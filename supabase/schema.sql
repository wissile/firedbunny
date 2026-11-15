-- FiredBunny accounts: the database side.
--
-- Paste this whole file into Supabase → SQL Editor → New query, and press Run. It is safe to run again: it only
-- creates what is missing and replaces the rules and functions below with this version.
--
-- What it sets up
--   user_data            one row per saved item per person: the profile (goals, net worth, household, lesson
--                        progress), each assessment result, and every other thing the site saves (trade journal,
--                        FIRE plan, spreadsheet rows, preferences...). key = what it is, value = the item as JSON.
--   row-level security   a signed-in person can read, add, change and delete only their own rows. Visitors who are
--                        not signed in (the "anon" role) cannot touch the table at all.
--   limits               keys up to 200 characters, one item up to 512 KB, at most 300 items per person.
--   delete_my_account()  lets a signed-in person delete their own account; their saved rows go with it.
--   feedback             notes visitors send from the About page and the help chat (src/feedback.js). Anyone can send
--                        one, signed in or not; nobody can read them through the website. Read them in the Table
--                        Editor (table feedback), newest first.
--   brokerage_links      one row per person who connected a brokerage on the Portfolio page: their SnapTrade user id
--                        and SnapTrade secret, encrypted by the site's Worker. No holdings or transactions are stored.
--
-- The website talks to this with the project's publishable (anon) key, which is public by design. These rules are
-- what keep each person's data private, so do not turn row-level security off.

create table if not exists public.user_data (
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  key        text        not null,
  value      jsonb       not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key),
  constraint user_data_key_length check (char_length(key) between 1 and 200),
  constraint user_data_value_size check (pg_column_size(value) <= 524288)
);

comment on table public.user_data is 'FiredBunny: everything a signed-in person saves, one row per item (see supabase/schema.sql in the site repo).';

alter table public.user_data enable row level security;

-- Only signed-in people, and only their own rows.
revoke all on table public.user_data from anon;
grant select, insert, update, delete on table public.user_data to authenticated;

drop policy if exists "user_data: read own"   on public.user_data;
drop policy if exists "user_data: add own"    on public.user_data;
drop policy if exists "user_data: change own" on public.user_data;
drop policy if exists "user_data: delete own" on public.user_data;

create policy "user_data: read own" on public.user_data
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "user_data: add own" on public.user_data
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "user_data: change own" on public.user_data
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "user_data: delete own" on public.user_data
  for delete to authenticated using ((select auth.uid()) = user_id);

-- The server's clock decides updated_at, so devices agree on which copy is newer; and one person can keep at most
-- 300 items, so a single account cannot fill the database.
create or replace function public.user_data_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  if tg_op = 'INSERT' and (select count(*) from public.user_data where user_id = new.user_id) >= 300 then
    raise exception 'FiredBunny: this account already has the maximum of 300 saved items' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists user_data_before_write on public.user_data;
create trigger user_data_before_write
  before insert or update on public.user_data
  for each row execute function public.user_data_before_write();

-- A signed-in person deletes their own account (the app stores and Europe's GDPR both expect this to be possible).
-- Runs with the function owner's rights so it may remove the login itself; it can only ever remove the caller.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'FiredBunny: not signed in' using errcode = 'insufficient_privilege';
  end if;
  delete from public.user_data where user_id = me;
  if to_regclass('public.brokerage_links') is not null then
    execute 'delete from public.brokerage_links where user_id = $1' using me;
  end if;
  delete from auth.users where id = me;
end;
$$;

revoke all on function public.delete_my_account() from public;
revoke all on function public.delete_my_account() from anon;
grant execute on function public.delete_my_account() to authenticated;

-- ---------------------------------------------------------------------------------------------------------------------
-- Feedback: notes from the About page form and the help chat (src/feedback.js).
--
-- Visitors (signed in or not) can only add a note: no one can read, change or delete notes through the website, not even
-- the person who sent one. The owner reads them in Table Editor → feedback and can set status (new, done...) there.
--   kind        Idea, Something to improve, Correct an inaccuracy, Question or Other
--   message     what they wrote (up to 4,000 characters)
--   email       only if they chose to give one for a reply
--   page        the page they were on, or the page they picked on the About form
--   source      'chat' or 'about'
--   user_agent  their browser, to help reproduce a problem
--   user_id     their account, when they were signed in (filled by the database, never by the browser)
create table if not exists public.feedback (
  id         uuid        primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  kind       text        not null,
  message    text        not null,
  email      text,
  page       text,
  source     text,
  user_agent text,
  user_id    uuid        default auth.uid() references auth.users (id) on delete set null,
  status     text        not null default 'new',
  constraint feedback_kind_length    check (char_length(kind) between 1 and 40),
  constraint feedback_message_length check (char_length(message) <= 4000 and message ~ '[^[:space:]]'),
  constraint feedback_email_shape    check (email is null or (char_length(email) <= 254 and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')),
  constraint feedback_page_length    check (page is null or char_length(page) <= 300),
  constraint feedback_source_length  check (source is null or char_length(source) <= 20),
  constraint feedback_ua_length      check (user_agent is null or char_length(user_agent) <= 300),
  constraint feedback_status_length  check (char_length(status) between 1 and 20)
);

comment on table public.feedback is 'FiredBunny: notes visitors send from the About page and the help chat. Visitors can only add rows (see supabase/schema.sql in the site repo).';

create index if not exists feedback_created_at on public.feedback (created_at desc);

alter table public.feedback enable row level security;

-- Add a note, and only the columns a visitor writes. No reading, changing or deleting.
revoke all on table public.feedback from anon, authenticated;
grant insert (kind, message, email, page, source, user_agent) on table public.feedback to anon, authenticated;

drop policy if exists "feedback: anyone can send" on public.feedback;
create policy "feedback: anyone can send" on public.feedback
  for insert to anon, authenticated with check (user_id is null or user_id = (select auth.uid()));

-- The database fills in the time, the status and who sent it (the signed-in account, or nobody), whatever the browser
-- sends; and it turns notes away once 120 have arrived in ten minutes from everyone together, so a flood of junk cannot
-- fill the table. Runs with the owner's rights so it may count the notes, which visitors cannot see.
create or replace function public.feedback_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.created_at := now();
  new.status := 'new';
  new.user_id := auth.uid();
  if (select count(*) from public.feedback where created_at > now() - interval '10 minutes') >= 120 then
    raise exception 'FiredBunny: too much feedback right now, try again in a few minutes' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists feedback_before_insert on public.feedback;
create trigger feedback_before_insert
  before insert on public.feedback
  for each row execute function public.feedback_before_insert();

-- ---------------------------------------------------------------------------------------------------------------------
-- Brokerage links: the Portfolio page's read-only connection through SnapTrade (worker/brokerage.js,
-- src/mod-y-portfolio.js, docs/portfolio/README.md).
--
-- One row per person who connected a brokerage. Holdings, balances and transactions are never stored here: the Worker
-- fetches them from SnapTrade when the person opens the Portfolio page, and only their own device keeps a copy.
--   snaptrade_user_id  the person's user id at SnapTrade: 'fb-' followed by their account id (plus a short suffix if
--                      SnapTrade had to give them a new one)
--   secret_box         their SnapTrade user secret, encrypted by the Worker (AES-256-GCM, with a key only the Worker
--                      holds and bound to this snaptrade_user_id). Useless without that key, and opens for no one else.
-- The Worker reads and writes the row with the person's own sign-in token, so the rules below bind it as well: each
-- person sees, adds, changes and deletes only their own row; visitors who are not signed in cannot touch the table.
-- Deleting the account deletes the row (and Settings asks the Worker to delete the SnapTrade user first).
create table if not exists public.brokerage_links (
  user_id           uuid        primary key default auth.uid() references auth.users (id) on delete cascade,
  snaptrade_user_id text        not null,
  secret_box        text        not null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint brokerage_links_user_id_shape check (
    snaptrade_user_id = 'fb-' || user_id::text
    or (snaptrade_user_id like ('fb-' || user_id::text || '-%') and char_length(snaptrade_user_id) <= 56)),
  constraint brokerage_links_box_length check (char_length(secret_box) between 20 and 1000)
);

comment on table public.brokerage_links is 'FiredBunny: each person''s SnapTrade user id and encrypted SnapTrade secret for the Portfolio page. No holdings are stored (see supabase/schema.sql in the site repo).';

alter table public.brokerage_links enable row level security;

revoke all on table public.brokerage_links from anon, authenticated;
grant select on table public.brokerage_links to authenticated;
-- (update includes user_id because an upsert sets every column it sends; the policy keeps it the person's own)
grant insert (user_id, snaptrade_user_id, secret_box), update (user_id, snaptrade_user_id, secret_box), delete on table public.brokerage_links to authenticated;

drop policy if exists "brokerage_links: read own"   on public.brokerage_links;
drop policy if exists "brokerage_links: add own"    on public.brokerage_links;
drop policy if exists "brokerage_links: change own" on public.brokerage_links;
drop policy if exists "brokerage_links: delete own" on public.brokerage_links;

create policy "brokerage_links: read own" on public.brokerage_links
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "brokerage_links: add own" on public.brokerage_links
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "brokerage_links: change own" on public.brokerage_links
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "brokerage_links: delete own" on public.brokerage_links
  for delete to authenticated using ((select auth.uid()) = user_id);

-- The server's clock keeps the dates.
create or replace function public.brokerage_links_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then new.created_at := now(); else new.created_at := old.created_at; end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists brokerage_links_before_write on public.brokerage_links;
create trigger brokerage_links_before_write
  before insert or update on public.brokerage_links
  for each row execute function public.brokerage_links_before_write();
