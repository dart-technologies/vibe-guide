import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildContextString } from '../utils/context';
import { calculateDistance } from '../utils/distance';

describe('Utils', () => {
    describe('context.ts - buildContextString', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should build context string for morning', () => {
            const morningDate = new Date('2025-12-17T09:00:00');
            vi.setSystemTime(morningDate);

            const ctx = { latitude: 40.7128, longitude: -74.006, locale: 'en_US' };
            const result = buildContextString(null, ctx, 'New York', 5);

            expect(result).toContain('morning');
            expect(result).toContain('New York (40.7128, -74.0060)');
            expect(result).toContain('Strictly limit results to within 5 miles');
        });

        it('should build context string for night with weather', () => {
            const nightDate = new Date('2025-12-17T23:00:00');
            vi.setSystemTime(nightDate);

            const ctx = { latitude: 34.0522, longitude: -118.2437, locale: 'en_US' };
            const weather = { tempF: 65, description: 'clear sky', icon: '01d' };
            const result = buildContextString(weather, ctx, 'Los Angeles', 1);

            expect(result).toContain('night');
            expect(result).toContain('65°F');
            expect(result).toContain('clear sky');
            expect(result).toContain('Los Angeles (34.0522, -118.2437)');
            expect(result).toContain('Strictly limit results to within 1 mile');
        });

        it('should fallback to "your area" if city is missing', () => {
            const ctx = { latitude: 0, longitude: 0, locale: 'en_US' };
            const result = buildContextString(null, ctx, null, 10);
            expect(result).toContain('your area (0.0000, 0.0000)');
        });
    });

    describe('distance.ts - calculateDistance', () => {
        it('should return null if any coordinate is missing', () => {
            expect(calculateDistance(40, -74, 41, undefined)).toBeNull();
        });

        it('should calculate distance between NYC and LA correctly', () => {
            // Approx distance NYC to LA is ~3940km
            const nyc = { lat: 40.7128, lon: -74.006 };
            const la = { lat: 34.0522, lon: -118.2437 };

            const distance = calculateDistance(nyc.lat, nyc.lon, la.lat, la.lon);

            // Result is in meters
            expect(distance).toBeGreaterThan(3900000);
            expect(distance).toBeLessThan(4000000);
        });

        it('should return 0 for same location', () => {
            expect(calculateDistance(40, -74, 40, -74)).toBe(0);
        });
    });
});
