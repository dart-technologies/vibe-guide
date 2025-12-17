import { describe, it, expect, vi } from 'vitest';
import { getPersona, buildPrefacedQuery, buildRewritePrompt, getAvatarSource, getTTSConfig, getAvatar } from '../services/persona';

describe('Persona Service', () => {
    it('should return valid persona for existing ID', () => {
        const p = getPersona('francesca');
        expect(p.name).toBe('Francesca the Foodie');
    });

    it('should return fallback persona for invalid ID', () => {
        const p = getPersona('non-existent' as any);
        expect(p).toBeDefined();
        expect(p.name).toBeDefined();
    });

    it('should build prefaced query correctly', () => {
        const query = buildPrefacedQuery('pete', 'Where is the best slice?');
        expect(query).toContain('Where is the best slice?');
        expect(query).toContain('NYC pride');
    });

    it('should build rewrite prompt with reservation hint', () => {
        const prompt = buildRewritePrompt('nora', 'late night drinks', 'Try The Back Room', true);
        expect(prompt).toContain('Mention that at least one spot is reservable');
        expect(prompt).toContain('The Back Room');
    });

    it('should return tts config', () => {
        const config = getTTSConfig('francesca');
        expect(config.voiceId).toBeDefined();
    });

    it('should return avatar name', () => {
        const avatar = getAvatar('pete');
        expect(avatar).toContain('pete.png');
    });

    it('should return avatar source (mocked requirement)', () => {
        const source = getAvatarSource('ava');
        // In test environment, AVATAR_SOURCES should be empty object based on the try/catch in persona.ts
        expect(source).toBeUndefined();
    });
});
