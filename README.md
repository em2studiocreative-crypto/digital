# UndanganKu

Prototype mobile-first untuk aplikasi pembuat undangan pernikahan digital.

## Menjalankan lokal

```bash
npm install
npm run dev
```

Antarmuka menggunakan data lokal untuk rancangan undangan. Pilihan desain menampilkan mockup sampul dan halaman undangan mobile; Live Preview berisi sampul, nama pasangan, orang tua (opsional), jadwal Akad, serta jadwal dan lokasi Resepsi (opsional). Pengguna dapat memilih warna tema serta warna font dari swatch atau pemilih warna khusus. Tema Islami menyediakan lima desain tanpa upload foto dan pilihan animasi ornamen (cahaya, gerak daun, kelopak, atau tanpa animasi); animasi dihentikan jika perangkat meminta pengurangan gerakan. Rancangan dan foto tetap tersimpan sementara di memori aplikasi. Akun menggunakan Supabase Auth:

- alur pembuatan: isi lengkap data pasangan dan acara, pilih template, atur foto/warna, lalu pratinjau
- onboarding
- daftar dan login dengan Nama ID dan kata sandi
- beranda
- galeri template
- pembuatan rancangan
- pratinjau final
- pemilihan masa aktif
- status pembayaran manual
- link undangan

Bagian lokasi Akad menyediakan pencarian otomatis alamat melalui OpenStreetMap Nominatim, pemilih peta interaktif, opsi lokasi perangkat, dan kolom link Google Maps. Jika pencarian tidak menemukan alamat, pengguna dapat memakai lokasi perangkat, menggeser pin, atau mengetuk titik pada peta. Pin yang dipilih menghasilkan link Google Maps untuk pratinjau undangan. Alamat Resepsi opsional menghasilkan link pencarian Google Maps pada Live Preview. Pencarian alamat dan peta memerlukan koneksi internet; hasilnya menggunakan Nominatim, bukan Google Geocoding API.

Tema **Dengan Foto** menyediakan lima tata letak dengan warna dan posisi foto berbeda. Foto JPG, PNG, atau WebP hingga 5 MB dapat dipilih pada editor; untuk saat ini foto dan rancangan hanya tersimpan sementara di memori aplikasi, sehingga tidak bertahan setelah halaman dimuat ulang dan belum ikut ke link undangan publik. Penyimpanan foto permanen memerlukan integrasi storage.

Password dan sesi ditangani Supabase Auth, bukan disimpan di aplikasi. Nama ID dipetakan ke alamat internal pada domain `.invalid` (tidak dapat menerima email); indeks unik di database mencegah duplikasi. Karena tidak ada email/nomor yang dapat diverifikasi, pemulihan password mandiri tidak tersedia. Siapkan prosedur bantuan admin sebelum membuka pendaftaran publik.

## Mengaktifkan autentikasi Nama ID

1. Isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` pada `.env.local` dari Supabase Dashboard → Project Settings → API. Frontend hanya memakai anon/publishable key.
2. Jalankan SQL pada `supabase/migrations/202611270001_username_auth.sql` di Supabase SQL Editor untuk menambahkan kolom dan indeks Nama ID serta memasang trigger yang membuat profil untuk setiap akun baru.
3. Di Supabase Dashboard → Authentication → Providers → Email, nonaktifkan **Confirm email**. Aplikasi menggunakan alamat internal `.invalid`, jadi email konfirmasi/pemulihan tidak dapat diterima.
4. Pastikan kebijakan password Supabase minimal 8 karakter. Untuk pendaftaran publik, aktifkan CAPTCHA/rate limit Auth di pengaturan Supabase.
5. Untuk GitHub Pages, simpan kedua nilai sebagai **repository secrets** bernama persis `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` (bukan sebagai Supabase secret). Pastikan **Settings → Pages → Build and deployment → Source** menggunakan **GitHub Actions**. Setelah menambahkan atau mengubah secrets, buka **Actions → Deploy UndanganKu to GitHub Pages → Run workflow** pada branch `main`; tunggu job build dan deploy sukses. Workflow memvalidasi kedua secrets sebelum build. Untuk host lain, atur keduanya pada environment build host tersebut. Vite menyematkan variabel `VITE_*` ke hasil build, jadi build dan deploy ulang setelah perubahan konfigurasi.

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
