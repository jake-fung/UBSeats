-- 2026-08-24 — CONTRACT phase: remove the library-shaped compatibility layer.
--
-- DO NOT RUN THIS until 1.1-rc has been merged to main AND that build is live on
-- Vercel. Running it while the old build is still serving traffic breaks it exactly
-- the way the expand phase was written to avoid.
--
-- Pre-flight check — every venue-parented room must have venue_id set, and no reader
-- should still depend on library_id:
--   select count(*) from building_rooms where library_id is not null and venue_id is null;
--   -- expect 0
--
-- Reversible? Only partially: the views are trivially recreatable, but dropping
-- building_rooms.library_id discards which venues used to be libraries in that column.
-- `venues.kind` retains that information, so it is recoverable via:
--   update building_rooms br set library_id = br.venue_id
--   from venues v where v.id = br.venue_id and v.kind = 'library';

begin;

drop view if exists public.library_images;
drop view if exists public.library_hours;
drop view if exists public.libraries;

alter table public.building_rooms drop constraint if exists building_rooms_library_id_fkey;
drop index if exists public.idx_building_rooms_library_id;
alter table public.building_rooms drop column library_id;

commit;
