import { Stack, useRouter, Link } from 'expo-router';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { PERSONAS } from '../constants/personas';
import { MOODS } from '../constants/moods';
import { PersonaCard } from '../components/PersonaCard';
import { useLocation } from '../hooks/useLocation';
import { trackEvent, AnalyticsEvents } from '../services/analytics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.82;
const CARD_HEIGHT = CARD_WIDTH * 1.28;
const GAP = 16;
const SIDE_INSET = (SCREEN_WIDTH - CARD_WIDTH) / 2;

export default function HomeScreen() {
  const router = useRouter();
  const { requestLocation } = useLocation();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  useEffect(() => {
    requestLocation();
  }, []);

  const filteredPersonas = selectedMood
    ? PERSONAS.filter((p) => {
      const mood = MOODS.find((m) => m.label === selectedMood);
      if (!mood) return true;
      return mood.ids.length === 0 || mood.ids.includes(p.id);
    }) : PERSONAS;

  const handleMoodSelect = (label: string) => {
    Haptics.selectionAsync();
    setSelectedMood(label === selectedMood ? null : label);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: '' }} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>Vibe Guide</Text>
          <Text style={styles.heroTagline}>
            Curated picks by local guides
          </Text>
        </View>
        <Text style={styles.sectionLabel}>Mood Match</Text>
        <View style={styles.moodRow}>
          {MOODS.map((mood) => {
            const isSelected = selectedMood === mood.label;
            return (
              <TouchableOpacity
                key={mood.label}
                style={[styles.moodButton, isSelected && styles.moodButtonActive]}
                onPress={() => handleMoodSelect(mood.label)}
              >
                <Text style={[styles.moodLabel, isSelected && styles.moodLabelActive]}>
                  {isSelected ? '✓ ' : ''}{mood.label}
                </Text>
                <Text style={styles.moodHint}>{mood.hint}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.sectionLabel}>Pick a persona</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.carouselContainer,
            { paddingHorizontal: SIDE_INSET }
          ]}
          decelerationRate="fast"
          snapToInterval={CARD_WIDTH + GAP}
          pagingEnabled={false}
        >
          {filteredPersonas.map((persona) => (
            <View
              key={persona.id}
              style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
            >
              <TouchableOpacity
                activeOpacity={0.9}
                style={[
                  styles.personaPressable,
                  { width: CARD_WIDTH, height: CARD_HEIGHT }
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  trackEvent(AnalyticsEvents.PERSONA_SELECTED, { personaId: persona.id, mood: selectedMood });
                  router.push({ pathname: '/chat/[persona]', params: { persona: persona.id } });
                }}
              >
                <PersonaCard
                  persona={persona}
                  layout="vertical"
                  style={{ flex: 1, height: '100%', width: '100%' }}
                />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f1115',
  },
  container: {
    paddingVertical: 24,
    gap: 12,
  },
  hero: {
    gap: 4,
    paddingHorizontal: 24,
    paddingVertical: 4,
  },
  kicker: {
    color: '#8ea0ff',
    fontWeight: '700',
    letterSpacing: 0.5,
    fontSize: 14,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#ffffff',
  },
  heroTagline: {
    fontSize: 16,
    color: '#d0d2d6',
    marginBottom: 8,
    lineHeight: 22,
  },
  sectionLabel: {
    color: '#9aa0ad',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
    paddingHorizontal: 24,
    textTransform: 'uppercase',
  },
  moodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 24,
  },
  moodButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#151821',
    borderWidth: 1,
    borderColor: '#242a36',
  },
  moodButtonActive: {
    backgroundColor: '#2a3142',
    borderColor: '#8ea0ff',
  },
  moodLabel: {
    color: '#ffffff',
    fontWeight: '700',
  },
  moodLabelActive: {
    color: '#8ea0ff',
  },
  moodHint: {
    color: '#9aa0ad',
    fontSize: 12,
  },
  carouselContainer: {
    gap: GAP,
    paddingBottom: 24,
  },
  personaPressable: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
});
