import { Buffer } from 'buffer';
import * as Audio from 'expo-audio';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import type { PersonaId } from '../constants/personas';
import { getTTSConfig } from './persona';
import { trackEvent, AnalyticsEvents } from './analytics';

// Simple text hash to ensure cache uniqueness per response
function hashText(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

const ELEVENLABS_API_KEY = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY;
function getGreetingClips(): Partial<Record<PersonaId, number>> {
  if (process.env.NODE_ENV === 'test') {
    return { francesca: 1 } as any; // Mock one for tests
  }
  return {
    ava: require('../assets/greetings/ava.mp3'),
    barry: require('../assets/greetings/barry.mp3'),
    bella: require('../assets/greetings/bella.mp3'),
    francesca: require('../assets/greetings/francesca.mp3'),
    lauren: require('../assets/greetings/lauren.mp3'),
    maxine: require('../assets/greetings/maxine.mp3'),
    nora: require('../assets/greetings/nora.mp3'),
    pete: require('../assets/greetings/pete.mp3'),
    sam: require('../assets/greetings/sam.mp3'),
    willa: require('../assets/greetings/willa.mp3'),
  };
}

const activePlayers = new Set<Audio.AudioPlayer>();

export async function stopAllAudio() {
  activePlayers.forEach(player => {
    try {
      player.pause();
      player.remove();
    } catch (e) {
      // ignore
    }
  });
  activePlayers.clear();
}

async function ensureCacheDir() {
  const dir = `${FileSystem.cacheDirectory}tts/`;
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
  return dir;
}

let audioConfigured = false;
async function ensureAudioConfig() {
  if (audioConfigured) return;
  try {
    await Audio.setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionModeAndroid: 'duckOthers',
      shouldRouteThroughEarpiece: false,
    });
    audioConfigured = true;
  } catch (e) {
    // ignore
  }
}

export async function playGreetingClip(personaId: PersonaId): Promise<(() => Promise<void>) | null> {
  await ensureAudioConfig();
  const moduleId = getGreetingClips()[personaId];
  if (!moduleId) return null; // Greeting assets not yet bundled.

  const asset = Asset.fromModule(moduleId);
  if (!asset.localUri) {
    await asset.downloadAsync();
  }

  try {
    const start = Date.now();
    const player = Audio.createAudioPlayer(asset.localUri ?? asset.uri);
    activePlayers.add(player);
    player.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish) {
        activePlayers.delete(player);
      }
    });
    player.play();

    // Track audio playback
    trackEvent(AnalyticsEvents.AUDIO_PLAYBACK_STARTED, { type: 'greeting', personaId });

    return async () => {
      activePlayers.delete(player);
      player.remove();
    };
  } catch (error) {
    trackEvent(AnalyticsEvents.API_ERROR, { service: 'audio', type: 'greeting', personaId, error: (error as Error).message });
    return null;
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  if (typeof btoa !== 'undefined') {
    return btoa(binary);
  }
  return Buffer.from(binary, 'binary').toString('base64');
}

async function fetchTTSAndCache(personaId: PersonaId, text: string): Promise<string> {
  if (!ELEVENLABS_API_KEY) {
    throw new Error('Missing EXPO_PUBLIC_ELEVENLABS_API_KEY env variable');
  }
  if (!text) {
    throw new Error('No text provided for TTS');
  }

  const dir = await ensureCacheDir();
  const hash = hashText(text);
  const outputPath = `${dir}${personaId}_${hash}.mp3`;
  const config = getTTSConfig(personaId);

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${config.voiceId}/stream`, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: text.replace(/\*\*/g, ''), // Remove Markdown bolding for TTS
      model_id: 'eleven_turbo_v2_5', // faster startup
      optimize_streaming_latency: 4, // prioritize latency over fidelity
      voice_settings: {
        stability: config.stability,
        similarity_boost: config.similarityBoost,
        style: config.style,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`TTS error ${res.status}: ${await res.text()}`);
  }

  const buffer = await res.arrayBuffer();
  const base64 = arrayBufferToBase64(buffer);
  await FileSystem.writeAsStringAsync(outputPath, base64, { encoding: FileSystem.EncodingType.Base64 });

  // Track TTS generation
  try {
    trackEvent('TTS Generated', { personaId, textLength: text.length });
  } catch (e) { }

  return outputPath;
}

async function getCachedTTSClip(personaId: PersonaId, text: string): Promise<string | null> {
  const hash = hashText(text);
  const dir = `${FileSystem.cacheDirectory}tts/${personaId}_${hash}.mp3`;
  const info = await FileSystem.getInfoAsync(dir);
  return info.exists ? dir : null;
}

async function playAudioFromUri(uri: string) {
  await ensureAudioConfig();
  const player = Audio.createAudioPlayer(uri);
  activePlayers.add(player);

  return new Promise<Audio.AudioPlayer>((resolve) => {
    const subscription = player.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish) {
        subscription.remove();
        activePlayers.delete(player);
        resolve(player);
      }
    });
    player.play();
  });
}

export async function playPersonaTTS(personaId: PersonaId, text: string): Promise<void> {
  try {
    const start = Date.now();
    const uri = await fetchTTSAndCache(personaId, text);
    const player = await playAudioFromUri(uri);

    // Track audio playback
    trackEvent(AnalyticsEvents.AUDIO_PLAYBACK_STARTED, { type: 'tts', personaId });

    player.remove();
    return;
  } catch (e) {
    trackEvent(AnalyticsEvents.API_ERROR, { service: 'audio', type: 'tts', personaId, error: (e as Error).message });

    const cached = await getCachedTTSClip(personaId, text);
    if (cached) {
      const player = await playAudioFromUri(cached);
      trackEvent(AnalyticsEvents.AUDIO_PLAYBACK_STARTED, { type: 'tts_cache', personaId });
      player.remove();
      return;
    }
    throw e;
  }
}

export async function playThinkingClip(personaId: PersonaId): Promise<(() => Promise<void>) | null> {
  // Placeholder: In a real app, this would play a "hmm..." or "let me check..." clip.
  // For now, we will re-use the greeting clip if available, or just log.
  // Ideally, we would have 'assets/thinking/{persona}.mp3'
  // using greeting as a temporary mocked 'noise' to fill silence if strictly requested,
  // but better to just log and let UI show indicator to avoid confusion.
  return null;
}

