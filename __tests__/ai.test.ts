import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rewriteWithOpenAI } from '../services/openai';
import { rewriteResponse } from '../services/rewrite';
import { PersonaId } from '../constants/personas';

const mockCreate = vi.fn();

// Mock OpenAI
vi.mock('openai', () => {
    return {
        default: vi.fn().mockImplementation(() => ({
            chat: {
                completions: {
                    create: mockCreate,
                },
            },
        })),
    };
});

// Mock react-native Platform
vi.mock('react-native', () => ({
    Platform: {
        OS: 'ios',
    },
}));

// Mock react-native-apple-llm
vi.mock('react-native-apple-llm', () => ({
    AppleLLMSession: vi.fn().mockImplementation(() => ({
        configure: vi.fn().mockResolvedValue(undefined),
        generateText: vi.fn().mockResolvedValue('Apple Rewritten Text'),
        dispose: vi.fn(),
    })),
    isFoundationModelsEnabled: vi.fn().mockResolvedValue('available'),
}));

// Mock persona service to avoid hitting real persona definitions if they change
vi.mock('../services/persona', () => ({
    getPersona: vi.fn((id: PersonaId) => ({
        id: id,
        name: 'Mock Persona',
        rewrite: 'Rewrite logic',
    })),
    buildRewritePrompt: vi.fn(() => 'Mock prompt'),
}));

describe('AI Services', () => {
    let mockOpenAIInstance: any;

    beforeEach(async () => {
        vi.clearAllMocks();
        vi.stubEnv('EXPO_PUBLIC_OPENAI_API_KEY', 'test-key');
        vi.stubEnv('EXPO_PUBLIC_REWRITE_PROVIDER', 'openai');
        const OpenAI = (await import('openai')).default;
        mockOpenAIInstance = new OpenAI();
    });

    describe('openai.ts - rewriteWithOpenAI', () => {
        it('should return rewritten text from OpenAI', async () => {
            // Setup mock response
            mockOpenAIInstance.chat.completions.create.mockResolvedValue({
                choices: [{ message: { content: 'This is the rewritten text' } }],
            });

            // Set API key for test
            process.env.EXPO_PUBLIC_OPENAI_API_KEY = 'test-key';

            const result = await rewriteWithOpenAI('francesca', 'query', 'raw response', false);
            expect(result).toBe('This is the rewritten text');
        });

        it('should fallback to persona framing on error', async () => {
            mockOpenAIInstance.chat.completions.create.mockRejectedValue(new Error('API Error'));

            const result = await rewriteWithOpenAI('pete', 'query', 'raw response', false);
            expect(result).toContain('Mock Persona take:');
        });

        it('should fallback on empty response', async () => {
            mockOpenAIInstance.chat.completions.create.mockResolvedValue({
                choices: [{ message: { content: '' } }],
            });

            const result = await rewriteWithOpenAI('pete', 'query', 'raw response', false);
            expect(result).toContain('Mock Persona take:');
        });
    });

    describe('rewrite.ts - rewriteResponse', () => {
        it('should delegate to openai by default', async () => {
            vi.stubEnv('EXPO_PUBLIC_REWRITE_PROVIDER', 'openai');

            mockCreate.mockResolvedValue({
                choices: [{ message: { content: 'Delegated to OpenAI' } }],
            });

            const result = await rewriteResponse('francesca', 'query', 'raw', false);
            expect(result).toBe('Delegated to OpenAI');
        });
    });
});
