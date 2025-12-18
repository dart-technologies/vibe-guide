import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useKeepAwake } from 'expo-keep-awake';
import { useEffect } from 'react';
import { LocationProvider } from '../contexts/LocationContext';
import { initAnalytics, trackEvent, AnalyticsEvents } from '../services/analytics';

export default function RootLayout() {
  useEffect(() => {
    initAnalytics();
    trackEvent(AnalyticsEvents.APP_STARTED);
  }, []);

  useKeepAwake();

  return (
    <LocationProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0f1115' },
        }}
      />
      <StatusBar style="light" />
    </LocationProvider>
  );
}
