/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const SUPABASE_SCHEMA_SQL = `-- MeetUp Local - Production Supabase/Postgres Schema & RLS Policies
-- Enables PostGIS extension for geo-spatial queries
create extension if not exists postgis;

-- Enable uuid-ossp extension
create extension if not exists "uuid-ossp";

-- Create Enum Types
create type event_category as enum ('cinema', 'sport', 'food', 'walk', 'boardgames', 'culture', 'other');
create type event_status as enum ('active', 'full', 'cancelled', 'completed');
create type participant_status as enum ('pending', 'accepted', 'declined', 'left');
create type gender_type as enum ('male', 'female', 'other');
create type allowed_gender_type as enum ('any', 'male', 'female');

-- ==========================================
-- 1. USERS TABLE
-- ==========================================
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  name text not null check (char_length(name) >= 2),
  birth_date date not null,
  gender gender_type not null,
  avatar_url text,
  bio text check (char_length(bio) <= 500),
  last_location geography(point, 4326) not null,
  search_radius_km integer not null default 10 check (search_radius_km between 1 and 100),
  is_banned boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for users
create index users_location_idx on public.users using gist (last_location);

-- ==========================================
-- 2. EVENTS TABLE
-- ==========================================
create table public.events (
  id uuid default gen_random_uuid() primary key,
  creator_id uuid references public.users(id) on delete cascade not null,
  title text not null check (char_length(title) between 3 and 100),
  description text not null check (char_length(description) between 10 and 1000),
  category event_category not null,
  location geography(point, 4326) not null,
  address_text text not null,
  starts_at timestamp with time zone not null,
  max_participants integer not null check (max_participants between 2 and 50),
  allowed_gender allowed_gender_type not null default 'any',
  min_age integer not null default 18 check (min_age >= 18),
  max_age integer not null default 99 check (max_age >= min_age),
  status event_status not null default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for events
create index events_location_idx on public.events using gist (location);
create index events_creator_idx on public.events (creator_id);
create index events_status_starts_at_idx on public.events (status, starts_at);

-- ==========================================
-- 3. EVENT PARTICIPANTS TABLE
-- ==========================================
create table public.event_participants (
  event_id uuid references public.events(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  status participant_status not null default 'pending',
  requested_at timestamp with time zone default timezone('utc'::text, now()) not null,
  resolved_at timestamp with time zone,
  primary key (event_id, user_id)
);

create index participants_user_idx on public.event_participants (user_id);
create index participants_event_status_idx on public.event_participants (event_id, status);

-- ==========================================
-- 4. EVENT MESSAGES TABLE
-- ==========================================
create table public.event_messages (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references public.events(id) on delete cascade not null,
  sender_id uuid references public.users(id) on delete cascade not null,
  text text not null check (char_length(text) between 1 and 2000),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index messages_event_idx on public.event_messages (event_id, created_at desc);

-- ==========================================
-- 5. REPORTS TABLE
-- ==========================================
create table public.reports (
  id uuid default gen_random_uuid() primary key,
  reporter_id uuid references public.users(id) on delete cascade not null,
  reported_user_id uuid references public.users(id) on delete cascade not null,
  event_id uuid references public.events(id) on delete set null,
  reason text not null check (char_length(reason) >= 5),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- 6. BLOCKS TABLE
-- ==========================================
create table public.blocks (
  blocker_id uuid references public.users(id) on delete cascade not null,
  blocked_id uuid references public.users(id) on delete cascade not null,
  primary key (blocker_id, blocked_id)
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.events enable row level security;
alter table public.event_participants enable row level security;
alter table public.event_messages enable row level security;
alter table public.reports enable row level security;
alter table public.blocks enable row level security;

-- USERS POLICIES
create policy "Users can view matching profiles" on public.users
  for select
  using (
    not is_banned 
    and id != auth.uid()
    and not exists (
      select 1 from public.blocks 
      where (blocker_id = auth.uid() and blocked_id = users.id)
         or (blocker_id = users.id and blocked_id = auth.uid())
    )
  );

create policy "Users can update own profile" on public.users
  for all
  using (auth.uid() = id);

-- EVENTS POLICIES
create policy "Users can view matching events" on public.events
  for select
  using (
    status in ('active', 'full')
    and not exists (
      select 1 from public.blocks
      where (blocker_id = auth.uid() and blocked_id = events.creator_id)
         or (blocker_id = events.creator_id and blocked_id = auth.uid())
    )
    and (allowed_gender = 'any' or allowed_gender::text = (select gender::text from public.users where id = auth.uid()))
    and (
      (select extract(year from age(now(), birth_date)) from public.users where id = auth.uid()) >= min_age
      and (select extract(year from age(now(), birth_date)) from public.users where id = auth.uid()) <= max_age
    )
  );

create policy "Users can insert own events" on public.events
  for insert
  with check (auth.uid() = creator_id);

create policy "Creators can update own events" on public.events
  for update
  using (auth.uid() = creator_id);

-- PARTICIPANTS POLICIES
create policy "View participants" on public.event_participants
  for select
  using (
    auth.uid() = user_id
    or auth.uid() = (select creator_id from public.events where id = event_id)
    or exists (
      select 1 from public.event_participants 
      where event_id = event_participants.event_id 
        and user_id = auth.uid() 
        and status = 'accepted'
    )
  );

create policy "Request to join events" on public.event_participants
  for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.events
      where id = event_id
        and status = 'active'
        and (allowed_gender = 'any' or allowed_gender::text = (select gender::text from public.users where id = auth.uid()))
        and (select extract(year from age(now(), birth_date)) from public.users where id = auth.uid()) >= min_age
        and (select extract(year from age(now(), birth_date)) from public.users where id = auth.uid()) <= max_age
    )
  );

create policy "Manage participant requests" on public.event_participants
  for update
  using (
    auth.uid() = (select creator_id from public.events where id = event_id)
    or (auth.uid() = user_id and status = 'accepted')
  );

-- EVENT MESSAGES POLICIES
create policy "Accepted participants can read messages" on public.event_messages
  for select
  using (
    exists (
      select 1 from public.event_participants
      where event_id = event_messages.event_id
        and user_id = auth.uid()
        and status = 'accepted'
    )
  );

create policy "Accepted participants can send messages" on public.event_messages
  for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.event_participants
      where event_id = event_messages.event_id
        and user_id = auth.uid()
        and status = 'accepted'
    )
  );

-- BLOCKS AND REPORTS POLICIES
create policy "Users can manage own blocks" on public.blocks
  for all
  using (auth.uid() = blocker_id);

create policy "Users can report other users" on public.reports
  for insert
  with check (auth.uid() = reporter_id);


-- AUTOMATION HELPER TRIGGERS
create or replace function public.handle_new_event_creator()
returns trigger as $$
begin
  insert into public.event_participants (event_id, user_id, status, requested_at)
  values (new.id, new.creator_id, 'accepted', now());
  return new;
end;
$$ language plpgsql security definer;

create trigger on_event_created
  after insert on public.events
  for each row execute procedure public.handle_new_event_creator();
`;
