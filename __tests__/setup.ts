import { vi } from 'vitest';

// Mock binary assets for require()
// This is a global mock for anything ending in .mp3
vi.mock('../assets/greetings/ava.mp3', () => ({ default: 1 }));
vi.mock('../assets/greetings/barry.mp3', () => ({ default: 2 }));
vi.mock('../assets/greetings/bella.mp3', () => ({ default: 3 }));
vi.mock('../assets/greetings/francesca.mp3', () => ({ default: 4 }));
vi.mock('../assets/greetings/lauren.mp3', () => ({ default: 5 }));
vi.mock('../assets/greetings/maxine.mp3', () => ({ default: 6 }));
vi.mock('../assets/greetings/nora.mp3', () => ({ default: 7 }));
vi.mock('../assets/greetings/pete.mp3', () => ({ default: 8 }));
vi.mock('../assets/greetings/sam.mp3', () => ({ default: 9 }));
vi.mock('../assets/greetings/willa.mp3', () => ({ default: 10 }));

// Set global env vars for tests
process.env.EXPO_PUBLIC_OPENAI_API_KEY = 'test-key';
process.env.EXPO_PUBLIC_YELP_API_KEY = 'test-key';
process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY = 'test-key';
process.env.EXPO_PUBLIC_OPENWEATHERMAP_API_KEY = 'test-key';

// Mock Amplitude
vi.mock('@amplitude/analytics-react-native', () => ({
    init: vi.fn(),
    track: vi.fn(),
    setUserId: vi.fn(),
    identify: vi.fn(),
}));

// Mock Expo Constants
vi.mock('expo-constants', () => ({
    default: {
        expoConfig: {
            extra: {
                amplitudeApiKey: 'test-key',
            },
        },
    },
}));

// Mock Analytics Service globally to avoid issues with dynamic require in tests
vi.mock('../services/analytics', () => ({
    initAnalytics: vi.fn(),
    trackEvent: vi.fn(),
    setUserId: vi.fn(),
    AnalyticsEvents: {
        APP_STARTED: 'App Started',
        PERSONA_SELECTED: 'Persona Selected',
        CHAT_STARTED: 'Chat Started',
        MESSAGE_SENT: 'Message Sent',
        RESPONSE_RECEIVED: 'Response Received',
        AUDIO_PLAYBACK_STARTED: 'Audio Playback Started',
        API_ERROR: 'API Error',
    },
}));
