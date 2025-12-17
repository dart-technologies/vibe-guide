import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import * as Location from 'expo-location';
import { reverseGeocodeYelp } from '../services/yelp';
import { getNycNeighborhood } from '../services/nyc';

export type Coords = { latitude: number; longitude: number };

type LocationStatus = 'idle' | 'loading' | 'granted' | 'denied';

interface LocationContextType {
    coords: Coords | null;
    city: string | null;
    status: LocationStatus;
    error: string | null;
    zip: string;
    setZip: (zip: string) => void;
    radius: number;
    setRadius: (r: number) => void;
    requestLocation: () => Promise<Coords | null>;
    setZipLocation: (zip: string) => Promise<Coords | null>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
    const [coords, setCoords] = useState<Coords | null>(null);
    const [city, setCity] = useState<string | null>(null);
    const [status, setStatus] = useState<LocationStatus>('idle');
    const [error, setError] = useState<string | null>(null);
    const [zip, setZip] = useState<string>('');
    const [radius, setRadius] = useState<number>(1);

    const reverseGeocode = async (lat: number, lon: number) => {
        try {
            const nycName = getNycNeighborhood(lat, lon);
            if (nycName) {
                setCity(nycName);
                return;
            }

            // 1. Native expo-location
            const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });

            // 2. Weehawken Fix
            const expoCity = results[0]?.city;
            if (expoCity === 'Weehawken') {
                setCity('Manhattan (West)');
                return;
            }

            const yelpCity = await reverseGeocodeYelp(lat, lon);
            if (yelpCity) {
                if (yelpCity === 'Weehawken') {
                    setCity('Manhattan (West)');
                } else {
                    setCity(yelpCity);
                }
                return;
            }

            // 4. Fallback to Expo normal parsing
            const first = results[0];
            if (first) {
                let chosen = first.district || first.city || first.subregion || first.name;
                setCity(chosen || null);
            }
        } catch {
            // ignore failures
        }
    };

    const requestLocation = useCallback(async () => {
        // If we already have a location or are loading, we can optionally skip.
        // However, to mimic original behavior but prevent double-mount calls:
        // We will just let it run but the state is shared now.
        // For perf improvement: check if loading.

        // Note: We can't easily check 'status' here inside useCallback if we want to avoid stale closures,
        // but unless we add status to dependency array (which changes the function identity),
        // we might trigger loops. 
        // Instead, we rely on the fact that this function identity is stable and we can use a ref or just let it run.

        // BETTER PERF: If we already have coords and status is granted, maybe we don't need to re-fetch?
        // But the user might want to refresh. 
        // Let's rely on the components to decide logic, OR prevent concurrent requests.

        setStatus('loading');
        setError(null);
        const { status: perm } = await Location.requestForegroundPermissionsAsync();
        if (perm !== 'granted') {
            setStatus('denied');
            setError('Location permission denied.');
            return null;
        }

        try {
            const pos = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Highest,
            });
            const next = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
            setCoords(next);
            setStatus('granted');
            reverseGeocode(next.latitude, next.longitude);
            return next;
        } catch (e) {
            setError('Failed to get location');
            setStatus('denied');
            return null;
        }
    }, []);

    const setZipLocation = useCallback(async (zipCode: string) => {
        setError(null);
        if (!zipCode) return null;
        try {
            const results = await Location.geocodeAsync(zipCode);
            if (results.length === 0) {
                setError('ZIP not found.');
                return null;
            }
            const geo = results[0];
            const next = { latitude: geo.latitude, longitude: geo.longitude };
            setCoords(next);
            setStatus('granted');
            reverseGeocode(next.latitude, next.longitude);
            return next;
        } catch {
            setError('Geocoding failed');
            return null;
        }
    }, []);

    return (
        <LocationContext.Provider
            value={{
                coords,
                city,
                status,
                error,
                zip,
                setZip,
                radius,
                setRadius,
                requestLocation,
                setZipLocation
            }}
        >
            {children}
        </LocationContext.Provider>
    );
}

export function useLocationContext() {
    const context = useContext(LocationContext);
    if (!context) {
        throw new Error('useLocationContext must be used within a LocationProvider');
    }
    return context;
}
