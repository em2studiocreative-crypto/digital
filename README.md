# UndanganKu

Aplikasi UndanganKu adalah aplikasi sungguhan yang dikembangkan untuk penggunaan dan produksi, bukan demo atau prototype. Perubahan dan penambahan fitur berikutnya merupakan pengembangan berkelanjutan pada aplikasi produksi ini dan tidak mengubah statusnya menjadi aplikasi demo. Kesiapan publikasi tetap bergantung pada konfigurasi layanan, migrasi database, dan pemeriksaan fitur yang dijelaskan di bawah.

## Menjalankan lokal

```bash
npm install
npm run dev
```

- Editor undangan terpadu menerima nama panggilan dan lengkap, tanggal, jadwal Akad/Resepsi, lokasi dan peta, keluarga, kata pengantar, doa, serta pesan untuk tamu.
- Pengaturan tampilan berada di editor yang sama: foto sampul opsional, tiga tata letak, palet warna UndanganKu, gaya huruf dan tombol, serta urutan navigasi undangan.
- Musik dapat dimatikan atau menggunakan file audio sendiri hingga 10 MB. Rancangan disimpan ke Supabase saat pengguna menekan **Selesai** pada editor; foto dan musik diunggah ke Supabase Storage.
- Live Preview menampilkan sampul dan bagian Acara, Keluarga, Peta, dan Doa mengikuti data serta urutan menu yang diatur.
- Alur pembuatan: buka **Buat rancangan pertama** dari Beranda, isi dan sesuaikan undangan pada satu editor, kemudian pratinjau dan lanjut ke aktivasi.
- Akun menggunakan Supabase Auth:
- onboarding
- daftar dan login dengan Nama ID dan kata sandi
- beranda
- editor undangan terpadu
- pembuatan rancangan
- pratinjau final
- pemilihan masa aktif
- status pembayaran manual
- link undangan

Bagian lokasi Akad menyediakan pencarian otomatis alamat melalui OpenStreetMap Nominatim, pemilih peta interaktif, opsi lokasi perangkat, dan kolom link Google Maps. Jika pencarian tidak menemukan alamat, pengguna dapat memakai lokasi perangkat, menggeser pin, atau mengetuk titik pada peta. Pin yang dipilih menghasilkan link Google Maps untuk pratinjau undangan. Alamat Resepsi opsional menghasilkan link pencarian Google Maps pada Live Preview. Pencarian alamat dan peta memerlukan koneksi internet; hasilnya menggunakan Nominatim, bukan Google Geocoding API.

Foto JPG, PNG, atau WebP hingga 5 MB dapat dipilih pada editor. Rancangan tersimpan di Supabase setelah pengguna menekan **Selesai**; foto dan musik disimpan di Supabase Storage setelah migrasi bucket media dijalankan. Link undangan publik dan aktivasi undangan tetap mengikuti tahap layanan yang tersedia dan tidak otomatis diterbitkan ketika rancangan disimpan.

Password dan sesi ditangani Supabase Auth, bukan disimpan di aplikasi. Nama ID dipetakan ke alamat internal pada domain `.invalid` (tidak dapat menerima email); indeks unik di database mencegah duplikasi. Karena tidak ada email/nomor yang dapat diverifikasi, pemulihan password mandiri tidak tersedia. Siapkan prosedur bantuan admin sebelum membuka pendaftaran publik.

## Mengaktifkan autentikasi Nama ID

1. Isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` pada `.env.local` dari Supabase Dashboard → Project Settings → API. Frontend hanya memakai anon/publishable key.
2. Jalankan SQL pada `supabase/migrations/202611270001_username_auth.sql` di Supabase SQL Editor untuk menambahkan kolom dan indeks Nama ID serta memasang trigger yang membuat profil untuk setiap akun baru.
3. Di Supabase Dashboard → Authentication → Providers → Email, nonaktifkan **Confirm email**. Aplikasi menggunakan alamat internal `.invalid`, jadi email konfirmasi/pemulihan tidak dapat diterima.
4. Pastikan kebijakan password Supabase minimal 8 karakter. Untuk pendaftaran publik, aktifkan CAPTCHA/rate limit Auth di pengaturan Supabase.
5. Untuk GitHub Pages, simpan kedua nilai sebagai **repository secrets** bernama persis `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` (bukan sebagai Supabase secret). Pastikan **Settings → Pages → Build and deployment → Source** menggunakan **GitHub Actions**. Setelah menambahkan atau mengubah secrets, buka **Actions → Deploy UndanganKu to GitHub Pages → Run workflow** pada branch `main`; tunggu job build dan deploy sukses. Workflow memvalidasi kedua secrets sebelum build. Untuk host lain, atur keduanya pada environment build host tersebut. Vite menyematkan variabel `VITE_*` ke hasil build, jadi build dan deploy ulang setelah perubahan konfigurasi.

`schema.sql` hanya untuk inisialisasi project Supabase baru yang belum memiliki tabel atau tipe UndanganKu; jangan jalankan ulang pada project yang sudah aktif karena skrip inisialisasi bukan migrasi idempoten. Untuk project yang sudah memakai skema sebelumnya, jalankan migrasi yang belum diterapkan di Supabase SQL Editor. `202611280001_editor_without_templates.sql` membuat `template_id` opsional; `202611280002_invitation_media_storage.sql` membuat bucket dan kebijakan akses media. Skema mengizinkan rancangan dan undangan tanpa `template_id`, sementara kolom `content` menampung pengaturan editor. Jangan pernah menaruh `service_role` key di frontend.

Kolom `content` menampung data tambahan editor (seperti nama panggilan, jadwal resepsi, keluarga, doa, pesan tamu, pengaturan tampilan, koordinat lokasi, serta URL media). Saat ini editor memuat hingga dua rancangan berstatus `draft`/`selected` setelah login dan menyimpannya saat pengguna menekan **Selesai**. Foto dan musik diunggah ke bucket publik `invitation-media`; hanya pemilik akun yang boleh mengunggah atau memperbarui file. Rancangan dan URL media disimpan terpisah dari sesi browser, sehingga tetap tersedia setelah halaman dimuat ulang.

Jika project sudah pernah menjalankan migrasi `202611280001_editor_without_templates.sql`, jalankan juga `supabase/migrations/202611280002_invitation_media_storage.sql` di Supabase SQL Editor untuk membuat bucket dan kebijakan akses media. Jangan jalankan ulang seluruh `schema.sql` pada project aktif. Jika upload media gagal setelah migrasi, periksa kebijakan Storage dan ukuran/format file; pesan kesalahan akan muncul di editor.

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
