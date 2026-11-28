-- Bucket media undangan; file hanya dapat diunggah/ditimpa oleh pemilik akun.
-- File publik agar foto dan musik tetap dapat dimuat pada undangan yang dibagikan.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'invitation-media',
  'invitation-media',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/wav', 'audio/x-wav', 'audio/webm']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "invitation media: public read" on storage.objects;
create policy "invitation media: public read"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'invitation-media');

drop policy if exists "invitation media: owner upload" on storage.objects;
create policy "invitation media: owner upload"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'invitation-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "invitation media: owner update" on storage.objects;
create policy "invitation media: owner update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'invitation-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'invitation-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
