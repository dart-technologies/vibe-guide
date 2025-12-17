import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { PersonaDefinition } from '../constants/personas';
import { getAvatarSource } from '../services/persona';

import { StyleProp, ViewStyle } from 'react-native';

type Props = {
  persona: PersonaDefinition;
  isActive?: boolean;
  layout?: 'horizontal' | 'vertical';
  style?: StyleProp<ViewStyle>;
};

export function PersonaCard({ persona, isActive, layout = 'horizontal', style }: Props) {
  const isVertical = layout === 'vertical';

  return (
    <LinearGradient
      colors={[persona.colors.primary, persona.colors.accent]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.card,
        isActive && styles.activeCard,
        isVertical && styles.cardVertical,
        style
      ]}
    >
      <View style={[styles.header, isVertical && styles.headerVertical]}>
        <Image
          source={getAvatarSource(persona.id)}
          style={[styles.avatar, isVertical && styles.avatarVertical]}
          transition={500}
        />
        <View style={[styles.textCol, isVertical && styles.textColVertical]}>
          <Text
            style={[styles.name, isVertical && styles.nameVertical]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {persona.name}
          </Text>
          <Text
            style={[styles.tone, isVertical && styles.toneVertical]}
            numberOfLines={2}
          >
            {persona.tone}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ffffff20',
    backgroundColor: '#131722',
    overflow: 'hidden',
  },
  activeCard: {
    borderColor: '#ffffff60',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  name: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 18,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ffffff88',
    backgroundColor: '#0f1115',
  },
  tone: {
    color: '#e3e5ec',
    fontSize: 14,
  },
  textCol: {
    flex: 1,
    gap: 4,
  },
  // Vertical Layout Overrides
  // Vertical Layout Overrides
  cardVertical: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerVertical: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 0,
    gap: 16,
  },
  avatarVertical: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 4,
    marginBottom: 8,
  },
  textColVertical: {
    alignItems: 'center',
    gap: 8,
    width: '100%',
    maxWidth: '100%',
    paddingHorizontal: 8,
  },
  nameVertical: {
    fontSize: 36,
    textAlign: 'center',
    marginBottom: 4,
    marginTop: 8,
  },
  toneVertical: {
    textAlign: 'center',
    fontSize: 16,
    opacity: 0.9,
  },
});
