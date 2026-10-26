# ElevenLabs voices — catalog (fetched 2026-10-26)

Full list from `node tools/narration/elevenlabs.mjs list`, saved here so future shorts don't need to
re-fetch it. The API key lives in `~/.env` (`ELEVENLABS_API_KEY`), shared with brandforge-os's own copy
of this tool — confirmed working 2026-10-26 after the user widened the key's permissions in ElevenLabs
(Settings → Developers → API Keys → full access; it initially lacked `voices_read` and `list` failed
with a 401 until then).

**Recommended for deph's tone (meditative, poetic, narrative — not corporate/hyped/social-media):**

| Language | Voice | ID | Why |
|---|---|---|---|
| ES (primary) | **Melody — Meditative & Gentle** | `5UFzavnH3OCXmnkfTBPr` | Argentine, female, calm, built for exactly this: `narrative_story`, `descriptive:calm`. |
| ES (alt) | Carlos Pro — Argentinian Documentary & Radio | `gBTPbHzRd0ZmV75Z5Zk4` | Male, professional, documentary tone, `narrative_story`. |
| EN (primary) | **George — Warm, Captivating Storyteller** | `JBFqnCBsd6RMkjVDRZzb` | British, male, mature, `narrative_story`, warm. |
| EN (alt) | River — Relaxed, Neutral, Informative | `SAz9YHcvj6GT2YYXdXww` | Gender-neutral, calm, conversational — less "performed" than George. |

Not yet confirmed against The Field's two Shorts: those appear to have **no spoken narration at all**
(music only) — nothing in `brandforge-os` or this project documents a voice track for them, and no
ElevenLabs output file exists for that piece. Asked the user to confirm 2026-10-26; unresolved.

## Full catalog

```
Roger - Laid-Back, Casual, Resonant | CwhRBWXzGAHq8TQ4Fs17 | premade | male, classy, en, conversational, middle_aged, american
Sarah - Mature, Reassuring, Confident | EXAVITQu4vr4xnSDxMaL | premade | female, professional, en, entertainment_tv, young, american
Laura - Enthusiast, Quirky Attitude | FGY2WhTYpPnrIDTdsKH5 | premade | female, sassy, en, social_media, young, american
Charlie - Deep, Confident, Energetic | IKne3meq5aSn9XLyUdCD | premade | male, hyped, en, conversational, young, australian
George - Warm, Captivating Storyteller | JBFqnCBsd6RMkjVDRZzb | premade | male, mature, en, narrative_story, middle_aged, british
Callum - Husky Trickster | N2lVS1w4EtoT3dr4eOWO | premade | male, en, characters_animation, middle_aged, american
River - Relaxed, Neutral, Informative | SAz9YHcvj6GT2YYXdXww | premade | neutral, calm, en, conversational, middle_aged, american
Harry - Fierce Warrior | SOYHLrjzK2X1ezoPC6cr | premade | male, rough, en, characters_animation, young, american
Liam - Energetic, Social Media Creator | TX3LPaxmHKxFdv7VOQHJ | premade | male, confident, en, social_media, young, american
Alice - Clear, Engaging Educator | Xb7hH8MSUJpSbSDYk0k2 | premade | female, professional, en, informative_educational, middle_aged, british
Matilda - Knowledgable, Professional | XrExE9yKIg1WjnnlVkGX | premade | female, upbeat, en, informative_educational, middle_aged, american
Will - Relaxed Optimist | bIHbv24MWmeRgasZH58o | premade | male, chill, en, conversational, young, american
Jessica - Playful, Bright, Warm | cgSgspJ2msm6clMCkdW9 | premade | female, cute, en, conversational, young, american
Eric - Smooth, Trustworthy | cjVigY5qzO86Huf0OWal | premade | male, classy, en, conversational, middle_aged, american
Bella - Professional, Bright, Warm | hpp4J3VqNfWAUOO0d1Us | premade | female, professional, en, informative_educational, middle_aged, american
Chris - Charming, Down-to-Earth | iP95p4xoKVk53GoZ742B | premade | male, casual, en, conversational, middle_aged, american
Brian - Deep, Resonant and Comforting | nPczCjzI2devNBz1zQrb | premade | male, classy, en, social_media, middle_aged, american
Daniel - Steady Broadcaster | onwK4e9ZLuTAKqWW03F9 | premade | male, formal, en, informative_educational, middle_aged, british
Lily - Velvety Actress | pFZP5JQG7iQjIQuC4Bku | premade | female, confident, en, informative_educational, middle_aged, british
Adam - Dominant, Firm | pNInz6obpgDQGcFmaJgB | premade | male, en, social_media, middle_aged, american
Bill - Wise, Mature, Balanced | pqHfZKP75CvOlQylNhV4 | premade | male, crisp, en, advertisement, old, american
Agustin - Spirited, Forceful and Assured | D09EpJbk4um1HKSpeTSc | professional | male, es, advertisement, argentine, middle_aged, hyped
Agustín - Relaxed, Warm and Approachable | ByVRQtaK1WDOvTmP1PKO | professional | male, es, conversational, argentine, middle_aged, casual
Jessica - Playful, Bright, Warm | r1KmysJdVYZjJCm4mL3b | professional | female, en, conversational, young, american, upbeat
Agustín - Fast and Energetic | KqSsYz0buWgkvSbaGn1n | professional | male, es, narrative_story, argentine, middle_aged, confident
Carlos Pro - Argentinian Documentary & Radio | gBTPbHzRd0ZmV75Z5Zk4 | professional | male, es, narrative_story, argentine, middle_aged, professional
Tomas - Argentina & Uruguaya | QK4xDwo9ESPHA4JNUpX3 | professional | male, es, conversational, argentine, young, confident
Melody - Meditative & Gentle | 5UFzavnH3OCXmnkfTBPr | professional | female, es, narrative_story, argentine, middle_aged, calm
Sofía | h60rOzgfLmYsntfqgGu2 | professional | female, es, social_media, argentine, middle_aged, casual
Lionel - Natural and Versatile Narrator | MjtZn5tagxL1RO6w9ER5 | professional | male, es, conversational, argentine, middle_aged, confident
Chelo - Young, Publicity & Characters | SxiIZdPt3fsiAenlubTX | professional | male, es, advertisement, argentine, young, confident
Pablo - Argentino, Córdoba | JXKQ929SO0LLl7spbEAI | professional | male, es, narrative_story, argentine, middle_aged, deep
```

Re-fetch with `node tools/narration/elevenlabs.mjs list` if the account's voices change — this file can
go stale.
