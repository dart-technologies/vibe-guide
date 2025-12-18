import Constants from 'expo-constants';

// We lazy-require Amplitude so that missing native modules (e.g., AsyncStorage)
// do not crash the bundle at import time (common if running in Expo Go or an
// iOS build that was not rebuilt after adding the dependency).
// eslint-disable-next-line @typescript-eslint/no-var-requires
type AmplitudeModule = typeof import('@amplitude/analytics-react-native');

let amplitude: AmplitudeModule | null = null;
let attemptedLoad = false;

function getAmplitude(): AmplitudeModule | null {
    if (amplitude || attemptedLoad) return amplitude;
    attemptedLoad = true;
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        amplitude = require('@amplitude/analytics-react-native');
        return amplitude;
    } catch (error) {
        console.warn('[analytics] amplitude native module unavailable; skipping init', (error as Error)?.message || error);
        amplitude = null;
        return null;
    }
}

const AMPLITUDE_API_KEY =
    process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY ||
    Constants.expoConfig?.extra?.amplitudeApiKey;

let analyticsReady = false;

function swallowAsync(result: any, onError?: (error: any) => void) {
    const promise = result?.promise || result;
    if (promise?.catch) {
        promise.catch((err: any) => {
            if (onError) onError(err);
        });
    }
}

export const initAnalytics = () => {
    const amp = getAmplitude();
    if (!amp) {
        console.warn('[analytics] amplitude module not loaded; skipping init');
        return;
    }
    if (!AMPLITUDE_API_KEY) {
        console.warn('[analytics] missing amplitude api key; skipping init');
        return;
    }
    try {
        console.log('[analytics] initializing with key:', AMPLITUDE_API_KEY.substring(0, 6) + '...');
        const res = amp.init(AMPLITUDE_API_KEY);
        analyticsReady = true;
        swallowAsync(res, (error) => {
            analyticsReady = false;
            console.warn('[analytics] init promise failed', (error as Error)?.message || error);
        });
    } catch (error) {
        analyticsReady = false;
        console.warn('[analytics] init failed', (error as Error)?.message || error);
    }
};

export const trackEvent = (eventName: string, eventProperties?: Record<string, any>) => {
    if (!analyticsReady) return;
    const amp = getAmplitude();
    if (!amp) return;
    try {
        const res = amp.track(eventName, eventProperties);
        swallowAsync(res, (error) => {
            console.warn('[analytics] track promise failed', (error as Error)?.message || error);
        });
    } catch (error) {
        console.warn('[analytics] track failed', (error as Error)?.message || error);
    }
};

export const setUserId = (userId: string) => {
    if (!analyticsReady) return;
    const amp = getAmplitude();
    if (!amp) return;
    try {
        const res = amp.setUserId(userId);
        swallowAsync(res, (error) => {
            console.warn('[analytics] setUserId promise failed', (error as Error)?.message || error);
        });
    } catch (error) {
        console.warn('[analytics] setUserId failed', (error as Error)?.message || error);
    }
};

export const AnalyticsEvents = {
    APP_STARTED: 'App Started',
    PERSONA_SELECTED: 'Persona Selected',
    CHAT_STARTED: 'Chat Started',
    MESSAGE_SENT: 'Message Sent',
    RESPONSE_RECEIVED: 'Response Received',
    AUDIO_PLAYBACK_STARTED: 'Audio Playback Started',
    API_ERROR: 'API Error',
};
