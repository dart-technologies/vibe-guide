import { Platform } from 'react-native';
import { PersonaId } from '../constants/personas';
import { buildRewritePrompt, getPersona } from './persona';
import { rewriteWithOpenAI } from './openai';

type RewriteProvider = 'openai' | 'apple';

function getRewriteProviderInternal(): RewriteProvider {
  const providerEnv = (process.env.EXPO_PUBLIC_REWRITE_PROVIDER || 'openai').toLowerCase();
  return providerEnv === 'apple' ? 'apple' : 'openai';
}

async function tryAppleRewrite(
  personaId: PersonaId,
  originalQuery: string,
  rawResponse: string,
  hasReservableSpot: boolean,
): Promise<string | null> {
  if (Platform.OS !== 'ios') {
    return null;
  }

  let Apple: any;
  try {
    // Dynamic require to avoid crashes on unsupported platforms / builds.
    Apple = require('react-native-apple-llm');
  } catch (e) {
    return null;
  }

  const { AppleLLMSession, isFoundationModelsEnabled } = Apple || {};
  if (!AppleLLMSession || !isFoundationModelsEnabled) {
    return null;
  }

  let availability: string;
  try {
    availability = await isFoundationModelsEnabled();
  } catch (e) {
    return null;
  }

  if (availability !== 'available') {
    return null;
  }

  const prompt = buildRewritePrompt(personaId, originalQuery, rawResponse, hasReservableSpot);
  const persona = getPersona(personaId);
  const session = new AppleLLMSession();

  try {
    await session.configure({
      instructions: persona.rewrite,
    });

    const start = Date.now();
    const result = await session.generateText({ prompt });
    const text = typeof result === 'string' ? result : result?.text ?? result;
    return typeof text === 'string' ? text.trim() : null;
  } catch (e) {
    return null;
  } finally {
    session.dispose?.();
  }
}

export async function rewriteResponse(
  personaId: PersonaId,
  originalQuery: string,
  rawResponse: string,
  hasReservableSpot: boolean,
): Promise<string> {
  const provider = getRewriteProviderInternal();
  if (provider === 'apple') {
    const apple = await tryAppleRewrite(personaId, originalQuery, rawResponse, hasReservableSpot);
    if (apple) return apple;
  }

  return rewriteWithOpenAI(personaId, originalQuery, rawResponse, hasReservableSpot);
}

export function getRewriteProvider(): RewriteProvider {
  return getRewriteProviderInternal();
}
