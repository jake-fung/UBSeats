-- APPLIED TO PRODUCTION 2026-08-24 as migration `venues_generalization_expand`.
-- Kept as a record; do not re-run (the renames are not idempotent).
--
-- 2026-08-24 — EXPAND phase: generalize libraries into venues (library | cafe),
-- while keeping the pre-existing library-shaped API intact so the currently
-- deployed `main` build keeps working against the same database.
--
-- After this runs:
--   main   reads building_rooms.library_id + views libraries/library_hours/library_images
--   1.1-rc reads building_rooms.venue_id   + tables venues/venue_hours/venue_images
--
-- Nothing is dropped and no row is deleted. The CONTRACT phase, which removes the
-- compatibility layer, is a separate file to run only after 1.1-rc is deployed to main.

begin;

-- 1. Rename the three tables. Their constraints, indexes, policies, grants and the
--    inbound FK from building_rooms all follow the rename automatically.
alter table public.libraries       rename to venues;
alter table public.library_hours   rename to venue_hours;
alter table public.library_images  rename to venue_images;

alter table public.venue_hours     rename column library_id to venue_id;
alter table public.venue_images    rename column library_id to venue_id;

-- NOTE: building_rooms.library_id is deliberately NOT renamed. It stays as the
-- compatibility column that `main` reads, holding ONLY library venue ids.

-- 2. Rename constraints and indexes so their names match their tables ------------
alter table public.venues       rename constraint libraries_building_uuid_fkey             to venues_building_uuid_fkey;
alter table public.venue_hours  rename constraint library_hours_library_id_fkey            to venue_hours_venue_id_fkey;
alter table public.venue_hours  rename constraint library_hours_day_of_week_check          to venue_hours_day_of_week_check;
alter table public.venue_hours  rename constraint library_hours_library_id_day_of_week_key to venue_hours_venue_id_day_of_week_key;
alter table public.venue_images rename constraint library_images_library_id_fkey           to venue_images_venue_id_fkey;

alter index public.libraries_pkey                 rename to venues_pkey;
alter index public.libraries_building_uuid_idx    rename to venues_building_uuid_idx;
alter index public.library_hours_pkey             rename to venue_hours_pkey;
alter index public.library_hours_library_id_idx   rename to venue_hours_venue_id_idx;
alter index public.library_images_pkey            rename to venue_images_pkey;
alter index public.idx_library_images_library_id  rename to idx_venue_images_venue_id;

alter policy "Allow public read on library_images" on public.venue_images
  rename to "Allow public read on venue_images";
alter policy "Allow public read on cafe_images" on public.room_images
  rename to "Allow public read on room_images";

-- 3. Add the kind discriminator --------------------------------------------------
alter table public.venues add column kind text not null default 'library';
alter table public.venues add constraint venues_kind_check check (kind in ('library', 'cafe'));
alter table public.venues alter column kind drop default;  -- future inserts must be explicit

-- 4. Add venue_id alongside library_id -------------------------------------------
--    venue_id is the forward-looking column: it holds EVERY venue id (libraries and
--    cafes). library_id keeps holding library ids only, so `main` is unaffected.
alter table public.building_rooms add column venue_id uuid;
alter table public.building_rooms add constraint building_rooms_venue_id_fkey
  foreign key (venue_id) references public.venues (id);
create index if not exists idx_building_rooms_venue_id on public.building_rooms (venue_id);

update public.building_rooms set venue_id = library_id where library_id is not null;

-- 5. Backfill one cafe venue per cafe-tagged room --------------------------------
--    Sets venue_id ONLY. library_id stays null for cafe rooms, so `main` continues
--    to render them as loose rooms carrying a cafe tag, exactly as it does today.
with cafe_rooms as (
  select br.uuid as room_uuid, br.room_name, br.building_uuid
  from public.building_rooms br
  join public.room_categories rc
    on rc.room_uuid = br.uuid and rc.categories_id = 'cafe'
  where br.venue_id is null
),
new_venues as (
  insert into public.venues (building_uuid, name, kind)
  select building_uuid, room_name, 'cafe' from cafe_rooms
  returning id, building_uuid, name
)
update public.building_rooms br
set venue_id = nv.id
from new_venues nv
join cafe_rooms cr
  on cr.building_uuid = nv.building_uuid and cr.room_name = nv.name
where br.uuid = cr.room_uuid;

-- 6. Copy existing cafe photos up to the venue -----------------------------------
--    room_images rows are intentionally LEFT IN PLACE.
insert into public.venue_images (venue_id, image_url)
select br.venue_id, ri.image_url
from public.room_images ri
join public.building_rooms br on br.uuid = ri.room_uuid
join public.venues v          on v.id = br.venue_id and v.kind = 'cafe';

-- 7. Compatibility views: reproduce the exact pre-migration shape for `main` ------
--    Filtered to kind='library' so cafe venues never leak into the old code path.
--    security_invoker = on makes the caller's RLS on venues/venue_hours/venue_images
--    apply, rather than the view owner's rights.
create view public.libraries with (security_invoker = on) as
  select id, building_uuid, name
  from public.venues
  where kind = 'library';

create view public.library_hours with (security_invoker = on) as
  select vh.id, vh.venue_id as library_id, vh.day_of_week, vh.opens_at, vh.closes_at
  from public.venue_hours vh
  join public.venues v on v.id = vh.venue_id and v.kind = 'library';

create view public.library_images with (security_invoker = on) as
  select vi.id, vi.venue_id as library_id, vi.image_url
  from public.venue_images vi
  join public.venues v on v.id = vi.venue_id and v.kind = 'library';

-- Mirror the grants the renamed tables already carry, so PostgREST exposes the
-- views to the same roles. RLS on the underlying tables still governs the rows.
grant select on public.libraries, public.library_hours, public.library_images
  to anon, authenticated, service_role;

commit;
