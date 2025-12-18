import 'dotenv/config';
import { ConfigContext, ExpoConfig } from 'expo/config';

const BUNDLE_IDENTIFIER = process.env.EXPO_BUNDLE_IDENTIFIER || 'art.dart.vibe';
const ANDROID_PACKAGE = process.env.EXPO_ANDROID_PACKAGE || 'art.dart.vibe';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Vibe Guide',
  slug: 'vibe-guide',
  scheme: 'vibeguide',
  version: config.version || '1.1.2',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  userInterfaceStyle: 'automatic',
  assetBundlePatterns: ['**/*'],
  ios: {
    ...config.ios,
    bundleIdentifier: BUNDLE_IDENTIFIER,
    supportsTablet: false,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSLocationWhenInUseUsageDescription: 'Vibe Guide uses your location to find the best local spots nearby.',
      NSLocationAlwaysAndWhenInUseUsageDescription: 'Vibe Guide uses your location to find the best local spots nearby.',
      NSMicrophoneUsageDescription: 'Vibe Guide uses the microphone for voice conversations with your guide.',
    },
  },
  android: {
    ...config.android,
    package: ANDROID_PACKAGE,
    adaptiveIcon: {
      foregroundImage: './assets/images/icon.png',
      backgroundColor: '#ffffff',
    },
    permissions: [
      'ACCESS_COARSE_LOCATION',
      'ACCESS_FINE_LOCATION',
      'RECORD_AUDIO',
    ],
  },
  extra: {
    ...config.extra,
    yelpApiKey: process.env.EXPO_PUBLIC_YELP_API_KEY,
    openaiApiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
    elevenLabsApiKey: process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY,
    openWeatherMapApiKey: process.env.EXPO_PUBLIC_OPENWEATHERMAP_API_KEY,
    amplitudeApiKey: process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY,
    eas: {
      projectId: '650f879a-ecd6-49e5-9ca8-0e6a60029927',
    },
  },
  runtimeVersion: {
    policy: 'sdkVersion',
  },
  plugins: [
    'expo-router',
    'expo-audio',
    'expo-asset',
    'expo-location',
  ]
});
