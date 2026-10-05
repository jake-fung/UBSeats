-- NOT YET APPLIED. Run once the `sync-library-hours` Edge Function is deployed.
--
-- 2026-10-04 — weekly library hours sync from hours.library.ubc.ca.
--
-- Each mapped venue/building gets this week's ACTUAL hours (holidays applied) written
-- into the existing venue_hours / building_hours tables, one branch at a time. A branch
-- that fails to fetch or parse keeps its previous rows; its hours_synced_at is then
-- older than the run's start, which is what the function's alert email reports.
--
-- Edge Function secrets required before the first run (not stored here):
--   RESEND_API_KEY, ALERT_EMAIL_TO  (optional: ALERT_EMAIL_FROM)
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

-- 3. Per-branch atomic replace ------------------------------------------------------
--    Swaps one target's 7-day rows and stamps hours_synced_at in a single transaction,
--    so a failure mid-write can never leave a branch with half a week.
--    p_rows: [{ "day_of_week": 0-6, "opens_at": "HH:MM", "closes_at": "HH:MM" }, ...]
--    Closed days are simply absent, which the read side already treats as closed.
create or replace function public.replace_library_hours(p_kind text, p_id uuid, p_rows jsonb)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_count integer;
begin
  if p_kind = 'venue' then
    delete from public.venue_hours where venue_id = p_id;
    insert into public.venue_hours (venue_id, day_of_week, opens_at, closes_at)
    select p_id, (r->>'day_of_week')::integer, (r->>'opens_at')::time, (r->>'closes_at')::time
      from jsonb_array_elements(p_rows) as r;
    get diagnostics v_count = row_count;
    update public.venues set hours_synced_at = now() where id = p_id;
  elsif p_kind = 'building' then
    delete from public.building_hours where building_uuid = p_id;
    insert into public.building_hours (building_uuid, day_of_week, opens_at, closes_at)
    select p_id, (r->>'day_of_week')::smallint, (r->>'opens_at')::time, (r->>'closes_at')::time
      from jsonb_array_elements(p_rows) as r;
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

revoke execute on function public.replace_library_hours(text, uuid, jsonb) from public, anon, authenticated;
grant  execute on function public.replace_library_hours(text, uuid, jsonb) to service_role;

-- 4. Weekly schedule ----------------------------------------------------------------
--    pg_cron runs in UTC and ignores DST: 08:30 UTC Sunday is 01:30 PDT / 00:30 PST,
--    so the run always lands on Sunday in Vancouver and syncs Sunday–Saturday.
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
