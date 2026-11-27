alter table public.profiles
  add column if not exists username text;

create unique index if not exists profiles_username_unique
  on public.profiles (lower(username))
  where username is not null;

create or replace function public.prevent_profile_username_change()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is not null and new.username is distinct from old.username then
    raise exception 'username_immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_username_immutable on public.profiles;
create trigger profiles_username_immutable
  before update on public.profiles
  for each row execute procedure public.prevent_profile_username_change();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  new_username text := nullif(lower(new.raw_user_meta_data ->> 'username'), '');
begin
  insert into public.profiles (id, phone, display_name, username)
  values (
    new.id,
    new.phone,
    coalesce(new.raw_user_meta_data ->> 'display_name', new_username, new.phone),
    new_username
  )
  on conflict (id) do update
  set username = coalesce(public.profiles.username, excluded.username),
      display_name = coalesce(public.profiles.display_name, excluded.display_name);
  return new;
end;
$$;
