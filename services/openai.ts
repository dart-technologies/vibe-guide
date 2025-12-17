import OpenAI from 'openai';
import { trackEvent, AnalyticsEvents } from './analytics';
import { PersonaId } from '../constants/personas';
import { buildRewritePrompt, getPersona } from './persona';

const COMPLETION_MODEL = 'gpt-4o-mini'; // faster, lower-latency tier
const MAX_COMPLETION_TOKENS = 120;
const REWRITE_TIMEOUT_MS = 4500;

let openaiClient: OpenAI | null = null;
function getOpenAIClient() {
    const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) return null;
    if (!openaiClient) {
        openaiClient = new OpenAI({
            apiKey: apiKey,
            dangerouslyAllowBrowser: true,
        });
    }
    return openaiClient;
}

function buildPersonaFallback(personaId: PersonaId, rawResponse: string): string {
    const persona = getPersona(personaId);
    const trimmed = rawResponse?.trim() || 'Lining up a few spots for you.';
    const clipped = trimmed.length > 480 ? `${trimmed.slice(0, 480)}...` : trimmed;
    return `${persona.name} take: ${clipped}`;
}

export async function rewriteWithOpenAI(
    personaId: PersonaId,
    originalQuery: string,
    rawResponse: string,
    hasReservableSpot: boolean
): Promise<string> {
    const openai = getOpenAIClient();
    if (!openai) {
        return buildPersonaFallback(personaId, rawResponse);
    }

    const prompt = buildRewritePrompt(personaId, originalQuery, rawResponse, hasReservableSpot);
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('rewrite-timeout')), REWRITE_TIMEOUT_MS);
    });

    try {
        const start = Date.now();
        const completion = (await Promise.race([
            openai.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: COMPLETION_MODEL,
                max_completion_tokens: MAX_COMPLETION_TOKENS,
            }),
            timeoutPromise,
        ])) as OpenAI.Chat.Completions.ChatCompletion;

        const rewritten = completion.choices[0]?.message?.content?.trim();

        return rewritten || buildPersonaFallback(personaId, rawResponse);
    } catch (error) {
        const isTimeout = (error as Error)?.message === 'rewrite-timeout';

        // Track API error
        trackEvent(AnalyticsEvents.API_ERROR, {
            service: 'openai',
            personaId,
            isTimeout,
            error: (error as Error)?.message || 'Unknown OpenAI error',
        });

        return buildPersonaFallback(personaId, rawResponse); // Fallback keeps persona framing
    } finally {
        if (timeoutId) clearTimeout(timeoutId);
    }
}

// Backward compatibility for direct imports, prefer rewriteWithOpenAI
export const rewriteResponse = rewriteWithOpenAI;
