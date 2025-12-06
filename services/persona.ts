import { PERSONA_BY_ID, PERSONAS, PersonaDefinition, PersonaId } from '../constants/personas';

const FALLBACK_PERSONA: PersonaDefinition = PERSONAS[0];

export function getPersona(id: PersonaId): PersonaDefinition {
  return PERSONA_BY_ID[id] ?? FALLBACK_PERSONA;
}

export function buildPrefacedQuery(personaId: PersonaId, userQuery: string): string {
  const persona = getPersona(personaId);
  return `${persona.preface}\n\nUser: ${userQuery}`;
}

export function buildRewritePrompt(personaId: PersonaId, originalQuery: string, yelpResponseText: string): string {
  const persona = getPersona(personaId);
  return [
    persona.rewrite,
    '',
    `Original query: ${originalQuery}`,
    `Yelp response: ${yelpResponseText}`,
    '',
    'Rewrite in character, keep business names and factual details intact.',
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
