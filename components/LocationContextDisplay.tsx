import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Coords } from '../hooks/useLocation';
import { WeatherSummary } from '../services/weather';

type Props = {
    coords: Coords | null;
    city: string | null;
    weather?: WeatherSummary | null;
    error?: string | null;
};

export function LocationContextDisplay({ coords, city, weather, error }: Props) {
    if (error) {
        return (
            <View style={styles.container}>
                <Ionicons name="alert-circle-outline" size={14} color="#f5c6c6" />
                <Text style={[styles.text, { color: '#f5c6c6' }]}>{error}</Text>
            </View>
        );
    }
    if (!coords && !city && !weather) return null;

    const locationName = city || weather?.city || 'Unknown Location';
    const weatherInfo = weather ? `${Math.round(weather.tempF)}°F — ${weather.description}` : null;

    // Fallback to coords if no city name, or append if we want debug info (but user wants combined/clean)
    // Let's do: City • Weather
    // If no weather, City • Coords

    return (
        <View style={styles.container}>
            <Ionicons name="location-outline" size={12} color="#8ea0ff" />
            <Text style={styles.text}>
                {locationName}
                {weatherInfo && <Text style={styles.highlight}>{` • ${weatherInfo}`}</Text>}
                {!weatherInfo && coords && (
                    <Text style={styles.subtext}>
                        {` • ${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)}`}
                    </Text>
                )}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        opacity: 0.8,
    },
    text: {
        color: '#e2e4e9',
        fontSize: 13,
        fontWeight: '500',
    },
    subtext: {
        color: '#8b91a0',
        fontSize: 12,
        fontWeight: '400',
    },
    highlight: {
        color: '#ffffff',
        fontWeight: '600',
    },
});
