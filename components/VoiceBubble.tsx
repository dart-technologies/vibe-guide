import { useCallback } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Audio from 'expo-audio';

type Props = {
  text: string;
  audioUri?: string;
  accentColor: string;
};

export function VoiceBubble({ text, audioUri, accentColor }: Props) {
  const player = Audio.useAudioPlayer(audioUri);
  const status = Audio.useAudioPlayerStatus(player);

  const togglePlayback = useCallback(async () => {
    if (!audioUri) return;
    try {
      if (status.playing) {
        player.pause();
      } else {
        player.play();
      }
    } catch (e) {
      console.warn('voice bubble playback failed', e);
    }
  }, [audioUri, player, status.playing]);

  const isLoading = !status.isLoaded && audioUri;

  return (
    <View style={[styles.bubble, { borderColor: accentColor }]}>
      <Text style={styles.text}>
        {text.split('**').map((part, index) =>
          index % 2 === 1 ? (
            <Text key={index} style={{ fontWeight: '700', color: '#fff' }}>{part}</Text>
          ) : (
            part
          )
        )}
      </Text>
      {audioUri && (
        <Pressable style={[styles.cta, { backgroundColor: accentColor }]} onPress={togglePlayback}>
          {isLoading ? <ActivityIndicator color="#0f1115" /> : <Text style={styles.ctaText}>{status.playing ? 'Pause' : 'Play'}</Text>}
        </Pressable>
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  bubble: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#11141c',
    gap: 8,
  },
  text: {
    color: '#e4e7ee',
    lineHeight: 20,
  },
  cta: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  ctaText: {
    color: '#0f1115',
    fontWeight: '700',
  },
});
