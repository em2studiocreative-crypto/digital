-- Editor undangan tidak lagi mewajibkan pilihan template.
-- Jalankan pada project Supabase yang sudah memiliki schema sebelumnya.

alter table public.invitation_drafts
  alter column template_id drop not null;

alter table public.invitations
  alter column template_id drop not null;

alter table public.invitation_drafts
  drop constraint if exists invitation_drafts_template_id_fkey;

alter table public.invitation_drafts
  add constraint invitation_drafts_template_id_fkey
  foreign key (template_id) references public.templates(id) on delete set null;

alter table public.invitations
  drop constraint if exists invitations_template_id_fkey;

alter table public.invitations
  add constraint invitations_template_id_fkey
  foreign key (template_id) references public.templates(id) on delete set null;

comment on column public.invitation_drafts.content is
  'Data editor dalam JSON: nama panggilan, jadwal, keluarga, doa, tamu, foto_url, music_url, palet, warna font, tata letak, gaya huruf, gaya tombol, urutan menu, dan koordinat lokasi. Jangan simpan data URI/base64 untuk media; gunakan Supabase Storage.';
