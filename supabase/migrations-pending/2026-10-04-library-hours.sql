-- APPLIED 2026-10-06 (pasted into the dashboard SQL Editor, so not in schema_migrations).
--
-- 2026-10-04 — weekly library hours sync from hours.library.ubc.ca, EXPAND phase.
--
-- Each run resolves this week's and next week's ACTUAL hours (holidays applied) per
-- mapped branch:
--   * *_hours_by_week   gets both weeks tagged with week_start (a Sunday). 1.2 reads this.
--   * venue_hours / building_hours keep one row per weekday and get THIS week only, so the
--     currently deployed main build, which matches rows by day_of_week alone, is unchanged.
-- This week failing keeps all of the branch's rows and is logged; next week failing only
-- means next week is not stored (1.2 shows "hours not published yet").
--
-- CONTRACT (after 1.2 is on main): stop writing the legacy tables in replace_library_hours,
-- then delete the synced owners' rows from venue_hours / building_hours. Those tables stay
-- for hand-entered hours that repeat every week.
--
-- Vault secrets `project_url` and `anon_key` already exist (used by sync-libcal-availability).

begin;

-- 1. Mapping + freshness columns ----------------------------------------------------
--    Library hours live on two tables today: most branches are library venues, but
--    Koerner and IKBLC carry their hours on the building itself.
alter table public.venues    add column library_branch text unique;
alter table public.venues    add column hours_synced_at timestamptz;
alter table public.buildings add column library_branch text unique;
alter table public.buildings add column hours_synced_at timestamptz;

comment on column public.venues.library_branch is
  'Branch id on hours.library.ubc.ca (the #view-<id> anchor). Null = hours not synced.';
comment on column public.buildings.library_branch is
  'Branch id on hours.library.ubc.ca (the #view-<id> anchor). Null = hours not synced.';

-- 2. Seed the mapping ----------------------------------------------------------------
--    Each of these buildings holds exactly one library venue, so building code + kind
--    identifies it. Note the site's id for Music, Art and Architecture is `library`.
update public.venues v
   set library_branch = m.branch
  from (values ('ACEN', 'asian'),
               ('DLAM', 'davidlam'),
               ('ALRD', 'law'),
               ('IBLC', 'library'),
               ('KLIB', 'researchcommons'),
               ('IRC',  'woodward'),
               ('FNLH', 'xwi7xwa')) as m (bldg_code, branch),
       public.buildings b
 where b.bldg_code = m.bldg_code
   and v.building_uuid = b.uuid
   and v.kind = 'library';

update public.buildings b
   set library_branch = m.branch
  from (values ('KLIB', 'koerner'),
               ('IBLC', 'ikblc')) as m (bldg_code, branch)
 where b.bldg_code = m.bldg_code;

do $$
begin
  if (select count(*) from public.venues where library_branch is not null) <> 7
     or (select count(*) from public.buildings where library_branch is not null) <> 2 then
    raise exception 'library_branch mapping did not match the expected 7 venues + 2 buildings';
  end if;
end $$;

-- 3. Backup of the hand-entered hours the first sync will overwrite -----------------
--    RLS on with no policy: not readable through the public API.
create table public.library_hours_backup_20261004 as
select 'venue'::text as kind, h.venue_id as owner_id, h.day_of_week::integer, h.opens_at, h.closes_at
  from public.venue_hours h join public.venues v on v.id = h.venue_id
 where v.library_branch is not null
union all
select 'building', h.building_uuid, h.day_of_week::integer, h.opens_at, h.closes_at
  from public.building_hours h join public.buildings b on b.uuid = h.building_uuid
 where b.library_branch is not null;

alter table public.library_hours_backup_20261004 enable row level security;

-- 4. Week-tagged hours (expand) -----------------------------------------------------
create table public.venue_hours_by_week (
  id          uuid primary key default gen_random_uuid(),
  venue_id    uuid not null references public.venues (id) on delete cascade,
  week_start  date not null check (extract(dow from week_start) = 0),
  day_of_week integer not null check (day_of_week between 0 and 6),
  opens_at    time not null,
  closes_at   time not null,
  unique (venue_id, week_start, day_of_week)
);

create table public.building_hours_by_week (
  id            uuid primary key default gen_random_uuid(),
  building_uuid uuid not null references public.buildings (uuid) on delete cascade,
  week_start    date not null check (extract(dow from week_start) = 0),
  day_of_week   smallint not null check (day_of_week between 0 and 6),
  opens_at      time not null,
  closes_at     time not null,
  unique (building_uuid, week_start, day_of_week)
);

comment on table public.venue_hours_by_week is
  'Actual hours per week (week_start = Sunday). Closed days have no row. Written by sync-library-hours.';
comment on table public.building_hours_by_week is
  'Actual hours per week (week_start = Sunday). Closed days have no row. Written by sync-library-hours.';

alter table public.venue_hours_by_week    enable row level security;
alter table public.building_hours_by_week enable row level security;
create policy "Allow public read access" on public.venue_hours_by_week    for select using (true);
create policy "Allow public read access" on public.building_hours_by_week for select using (true);

-- 5. Per-branch atomic replace ------------------------------------------------------
--    One transaction per branch, so a failure mid-write never leaves half a week.
--    p_this_rows / p_next_rows: [{ "day_of_week": 0-6, "opens_at": "HH:MM", "closes_at": "HH:MM" }]
--    p_next_rows null = next week could not be resolved; it is then simply not stored.
create or replace function public.replace_library_hours(
  p_kind            text,
  p_id              uuid,
  p_this_week_start date,
  p_this_rows       jsonb,
  p_next_rows       jsonb default null
)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_count integer;
begin
  if extract(dow from p_this_week_start) <> 0 then
    raise exception 'replace_library_hours: % is not a Sunday', p_this_week_start;
  end if;

  if p_kind = 'venue' then
    -- Expand only: the one-row-per-weekday table main reads. Drop this block at contract.
    delete from public.venue_hours where venue_id = p_id;
    insert into public.venue_hours (venue_id, day_of_week, opens_at, closes_at)
    select p_id, (r->>'day_of_week')::integer, (r->>'opens_at')::time, (r->>'closes_at')::time
      from jsonb_array_elements(p_this_rows) as r;

    -- This week, next week and any past week are replaced; nothing older is kept.
    delete from public.venue_hours_by_week where venue_id = p_id and week_start <= p_this_week_start + 7;
    insert into public.venue_hours_by_week (venue_id, week_start, day_of_week, opens_at, closes_at)
    select p_id, w.week_start, (r->>'day_of_week')::integer, (r->>'opens_at')::time, (r->>'closes_at')::time
      from (values (p_this_week_start, p_this_rows),
                   (p_this_week_start + 7, coalesce(p_next_rows, '[]'::jsonb))) as w (week_start, rows),
           jsonb_array_elements(w.rows) as r;
    get diagnostics v_count = row_count;

    update public.venues set hours_synced_at = now() where id = p_id;
  elsif p_kind = 'building' then
    -- Expand only: the one-row-per-weekday table main reads. Drop this block at contract.
    delete from public.building_hours where building_uuid = p_id;
    insert into public.building_hours (building_uuid, day_of_week, opens_at, closes_at)
    select p_id, (r->>'day_of_week')::smallint, (r->>'opens_at')::time, (r->>'closes_at')::time
      from jsonb_array_elements(p_this_rows) as r;

    delete from public.building_hours_by_week where building_uuid = p_id and week_start <= p_this_week_start + 7;
    insert into public.building_hours_by_week (building_uuid, week_start, day_of_week, opens_at, closes_at)
    select p_id, w.week_start, (r->>'day_of_week')::smallint, (r->>'opens_at')::time, (r->>'closes_at')::time
      from (values (p_this_week_start, p_this_rows),
                   (p_this_week_start + 7, coalesce(p_next_rows, '[]'::jsonb))) as w (week_start, rows),
           jsonb_array_elements(w.rows) as r;
    get diagnostics v_count = row_count;

    update public.buildings set hours_synced_at = now() where uuid = p_id;
  else
    raise exception 'replace_library_hours: unknown kind %', p_kind;
  end if;

  if not found then
    raise exception 'replace_library_hours: no % with id %', p_kind, p_id;
  end if;

  return v_count;
end;
$function$;

revoke execute on function public.replace_library_hours(text, uuid, date, jsonb, jsonb) from public, anon, authenticated;
grant  execute on function public.replace_library_hours(text, uuid, date, jsonb, jsonb) to service_role;

-- 6. Weekly schedule ----------------------------------------------------------------
--    pg_cron runs in UTC and ignores DST: 08:30 UTC Sunday is 01:30 PDT / 00:30 PST,
--    so the run always lands on Sunday in Vancouver and syncs that week and the next.
select cron.schedule(
  'sync-library-hours',
  '30 8 * * 0',
  $$
  select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/sync-library-hours',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'anon_key')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 60000
  ) as request_id;
  $$
);

commit;
