import 'dotenv/config';
import { ConfigContext, ExpoConfig } from 'expo/config';

const BUNDLE_IDENTIFIER = process.env.EXPO_BUNDLE_IDENTIFIER || 'art.dart.vibe';
const ANDROID_PACKAGE = process.env.EXPO_ANDROID_PACKAGE || 'art.dart.vibe';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Vibe Guide',
  slug: 'vibe-guide',
  scheme: 'vibeguide',
  version: config.version || '1.0.0',
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
    },
  },
  android: {
    ...config.android,
    package: ANDROID_PACKAGE,
    adaptiveIcon: {
      foregroundImage: './assets/images/icon.png',
      backgroundColor: '#ffffff',
    },
  },
  extra: {
    ...config.extra,
    yelpApiKey: process.env.EXPO_PUBLIC_YELP_API_KEY,
    openaiApiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
    elevenLabsApiKey: process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY,
    openWeatherMapApiKey: process.env.EXPO_PUBLIC_OPENWEATHERMAP_API_KEY,
    eas: {
      projectId: '650f879a-ecd6-49e5-9ca8-0e6a60029927',
    },
  },
  runtimeVersion: {
    policy: 'sdkVersion',
  },
  plugins: [
    "expo-audio",
    "expo-asset",
    "expo-router"
  ]
});
