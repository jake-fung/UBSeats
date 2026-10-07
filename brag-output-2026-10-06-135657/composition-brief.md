# Hyperframes Composition Brief: UBSeats

## Objective
Create a short launch-style brag video for UBSeats.

## Output
- Composition directory: `brag-output-2026-10-06-135657/composition/`
- Rendered video: `brag-output-2026-10-06-135657/brag.mp4`
- Format: landscape — 1920x1080
- Duration: 22 seconds

## Source Material
- Project root: UBSeats repo
- Primary files read: README.md, index.html, src/index.css, src/components/{Header,FilterBar}.tsx, src/components/details/{RoomTimetable,HoursPill,RoomCard}.tsx, src/utils/mapMarkerUtils.ts, public/ubseats.png
- Live captures (public ubseats.ca, 3200x1800): `shots/01-map.png` (all buildings), `shots/02-filter.png` ("Now Available Rooms" active), `shots/03-panel.png` (IKB panel), `shots/04-rooms-600.png` (IKB room list with timetables)
- Product name: UBSeats
- Tagline / strongest claim: "Live seat & room availability across UBC Vancouver."
- Key UI moment to recreate: IKB room card (IBLC – Room 461, Capacity 25) with the green/red RoomTimetable strip + tooltip "3:30pm–3:45pm · Available"
- Copy that must appear verbatim:
  - "Now Available Rooms" (filter chip, from real screenshot)
  - "Irving K. Barber Learning Centre (IKB)"
  - "Open · Closes at 12am"
  - "IBLC – Room 461" / "Capacity: 25"
  - "ubseats.ca"

## Creative Direction
- Tone preset: default
- Creative direction: a UBC student's inside joke, delivered as a clean product launch
- Interpretation: playful copy, clean motion, crossfades/wipes; humour from the real IKB pain
- Angle: open on the familiar pain (IKB at 2pm, every room taken), then the product flips it — map → filter → a real IKB room going green.
- Hook: "IKB. 2pm." / "Every room: taken." over a filling red timetable strip
- Outro / punchline: "Stop wandering. Start studying." + ubseats.ca
- Avoid: generic SaaS language, abstract filler visuals, redesigning the UI

## Visual Identity
- Background: navy `#2B3A55` (map water) for type scenes
- Text: `#111827` on white UI; white on navy
- Accent: `#0080FF` (hsl 210 100% 50%)
- Status colours: `#4ADE80` available, `#F87171` unavailable, `#D1D5DB` closed
- Display/body font: Poppins (local TTFs)
- Visual references: blue-bordered building pills with count badge; white rounded-full header; rounded-2xl room cards

## Storyboard
Contract: `brag-plan.md`.
1. Hook — 3.0s — "IKB. 2pm." / "Every room: taken." + red strip
2. Reveal — 2.5s — pin + UBSeats wordmark + subline
3. Map + filter — 4.5s — real map push-in, cursor clicks "Now Available Rooms", crossfade to filtered map
4. Room goes green — 5.0s — IBLC click, IKB panel + Room 461 timetable fills, tooltip
5. Proof — 3.5s — three stat chips on beat grid
6. Outro — 3.5s — logo beat-locked at 18.52s, tagline, ubseats.ca

## Audio
- Audio role: warm upbeat bed
- Audio arc: bed from frame 0 → interaction clicks in product scenes → bell on logo → fade
- Music: `assets/music/happy-beats-business-moves-vol-1-by-ende-dot-app.mp3`, volume ~0.32, fade last ~1.2s
- Music cue guidance: bundled preset (120.19 BPM; beats at x.02/x.52). Lock logo to 18.52; chips at 15.52/16.52/17.52.
- Audio-reactive treatment: subtle — RMS drives the glow behind the outro pin / navy background radial
- Audio-coupled moments: hook "taken" thud; filter chip click; marker click; panel slide; tooltip rollover; chips drop; logo bell
- SFX analysis guidance: brag `assets/sfx/sfx-analysis.md` — prefer low HF-risk picks
- Exact SFX choice: chosen during composition against implemented animation
