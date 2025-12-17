import * as amplitude from '@amplitude/analytics-react-native';
import Constants from 'expo-constants';

const AMPLITUDE_API_KEY = process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY || '3gSj67jDVU_aLsDN2oqlHiKYvycy2TJC';

export const initAnalytics = () => {
    amplitude.init(AMPLITUDE_API_KEY);
};

export const trackEvent = (eventName: string, eventProperties?: Record<string, any>) => {
    amplitude.track(eventName, eventProperties);
};

export const setUserId = (userId: string) => {
    amplitude.setUserId(userId);
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
