# MVP Roadmap

## Deadline
- [x] Submit TestFlight build + demo video to Devpost by **Wed Dec 17, 2025, 5pm ET**.
  - **TestFlight**: [https://testflight.apple.com/join/tPxPbsYb](https://testflight.apple.com/join/tPxPbsYb)
  - **Demo Video**: [https://www.youtube.com/watch?v=YIzC-U-JhUI](https://www.youtube.com/watch?v=YIzC-U-JhUI)

---

## Sprint Focus

| Day | Focus | Key Deliverable |
|-----|-------|-----------------|
| **1-2** | Core chat loop | User → Yelp AI → Response displayed with `chat_id` persistence |
| **3** | Persona rewrite | GPT-5 integration, entity preservation tests pass |
| **4** | Voice playback | ElevenLabs TTS + generate all 10 greeting clips |
| **5** | Latency masking | Greeting audio + thinking animation smooths UX |
| **6** | Reservation flow | Detect reservable spots, "Reserve" CTA opens Yelp |
| **7** | Visual polish | Persona color themes, avatar animations, blur headers |
| **8** | Context integration | OpenWeatherMap + time-of-day in persona preface |
| **9** | TestFlight build | EAS submission, test on physical devices, fix blockers |
| **10** | Demo video | Record, edit to 3 min, submit by 5pm ET |

---

## Demo Video Optimization (3 Min)

| Time | Beat | Visual |
|------|------|--------|
| 0:00-0:15 | **Hook** | "Same question, 3 personalities, watch the magic." |
| 0:15-1:00 | **Francesca** | Ask anchor prompt, voice plays, response appears |
| 1:00-1:45 | **Nora** | Contrasting speakeasy answer, color theme shifts |
| 1:45-2:15 | **Pete** | Fun answer + tap "Reserve" button live |
| 2:15-2:45 | **Continuity** | Switch persona mid-chat, prove `chat_id` works |
| 2:45-3:00 | **CTA** | App name + "personality-driven discovery" tagline |

**Critical:** Record on physical iOS device via TestFlight—not simulator.

---

## Visual Polish Priorities

| Priority | Element | Implementation | Wow Factor |
|----------|---------|----------------|------------|
| **1** | Persona color themes | Use `persona.colors` for headers, bubbles | 🔥🔥🔥 |
| **2** | Avatar animations | `Animated.spring` on selection + pulse while thinking | 🔥🔥🔥 |
| **3** | Greeting audio clips | Pre-cache all 10, play immediately on send | 🔥🔥 |
| **4** | Blur headers | `expo-blur` on chat header + bottom sheets | 🔥🔥 |
| **5** | Waveform during playback | Mock bars with `Animated.View` (see `LATENCY_MASKING.md`) | 🔥 |

**Skip for MVP:** Real waveform visualization, map views, complex gestures.

---

## Mood Match Quick Actions

Instead of typing, user taps one of 4 mood buttons on the persona gallery:

| Mood | Pre-configured Query | Suggested Persona |
|------|---------------------|-------------------|
| **Surprise me** | "I have 3 hours free right now. Surprise me." | Random |
| **Impress someone** | "I want to impress someone tonight." | Francesca, Lauren |
| **Stay cozy** | "Find me somewhere cozy and quiet." | Willa, Bella |
| **Go wild** | "Show me the best nightlife around." | Nora, Barry |

---

## Weather + Time Context

Enrich persona preface with OpenWeatherMap + local time:
- Morning (5am-12pm): "Saturday morning"
- Afternoon (12pm-5pm): "Saturday afternoon"
- Evening (5pm-9pm): "Saturday evening"
- Night (9pm-5am): "Saturday night"

Format: `"Current context: Saturday afternoon, partly cloudy, 57°F in Manhattan."`

---

## Execution Checklist

### Setup & Config
- [x] Expo SDK 54 target + iOS bundle ID set in `app.config.ts` (`art.dart.vibe`)
- [x] `.env` wired into `app.config.ts` (`YELP`, `OPENAI`, `ELEVENLABS`, `OPENWEATHERMAP`)
- [x] EAS build profiles for iOS configured (`eas.json`, bundle identifier `art.dart.vibe`)

### APIs
- [x] Yelp AI key validated via curl (200 OK)
- [x] `chat_id` persisted across turns (client session helper in `services/yelp.ts`)
- [x] Retry on 429; 401 surfaced to UI (`services/yelp.ts`)
- [x] OpenWeatherMap returns temp + conditions (`services/weather.ts`)

### Persona Layer
- [x] All 10 personas defined in `constants/personas.ts`
- [x] GPT-5 rewrite keeps entity names verbatim (prompt scaffolding in `services/persona.ts`)
- [x] Entity preservation unit tests pass (`__tests__/services.test.ts`)

### Audio & Latency
- [x] All 10 greeting clips generated and bundled (`assets/greetings/*.mp3`, wired in `services/audio.ts`)
- [x] Greeting plays immediately on message send (triggered in `app/chat/[persona].tsx`)
- [x] Real TTS streams after greeting finishes (`playPersonaTTS` invoked post-greeting)
- [x] Time-to-first-audio < 3s on Wi-Fi (verified ~1.9s in-device logs)
- [x] Per-persona TTS cache with replay fallback (`services/audio.ts`)

### UI & Polish
- [x] Persona gallery with all 10 cards (`app/index.tsx`, `components/PersonaCard`)
- [x] Mood Match quick action buttons (`app/index.tsx`)
- [x] Color theme transitions on persona switch (`app/chat/[persona].tsx` background animation)
- [x] Avatar pulse animation while thinking (`components/ThinkingIndicator`)
- [x] Chat bubbles with inline play/pause (`components/VoiceBubble`)
- [x] Blur headers using `expo-blur` (`app/chat/[persona].tsx`)

### Reservation Flow
- [x] Detect `reservation_url` or `actions[type=reservation]`
- [x] "Reserve" button appears for reservable spots
- [x] Tap opens Yelp reservation in browser
- [x] Persona mentions reservability when available

### Location & Context
- [x] Location permission request flow (`useLocation`)
- [x] Manual ZIP entry fallback (`useLocation` ZIP geocode)
- [x] Lat/long passed to Yelp requests (chat screen uses coords)
- [x] Weather + time-of-day in persona preface (context string in chat screen)

### Testing
- [x] Mock Yelp responses for offline UI testing (toggle in chat uses `mock/yelp-response.json`)
- [x] Confirm `chat_id` survives refresh (cached to file and restored)
- [x] Verify location permissions and fallback (location card with permission + ZIP flow)
- [x] No crashes on background/foreground transitions (AppState watcher for visibility changes)

### Demo Prep
- [x] TestFlight build submitted Day 9
- [x] Demo recorded on physical iOS device
- [x] Video edited to 3 min
- [x] Devpost assets packaged (screenshots, description)
- [x] Submit

---

## Guardrails

- Ship all 10 personas, but demo focuses on **Francesca, Nora, Pete**
- Keep **time-to-first-audio < 3s** on Wi-Fi
- If TTS fails, fallback to text-only gracefully
