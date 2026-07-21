# Project structure reorg — design

**Date:** 2026-07-21
**Status:** Approved (pending spec review)

## Motivation

The docs (README, CLAUDE.md) describe a layer-based `src/` layout, but `components/`
has drifted: it's a flat folder mixing genuinely unrelated pieces (the map, the
header, the mobile/desktop detail-panel shells, an about panel) with a separate
`details/` folder for detail-panel sub-components. Two file names have also drifted
from the project's own naming conventions.

This reorg groups files by actual coupling (verified via import graph, not guesswork)
and fixes the naming drift. It is a pure file-move + import-path refactor — **no
behavior, prop, or component logic changes.**

## Non-goals

- No hooks move out of `hooks/` into component folders (scope is `components/` +
  two isolated naming fixes; `useSheetDrag`, `useScrolled`, `useEscapeKey`,
  `useRoomAvailability` stay in `hooks/` even though each has a single consumer).
- No barrel/`index.ts` re-export files — the codebase doesn't use that pattern
  anywhere today, and introducing it would be an unrequested abstraction.
- No further nesting inside `building-detail/` (e.g. a `room/` subfolder) — decided
  against; 14 files in one flat feature folder is acceptable for one cohesive
  feature.
- `scraper/` and `supabase/functions/` are untouched — separate deployables, not
  part of this reorg.

## Target structure

```
src/
├── components/
│   ├── About.tsx                 # unchanged location — single file, no sub-deps
│   ├── FilterBar.tsx              # unchanged location — single file, no sub-deps
│   ├── map/
│   │   ├── SpotMap.tsx
│   │   └── mapMarkerUtils.ts      # moved from utils/ — only ever used by SpotMap
│   ├── header/
│   │   ├── Header.tsx
│   │   └── SearchBar.tsx          # only ever used by Header
│   ├── building-detail/           # renamed from details/, absorbs 3 top-level files
│   │   ├── BottomSheet.tsx
│   │   ├── DragHandle.tsx         # only used by BottomSheet
│   │   ├── SidePanel.tsx
│   │   ├── BuildingDetailContent.tsx
│   │   ├── RoomSection.tsx
│   │   ├── RoomCard.tsx
│   │   ├── RoomTimetable.tsx
│   │   ├── LibraryCard.tsx
│   │   ├── HoursPill.tsx
│   │   ├── CapacityRow.tsx
│   │   ├── CategoryTags.tsx
│   │   ├── NoteTags.tsx
│   │   ├── NotePopup.tsx
│   │   └── ViewSpaceButton.tsx
│   └── ui/                        # unchanged — shadcn primitives
├── hooks/                          # unchanged set, one rename
│   ├── useToast.ts                 # renamed from use-toast.ts (only kebab-case hook)
│   └── ... (rest unchanged)
├── pages/                          # unchanged
├── supabase/                       # unchanged
└── utils/
    ├── categoryUtils.ts            # renamed from spotUtils.ts (validates CategoryType,
    │                                #   "spot" was a stale name from an earlier iteration)
    └── ... (cnUtils, hoursUtils, screenSizeUtils unchanged)
```

## File moves (`git mv`, preserves history)

| From | To |
|---|---|
| `components/SpotMap.tsx` | `components/map/SpotMap.tsx` |
| `utils/mapMarkerUtils.ts` | `components/map/mapMarkerUtils.ts` |
| `components/Header.tsx` | `components/header/Header.tsx` |
| `components/SearchBar.tsx` | `components/header/SearchBar.tsx` |
| `components/BottomSheet.tsx` | `components/building-detail/BottomSheet.tsx` |
| `components/DragHandle.tsx` | `components/building-detail/DragHandle.tsx` |
| `components/SidePanel.tsx` | `components/building-detail/SidePanel.tsx` |
| `components/details/BuildingDetailContent.tsx` | `components/building-detail/BuildingDetailContent.tsx` |
| `components/details/RoomSection.tsx` | `components/building-detail/RoomSection.tsx` |
| `components/details/RoomCard.tsx` | `components/building-detail/RoomCard.tsx` |
| `components/details/RoomTimetable.tsx` | `components/building-detail/RoomTimetable.tsx` |
| `components/details/LibraryCard.tsx` | `components/building-detail/LibraryCard.tsx` |
| `components/details/HoursPill.tsx` | `components/building-detail/HoursPill.tsx` |
| `components/details/CapacityRow.tsx` | `components/building-detail/CapacityRow.tsx` |
| `components/details/CategoryTags.tsx` | `components/building-detail/CategoryTags.tsx` |
| `components/details/NoteTags.tsx` | `components/building-detail/NoteTags.tsx` |
| `components/details/NotePopup.tsx` | `components/building-detail/NotePopup.tsx` |
| `components/details/ViewSpaceButton.tsx` | `components/building-detail/ViewSpaceButton.tsx` |
| `hooks/use-toast.ts` | `hooks/useToast.ts` |
| `utils/spotUtils.ts` | `utils/categoryUtils.ts` |

## Import edits required

Verified by grepping every reference to each moved file across `src/` — this is the
complete set, nothing else touches these paths:

| File | Change |
|---|---|
| `pages/Index.tsx` | `@/components/Header` → `@/components/header/Header`; `@/components/SpotMap` → `@/components/map/SpotMap`; `@/components/SidePanel` → `@/components/building-detail/SidePanel`; `@/components/BottomSheet` → `@/components/building-detail/BottomSheet` |
| `components/building-detail/BottomSheet.tsx` | `@/components/DragHandle` → `@/components/building-detail/DragHandle`; `@/components/details/BuildingDetailContent` → `@/components/building-detail/BuildingDetailContent` |
| `components/building-detail/SidePanel.tsx` | `@/components/details/BuildingDetailContent` → `@/components/building-detail/BuildingDetailContent` |
| `components/building-detail/BuildingDetailContent.tsx` | `@/components/details/{HoursPill,LibraryCard,RoomSection}` → `@/components/building-detail/{HoursPill,LibraryCard,RoomSection}` |
| `components/building-detail/NoteTags.tsx` | `@/components/details/NotePopup` → `@/components/building-detail/NotePopup` |
| `components/building-detail/RoomCard.tsx` | `@/components/details/{NoteTags,CategoryTags,CapacityRow,ViewSpaceButton,RoomTimetable}` → `@/components/building-detail/{...}` |
| `components/building-detail/LibraryCard.tsx` | `@/components/details/{HoursPill,RoomCard}` → `@/components/building-detail/{HoursPill,RoomCard}` |
| `components/building-detail/RoomSection.tsx` | `@/components/details/RoomCard` → `@/components/building-detail/RoomCard` |
| `hooks/useSheetDrag.ts` | `@/components/DragHandle` → `@/components/building-detail/DragHandle` |
| `components/map/SpotMap.tsx` | `@/utils/mapMarkerUtils` → `@/components/map/mapMarkerUtils` (screenSizeUtils import is unaffected — stays in `utils/`) |
| `components/ui/toaster.tsx` | `@/hooks/use-toast` → `@/hooks/useToast` |
| `hooks/useMapState.ts` | `@/hooks/use-toast` → `@/hooks/useToast` |
| `supabase/services/supabaseService.ts` | `@/utils/spotUtils` → `@/utils/categoryUtils` |

Convention note: the existing codebase already uses absolute `@/components/details/X`
imports between siblings in the same folder (not relative `./X`), so all edits above
follow that same established pattern — just swapping the directory segment. This is
a purely mechanical find-replace per file, no import-style changes.

## README follow-up

The README's "Project Structure" tree (updated earlier this session) will need its
`components/` block updated to match this new layout once the move lands.

## Verification plan

1. `npm run lint` — catches unresolved imports.
2. `npm run build` (`tsc` via Vite) — catches any missed path or type-only import.
3. Quick dev-server smoke check: app loads, map renders, opening a building shows
   the detail panel (mobile + desktop), filter bar opens — since this is a
   zero-behavior-change refactor, this is a sanity check, not exhaustive QA.
4. `git status` reviewed before considering done — moves should show as renames
   (`R`), not delete+add pairs, confirming history is preserved.
