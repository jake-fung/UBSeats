-- public.feedback — user-submitted feedback from the in-app modal.
--
-- Write-only from the browser: RLS grants INSERT to anon but there is
-- deliberately NO SELECT policy, so submissions cannot be enumerated with the
-- public anon key. Read these rows in the Supabase dashboard (service role
-- bypasses RLS).
--
-- CHECK constraints are the real validation boundary. The anon key is public in
-- a static SPA, so anyone can POST directly to this table and bypass every
-- client-side check in FeedbackModal.tsx.

create table if not exists public.feedback (
  id         uuid        primary key default gen_random_uuid(),
  category   text        not null check (category in ('bug', 'feature', 'spot', 'other')),
  device     text        not null check (device in ('iphone', 'android', 'ipad', 'desktop')),
  message    text        not null check (char_length(message) between 1 and 2000),
  created_at timestamptz not null default now()
);

alter table public.feedback enable row level security;

create policy "anon can submit feedback"
  on public.feedback
  for insert
  to anon, authenticated
  with check (true);

-- Newest-first dashboard reads.
create index if not exists feedback_created_at_idx on public.feedback (created_at desc);
