-- Schema for the student sign-up site.
-- Run once against your database (npm run db:init does this for you).

create table if not exists events (
  id          bigserial primary key,
  type        text        not null check (type in ('dinner', 'office_hours')),
  title       text        not null,
  description text        not null default '',
  location    text        not null default '',
  starts_at   timestamptz not null,
  ends_at     timestamptz,
  capacity    integer     not null default 1 check (capacity >= 1),
  is_closed   boolean     not null default false,
  -- groups generated office-hour slots so the admin can manage them together
  series_label text       not null default '',
  created_at  timestamptz not null default now()
);

create index if not exists idx_events_type_start on events (type, starts_at);

create table if not exists reservations (
  id           bigserial primary key,
  event_id     bigint      not null references events (id) on delete cascade,
  name         text        not null,
  email        text        not null,
  cancel_token text        not null unique,
  created_at   timestamptz not null default now()
);

create index if not exists idx_reservations_event on reservations (event_id);
