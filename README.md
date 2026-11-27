# UndanganKu

Prototype mobile-first untuk aplikasi pembuat undangan pernikahan digital.

## Menjalankan lokal

```bash
npm install
npm run dev
```

Antarmuka menggunakan data lokal untuk rancangan undangan. Akun menggunakan Supabase Auth:

- onboarding
- daftar dan login dengan Nama ID dan kata sandi
- beranda
- galeri template
- pembuatan rancangan
- pratinjau final
- pemilihan masa aktif
- status pembayaran manual
- link undangan

Password dan sesi ditangani Supabase Auth, bukan disimpan di aplikasi. Nama ID dipetakan ke alamat internal pada domain `.invalid` (tidak dapat menerima email); indeks unik di database mencegah duplikasi. Karena tidak ada email/nomor yang dapat diverifikasi, pemulihan password mandiri tidak tersedia. Siapkan prosedur bantuan admin sebelum membuka pendaftaran publik.

## Mengaktifkan autentikasi Nama ID

1. Isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` pada `.env.local` dari Supabase Dashboard → Project Settings → API. Frontend hanya memakai anon/publishable key.
2. Jalankan SQL pada `supabase/migrations/202611270001_username_auth.sql` di Supabase SQL Editor untuk menambahkan kolom dan indeks Nama ID serta menyimpan ID pada profil baru.
3. Di Supabase Dashboard → Authentication → Providers → Email, nonaktifkan **Confirm email**. Aplikasi menggunakan alamat internal `.invalid`, jadi email konfirmasi/pemulihan tidak dapat diterima.
4. Pastikan kebijakan password Supabase minimal 8 karakter. Untuk pendaftaran publik, aktifkan CAPTCHA/rate limit Auth di pengaturan Supabase.
5. Jalankan `npm run build`, lalu deploy folder `dist` ke host HTTPS. Vite menyematkan variabel `VITE_*` ke hasil build, jadi atur kedua variabel tersebut pada environment build di penyedia hosting sebelum build dijalankan. Mengubah environment setelah build saja tidak cukup; build dan deploy ulang agar aplikasi memakai konfigurasi baru.

Untuk basis data baru, `schema.sql` sudah menyertakan kolom dan indeks tersebut. Jangan pernah menaruh `service_role` key di frontend.

OTP, pemulihan akun otomatis, payment gateway/Virtual Account, dashboard admin, RSVP tersimpan, dan upload bukti transfer belum terhubung pada tahap ini.

## PWA

PWA memakai `public/manifest.webmanifest`, `public/sw.js`, dan icon `public/icon.svg`.
Service worker akan aktif saat aplikasi dijalankan melalui `localhost` atau HTTPS. Versi cache shell dinaikkan saat ada perubahan aplikasi agar instalasi lama mengambil asset terbaru. Pada browser Android, gunakan menu **Install app** atau **Add to Home screen**.

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
