# UBSeats

**Check real-time seat and room availability across UBC Vancouver campus.**

![UBSeats](public/ubseats.png)

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)

🔗 [Live Demo → ubseats.vercel.app](https://ubseats.vercel.app/)

## Overview

UBSeats is a React + TypeScript web app that shows live seat and bookable room availability for buildings across the University of British Columbia Vancouver campus. Browse an interactive Mapbox map, filter by category, search by name, and instantly see hours and room details for any building.

## Data Sources

UBSeats combines data from a few places, refreshed at different cadences:

- **Building metadata & geolocation** — sourced from [UBCGeodata/ubc-geospatial-opendata](https://github.com/UBCGeodata/ubc-geospatial-opendata), then curated and stored in Supabase (`buildings`, `building_hours`).
- **Bookable room & study space details** — sourced from [UBC Learning Spaces](https://learningspaces.ubc.ca/), then curated and stored in Supabase (`building_rooms`, etc.). Populated and maintained manually as new buildings/rooms are added.
- **Classroom (general teaching space) availability** — scraped from UBC's Scientia "List Timetable" (`sws-van.as.it.ubc.ca`) by the standalone [`scraper/`](scraper/) tool. This system sits behind UBC's CWL login, so the scraper is run manually/on-demand under an authenticated UBC session — see [`scraper/README.md`](scraper/README.md) for details. Results are written to `classroom_bookings` and inverted client-side into free/busy status.
- **Library and bookable-room availability** — synced from LibCal (`libcal.library.ubc.ca`) and MRBS (Sauder's room booking system) by the `sync-libcal-availability` Supabase Edge Function ([`src/supabase/functions/sync-libcal-availability`](src/supabase/functions/sync-libcal-availability)), which reads their public availability grids and writes into `room_availability`.
- **Map tiles** — Mapbox, via a public access token restricted to this app's domains.

Because classroom availability depends on a manual, CWL-authenticated scrape rather than a public API, that data may lag behind the live timetable and is refreshed only when the scraper is run.

## Features

- 🗺️ **Interactive map** — Mapbox GL JS map with markers for every campus building
- 🕐 **Live hours** — open/closed status computed from real building hours data
- 🟢 **Live room availability** — classrooms and library-booking rooms show real-time free/busy status and a slot timetable
- 🔍 **Search & filter** — search by building name or filter by category (library, café, quiet study, bookable rooms, classrooms)
- 📋 **Room details** — capacity, booking links, category tags, and notes per room
- 📚 **Library support** — library sub-spaces are shown separately within each building
- 📱 **Responsive** — works on both desktop and mobile

## Tech Stack

| Layer         | Technology                             |
| ------------- | -------------------------------------- |
| Frontend      | React 19, TypeScript, Vite             |
| Map           | Mapbox GL JS                           |
| Styling       | Tailwind CSS, shadcn/ui                |
| Data fetching | TanStack Query v5                      |
| Backend / DB  | Supabase (PostgreSQL + Edge Functions) |
| Deployment    | Vercel                                 |

## Getting Started

### Prerequisites

- Node.js ≥ 18
- A [Mapbox](https://mapbox.com) account (free tier works)
- A [Supabase](https://supabase.com) project

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

### Running Locally

```bash
npm run dev       # Start dev server on http://localhost:8080
npm run build     # Production build
npm run preview   # Preview the production build locally
npm run lint      # Run ESLint
```

There is no `npm test` command — no test suite is configured for the frontend app (the `scraper/` package has its own tests, run separately via `npm test` from within `scraper/`).

## Project Structure

```
src/
├── components/
│   ├── details/            # BuildingDetailContent, RoomCard, RoomTimetable, LibraryCard, …
│   └── ui/                 # shadcn/ui primitives (skeleton, toast, toaster, tooltip)
├── hooks/                  # useMapState, useBuildings, useRoomAvailability, …
├── pages/                  # Route-level pages (Index)
├── supabase/
│   ├── functions/          # sync-libcal-availability — Deno Edge Function, syncs
│   │                       #   LibCal/MRBS availability into `room_availability`
│   ├── services/           # supabaseService.ts — all data fetching
│   └── schema/             # TypeScript types (Building, Room, Library, …)
└── utils/                  # hoursUtils, spotUtils, mapMarkerUtils, cnUtils, …

scraper/                    # Standalone Playwright scraper for general classroom
                             #   bookings (Scientia timetable) — see scraper/README.md
```

## Architecture Notes

- **Single data fetch** — `fetchBuildings()` fires 9 parallel Supabase queries and assembles them client-side into a `Building[]` tree. All filtering is done client-side via `useMemo`.
- **Central state** — `useMapState` owns filter state, selected building, sidebar visibility, and the loading overlay. The `Index` page is a thin shell that delegates to this hook.
- **Library rooms** — rooms with a `library_id` are separated from building rooms during assembly and rendered under a `LibraryCard` within `BuildingDetailContent`.
- **Detail panel** — `BuildingDetailContent` renders inside `BottomSheet` (mobile, drag-to-dismiss) or `SidePanel` (desktop), chosen via `useIsMobile`.
- **Live availability, two sources merged client-side** — `fetchRoomAvailability()` starts from classroom bookings (populated by the standalone `scraper/`) inverted into free/busy slots, then overlays fresher rows from `room_availability` (kept in sync by the `sync-libcal-availability` Edge Function for LibCal/MRBS-linked rooms). `useRoomAvailability` reads the merged map per room; `RoomCard` renders it via `RoomTimetable`.

## Acknowledgments

- Building metadata & geolocation from [UBCGeodata/ubc-geospatial-opendata](https://github.com/UBCGeodata/ubc-geospatial-opendata)
- Room and study space details from [UBC Learning Spaces](https://learningspaces.ubc.ca/)
- Classroom timetable data from UBC's Scientia system
- Library and bookable-room availability from UBC Library's LibCal and Sauder's MRBS

This project is not affiliated with or endorsed by the University of British Columbia.

## LICENSE

The MIT License (MIT)
see [LICENSE](LICENSE) for details.