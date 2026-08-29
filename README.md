# UBSeats

**Check real-time seat and room availability across UBC Vancouver campus.**

![UBSeats](public/ubseats.png)

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)

🔗 [ubseats.ca](https://ubseats.ca/)

## Overview

UBSeats is a React + TypeScript web app that shows live seat and bookable room availability for buildings across the University of British Columbia Vancouver campus. Browse an interactive Mapbox map, filter by category, search by name, and instantly see hours and room details for any building.

## Data Sources

UBSeats combines data from a few places, refreshed at different cadences:

- **Building metadata & geolocation** — sourced from [UBCGeodata/ubc-geospatial-opendata](https://github.com/UBCGeodata/ubc-geospatial-opendata), then curated and stored in Supabase (`buildings`, `building_hours`).
- **Bookable room & study space details** — sourced from [UBC Learning Spaces](https://learningspaces.ubc.ca/), then curated and stored in Supabase (`building_rooms`, `venues`, `notes`, etc.). Populated and maintained manually as new buildings/rooms are added.
- **Classroom (general teaching space) availability** — scraped from UBC's Scientia "List Timetable" (`sws-van.as.it.ubc.ca`) by the standalone [`scraper/`](scraper/) tool. This system sits behind UBC's CWL login and campus network, so the scraper is run manually/on-demand from campus Wi-Fi or the UBC VPN — see [`scraper/README.md`](scraper/README.md) for details. Results are written to `classroom_bookings` and inverted client-side into free/busy status.
- **Library bookable-room availability** — synced from LibCal (`libcal.library.ubc.ca`) by the `sync-libcal-availability` Supabase Edge Function ([`supabase/functions/sync-libcal-availability`](supabase/functions/sync-libcal-availability)), which reads the public availability grids and writes into `room_availability`.
- **Map tiles** — Mapbox, via a public access token restricted to this app's domains.

Two caveats worth knowing:

- Classroom availability depends on a manual, CWL-authenticated scrape rather than a public API, so it may lag behind the live timetable and is refreshed only when the scraper is run.
- Sauder's MRBS booking system (`booking.sauder.ubc.ca`) **is no longer a sync source**. It moved behind CWL SSO and bot defenses, so `roomSync` deliberately skips those booking links; Sauder rooms still appear with their details and booking link, just without live availability.

## Features

- 🗺️ **Interactive map** — Mapbox GL JS map with markers for every campus building
- 🕐 **Live hours** — open/closed status computed from real building and venue hours data
- 🟢 **Live room availability** — classrooms and library-booking rooms show real-time free/busy status and a clickable slot timetable
- 🔍 **Search & filter** — search by building name, or filter by category (library, café, quiet study, bookable rooms, classrooms, workstations)
- 📋 **Room details** — capacity, booking links, category tags, and per-room notes with icons and popups
- 📚 **Venue support** — libraries and cafés are shown as their own cards, with their own hours and photos, within each building
- ⭐ **Favourites** — star buildings to pin them; stored per-browser in `localStorage`
- 💬 **Feedback** — in-app feedback form writing to the Supabase `feedback` table
- 📱 **Responsive** — works on both desktop and mobile

## Tech Stack

| Layer         | Technology                                    |
| ------------- | --------------------------------------------- |
| Frontend      | React 19, TypeScript, Vite 8                  |
| Map           | Mapbox GL JS                                  |
| Styling       | Tailwind CSS v4, shadcn/ui (Radix primitives) |
| Routing       | React Router v7                               |
| Data fetching | TanStack Query v5                             |
| Backend / DB  | Supabase (PostgreSQL + Deno Edge Functions)   |
| Scraper       | Playwright + tsx (Node)                       |
| Analytics     | Vercel Analytics                              |
| Deployment    | Vercel                                        |

## Getting Started

### Prerequisites

- Node.js ≥ 18
- A [Mapbox](https://mapbox.com) account (free tier works)
- A [Supabase](https://supabase.com) project
- [Deno](https://deno.com) — only if you plan to work on the Edge Function

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/jake-fung/UBSeats.git
cd UBSeats

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env   # then fill in the values below
```

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_MAPBOX_API_KEY=your_mapbox_public_token
VITE_MAPBOX_STYLE_URL=mapbox://styles/...
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your_supabase_anon_key
```

The `scraper/` package has its own `.env` with a Supabase **service role** key — see [`scraper/README.md`](scraper/README.md).

### Running Locally

```bash
npm run dev          # Start dev server on http://localhost:8080
npm run build        # Production build
npm run preview      # Preview the production build locally
npm run lint         # Run ESLint
npm run format       # Format with Prettier
npm run format:check # Check formatting without writing
```

### Tests

There is no test suite for the frontend app itself. The two backend pieces have their own:

```bash
# Edge Function (Deno)
deno test supabase/functions/sync-libcal-availability

# Scraper (Node test runner)
cd scraper && npm test
```

## Project Structure

The Supabase layer lives at the **repo root**, not under `src/`, so the Edge Function
can be deployed as-is by the Supabase CLI. Two path aliases are configured (in both
`vite.config.ts` and `tsconfig.json`): `@/supabase/*` → `./supabase/*`, and `@/*` → `./src/*`.

```
src/
├── components/
│   ├── details/            # BuildingDetailContent, RoomCard, RoomSection, RoomTimetable,
│   │                       #   VenueCard, NotePopup, NoteTags, FavouriteButton, …
│   └── ui/                 # shadcn/ui primitives (skeleton, toast, toaster, tooltip)
├── hooks/                  # useMapState, useBuildings, useRoomAvailability, useFavourites,
│                           #   useSearch, useSheetDrag, useIsMobile, …
├── stores/                 # favouritesStore — localStorage-backed external store
├── pages/                  # Route-level pages (Index)
└── utils/                  # hoursUtils, spotUtils, mapMarkerUtils, screenSizeUtils, cnUtils

supabase/
├── client.ts               # Browser Supabase client
├── functions/              # sync-libcal-availability — Deno Edge Function, syncs
│                           #   LibCal availability into `room_availability` (+ tests)
├── services/               # supabaseService.ts — all data fetching
├── schema/                 # types.ts (Building, Room, Venue, …) + generated database.types.ts
└── migrations-pending/     # SQL migrations not yet applied

scraper/                    # Standalone Playwright scraper for general classroom
                            #   bookings (Scientia timetable) — see scraper/README.md
```

## Architecture Notes

- **Single data fetch** — `fetchBuildings()` fires 11 parallel Supabase queries (buildings, rooms, venues, their hours/images, categories and notes) and assembles them client-side into a `Building[]` tree. All filtering is done client-side via `useMemo`.
- **Central state** — `useMapState` owns filter state, selected building, sidebar visibility, and the loading overlay. The `Index` page is a thin shell that delegates to this hook.
- **Venues** — a venue is a named place inside a building with its own hours and photo: a library or a café (`venues.kind`). Rooms with a `venue_id` are grouped under their venue during assembly and rendered as a `VenueCard`, interleaved alphabetically with the building's loose rooms by `RoomSection`. A library's card expands to its rooms; a café's renders flat and hosts its single room's controls directly.
- **Detail panel** — `BuildingDetailContent` renders inside `BottomSheet` (mobile, drag-to-dismiss) or `SidePanel` (desktop), chosen via `useIsMobile`.
- **Live availability, two sources merged client-side** — `fetchRoomAvailability()` starts from classroom bookings (populated by the standalone `scraper/`) inverted into free/busy slots, then overlays fresher rows from `room_availability` (kept in sync by the `sync-libcal-availability` Edge Function for LibCal-linked rooms). Overlay rows older than a 30-minute staleness guard are ignored, so a stopped sync degrades to "no live data" rather than showing stale availability as current. `useRoomAvailability` reads the merged map per room; `RoomCard` renders it via `RoomTimetable`.
- **Favourites** — `favouritesStore` is a small `useSyncExternalStore` store over `localStorage`, handing out an immutable snapshot that is replaced only when the favourite set actually changes. Every storage access is wrapped in `try/catch`, so private mode or disabled storage degrades to in-memory only.

## Acknowledgments

- Building metadata & geolocation from [UBCGeodata/ubc-geospatial-opendata](https://github.com/UBCGeodata/ubc-geospatial-opendata)
- Room and study space details from [UBC Learning Spaces](https://learningspaces.ubc.ca/)
- Classroom timetable data from UBC's Scientia system
- Library bookable-room availability from UBC Library's LibCal

This project is not affiliated with or endorsed by the University of British Columbia.

## LICENSE

The MIT License (MIT)
see [LICENSE](LICENSE.md) for details.
