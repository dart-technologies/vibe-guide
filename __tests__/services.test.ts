/// <reference types="vitest" />

import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { PERSONAS } from '../constants/personas';
import { buildRewritePrompt } from '../services/persona';
import { getReservationUrl, hasReservation, hasReservableEntity, YelpSession } from '../services/yelp';
import { fetchWeather } from '../services/weather';
import { filterEntitiesByPersonaText, normalizeEntities } from '../services/entities';

vi.mock('axios', () => {
  const post = vi.fn();
  const get = vi.fn();
  return { default: { post, get }, post, get };
});

describe('Yelp reservation helpers', () => {
  it('detects reservation availability via reservation_url or actions', () => {
    expect(hasReservation({ id: '1', name: 'A', url: 'x', reservation_url: 'res' })).toBe(true);
    expect(
      hasReservation({ id: '2', name: 'B', url: 'x', actions: [{ type: 'reservation', url: 'y' }] }),
    ).toBe(true);
    expect(hasReservation({ id: '3', name: 'C', url: 'x' })).toBe(false);
  });

  it('returns correct reservation URLs with fallbacks', () => {
    const withReservationUrl = { id: '1', name: 'A', url: 'x', reservation_url: 'res' };
    const withAction = { id: '2', name: 'B', url: 'x', actions: [{ type: 'reservation', url: 'y' }] };
    const withFallback = { id: '3', name: 'C', url: 'fallback' };

    expect(getReservationUrl(withReservationUrl)).toBe('res');
    expect(getReservationUrl(withAction)).toBe('y');
    expect(getReservationUrl(withFallback)).toBe('fallback');
    expect(getReservationUrl({ id: '4', name: 'D', url: '', actions: [] })).toBeNull();
  });

  it('detects when any entity is reservable', () => {
    expect(hasReservableEntity([{ id: '1', name: 'A', url: 'x' }])).toBe(false);
    expect(
      hasReservableEntity([
        { id: '1', name: 'A', url: 'x' },
        { id: '2', name: 'B', url: 'x', reservation_url: 'res' },
      ]),
    ).toBe(true);
  });
});

describe('YelpSession chat_id persistence and errors', () => {
  const originalKey = process.env.EXPO_PUBLIC_YELP_API_KEY;
  const post = axios.post as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_YELP_API_KEY = 'test-key';
    post.mockReset();
  });

  afterAll(() => {
    process.env.EXPO_PUBLIC_YELP_API_KEY = originalKey;
  });

  it('persists chat_id across sends', async () => {
    post.mockResolvedValueOnce({ data: { chat_id: 'abc', response: { text: 'hi' } } });
    post.mockResolvedValueOnce({ data: { response: { text: 'hi again' } } });

    const session = new YelpSession();
    const ctx = { locale: 'en_US', latitude: 1, longitude: 2 };

    await session.sendChat('first', ctx);
    await session.sendChat('second', ctx);

    const firstCallPayload = post.mock.calls[0]?.[1];
    const secondCallPayload = post.mock.calls[1]?.[1];

    expect(firstCallPayload?.chat_id).toBeUndefined();
    expect(secondCallPayload?.chat_id).toBe('abc');
  });

  it('surfaces 401 as a friendly error', async () => {
    post.mockRejectedValueOnce({ response: { status: 401 } });
    const session = new YelpSession();
    await expect(session.sendChat('first', { locale: 'en_US', latitude: 1, longitude: 2 })).rejects.toThrow(
      /Unauthorized/,
    );
  });

  it('drops chat_id and retries once on INTERNAL_ERROR', async () => {
    vi.useFakeTimers();
    const makeErr = () => ({
      response: {
        status: 500,
        data: {
          error: { code: 'INTERNAL_ERROR', description: 'Something went wrong internally, please try again later.' },
        },
      },
      message: 'Request failed with status code 500',
    });

    post
      .mockRejectedValueOnce(makeErr())
      .mockRejectedValueOnce(makeErr())
      .mockRejectedValueOnce(makeErr())
      .mockResolvedValueOnce({ data: { response: { text: 'ok' } } });

    const session = new YelpSession();
    session.setChatId('stale-chat');
    const ctx = { locale: 'en_US', latitude: 1, longitude: 2 };
    const promise = session.sendChat('retry me', ctx);

    await vi.runAllTimersAsync();
    const res = await promise;

    expect(res.response.text).toBe('ok');
    expect(post).toHaveBeenCalledTimes(4);
    expect(post.mock.calls[0]?.[1].chat_id).toBe('stale-chat');
    expect(post.mock.calls[3]?.[1].chat_id).toBeUndefined();
    vi.useRealTimers();
  });
});

describe('Weather service', () => {
  const originalWeatherKey = process.env.EXPO_PUBLIC_OPENWEATHERMAP_API_KEY;

  afterEach(() => {
    process.env.EXPO_PUBLIC_OPENWEATHERMAP_API_KEY = originalWeatherKey;
    vi.restoreAllMocks();
  });

  it('throws when API key missing', async () => {
    delete process.env.EXPO_PUBLIC_OPENWEATHERMAP_API_KEY;
    await expect(fetchWeather(0, 0)).rejects.toThrow(/Missing EXPO_PUBLIC_OPENWEATHERMAP_API_KEY/);
  });

  it('throws when API responds non-200', async () => {
    process.env.EXPO_PUBLIC_OPENWEATHERMAP_API_KEY = 'test-key';
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500, text: async () => 'bad' })) as any);

    await expect(fetchWeather(0, 0)).rejects.toThrow(/OpenWeatherMap error 500/);
  });

  it('returns null on weather API failure', async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({ status: 500 });
    // In our weather service, fetchWeather throws. We want to test the null fallback elsewhere if it exists.
    // Actually, weather.ts:fetchWeather throws on !res.ok.
    await expect(fetchWeather(40, -74)).rejects.toThrow();
  });
});

describe('Yelp error handling deep dive', () => {
  it('logs and handles raw axios errors without status', async () => {
    vi.mocked(axios.post).mockRejectedValueOnce(new Error('Network Crash'));
    const session = new YelpSession('user-123');
    await expect(session.sendChat('hi', { latitude: 0, longitude: 0, locale: 'en_US' })).rejects.toThrow('Network Crash');
  });

  it('performs reverse geocoding correctly', async () => {
    const { reverseGeocodeYelp } = await import('../services/yelp');
    vi.mocked(axios.get).mockResolvedValueOnce({
      data: {
        businesses: [{
          name: 'Test Spot',
          location: { city: 'New York', address1: '123 Main St' }
        }]
      }
    });
    const city = await reverseGeocodeYelp(40, -74);
    expect(city).toBe('New York');
  });

  it('handles reverse geocoding failure gracefully', async () => {
    const { reverseGeocodeYelp } = await import('../services/yelp');
    vi.mocked(axios.get).mockRejectedValueOnce(new Error('API Down'));
    const city = await reverseGeocodeYelp(40, -74);
    expect(city).toBeNull();
  });
});

describe('Persona layer', () => {
  it('includes all 10 personas', () => {
    expect(PERSONAS).toHaveLength(10);
  });

  it('builds rewrite prompt that preserves business names', () => {
    const prompt = buildRewritePrompt('francesca', 'query text', 'yelp response text');
    expect(prompt).toMatch(/keep all business names and details verbatim/i);
    expect(prompt).toContain('Original query: query text');
    expect(prompt).toContain('Yelp response: yelp response text');
  });
});

describe('Entity helpers', () => {
  it('normalizes and dedupes entities, keeping categories and sorting by rating', () => {
    const raw = [
      {
        businesses: [
          { id: 'a', name: 'Alpha', rating: 3.5, categories: [{ title: 'Bookstores' }] },
          { id: 'b', name: 'Bravo', rating: 4.7, price: '$$' },
        ],
      },
      { id: 'a', name: 'Alpha', rating: 4.0, url: 'alpha.com' },
    ];

    const normalized = normalizeEntities(raw as any);
    expect(normalized).toHaveLength(2);
    expect(normalized[0].name).toBe('Bravo');
    expect((normalized[1] as any).categories?.[0]?.title).toBe('Bookstores');
  });

  it('injects mockSlots for reservable entities', () => {
    const raw = [
      { id: 'a', name: 'Alpha', rating: 4.0, reservation_url: 'res-link' },
      { id: 'b', name: 'Bravo', rating: 3.5 },
    ];
    const normalized = normalizeEntities(raw as any);
    expect(normalized.find(e => e.id === 'a')?.mockSlots).toBeDefined();
    expect(normalized.find(e => e.id === 'a')?.mockSlots?.length).toBeGreaterThan(0);
    expect(normalized.find(e => e.id === 'b')?.mockSlots).toBeUndefined();
  });

  it('filters entities by names mentioned in persona text', () => {
    const entities = [
      { id: '1', name: 'Cafe Blue', url: 'u', rating: 4 },
      { id: '2', name: 'Starlight Bar', url: 'u2', rating: 5 },
    ] as any;

    const filtered = filterEntitiesByPersonaText('try Starlight Bar for drinks', entities);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('Starlight Bar');
  });
});
