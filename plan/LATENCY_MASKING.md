# Latency Masking Strategy

Target: **Time-to-first-audio under 3 seconds** on Wi-Fi. This is critical for demo smoothness—judges will perceive lag as buggy.

## The Problem

Full chain latency (current targets):
```
User input → Yelp AI (~800ms) → Persona rewrite (OpenAI 4o-mini or Apple FM if available, ~1s target) → ElevenLabs TTS (~1500ms) = ~3.5s
```

That's too long for a demo. Users will think the app is frozen.

## Solution: Greeting Clips + Parallel Fetching

### 1. Pre-cached Persona Greetings

Each persona has a 2-3 second "thinking" greeting that plays immediately:

| Persona | Greeting Clip Transcript | File |
|---------|-------------------------|------|
| Ava | "I'm thinking of something perfect..." | `greetings/ava.mp3` |
| Barry | "Oh, this is going to be GOOD..." | `greetings/barry.mp3` |
| Bella | "Let me find a quiet corner for you..." | `greetings/bella.mp3` |
| Francesca | "Hmm, let me think about this, darling..." | `greetings/francesca.mp3` |
| Lauren | "Allow me a moment to curate this..." | `greetings/lauren.mp3` |
| Maxine | "Alright, let's crush this..." | `greetings/maxine.mp3` |
| Nora | "Ooh, I know just the spot..." | `greetings/nora.mp3` |
| Pete | "Alright, listen up, I got the perfect plan..." | `greetings/pete.mp3` |
| Sam | "Okay, okay, I got you..." | `greetings/sam.mp3` |
| Willa | "Let me find something cozy for you..." | `greetings/willa.mp3` |

**Generate these once** using ElevenLabs with each persona's voice settings. Bundle in `assets/greetings/`.

### 2. Implementation Flow

```ts
// hooks/useChat.ts
import * as Audio from 'expo-audio';

const greetingClips: Record<PersonaId, number> = {
  francesca: require('../assets/greetings/francesca.mp3'),
  nora: require('../assets/greetings/nora.mp3'),
  // ... all 10
};

async function sendMessage(query: string, personaId: PersonaId) {
  // 1. Immediately show "thinking" UI state
  setIsThinking(true);

  // 2. Play greeting clip (non-blocking)
  const player = Audio.createAudioPlayer(greetingClips[personaId]);
  player.play();

  // 3. Fire Yelp + GPT-5 in parallel with greeting playback
  const [yelpResponse, _] = await Promise.all([
    fetchYelp(query, location),
    new Promise(resolve => {
        const sub = player.addListener('playbackStatusUpdate', (status) => {
            if (status.didJustFinish) {
                sub.remove();
                resolve(true);
            }
        });
    }),
  ]);

  const rewrittenText = await rewriteWithPersona(personaId, query, yelpResponse);

  // 4. Stream real TTS (greeting is done by now)
  const ttsUri = await fetchElevenLabs(rewrittenText, getTTSConfig(personaId));
  const ttsPlayer = Audio.createAudioPlayer(ttsUri);
  ttsPlayer.play();

  setIsThinking(false);
}
```

### 3. Visual "Thinking" State

While audio plays, show animated persona:

```tsx
// components/ThinkingIndicator.tsx
import { Animated, Image, View } from 'react-native';
import { useEffect, useRef } from 'react';

export function ThinkingIndicator({ persona }: { persona: PersonaDefinition }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.1, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: persona.colors.primary + '20' }]}>
      <Animated.Image
        source={{ uri: persona.avatar }}
        style={[styles.avatar, { transform: [{ scale: pulse }] }]}
      />
      <Text style={styles.thinking}>Thinking...</Text>
    </View>
  );
}
```

### 4. Waveform Mock During Playback

Real waveform visualization is complex. Use a simple animated bar pattern:

```tsx
// components/VoiceWaveform.tsx
export function VoiceWaveform({ isPlaying }: { isPlaying: boolean }) {
  const bars = [0.3, 0.7, 1, 0.5, 0.8, 0.4, 0.9, 0.6]; // relative heights

  return (
    <View style={styles.waveform}>
      {bars.map((height, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            {
              height: isPlaying ? `${height * 100}%` : '20%',
              opacity: isPlaying ? 1 : 0.3,
            },
          ]}
        />
      ))}
    </View>
  );
}
```

### 5. Fallback Chain

If any step fails, degrade gracefully:

```ts
try {
  const ttsAudio = await fetchElevenLabs(text, config);
  await ttsAudio.playAsync();
} catch (e) {
  // Fallback 1: Play cached clip from last successful response
  const cached = await getCachedClip(personaId);
  if (cached) {
    await cached.playAsync();
    return;
  }
  // Fallback 2: Show text-only response
  setShowTextFallback(true);
}
```

## Pre-generation Script

Run once before building:

```bash
# scripts/generate-greetings.sh
#!/bin/bash
set -e

VOICES=(
  "francesca:pNInz6obpgDQGcFmaJgB:Hmm, let me think about this, darling..."
  "nora:21m00Tcm4TlvDq8ikWAM:Ooh, I know just the spot..."
  # ... all 10
)

for entry in "${VOICES[@]}"; do
  IFS=':' read -r name voice_id text <<< "$entry"
  curl -X POST "https://api.elevenlabs.io/v1/text-to-speech/${voice_id}" \
    -H "xi-api-key: $ELEVENLABS_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"text\": \"${text}\", \"voice_settings\": {\"stability\": 0.7, \"similarity_boost\": 0.8}}" \
    -o "assets/greetings/${name}.mp3"
  echo "Generated ${name}.mp3"
done
```

## Metrics to Track

| Metric | Target |
|--------|--------|
| Time to greeting audio | < 200ms |
| Time to real TTS start | < 3s |
| Greeting → TTS gap | < 500ms |
| Full response displayed | < 5s |

## Demo Tip

The greeting clip makes the app feel *instantly* responsive. "Hmm, let me think..." buys time while the real work happens in the background—judges perceive this as fast, polished UX.
