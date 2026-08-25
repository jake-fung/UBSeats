-- 2026-08-24 — ROLLBACK for the EXPAND phase.
--
-- Valid only while the compatibility layer still exists (i.e. the CONTRACT phase has
-- NOT been run). Restores the schema to its pre-expand shape.
--
-- Order matters: building_rooms_venue_id_fkey is NO ACTION, not ON DELETE SET NULL,
-- so rows must stop referencing the cafe venues before those venues can be deleted.

begin;

drop view if exists public.library_images;
drop view if exists public.library_hours;
drop view if exists public.libraries;

delete from public.venue_images
  where venue_id in (select id from public.venues where kind = 'cafe');

update public.building_rooms set venue_id = null;

delete from public.venues where kind = 'cafe';

alter table public.building_rooms drop constraint building_rooms_venue_id_fkey;
drop index if exists public.idx_building_rooms_venue_id;
alter table public.building_rooms drop column venue_id;

alter table public.venues drop constraint venues_kind_check;
alter table public.venues drop column kind;

alter policy "Allow public read on room_images" on public.room_images
  rename to "Allow public read on cafe_images";
alter policy "Allow public read on venue_images" on public.venue_images
  rename to "Allow public read on library_images";

alter index public.idx_venue_images_venue_id  rename to idx_library_images_library_id;
alter index public.venue_images_pkey          rename to library_images_pkey;
alter index public.venue_hours_venue_id_idx   rename to library_hours_library_id_idx;
alter index public.venue_hours_pkey           rename to library_hours_pkey;
alter index public.venues_building_uuid_idx   rename to libraries_building_uuid_idx;
alter index public.venues_pkey                rename to libraries_pkey;

alter table public.venue_images rename constraint venue_images_venue_id_fkey           to library_images_library_id_fkey;
alter table public.venue_hours  rename constraint venue_hours_venue_id_day_of_week_key to library_hours_library_id_day_of_week_key;
alter table public.venue_hours  rename constraint venue_hours_day_of_week_check        to library_hours_day_of_week_check;
alter table public.venue_hours  rename constraint venue_hours_venue_id_fkey            to library_hours_library_id_fkey;
alter table public.venues       rename constraint venues_building_uuid_fkey            to libraries_building_uuid_fkey;

alter table public.venue_images rename column venue_id to library_id;
alter table public.venue_hours  rename column venue_id to library_id;

alter table public.venue_images rename to library_images;
alter table public.venue_hours  rename to library_hours;
alter table public.venues       rename to libraries;

commit;
