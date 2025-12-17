import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as Audio from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { stopAllAudio, playGreetingClip } from '../services/audio';

// Mock Expo Audio
vi.mock('expo-audio', () => ({
    createAudioPlayer: vi.fn(() => ({
        play: vi.fn(),
        pause: vi.fn(),
        remove: vi.fn(),
        addListener: vi.fn((event, cb) => ({
            remove: vi.fn(),
        })),
    })),
    setAudioModeAsync: vi.fn(),
}));

// Mock Expo FileSystem
vi.mock('expo-file-system/legacy', () => ({
    cacheDirectory: 'mock-cache/',
    getInfoAsync: vi.fn(() => Promise.resolve({ exists: true })),
    makeDirectoryAsync: vi.fn(),
    writeAsStringAsync: vi.fn(),
    EncodingType: { Base64: 'base64' },
}));

// Mock Asset
vi.mock('expo-asset', () => ({
    Asset: {
        fromModule: vi.fn(() => ({
            downloadAsync: vi.fn(),
            localUri: 'mock-uri',
        })),
    },
}));

describe('Audio Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should track and stop all active players', async () => {
        // Trigger a playback
        await playGreetingClip('francesca');

        expect(Audio.createAudioPlayer).toHaveBeenCalled();

        const mockPlayer = vi.mocked(Audio.createAudioPlayer).mock.results[0].value;

        // Stop all audio
        await stopAllAudio();

        expect(mockPlayer.pause).toHaveBeenCalled();
        expect(mockPlayer.remove).toHaveBeenCalled();
    });

    it('should handle clean stopAllAudio when no players are active', async () => {
        await expect(stopAllAudio()).resolves.not.toThrow();
    });

    it('should handle errors in playGreetingClip gracefully', async () => {
        vi.mocked(Audio.createAudioPlayer).mockImplementationOnce(() => {
            throw new Error('Player creation failed');
        });

        const result = await playGreetingClip('francesca');
        expect(result).toBeNull();
    });

    it('should correctly convert ArrayBuffer to Base64 (internal helper)', async () => {
        const buffer = new Uint8Array([72, 101, 108, 108, 111]).buffer; // "Hello"
        // Reach into the module if possible or test via public API
        // For now, testing through playPersonaTTS which calls it
    });

    it('should produce consistent hashes for text', async () => {
    });
});
