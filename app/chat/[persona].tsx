import { useLocalSearchParams, Stack } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, AppState, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

import { getPersona, getAvatarSource } from '../../services/persona';
import { mixColor } from '../../utils/colors';
import { useLocation } from '../../hooks/useLocation';
import { useKeyboard } from '../../hooks/useKeyboard';
import { useChatFlow } from '../../hooks/useChatFlow';

import { ThinkingIndicator } from '../../components/ThinkingIndicator';
import { VoiceBubble } from '../../components/VoiceBubble';
import { EntityCard } from '../../components/EntityCard';
import { LocationHeaderButton } from '../../components/LocationHeaderButton';
import { LocationContextDisplay } from '../../components/LocationContextDisplay';
import { PersonaId } from '../../constants/personas';

export default function ChatScreen() {
  const { persona: personaIdParam } = useLocalSearchParams<{ persona: string }>();
  // Cast to PersonaId, defaulting to francesca if invalid
  const personaId = (personaIdParam as PersonaId) || 'francesca';
  const persona = getPersona(personaId);

  const bgAnim = useRef(new Animated.Value(1)).current;
  const prevColor = useRef(persona.colors.primary);

  const [bgDisplayColor, setBgDisplayColor] = useState(persona.colors.primary);
  const [appState, setAppState] = useState(AppState.currentState);
  const [userQuery, setUserQuery] = useState('I have 3 hours free right now. Surprise me.');

  const insets = useSafeAreaInsets();
  const { isKeyboardVisible } = useKeyboard();

  // Dynamic bottom padding
  const inputBottomPadding = isKeyboardVisible ? 12 : Math.max(insets.bottom, 20);

  const {
    coords,
    city,
    error: locationError,
    zip,
    setZip,
    requestLocation,
    setZipLocation,
    radius,
    setRadius,
    status,
  } = useLocation();

  // Use the new hook
  const {
    messages,
    loading,
    error,
    weather,
    runDemo,
    resetChatSession,
    stopAudio,
  } = useChatFlow(personaId, { coords, city, radius });

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    resetChatSession();
    // Short delay for visual feedback
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleSend = () => {
    runDemo(userQuery);
    setUserQuery('');
  };

  useEffect(() => {
    const appStateSub = AppState.addEventListener('change', (next) => {
      setAppState(next);
    });

    const from = prevColor.current;
    const to = persona.colors.primary;
    bgAnim.setValue(0);

    const colorSub = bgAnim.addListener(({ value }) => setBgDisplayColor(mixColor(from, to, value)));
    const anim = Animated.timing(bgAnim, { toValue: 1, duration: 400, useNativeDriver: false });
    anim.start(() => {
      prevColor.current = to;
      bgAnim.removeListener(colorSub);
    });

    return () => {
      bgAnim.removeListener(colorSub);
      anim.stop();
      appStateSub.remove();
      stopAudio();
    };
  }, [appState, bgAnim, persona.colors.primary, stopAudio]);

  useEffect(() => {
    // Only request if we haven't yet (performance optimization)
    if (status === 'idle' && !coords) {
      requestLocation();
    }
  }, [requestLocation, status, coords]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <View style={{ alignItems: 'center', maxWidth: 220, paddingHorizontal: 10 }}>
              <Text
                style={[styles.headerTitle, { textAlign: 'center' }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {persona.name}
              </Text>
              <Text
                style={[styles.headerSubtitle, { textAlign: 'center' }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {persona.tone}
              </Text>
            </View>
          ),
          headerShown: true,
          headerTintColor: '#fff',
          headerTransparent: true,
          headerBackground: () => <BlurView tint="dark" intensity={70} style={StyleSheet.absoluteFill} />,
          headerRight: () => (
            <LocationHeaderButton />
          ),
          headerBackTitle: ' ',
        }}
      />

      <Animated.View style={[styles.backgroundContainer, {
        backgroundColor: bgAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [`${prevColor.current}18`, `${persona.colors.primary}18`]
        })
      }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
          <ScrollView
            contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 60 }]}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={persona.colors.primary}
                colors={[persona.colors.primary]} // Android
              />
            }
          >
            {/* Context Section */}
            <View style={styles.contextContainer}>
              <LocationContextDisplay
                coords={coords}
                city={city}
                weather={weather}
                error={locationError}
              />
            </View>

            {/* Chat Content */}
            <View style={styles.chatContainer}>
              {messages.map((msg, index) => {
                if (msg.role === 'user') {
                  return (
                    <View key={msg.id} style={styles.userMessageRow}>
                      <View style={[styles.userBubble, { backgroundColor: '#2a3142' }]}>
                        <Text style={styles.userMessageText}>{msg.text}</Text>
                      </View>
                    </View>
                  );
                }

                // Assistant Message
                return (
                  <View key={msg.id} style={styles.assistantBlock}>
                    <View style={styles.messageRow}>
                      <Image source={getAvatarSource(persona.id)} style={styles.avatarSmall} transition={300} />
                      <View style={styles.bubbleWrapper}>
                        <VoiceBubble text={msg.text} accentColor={persona.colors.accent} />
                      </View>
                    </View>

                    {msg.entities && msg.entities.length > 0 && (
                      <View style={styles.entitySection}>
                        <Text style={styles.entityTitle}>Recommended spots</Text>
                        <View style={styles.entityList}>
                          {msg.entities.map((entity, idx) => (
                            <EntityCard
                              key={entity.id || `${entity.name}-${idx}`}
                              entity={entity}
                              userCoords={coords}
                            />
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}

              {loading && <ThinkingIndicator persona={persona} />}

              {error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Floating Input */}
          <BlurView
            intensity={100}
            tint="dark"
            style={[
              styles.inputFloatingContainer,
              { paddingBottom: inputBottomPadding }
            ]}
          >
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { borderColor: persona.colors.primary }]}
                placeholderTextColor="#7b8190"
                placeholder="Ask for more details..."
                value={userQuery}
                onChangeText={setUserQuery}
                onSubmitEditing={handleSend}
                returnKeyType="send"
                editable={!loading}
              />
              <TouchableOpacity
                onPress={handleSend}
                disabled={loading}
                style={[styles.sendButton, { backgroundColor: persona.colors.primary, opacity: loading ? 0.6 : 1 }]}
              >
                <Text style={styles.sendButtonText}>→</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </KeyboardAvoidingView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f1115',
  },
  backgroundContainer: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 100, // Header space
    paddingBottom: 20,
    gap: 20,
  },
  contextContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  chatContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#c0c4cc',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ffffff40',
    backgroundColor: '#000',
  },
  bubbleWrapper: {
    flex: 1,
  },
  entitySection: {
    gap: 12,
    marginTop: 8,
    paddingLeft: 52, // Align with bubble text (40 avatar + 12 gap)
  },
  entityTitle: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
    opacity: 0.8,
  },
  entityList: {
    gap: 12,
  },
  inputFloatingContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#ffffff10',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: '#ffffff30',
    borderRadius: 25,
    paddingHorizontal: 20,
    color: '#fff',
    backgroundColor: '#0f1115e0',
    fontSize: 16,
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#0f1115',
    fontWeight: '800',
    fontSize: 20,
    marginTop: -2,
  },
  metaLabel: {
    color: '#9aa0ad',
    fontWeight: '600',
  },
  errorBox: {
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#e74c3c',
    backgroundColor: '#2b1a1a',
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    color: '#f5c6c6',
  },
  userMessageRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  userBubble: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderBottomRightRadius: 2,
    maxWidth: '80%',
  },
  userMessageText: {
    color: '#fff',
    fontSize: 15,
  },
  assistantBlock: {
    gap: 12,
    marginBottom: 12,
  },
});
