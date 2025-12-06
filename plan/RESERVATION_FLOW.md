# Reservation Flow

Yelp AI's agentic action capabilities support restaurant reservations at thousands of locations. This is a **key differentiator** for the hackathon—judges will expect us to leverage it.

## How Yelp AI Returns Reservation Data

When a business supports reservations, the `entities[]` response includes:

```json
{
  "id": "abc123",
  "name": "L'Artusi",
  "rating": 4.5,
  "review_count": 1523,
  "reservation_url": "https://www.yelp.com/reservations/lartusi-new-york?...",
  "actions": [
    { "type": "reservation", "url": "https://..." }
  ]
}
```

**Fields to check:**
- `entity.reservation_url` — direct link
- `entity.actions[]` — may include `type: "reservation"`
- `entity.url` — fallback to business page

## Implementation (Expo)

### 1. Detect Reservation Availability

```ts
// services/yelp.ts
export function hasReservation(entity: YelpEntity): boolean {
  return Boolean(
    entity.reservation_url ||
    entity.actions?.some((a) => a.type === 'reservation')
  );
}

export function getReservationUrl(entity: YelpEntity): string | null {
  if (entity.reservation_url) return entity.reservation_url;
  const action = entity.actions?.find((a) => a.type === 'reservation');
  return action?.url ?? entity.url; // fallback to Yelp page
}
```

### 2. CTA Row Component

```tsx
// components/BusinessCard.tsx
import { Linking, TouchableOpacity, Text, View } from 'react-native';
import { hasReservation, getReservationUrl } from '../services/yelp';

type Props = { entity: YelpEntity };

export function CTARow({ entity }: Props) {
  const reserveUrl = getReservationUrl(entity);
  const canReserve = hasReservation(entity);

  return (
    <View style={styles.ctaRow}>
      {canReserve && (
        <TouchableOpacity
          style={[styles.ctaButton, styles.reserveButton]}
          onPress={() => Linking.openURL(reserveUrl!)}
        >
          <Text style={styles.ctaText}>Reserve</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={styles.ctaButton}
        onPress={() => Linking.openURL(entity.url)}
      >
        <Text style={styles.ctaText}>View on Yelp</Text>
      </TouchableOpacity>
      {entity.phone && (
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => Linking.openURL(`tel:${entity.phone}`)}
        >
          <Text style={styles.ctaText}>Call</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
```

### 3. Persona Voice Integration

When persona rewrites, mention reservations naturally:

```ts
// services/persona.ts - update rewrite prompt
export function buildRewritePrompt(
  personaId: PersonaId,
  originalQuery: string,
  yelpResponseText: string,
  hasReservableSpot: boolean
): string {
  const persona = getPersona(personaId);
  const reservationHint = hasReservableSpot
    ? 'Mention that a reservation can be made with one tap.'
    : '';
  
  return [
    persona.rewrite,
    reservationHint,
    '',
    `Original query: ${originalQuery}`,
    `Yelp response: ${yelpResponseText}`,
    '',
    'Rewrite in character, keep business names and factual details intact.',
  ].join('\n');
}
```

## Demo Script Integration

**Reserve action is a demo highlight.** In the 3-minute video:

1. Ask Francesca for "date night in Manhattan"
2. She responds with **L'Artusi** recommendation (4.5★, West Village, regional Italian)
3. Tap the **Reserve** button live on screen
4. Show Yelp reservation page opening

**Voiceover:** "One tap, and you're booked."

## Test Cases

- [ ] Business with `reservation_url` → "Reserve" button appears
- [ ] Business with only `actions[type=reservation]` → falls back correctly
- [ ] Business with no reservation → only "View on Yelp" shown
- [ ] Tapping Reserve → opens iOS Safari / in-app browser to Yelp
- [ ] Persona mentions reservability when available

## Error Handling

```ts
const handleReserve = async (url: string) => {
  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    Linking.openURL(url);
  } else {
    // Show fallback: "Open Yelp to reserve"
    Alert.alert('Open in Yelp', 'Tap to complete your reservation on Yelp.com');
  }
};
```