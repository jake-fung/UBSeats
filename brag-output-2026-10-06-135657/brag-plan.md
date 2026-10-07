# Brag Plan: UBSeats

## What is this app?
A live map of UBC Vancouver that shows which classrooms and library study rooms are free *right now*, with a per-room timetable, so students stop wandering IKB looking for a seat.

## The angle
Every UBC student knows the ritual: walk into IKB, lap every floor, every room is taken, leave. UBSeats is the answer to that one very specific pain. The video opens on the pain (a full building), then shows the product doing the opposite in seconds: map → "Now Available Rooms" → a real IKB room going green. It's specific to UBC (real building codes like IBLC, BUCH, ANGU; real map), not "find a space" in the abstract.

## Hook (first 2-3 seconds)
Dark navy (the map's own water colour). Big white Poppins type slams in: **"IKB. 2pm."** then, after a beat, **"Every room: taken."** with a strip of red timetable blocks filling across beneath it like the real RoomTimetable component. Students recognize it instantly.

## Key moments (the middle)
- **The real campus map**: the live ubseats.ca screenshot with 60+ building pills (BUCH 66, ANGU 56, IBLC 35…), slow push-in.
- **The filter click**: a cursor taps the "Now Available Rooms" chip; it turns blue and the map swaps to only buildings with free rooms (BUCH 66 → 20). Real before/after screenshots.
- **The room going green**: recreated IKB room card (IBLC – Room 461, Capacity 25). Timetable blocks fill left→right, mostly green, and a tooltip pops: "3:30pm–3:45pm · Available" (real per-block format; caption carries "free until 10pm").

## Outro / punchline
Stat chips ("347 classrooms", "Library rooms synced every 15 min", "Every building on campus"), then the logo (blue pin + UBSeats) lands on a strong beat. Line: **"Stop wandering. Start studying."** + **ubseats.ca**.

## User flow worth showing
Open map (entry) → tap "Now Available Rooms" (key action) → open IKB and see Room 461 is free until 10pm (result).

## Tone
- Preset: default
- Creative direction: "a UBC student's inside joke, delivered as a clean product launch"
- Interpretation: playful copy, clean motion, crossfades/wipes, room to breathe; humour comes from the very real IKB pain, not from gags.

## Format: landscape — 1920x1080
## Duration: 22s

## Visual identity (from the project)
- Background: map navy `#2B3A55` (sampled from live map water) for type scenes; white `#FFFFFF` for UI cards
- Accent: `hsl(210 100% 50%)` = `#0080FF` (primary)
- Text: `#111827` (gray-900) on white; white on navy
- Status: available `#4ADE80` (green-400), unavailable `#F87171` (red-400), closed `#D1D5DB` (gray-300)
- Display font: Poppins (600/700)
- Body font: Poppins (400/500)
- Strongest visual element: the live map with blue-bordered building pills + count badges; the green/red room timetable strip

## Share copy (draft)
Built UBSeats so nobody has to lap IKB looking for an empty room again. Live classroom + library room availability for all of UBC Vancouver → ubseats.ca

## Audio direction
- Role: warm bed, upbeat
- Music: `happy-beats-business-moves-vol-1-by-ende-dot-app.mp3`
- Music treatment: start at 0, bed ~0.32, fade out over last ~1.2s
- Music cue guidance: preset read (`cues/happy-beats-business-moves-vol-1…music-cues.json`, 120.19 BPM, beats on x.02 / x.52). Strong cues: 18.52s → logo landing; 20.02s → tagline/URL settle. Beat grid 3.02 → reveal logo. Stat chips at 15.52 / 16.52 / 17.52 (every other beat, readable).
- Audio-reactive treatment: subtle; music RMS gently breathes the blue pin glow / outro accent. No visualizer graphics.
- SFX posture: moderate, motion-matched (default tone: 3–6 cues)
- Audio-coupled moments: hook red blocks fill (soft accent on "taken"), cursor click on filter chip, cursor click on IBLC marker, timetable fill (one soft sweep, not per block), stat chips (light drops), logo bell
- Restraint rule: no per-block clicks; nothing louder than the logo bell; no glitches

## Storyboard

### Scene 1 — Hook — 3.0s (0.0–3.0)
Navy. "IKB. 2pm." slams in (0.2s). "Every room: taken." follows at ~1.0s, holds to 3.0. Beneath: a row of red timetable blocks fills quickly left→right.
Sequential/interaction: yes — red blocks fill as a sweep (accent, not text)
Audio intent: music starts; a dry soft thud on "taken"
Audio-coupled idea: soft impact as second line lands
Transition mood: clean wipe → Scene 2

### Scene 2 — Reveal — 2.5s (3.0–5.5)
Blue location pin drops in (beat 3.02), "UBSeats" wordmark slides beside it. Subline: "Live seat & room availability across UBC Vancouver." (held ≥1.4s).
Sequential/interaction: none
Audio intent: lift
Audio-coupled idea: soft impact on pin land
Transition mood: zoom-through into map → Scene 3

### Scene 3 — The map + filter — 4.5s (5.5–10.0)
Real map screenshot, slow push-in. Caption pill "Every building on campus." (5.8–7.6). Cursor glides to the "Now Available Rooms" chip, clicks (~8.0); crossfade to filtered screenshot (chip blue). Caption swaps to "Only what's free. Right now." (8.3–10.0).
Sequential/interaction: yes — simulated cursor click on filter chip
Audio intent: momentum
Audio-coupled idea: click SFX on chip press
Transition mood: push toward IBLC → Scene 4

### Scene 4 — The room goes green — 5.0s (10.0–15.0)
Cursor taps the IBLC marker (10.2). Recreated panel slides in: "Irving K. Barber Learning Centre (IKB)", green "Open · Closes at 12am" pill, then large room card "IBLC – Room 461 · Capacity: 25" with the timetable strip filling left→right (2:00 free, 2:15–3:30 booked, green to 10pm, grey after). Tooltip pops over first green block: "3:30pm–3:45pm · Available" (holds ~1.8s). Caption: "Free until 10pm. Go study."
Sequential/interaction: yes — marker click, blocks fill sequentially, tooltip
Audio intent: payoff / satisfaction
Audio-coupled idea: click on marker, soft slide on panel, rollover on tooltip
Transition mood: clean → Scene 5

### Scene 5 — Proof — 3.5s (15.0–18.5)
Three white chips stack in on navy, every other beat (15.52, 16.52, 17.52), all held together after: "347 classrooms", "Library rooms synced every 15 min", "Hours for every building".
Sequential/interaction: yes — chips one by one, full set holds ≥1s
Audio intent: confident build
Audio-coupled idea: light drop per chip
Transition mood: clean → Scene 6

### Scene 6 — Outro — 3.5s (18.5–22.0)
Logo lands at 18.52 (beat-locked). "Stop wandering. Start studying." (from ~19.2), "ubseats.ca" in blue pill (settles ~20.02). Hold; music fades.
Sequential/interaction: none
Audio intent: resolution
Audio-coupled idea: bell on logo landing
Transition mood: end

**Music mood for this video:** upbeat
**Audio summary:** an upbeat bed from frame one, light interaction clicks through the product flow, one bell when the logo lands, then a gentle fade.
