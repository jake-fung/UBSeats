-- 2026-08-24 — Generalize libraries into venues (library | cafe).
-- Renames only: no table is dropped and no row is deleted.
-- Reviewed and applied via the Supabase MCP server, not the CLI.

begin;

-- 1. Rename the tables ------------------------------------------------------
alter table public.libraries       rename to venues;
alter table public.library_hours   rename to venue_hours;
alter table public.library_images  rename to venue_images;

-- 2. Rename the owning columns ---------------------------------------------
alter table public.venue_hours     rename column library_id to venue_id;
alter table public.venue_images    rename column library_id to venue_id;
alter table public.building_rooms  rename column library_id to venue_id;

-- 3. Rename constraints and indexes so their names match their tables -------
alter table public.venues          rename constraint libraries_building_uuid_fkey     to venues_building_uuid_fkey;
alter table public.venue_hours     rename constraint library_hours_library_id_fkey    to venue_hours_venue_id_fkey;
alter table public.venue_hours     rename constraint library_hours_day_of_week_check  to venue_hours_day_of_week_check;
alter table public.venue_hours     rename constraint library_hours_library_id_day_of_week_key to venue_hours_venue_id_day_of_week_key;
alter table public.venue_images    rename constraint library_images_library_id_fkey   to venue_images_venue_id_fkey;
alter table public.building_rooms  rename constraint building_rooms_library_id_fkey   to building_rooms_venue_id_fkey;

alter index public.libraries_pkey                 rename to venues_pkey;
alter index public.libraries_building_uuid_idx    rename to venues_building_uuid_idx;
alter index public.library_hours_pkey             rename to venue_hours_pkey;
alter index public.library_hours_library_id_idx   rename to venue_hours_venue_id_idx;
alter index public.library_images_pkey            rename to venue_images_pkey;
alter index public.idx_library_images_library_id  rename to idx_venue_images_venue_id;

-- 4. Add the kind discriminator --------------------------------------------
alter table public.venues add column kind text not null default 'library';
alter table public.venues add constraint venues_kind_check check (kind in ('library', 'cafe'));
alter table public.venues alter column kind drop default;  -- future inserts must be explicit

-- 5. Backfill one cafe venue per cafe-tagged room --------------------------
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

-- 6. Copy existing cafe photos up to the venue -----------------------------
--    room_images rows are intentionally LEFT IN PLACE (deleting is the only
--    irreversible step available here, and they are harmless).
insert into public.venue_images (venue_id, image_url)
select br.venue_id, ri.image_url
from public.room_images ri
join public.building_rooms br on br.uuid = ri.room_uuid
join public.venues v          on v.id = br.venue_id and v.kind = 'cafe';

-- 7. Tidy the last cafe-era name -------------------------------------------
alter policy "Allow public read on cafe_images" on public.room_images
  rename to "Allow public read on room_images";

commit;

-- ---------------------------------------------------------------------------
-- ROLLBACK (run manually; not part of the migration above)
-- ---------------------------------------------------------------------------
-- begin;
-- -- Order matters: building_rooms_venue_id_fkey is NO ACTION, not SET NULL,
-- -- so rows must stop referencing the cafe venues before those venues are deleted.
-- update public.building_rooms set venue_id = null
--   where venue_id in (select id from public.venues where kind = 'cafe');
-- delete from public.venue_images
--   where venue_id in (select id from public.venues where kind = 'cafe');
-- delete from public.venues where kind = 'cafe';
-- alter table public.venues drop constraint venues_kind_check;
-- alter table public.venues drop column kind;
-- alter table public.building_rooms rename column venue_id to library_id;
-- alter table public.venue_images   rename column venue_id to library_id;
-- alter table public.venue_hours    rename column venue_id to library_id;
-- alter table public.venue_images   rename to library_images;
-- alter table public.venue_hours    rename to library_hours;
-- alter table public.venues         rename to libraries;
-- -- (constraint/index names renamed back symmetrically)
-- commit;

-- ---------------------------------------------------------------------------
-- OPTIONAL — strip the building-code prefix from cafe venue names.
-- Default is NOT to run this. See the spec's "Open question — cafe venue names".
-- Turns 'ALUM – Loafe Café' into 'Loafe Café'. Note the en dash (–), not a hyphen.
-- Running this also shortens the Favourites list entry for that cafe, because
-- RoomDetails labels FavouriteButton with the venue name when a venue is present.
-- ---------------------------------------------------------------------------
-- update public.venues
-- set name = regexp_replace(name, '^[A-Z]+\s+–\s+', '')
-- where kind = 'cafe';
