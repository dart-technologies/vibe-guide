import { ImageSourcePropType } from 'react-native';
import { PERSONA_BY_ID, PERSONAS, PersonaDefinition, PersonaId } from '../constants/personas';

const FALLBACK_PERSONA: PersonaDefinition = PERSONAS[0];

const AVATAR_SOURCES: Record<PersonaId, ImageSourcePropType> = (() => {
  try {
    return {
      ava: require('../public/avatars/ava.png'),
      barry: require('../public/avatars/barry.png'),
      bella: require('../public/avatars/bella.png'),
      francesca: require('../public/avatars/francesca.png'),
      lauren: require('../public/avatars/lauren.png'),
      maxine: require('../public/avatars/maxine.png'),
      nora: require('../public/avatars/nora.png'),
      pete: require('../public/avatars/pete.png'),
      sam: require('../public/avatars/sam.png'),
      willa: require('../public/avatars/willa.png'),
    };
  } catch (e) {
    // Tests or non-RN environments: fall back to empty object
    return {} as Record<PersonaId, ImageSourcePropType>;
  }
})();

export function getPersona(id: PersonaId): PersonaDefinition {
  return PERSONA_BY_ID[id] ?? FALLBACK_PERSONA;
}

export function buildPrefacedQuery(personaId: PersonaId, userQuery: string): string {
  const persona = getPersona(personaId);
  return `${persona.preface}\n\nUser: ${userQuery}`;
}

export function buildRewritePrompt(
  personaId: PersonaId,
  originalQuery: string,
  yelpResponseText: string,
  hasReservableSpot: boolean = false,
): string {
  const persona = getPersona(personaId);
  const reservationHint = hasReservableSpot ? 'Mention that at least one spot is reservable with one tap.' : '';
  return [
    persona.rewrite,
    reservationHint,
    '',
    `Original query: ${originalQuery}`,
    `Yelp response: ${yelpResponseText}`,
    '',
    'Rewrite in character, keep business names and factual details intact. Keep it short (2-3 sentences). Wrap business names in **double asterisks** for bolding.',
  ].join('\n');
}

export function getTTSConfig(personaId: PersonaId) {
  const persona = getPersona(personaId);
  return persona.tts;
}

export function getAvatar(personaId: PersonaId) {
  const persona = getPersona(personaId);
  return persona.avatar;
}

export function getAvatarSource(personaId: PersonaId): ImageSourcePropType {
  return AVATAR_SOURCES[personaId] ?? AVATAR_SOURCES[FALLBACK_PERSONA.id as PersonaId];
}
