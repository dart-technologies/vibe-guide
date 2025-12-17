# Yelp AI Integration

## Endpoint
`POST https://api.yelp.com/ai/chat/v2`
Headers: `Authorization: Bearer <YELP_API_KEY>`, `Content-Type: application/json`

## Minimal Payload
```json
{
  "query": "Best date night spots in Manhattan",
  "user_context": {"locale": "en_US", "latitude": 40.7128, "longitude": -74.0060},
  "chat_id": "<optional from prior call>"
}
```

## Key Response Fields
- `response.text` — Yelp AI narrative answer.
- `entities[]` — business objects with `id`, `name`, `categories`, `coordinates`, `price`, `rating`, `url`, `phone`.
- `contextual_info.summary` or `summaries.short` — use for card copy.
- `review_snippet` — optional highlight for social proof.
- `chat_id` — persist for the session.

## Session Wrapper (pseudo)
```ts
class YelpSession {
  chatId?: string;
  async send(query, ctx) {
    const body = { query, user_context: ctx, ...(this.chatId && { chat_id: this.chatId }) };
    const res = await post(body);
    this.chatId ||= res.chat_id;
    return res;
  }
  reset() { this.chatId = undefined; }
}
```

## Persona Rewrite Flow
1) Prepend persona system text to the user query (pre-Yelp) only when tone matters.  
2) Call Yelp AI; keep entities untouched.  
3) Use GPT-5 (4o-mini) to rewrite `response.text` into persona voice; attach as `persona_text` (Apple Foundation Models optional when `EXPO_PUBLIC_REWRITE_PROVIDER=apple`).  
4) Stream ElevenLabs TTS from `persona_text`.  
5) Fall back to original `response.text` on errors.

## Journey Builder (client)
- Detect duration keywords ("hours", "tonight", "morning").
- Map `entities` → 2–3 stops, add ETA using category heuristics.
- Actions: `Reserve` (if enabled), `Navigate` (coords), `View on Yelp` (url), `Call` (phone).

## Test Grid
- First call returns `chat_id`; second call reuses it.
- Entity present vs missing `contextual_info.summary` fallback to `summaries.short`.
- Location swap updates results.
- High-latency/429 → retry with short backoff; 401 → surface bad key error.
