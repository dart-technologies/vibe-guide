# Vibe Guide: Moment Match

Built for the [Yelp AI Hackathon](https://yelp-ai.devpost.com/)

AI concierge that answers the same question in ten different voices. Powered by Yelp AI for facts, GPT-5 for tone, and ElevenLabs for playback. Primary target: Expo iOS (TestFlight); Android/web are optional later.

## Quick Start (Expo iOS)
```bash
npx create-expo-app vibe-guide --template
cd vibe-guide
npx expo install expo-audio expo-file-system expo-location
npm install openai axios
npx expo start
```
Built on **Expo SDK 54**. Set env vars: `EXPO_PUBLIC_YELP_API_KEY`, `EXPO_PUBLIC_OPENAI_API_KEY`, `EXPO_PUBLIC_ELEVENLABS_API_KEY`. Build/structure details live in `plan/EXPO_IMPLEMENTATION.md`.

## Personas
| # | Name | Voice | Specialty |
|---|---|---|---|
| 1 | Artsy Ava | Soft curator | Galleries, design, meaning |
| 2 | Barry Broadway | Theatrical hype | Matinees, show gossip, theater bars |
| 3 | Bookish Bella | Gentle narrator | Bookstores and quiet cafes |
| 4 | Francesca the Foodie | Polished British critic | Chef-driven dining & pairings |
| 5 | Luxury Lauren | Polished host | VIP dining, art house luxury |
| 6 | Marathon Maxine | Energetic coach | Movement-first itineraries |
| 7 | Nora Nightlife | Sultry insider | Speakeasies, late-night runs |
| 8 | Pizza Pete | Passionate tutor | Pizza culture and slices |
| 9 | Street Food Sam | Straight-up NYC | Neighborhood eats on a budget |
| 10| Willa the Wanderer | Warm and cozy | Coffee, markets, slow mornings |
MVP focus: Francesca, Nora, Pete. More cues: `docs/PERSONAS.md`.

## How It Works
- Persona wrapper rewrites Yelp AI responses without changing facts.
- `chat_id` from Yelp persists across turns; journeys built from returned entities.
- ElevenLabs streams persona_text to audio; cached clips per persona for fast replay.

## Demo Angle
Anchor prompt: "I have 3 hours free right now. Surprise me." Show 3 personas answering, then tap Reserve on a recommended spot. Demo script in `plan/MVP_ROADMAP.md`.

## Docs Map
- `docs/PERSONAS.md` — voice and tone cues for all 10 personas
- `plan/MVP_ROADMAP.md` — 10-day sprint, demo script, execution checklist
- `plan/EXPO_IMPLEMENTATION.md` — setup, user journey, file layout
- `plan/API_INTEGRATION.md` — Yelp AI request/response contract
- `plan/RESERVATION_FLOW.md` — Yelp AI agentic reservation integration
- `plan/LATENCY_MASKING.md` — greeting clip strategy for smooth UX
- `constants/personas.ts` — persona prompts, voice IDs, avatars

## Concept Snapshot
- Product: AI concierge that turns local discovery into entertainment via 10 voiced personas, Yelp AI data, GPT-5 tone shaping, ElevenLabs playback.
- Why it wins: distinct journeys from the same query; practical 2–3 stop timelines with ETAs; entertaining voices and themes.
- Differentiators: persona-first rewrite while keeping Yelp facts verbatim; time-aware journeys with reservation hooks; mobile-first (Expo iOS).
- Success criteria: three personas demoed live with TTS; chat_id persistence proven; journey cards show ETA/summary/CTA row; user can craft a plan in under 3 minutes.

## Stack
- Expo (React Native) front end, iOS priority
- OpenAI GPT-5 for persona rewrite
- ElevenLabs TTS for character audio
- Yelp AI chat/v2 for business intelligence