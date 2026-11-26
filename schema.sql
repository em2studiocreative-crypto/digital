-- UndanganKu / Supabase schema
-- Jalankan di Supabase SQL Editor.
-- Supabase Auth tetap menjadi sumber identitas utama melalui auth.users.

create extension if not exists pgcrypto;

create type public.user_role as enum ('user', 'admin');
create type public.draft_status as enum ('draft', 'selected', 'published', 'archived');
create type public.invitation_status as enum ('awaiting_payment', 'pending_review', 'active', 'expired', 'rejected');
create type public.payment_status as enum ('pending', 'approved', 'rejected');
create type public.rsvp_attendance as enum ('attending', 'not_attending', 'undecided');
create type public.analytics_event as enum ('view', 'open', 'rsvp', 'message', 'map_click', 'share_click');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  phone text unique,
  display_name text,
  role public.user_role not null default 'user',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, phone, display_name)
  values (
    new.id,
    new.phone,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.phone)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create table public.templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null,
  description text,
  cover_image_url text,
  design_config jsonb not null default '{}'::jsonb,
  color_themes jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger templates_set_updated_at
  before update on public.templates
  for each row execute procedure public.set_updated_at();

create table public.invitation_drafts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  template_id uuid not null references public.templates(id) on delete restrict,
  status public.draft_status not null default 'draft',
  groom_name text,
  bride_name text,
  event_date date,
  venue text,
  city text,
  theme_index smallint not null default 0 check (theme_index >= 0),
  content jsonb not null default '{}'::jsonb,
  enabled_features jsonb not null default '{"countdown": true, "gallery": true, "music": true, "rsvp": true, "guest_messages": true, "map": true}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index invitation_drafts_owner_idx on public.invitation_drafts(owner_id);
create index invitation_drafts_status_idx on public.invitation_drafts(status);

create or replace function public.enforce_two_drafts()
returns trigger
language plpgsql
as $$
declare
  active_draft_count integer;
begin
  select count(*)
    into active_draft_count
    from public.invitation_drafts
   where owner_id = new.owner_id
     and status in ('draft', 'selected')
     and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);

  if new.status in ('draft', 'selected') and active_draft_count >= 2 then
    raise exception 'Pengguna hanya dapat memiliki maksimal 2 rancangan aktif';
  end if;

  return new;
end;
$$;

create trigger invitation_drafts_limit
  before insert or update on public.invitation_drafts
  for each row execute procedure public.enforce_two_drafts();

create trigger invitation_drafts_set_updated_at
  before update on public.invitation_drafts
  for each row execute procedure public.set_updated_at();

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  draft_id uuid not null unique references public.invitation_drafts(id) on delete restrict,
  template_id uuid not null references public.templates(id) on delete restrict,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  status public.invitation_status not null default 'awaiting_payment',
  content jsonb not null default '{}'::jsonb,
  theme_index smallint not null default 0 check (theme_index >= 0),
  active_from timestamptz,
  active_until timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (active_until is null or active_from is null or active_until > active_from)
);

create index invitations_owner_idx on public.invitations(owner_id);
create index invitations_slug_idx on public.invitations(slug);
create index invitations_status_expiry_idx on public.invitations(status, active_until);
create unique index one_publishable_invitation_per_owner_idx
  on public.invitations(owner_id)
  where status in ('awaiting_payment', 'pending_review', 'active');

create trigger invitations_set_updated_at
  before update on public.invitations
  for each row execute procedure public.set_updated_at();

create table public.virtual_accounts (
  id uuid primary key default gen_random_uuid(),
  bank_name text not null,
  account_number text not null,
  account_holder text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index virtual_accounts_active_one_idx
  on public.virtual_accounts (is_active)
  where is_active = true;

create trigger virtual_accounts_set_updated_at
  before update on public.virtual_accounts
  for each row execute procedure public.set_updated_at();

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  payer_id uuid not null references public.profiles(id) on delete cascade,
  virtual_account_id uuid references public.virtual_accounts(id) on delete set null,
  duration_days integer not null check (duration_days in (30, 90, 180, 365)),
  amount numeric(12, 2) not null check (amount >= 0),
  proof_url text,
  status public.payment_status not null default 'pending',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index payments_payer_idx on public.payments(payer_id);
create index payments_status_idx on public.payments(status);
create index payments_invitation_idx on public.payments(invitation_id);

create trigger payments_set_updated_at
  before update on public.payments
  for each row execute procedure public.set_updated_at();

create table public.rsvps (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  guest_name text not null check (char_length(trim(guest_name)) between 2 and 120),
  attendance public.rsvp_attendance not null,
  guest_count smallint not null default 1 check (guest_count between 1 and 20),
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index rsvps_invitation_idx on public.rsvps(invitation_id);

create trigger rsvps_set_updated_at
  before update on public.rsvps
  for each row execute procedure public.set_updated_at();

create table public.guest_messages (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  guest_name text not null check (char_length(trim(guest_name)) between 2 and 120),
  message text not null check (char_length(trim(message)) between 2 and 1000),
  is_visible boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create index guest_messages_invitation_idx on public.guest_messages(invitation_id, created_at desc);

create table public.invitation_analytics (
  id bigint generated always as identity primary key,
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  event public.analytics_event not null,
  session_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index invitation_analytics_invitation_idx on public.invitation_analytics(invitation_id, created_at desc);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.templates enable row level security;
alter table public.invitation_drafts enable row level security;
alter table public.invitations enable row level security;
alter table public.virtual_accounts enable row level security;
alter table public.payments enable row level security;
alter table public.rsvps enable row level security;
alter table public.guest_messages enable row level security;
alter table public.invitation_analytics enable row level security;

create policy "profiles: own read"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());

create policy "profiles: own update"
  on public.profiles for update to authenticated
  using (id = auth.uid() and not public.is_admin())
  with check (id = auth.uid() and role = 'user');

create policy "profiles: admin manage"
  on public.profiles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "templates: public read active"
  on public.templates for select to anon, authenticated
  using (is_active = true or public.is_admin());

create policy "templates: admin write"
  on public.templates for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "drafts: owner access"
  on public.invitation_drafts for all to authenticated
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

create policy "invitations: owner read"
  on public.invitations for select to authenticated
  using (owner_id = auth.uid() or public.is_admin());

create policy "invitations: owner create"
  on public.invitations for insert to authenticated
  with check (owner_id = auth.uid() or public.is_admin());

create policy "invitations: owner update before active"
  on public.invitations for update to authenticated
  using ((owner_id = auth.uid() and status in ('awaiting_payment', 'pending_review', 'rejected')) or public.is_admin())
  with check ((owner_id = auth.uid() and status in ('awaiting_payment', 'pending_review', 'rejected')) or public.is_admin());

create policy "invitations: public read by slug"
  on public.invitations for select to anon, authenticated
  using (status = 'active' and active_from <= now() and active_until > now());

create policy "virtual accounts: active read"
  on public.virtual_accounts for select to authenticated
  using (is_active = true or public.is_admin());

create policy "virtual accounts: admin write"
  on public.virtual_accounts for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "payments: owner read/create"
  on public.payments for select to authenticated
  using (payer_id = auth.uid() or public.is_admin());

create policy "payments: owner create"
  on public.payments for insert to authenticated
  with check (payer_id = auth.uid());

create policy "payments: owner update pending"
  on public.payments for update to authenticated
  using (payer_id = auth.uid() and status = 'pending')
  with check (payer_id = auth.uid() and status = 'pending');

create policy "payments: admin review"
  on public.payments for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "rsvps: public create for active invitations"
  on public.rsvps for insert to anon, authenticated
  with check (exists (
    select 1 from public.invitations i
    where i.id = invitation_id
      and i.status = 'active'
      and i.active_from <= now()
      and i.active_until > now()
  ));

create policy "rsvps: owner/admin read"
  on public.rsvps for select to authenticated
  using (exists (
    select 1 from public.invitations i
    where i.id = invitation_id and (i.owner_id = auth.uid() or public.is_admin())
  ));

create policy "rsvps: owner/admin update"
  on public.rsvps for update to authenticated
  using (exists (
    select 1 from public.invitations i
    where i.id = invitation_id and (i.owner_id = auth.uid() or public.is_admin())
  ));

create policy "rsvps: owner/admin delete"
  on public.rsvps for delete to authenticated
  using (exists (
    select 1 from public.invitations i
    where i.id = invitation_id and (i.owner_id = auth.uid() or public.is_admin())
  ));

create policy "guest messages: public create for active invitations"
  on public.guest_messages for insert to anon, authenticated
  with check (exists (
    select 1 from public.invitations i
    where i.id = invitation_id
      and i.status = 'active'
      and i.active_from <= now()
      and i.active_until > now()
  ));

create policy "guest messages: public read visible"
  on public.guest_messages for select to anon, authenticated
  using (is_visible = true and exists (
    select 1 from public.invitations i
    where i.id = invitation_id
      and i.status = 'active'
      and i.active_from <= now()
      and i.active_until > now()
  ));

create policy "guest messages: owner/admin update"
  on public.guest_messages for update to authenticated
  using (exists (
    select 1 from public.invitations i
    where i.id = invitation_id and (i.owner_id = auth.uid() or public.is_admin())
  ));

create policy "guest messages: owner/admin delete"
  on public.guest_messages for delete to authenticated
  using (exists (
    select 1 from public.invitations i
    where i.id = invitation_id and (i.owner_id = auth.uid() or public.is_admin())
  ));

create policy "analytics: public create for active invitations"
  on public.invitation_analytics for insert to anon, authenticated
  with check (exists (
    select 1 from public.invitations i
    where i.id = invitation_id
      and i.status = 'active'
      and i.active_from <= now()
      and i.active_until > now()
  ));

create policy "analytics: owner/admin read"
  on public.invitation_analytics for select to authenticated
  using (exists (
    select 1 from public.invitations i
    where i.id = invitation_id and (i.owner_id = auth.uid() or public.is_admin())
  ));

-- Dipanggil admin setelah bukti pembayaran diverifikasi.
-- Fungsi ini mengaktifkan link dan menghitung masa aktif dari waktu persetujuan.
create or replace function public.approve_payment(p_payment_id uuid)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  selected_payment public.payments%rowtype;
  published_invitation_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Hanya admin yang dapat menyetujui pembayaran';
  end if;

  select * into selected_payment
    from public.payments
   where id = p_payment_id
   for update;

  if selected_payment.id is null then
    raise exception 'Pembayaran tidak ditemukan';
  end if;

  update public.payments
     set status = 'approved',
         reviewed_by = auth.uid(),
         reviewed_at = timezone('utc', now()),
         updated_at = timezone('utc', now())
   where id = p_payment_id;

  update public.invitations
     set status = 'active',
         active_from = timezone('utc', now()),
         active_until = timezone('utc', now()) + make_interval(days => selected_payment.duration_days),
         published_at = coalesce(published_at, timezone('utc', now())),
         updated_at = timezone('utc', now())
   where id = selected_payment.invitation_id
   returning id into published_invitation_id;

  update public.invitation_drafts d
     set status = 'published', updated_at = timezone('utc', now())
    from public.invitations i
   where i.id = selected_payment.invitation_id
     and d.id = i.draft_id;

  return published_invitation_id;
end;
$$;

-- Otomatis menandai undangan aktif yang melewati active_until sebagai expired
create or replace function public.expire_old_invitations()
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  affected integer;
begin
  update public.invitations
     set status = 'expired', updated_at = timezone('utc', now())
   where status = 'active' and active_until <= now();
  get diagnostics affected = row_count;
  return affected;
end;
$$;

-- Jalankan fungsi ini melalui Supabase Cron/Edge Function secara berkala.

insert into public.templates (slug, name, category, description, color_themes, design_config)
values
  ('rimba-senja', 'Rimba Senja', 'Natural', 'Nuansa hijau hutan dan cahaya senja.', '[{"name":"Sage","primary":"#c7d0b4","accent":"#d9c096"},{"name":"Forest","primary":"#6e7b68","accent":"#e0c48a"}]', '{"layout":"immersive-cover","font":"editorial-serif","sections":["opening","couple","event","countdown","gallery","map","rsvp","messages"]}'),
  ('purnama-jawa', 'Purnama Jawa', 'Tradisional', 'Perpaduan tradisi dan elegansi modern.', '[{"name":"Earth","primary":"#a88a62","accent":"#ede0c2"},{"name":"Night","primary":"#44372c","accent":"#d7b879"}]', '{"layout":"immersive-cover","font":"heritage-serif","sections":["opening","couple","event","countdown","gallery","map","rsvp","messages"]}'),
  ('arunika', 'Arunika', 'Minimalis', 'Hangat, ringan, dan modern.', '[{"name":"Dawn","primary":"#d6c6bc","accent":"#f4ede5"},{"name":"Clay","primary":"#8a6e62","accent":"#d9bb8b"}]', '{"layout":"immersive-cover","font":"modern-serif","sections":["opening","couple","event","countdown","gallery","map","rsvp","messages"]}'),
  ('taman-hati', 'Taman Hati', 'Romantis', 'Lembut dengan aksen floral yang tenang.', '[{"name":"Rose","primary":"#c5b4b0","accent":"#eee1d7"},{"name":"Mocha","primary":"#8a6c60","accent":"#d8bd8a"}]', '{"layout":"immersive-cover","font":"romantic-serif","sections":["opening","couple","event","countdown","gallery","map","rsvp","messages"]}')
on conflict (slug) do nothing;
