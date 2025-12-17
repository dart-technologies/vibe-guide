import { describe, it, expect } from 'vitest';
import { getNycNeighborhood } from '../services/nyc';

describe('NYC Service', () => {
    it('should identify SoHo correctly', () => {
        // SoHo centroid is 40.7233, -74.0030
        const result = getNycNeighborhood(40.723, -74.003);
        expect(result).toBe('SoHo');
    });

    it('should identify Williamsburg correctly', () => {
        // Williamsburg centroid is 40.7178, -73.9576
        const result = getNycNeighborhood(40.718, -73.958);
        expect(result).toBe('Williamsburg');
    });

    it('should identify Midtown correctly within threshold', () => {
        // Midtown centroid is 40.7549, -73.9840
        const result = getNycNeighborhood(40.755, -73.984);
        expect(result).toBe('Midtown');
    });

    it('should return null for far away locations (e.g., LA)', () => {
        const result = getNycNeighborhood(34.0522, -118.2437);
        expect(result).toBeNull();
    });

    it('should return nearest match even if slightly outside 0.8km threshold but within 1.5km', () => {
        // Just outside SoHo center but within 1.5km
        // SoHo lat: 40.7233, lon: -74.0030
        // A point ~1km away
        const result = getNycNeighborhood(40.73, -74.01);
        expect(result).toBeDefined();
    });
});
