-- OPTIONAL — strip the building-code prefix from cafe venue names.
-- Default is NOT to run this. See the spec's "Open question — cafe venue names".
-- Turns 'ALUM – Loafe Café' into 'Loafe Café'. Note the en dash (–), not a hyphen.
--
-- Running this also shortens the Favourites list entry for that cafe, because
-- RoomDetails labels FavouriteButton with the venue name when a venue is present.
-- It does NOT affect `main`: the compatibility views expose only kind='library'.

update public.venues
set name = regexp_replace(name, '^[A-Z]+\s+–\s+', '')
where kind = 'cafe';
