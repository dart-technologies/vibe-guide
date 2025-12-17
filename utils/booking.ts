/**
 * Utility to generate mock reservation slots for the demo.
 */

export function generateMockSlots(): string[] {
    const slots = [
        '6:30 PM',
        '7:00 PM',
        '7:15 PM',
        '8:00 PM',
        '8:30 PM',
        '9:00 PM'
    ];

    // Return 3-4 random slots
    return slots
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.min(3 + Math.floor(Math.random() * 2), slots.length))
        .sort((a, b) => {
            // Simple sort for PM times
            const getVal = (s: string) => {
                const [time, period] = s.split(' ');
                const [h, m] = time.split(':').map(Number);
                return (h === 12 ? 0 : h) * 60 + m + (period === 'PM' ? 720 : 0);
            };
            return getVal(a) - getVal(b);
        });
}

const slotCache: Record<string, string[]> = {};

/**
 * Ensures consistent slots for the same entity during a session.
 */
export function getMockAvailability(entityId: string): string[] {
    if (!slotCache[entityId]) {
        slotCache[entityId] = generateMockSlots();
    }
    return slotCache[entityId];
}
