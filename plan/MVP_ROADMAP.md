# MVP Roadmap

## Deadline
- [ ] Submit TestFlight build + demo video to Devpost by **Wed Dec 17, 2025, 5pm ET**.

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
- [ ] Expo SDK 54, iOS bundle IDs set
- [ ] `.env` wired into `app.config.ts` (`YELP`, `OPENAI`, `ELEVENLABS`, `OPENWEATHERMAP`)
- [ ] EAS build profile for iOS configured

### APIs
- [ ] Yelp AI key validated via curl
- [ ] `chat_id` persisted across turns
- [ ] Retry on 429; 401 surfaced to UI
- [ ] OpenWeatherMap returns temp + conditions

### Persona Layer
- [ ] All 10 personas defined in `constants/personas.ts`
- [ ] GPT-5 rewrite keeps entity names verbatim
- [ ] Entity preservation unit tests pass

### Audio & Latency
- [ ] All 10 greeting clips generated and bundled
- [ ] Greeting plays immediately on message send
- [ ] Real TTS streams after greeting finishes
- [ ] Time-to-first-audio < 3s on Wi-Fi
- [ ] Per-persona TTS cache with replay fallback

### UI & Polish
- [ ] Persona gallery with all 10 cards
- [ ] Mood Match quick action buttons
- [ ] Color theme transitions on persona switch
- [ ] Avatar pulse animation while thinking
- [ ] Chat bubbles with inline play/pause
- [ ] Blur headers using `expo-blur`

### Reservation Flow
- [ ] Detect `reservation_url` or `actions[type=reservation]`
- [ ] "Reserve" button appears for reservable spots
- [ ] Tap opens Yelp reservation in browser
- [ ] Persona mentions reservability when available

### Location & Context
- [ ] Location permission request flow
- [ ] Manual ZIP entry fallback
- [ ] Lat/long passed to Yelp requests
- [ ] Weather + time-of-day in persona preface

### Testing
- [ ] Mock Yelp responses for offline UI testing
- [ ] Confirm `chat_id` survives refresh
- [ ] Verify location permissions and fallback
- [ ] No crashes on background/foreground transitions

### Demo Prep
- [ ] TestFlight build submitted Day 9
- [ ] Demo recorded on physical iOS device
- [ ] Video edited to 3 min
- [ ] Devpost assets packaged (screenshots, description)
- [ ] Submit

---

## Guardrails

- Ship all 10 personas, but demo focuses on **Francesca, Nora, Pete**
- Keep **time-to-first-audio < 3s** on Wi-Fi
- If TTS fails, fallback to text-only gracefully