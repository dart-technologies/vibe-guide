import { useCallback, useEffect, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system/legacy';
import { getPersona } from '../services/persona';
import { rewriteResponse } from '../services/rewrite';
import { YelpSession, YelpUserContext, hasReservableEntity } from '../services/yelp';
import { fetchWeather, WeatherSummary } from '../services/weather';
import { playGreetingClip, playPersonaTTS, playThinkingClip, stopAllAudio } from '../services/audio';
import { normalizeEntities as normalizeYelpEntities, filterEntitiesByPersonaText } from '../services/entities';
import { buildContextString } from '../utils/context';
import { PersonaId } from '../constants/personas';
import { trackEvent, AnalyticsEvents } from '../services/analytics';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const MOCK_YELP = require('../mock/yelp-response.json');

export type ChatMessage = {
    id: string;
    role: 'user' | 'assistant';
    text: string;
    entities?: any[];
};

export type ChatFlowHelpers = {
    resetChatSession: () => void;
    runDemo: (customQuery?: string) => Promise<void>;
    toggleMock: () => void;
    stopAudio: () => void;
    messages: ChatMessage[];
};

export function useChatFlow(
    personaId: PersonaId,
    locationData: {
        coords: { latitude: number; longitude: number } | null;
        city: string | null;
        radius: number;
    }
) {
    const persona = getPersona(personaId);
    const chatIdFile = `${FileSystem.cacheDirectory}chat_id_${persona.id}.txt`;

    const sessionRef = useRef(new YelpSession());

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [weather, setWeather] = useState<WeatherSummary | null>(null);
    const [chatId, setChatId] = useState<string | undefined>(undefined);
    const [useMock, setUseMock] = useState(false);

    // Restore chat ID on mount
    useEffect(() => {
        let active = true;
        FileSystem.readAsStringAsync(chatIdFile)
            .then((id) => {
                if (active && id) {
                    sessionRef.current.setChatId(id);
                    setChatId(id);
                }
            })
            .catch(() => { });

        return () => { active = false; };
    }, [chatIdFile]);

    const resetChatSession = useCallback(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        sessionRef.current.reset();
        setChatId(undefined);
        setMessages([]);
        setError(null);
        setLoading(false);
        FileSystem.deleteAsync(chatIdFile, { idempotent: true }).catch(() => { });
    }, [chatIdFile]);

    const toggleMock = useCallback(() => {
        Haptics.selectionAsync();
        setUseMock((v) => !v);
    }, []);

    const stopAudio = useCallback(() => {
        stopAllAudio().catch(() => { });
    }, []);

    const runDemo = useCallback(async (customQuery?: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const baseQuery = 'I have 3 hours free right now. Surprise me.';

        // Note: The UI usually manages the "input" state (userQuery), but here we just take the string.
        // Ideally the UI clears its input after calling this.
        const validQuery = customQuery || baseQuery;

        // Add user message immediately
        if (validQuery) {
            setMessages((prev) => [
                ...prev,
                { id: Date.now().toString(), role: 'user', text: validQuery },
            ]);
        }

        setLoading(true);
        setError(null);
        const t0 = Date.now();

        try {
            // 1. Weather
            let currentWeather = weather;
            const { coords, city, radius } = locationData;

            // Default coords if null
            const effectiveCoords = coords || { latitude: 40.7128, longitude: -74.006 };

            const userContext: YelpUserContext = {
                locale: 'en_US',
                latitude: effectiveCoords.latitude,
                longitude: effectiveCoords.longitude,
            };

            if (!currentWeather) {
                try {
                    const w = await fetchWeather(userContext.latitude, userContext.longitude);
                    setWeather(w);
                    currentWeather = w;
                } catch (e) {
                    // ignore
                }
            }

            // 2. Greeting (only if start of convo) OR Thinking Clip
            let audioPlaybackProm;

            if (messages.length === 0) {
                audioPlaybackProm = playGreetingClip(persona.id);
            } else {
                audioPlaybackProm = playThinkingClip(persona.id);
            }

            // 3. Send to Yelp
            const session = sessionRef.current;
            const contextText = buildContextString(currentWeather, userContext, city, radius);

            // Combine context, persona preface (if any), and user query
            const parts = [
                contextText,
                persona.preface,
                validQuery // The user's actual question
            ].filter(Boolean);

            const prefacedQuery = parts.join('\n\n');

            trackEvent(AnalyticsEvents.MESSAGE_SENT, {
                personaId: persona.id,
                isMock: useMock,
                messageCount: messages.length + 1,
            });

            const res = useMock ? MOCK_YELP : await session.sendChat(prefacedQuery, userContext);

            // 4. Process Response
            const rawText = res.response?.text ?? 'No response text returned.';
            const normalized = normalizeYelpEntities(res.entities ?? []);

            // Save Chat ID
            setChatId(session.getChatId());
            if (session.getChatId()) {
                FileSystem.writeAsStringAsync(chatIdFile, session.getChatId() || '').catch(() => { });
            }

            // 5. Finish Audio (Greeting or Thinking)
            if (audioPlaybackProm) {
                const stopAudio = await audioPlaybackProm;
                if (stopAudio) await stopAudio();
            }

            let finalText = rawText;
            let finalEntities = normalized; // Fallback

            if (res.response?.text) {
                const reservationHint = hasReservableEntity(res.entities);

                // 6. Rewrite
                const rewrittenText = await rewriteResponse(
                    persona.id,
                    prefacedQuery,
                    res.response.text,
                    reservationHint
                );
                finalText = rewrittenText;

                // 7. TTS
                playPersonaTTS(persona.id, rewrittenText).catch(() => { });

                trackEvent(AnalyticsEvents.RESPONSE_RECEIVED, {
                    personaId: persona.id,
                    entityCount: normalized.length,
                    textLength: rewrittenText.length,
                });
            }

            // 8. Re-filter entities based on REWRITTEN text
            finalEntities = filterEntitiesByPersonaText(finalText, normalized);

            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now().toString(),
                    role: 'assistant',
                    text: finalText,
                    entities: finalEntities,
                },
            ]);

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            const msg = (e as Error).message || 'Unknown error';
            setError(msg.toLowerCase().includes('internal') ? 'Yelp internal error' : msg);
        } finally {
            setLoading(false);
        }
    }, [
        persona.id,
        messages.length,
        useMock,
        chatIdFile,
        locationData, // coords, city, radius dependency
        weather
    ]);

    return {
        messages,
        loading,
        error,
        weather,
        chatId,
        useMock,
        runDemo,
        resetChatSession,
        toggleMock,
        stopAudio,
    };
}
