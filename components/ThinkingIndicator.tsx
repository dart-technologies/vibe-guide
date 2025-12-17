import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { PersonaDefinition } from '../constants/personas';
import { getAvatarSource } from '../services/persona';

type Props = { persona: PersonaDefinition };

export function ThinkingIndicator({ persona }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    // Sync Pulse & Shimmer
    Animated.loop(
      Animated.parallel([
        // Avatar Pulse (Scale)
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.08, duration: 800, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 800, useNativeDriver: true }),
        ]),
        // Text Shimmer (Opacity)
        Animated.sequence([
          Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, [scale, opacity]);

  return (
    <View style={[styles.container, { backgroundColor: `${persona.colors.primary}22` }]}>
      <Animated.View style={[styles.avatarWrap, { transform: [{ scale }] }]}>
        <Image source={getAvatarSource(persona.id)} style={styles.avatar} transition={300} />
      </Animated.View>
      <Animated.Text style={[styles.text, { opacity }]}>Curating…</Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#0f1115',
    borderWidth: 1,
    borderColor: '#ffffff30',
  },
  avatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  text: {
    color: '#e3e5ec',
    fontWeight: '600',
  },
});
