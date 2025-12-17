// Hardcoded NYC Neighborhood centroids for high-precision hackathon context
// "Show, Don't Tell" - ensures we get "SoHo" not "New York"
// Source: Approximate centroids

type Neighborhood = {
    name: string;
    lat: number;
    lon: number;
    borough: string;
};

const NYC_NEIGHBORHOODS: Neighborhood[] = [
    { name: 'SoHo', lat: 40.7233, lon: -74.0030, borough: 'Manhattan' },
    { name: 'West Village', lat: 40.7358, lon: -74.0036, borough: 'Manhattan' },
    { name: 'Tribeca', lat: 40.7163, lon: -74.0086, borough: 'Manhattan' },
    { name: 'Financial District', lat: 40.7074, lon: -74.0113, borough: 'Manhattan' },
    { name: 'Chinatown', lat: 40.7158, lon: -73.9970, borough: 'Manhattan' },
    { name: 'Lower East Side', lat: 40.7150, lon: -73.9843, borough: 'Manhattan' },
    { name: 'East Village', lat: 40.7265, lon: -73.9815, borough: 'Manhattan' },
    { name: 'Nolita', lat: 40.7229, lon: -73.9960, borough: 'Manhattan' },
    { name: 'Chelsea', lat: 40.7465, lon: -74.0014, borough: 'Manhattan' },
    { name: 'Meatpacking District', lat: 40.7405, lon: -74.0060, borough: 'Manhattan' },
    { name: 'Hell\'s Kitchen', lat: 40.7638, lon: -73.9918, borough: 'Manhattan' },
    { name: 'Midtown', lat: 40.7549, lon: -73.9840, borough: 'Manhattan' },
    { name: 'Upper West Side', lat: 40.7870, lon: -73.9754, borough: 'Manhattan' },
    { name: 'Upper East Side', lat: 40.7736, lon: -73.9566, borough: 'Manhattan' },
    { name: 'Hudson Yards', lat: 40.7538, lon: -74.0022, borough: 'Manhattan' },

    // Brooklyn
    { name: 'Williamsburg', lat: 40.7178, lon: -73.9576, borough: 'Brooklyn' },
    { name: 'DUMBO', lat: 40.7031, lon: -73.9888, borough: 'Brooklyn' },
    { name: 'Greenpoint', lat: 40.7288, lon: -73.9520, borough: 'Brooklyn' },
    { name: 'Bushwick', lat: 40.6958, lon: -73.9171, borough: 'Brooklyn' },
    { name: 'Brooklyn Heights', lat: 40.6960, lon: -73.9933, borough: 'Brooklyn' },

    // Hack: Weehawken Fix (Map Weehawken area to Manhattan context if desired, or just label clearly)
    // If we want to "Fix" Weehawken, we can add a fake node or just handle it logic.
    // For now, let's keep it accurate but distinct.
];

// Simple Haversine distance
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d;
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
}

export function getNycNeighborhood(lat: number, lon: number): string | null {
    let closest: Neighborhood | null = null;
    let minDist = Infinity;

    // Threshold: 0.8 km (~0.5 miles) is reasonable for "In this neighborhood"
    // NYC neighborhoods are small.
    const THRESHOLD_KM = 0.8;

    for (const n of NYC_NEIGHBORHOODS) {
        const dist = getDistanceFromLatLonInKm(lat, lon, n.lat, n.lon);
        if (dist < minDist) {
            minDist = dist;
            closest = n;
        }
    }

    if (closest && minDist < THRESHOLD_KM) {
        return closest.name;
    }

    // Slightly larger threshold for "Near X"?
    if (closest && minDist < 1.5) {
        // Maybe return "Near [Name]"? Or just strictly match.
        // Let's retry with slightly looser bounds if we really want a hit.
        return closest.name;
    }

    return null;
}
