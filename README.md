# UndanganKu

Prototype mobile-first untuk aplikasi pembuat undangan pernikahan digital.

## Menjalankan lokal

```bash
npm install
npm run dev
```

Prototype ini menggunakan data lokal untuk simulasi alur:

- onboarding
- login nomor telepon
- beranda
- galeri template
- pembuatan rancangan
- pratinjau final
- pemilihan masa aktif
- status pembayaran manual
- link undangan

Backend, OTP nyata, payment gateway/Virtual Account, dashboard admin, database, RSVP tersimpan, dan upload bukti transfer belum terhubung pada tahap ini.

## PWA

PWA memakai `public/manifest.webmanifest`, `public/sw.js`, dan icon `public/icon.svg`.
Service worker akan aktif saat aplikasi dijalankan melalui `localhost` atau HTTPS. Pada browser Android, gunakan menu **Install app** atau **Add to Home screen**.

## Supabase environment

Salin `.env.example` menjadi `.env.local`, lalu isi:

```bash
cp .env.example .env.local
```

Nilai diambil dari Supabase Dashboard → Project Settings → API:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Gunakan hanya `anon/publishable key` di frontend. Jangan pernah menaruh `service_role key` di React, `.env` yang di-commit, atau kode yang dikirim ke browser.
