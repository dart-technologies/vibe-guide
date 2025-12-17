import { YelpUserContext } from '../services/yelp';
import { WeatherSummary } from '../services/weather';

export function buildContextString(weather: WeatherSummary | null, ctx: YelpUserContext, city?: string | null, radius?: number) {
    const now = new Date();
    const hour = now.getHours();
    const timeOfDay =
        hour >= 5 && hour < 12
            ? 'morning'
            : hour >= 12 && hour < 17
                ? 'afternoon'
                : hour >= 17 && hour < 21
                    ? 'evening'
                    : 'night';
    const timeString = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    const place = city || 'your area';

    // Include precise coords in text for clarity
    const locString = `Location: ${place} (${ctx.latitude.toFixed(4)}, ${ctx.longitude.toFixed(4)})`;

    const parts = [`Current context: ${timeOfDay} (${timeString})`];
    if (weather) {
        parts.push(`${Math.round(weather.tempF)}°F`, weather.description, locString);
    } else {
        parts.push(locString);
    }
    if (radius) {
        // Use stronger language for the LLM context
        parts.push(`Strictly limit results to within ${radius} mile${radius !== 1 ? 's' : ''}`);
    }
    return parts.join(', ');
}
