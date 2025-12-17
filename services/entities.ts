import { YelpEntity, hasReservation } from './yelp';
import { getMockAvailability } from '../utils/booking';

export function filterEntitiesByPersonaText(text: string, entities: YelpEntity[]): YelpEntity[] {
  if (!text) return entities;
  const lowered = text.toLowerCase();

  const matches: { entity: YelpEntity; index: number }[] = [];

  entities.forEach((entity) => {
    const name = (entity.name || '').toLowerCase();
    if (name) {
      // 1. Exact Match
      let idx = lowered.indexOf(name);

      // 2. Cleaned Match (remove 'the ', 'restaurant', etc)
      if (idx === -1) {
        const cleanName = name.replace(/^(the|a|an)\s+/g, '').split(' - ')[0].trim();
        if (cleanName.length > 3) {
          idx = lowered.indexOf(cleanName);
        }
      }

      // 3. Partial Match (if the entity name is "Anytime Kitchen" and text says "Anytime")
      // This is risky if name is common like "Starbucks", but useful for specific spots.
      if (idx === -1) {
        const parts = name.split(' ');
        // Try matching first word if length > 4 (e.g. "Kinwich" in "Kinwich Sandwich Shop")
        if (parts[0] && parts[0].length >= 4) {
          idx = lowered.indexOf(parts[0]);
        }
      }

      if (idx !== -1) {
        matches.push({ entity, index: idx });
      }
    }
  });

  // Sort by index (order of mention)
  matches.sort((a, b) => a.index - b.index);

  if (matches.length > 0) {
    // Return ALL matches found in the text, don't arbitrarily limit
    return matches.map(m => m.entity);
    // If the text mentions 5 places, we should show 5 cards.
  }

  // If no text match found, return top 5 rated/default
  return entities.slice(0, 5);
}

export function normalizeEntities(raw: any[]): YelpEntity[] {
  const flattened: YelpEntity[] = [];

  raw.forEach((entity) => {
    const businesses = Array.isArray(entity?.businesses) && entity.businesses.length > 0 ? entity.businesses : [entity];

    businesses.forEach((biz: any) => {
      const source = biz ?? {};
      const summary =
        source.contextual_info?.summary ??
        source.summaries?.short ??
        source?.attributes?.biz_summary?.summary ??
        entity?.contextual_info?.summary ??
        entity?.summaries?.short;

      const ent = {
        id: source.id,
        name: source.name,
        url: source.url,
        phone: source.phone,
        rating: source.rating,
        price: source.price,
        distance: source.distance,
        location: source.location,
        coordinates: source.coordinates,
        categories: source.categories ?? entity.categories,
        reservation_url: source.reservation_url ?? entity.reservation_url,
        actions: source.actions ?? entity.actions,
        summary,
      } as YelpEntity;

      // Inject mock slots if reservable
      if (hasReservation(ent)) {
        ent.mockSlots = getMockAvailability(ent.id || ent.name);
      }

      flattened.push(ent);
    });
  });

  const scored: YelpEntity[] = [];
  const seen = new Set<string>();
  flattened.forEach((item) => {
    const key = item.id || item.name || item.url;
    if (key && !seen.has(key)) {
      seen.add(key);
      scored.push(item);
    }
  });

  scored.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

  // Return all entities so filter can select the best ones from the full set
  return scored;
}
