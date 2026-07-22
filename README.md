# UBSeats

**Check real-time seat and room availability across UBC Vancouver campus.**

🔗 [Live Demo → ubseats.vercel.app](https://ubseats.vercel.app/)

---

## Overview

UBSeats is a React + TypeScript web app that shows live seat and bookable room availability for buildings across the University of British Columbia Vancouver campus. Browse an interactive Mapbox map, filter by category, search by name, and instantly see hours and room details for any building.

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
git clone https://github.com/jakefung/ubseats.git
cd ubseats

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
