import axios, { AxiosError, AxiosResponse } from 'axios';
import { trackEvent, AnalyticsEvents } from './analytics';

const BASE_URL = 'https://api.yelp.com/ai';

export type YelpUserContext = {
  locale: string;
  latitude: number;
  longitude: number;
};

export type YelpReservationAction = { type?: string; url?: string };

export type YelpCategory = { title: string; alias?: string };

export type YelpLocation = {
  address1?: string;
  city?: string;
  state?: string;
  zip_code?: string;
};

export type YelpEntity = {
  id: string;
  name: string;
  url: string;
  phone?: string;
  rating?: number;
  price?: string;
  distance?: number;
  location?: YelpLocation;
  coordinates?: { latitude: number; longitude: number };
  categories?: YelpCategory[];
  reservation_url?: string;
  actions?: YelpReservationAction[];
  mockSlots?: string[];
  [key: string]: unknown;
};

export type YelpChatResponse = {
  chat_id?: string;
  response: { text: string };
  entities?: YelpEntity[];
  contextual_info?: { summary?: string };
  summaries?: { short?: string };
};

type YelpChatPayload = {
  query: string;
  user_context: YelpUserContext;
  chat_id?: string;
};

function getApiKey(): string | null {
  return process.env.EXPO_PUBLIC_YELP_API_KEY || null;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestWithRetry<T>(
  fn: () => Promise<AxiosResponse<T>>,
  retries: number = 2,
  backoffMs: number = 600,
  attempt: number = 0,
): Promise<T> {
  try {
    const res = await fn();
    return res.data;
  } catch (error) {
    const err = error as AxiosError;
    const status = err.response?.status;
    const data = err.response?.data;
    const code = (data as any)?.error?.code as string | undefined;

    if (status === 401) {
      throw new Error('Unauthorized: check Yelp API key');
    }

    if (status === 429 && retries > 0) {
      await sleep(backoffMs);
      return requestWithRetry(fn, retries - 1, backoffMs * 2, attempt + 1);
    }

    if ((status === 500 || status === 503 || status === 504) && retries > 0) {
      await sleep(backoffMs);
      return requestWithRetry(fn, retries - 1, backoffMs * 2, attempt + 1);
    }

    const payload = err.response?.data as any;
    const message = payload?.error?.description || payload || err.message || 'Unknown Yelp API error';

    // Track API error
    trackEvent(AnalyticsEvents.API_ERROR, {
      service: 'yelp',
      status,
      code,
      message,
      attempt,
    });

    throw new Error(
      typeof message === 'string'
        ? message
        : JSON.stringify({ status, code, message: err.message, data: payload }),
    );
  }
}

const YELP_FUSION_URL = 'https://api.yelp.com/v3';

export class YelpSession {
  private chatId?: string;
  private readonly apiKey: string | null;

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? getApiKey();
  }

  reset() {
    this.chatId = undefined;
  }

  getChatId() {
    return this.chatId;
  }

  setChatId(id?: string) {
    this.chatId = id;
  }

  async sendChat(query: string, userContext: YelpUserContext): Promise<YelpChatResponse> {
    if (!this.apiKey) {
      throw new Error('Yelp API key is missing. Please check your environment variables or EAS secrets.');
    }

    const payload: YelpChatPayload = {
      query,
      user_context: userContext,
      ...(this.chatId && { chat_id: this.chatId }),
    };

    try {
      const data = await requestWithRetry<YelpChatResponse>(() =>
        axios.post(`${BASE_URL}/chat/v2`, payload, {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      if (data.chat_id) {
        this.chatId = data.chat_id;
      }

      return data;
    } catch (err) {
      const message = (err as Error).message?.toLowerCase?.() || '';
      const isInternal = message.includes('internal_error') || message.includes('something went wrong internally');
      if (isInternal && this.chatId) {
        console.warn('[yelp] internal error with chat_id; clearing session and retrying once');
        this.chatId = undefined;
        return this.sendChat(query, userContext);
      }
      throw err;
    }
  }
}

export async function reverseGeocodeYelp(lat: number, lng: number): Promise<string | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;
  try {
    // Search for closest business to get "neighborhood" or "city" context
    const res = await axios.get(`${YELP_FUSION_URL}/businesses/search`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      params: {
        latitude: lat,
        longitude: lng,
        limit: 1,
        sort_by: 'distance',
      },
    });

    const business = res.data?.businesses?.[0];
    if (business && business.location) {
      // Yelp location often puts neighborhood in 'display_address' or just uses city.
      // We can also return business name or location.city.
      // Actually, let's look for known neighborhoods in the response if mapped?
      // For now, return City. Or if we want to be fancy, checks if 'location.neighborhoods' exists (legacy field, maybe gone).

      const city = business.location.city;
      const addr = business.location.address1;
      return city || null;
    }
    return null;
  } catch (e) {
    console.warn('[yelp] reverse geocode failed', (e as Error).message);
    return null;
  }
}


export function hasReservation(entity: YelpEntity): boolean {
  return Boolean(entity.reservation_url || entity.actions?.some((a) => a.type === 'reservation'));
}

export function getReservationUrl(entity: YelpEntity): string | null {
  if (entity.reservation_url) return entity.reservation_url;
  const action = entity.actions?.find((a) => a.type === 'reservation');
  const url = action?.url || entity.url;
  return url && url.trim().length > 0 ? url : null;
}

export function hasReservableEntity(entities?: YelpEntity[]): boolean {
  return Boolean(entities?.some((e) => hasReservation(e)));
}
