# Laporan Pekerjaan Harian - V2 Beye Dev Report

## Tanggal: 13 Juni 2026

Dokumen ini mencakup rekapitulasi detail dari seluruh aktivitas perbaikan bug, integrasi data GitHub, peningkatan fungsionalitas visual, serta peningkatan UI/UX interaktif yang dilakukan pada tanggal 13 Juni 2026.

---

### 1. Perbaikan Bug Kritis Otentikasi & Sinkronisasi
- **Otomatisasi Username GitHub di API Akun ([src/app/api/accounts/route.ts](file:///D:/DEV/2026/V2%20Beye%20Dev%20Report/src/app/api/accounts/route.ts)):** 
  - **Masalah:** Frontend hanya mengirimkan `token` (PAT) karena formulir tidak memiliki kolom input username, sementara backend mewajibkan payload `username` sehingga proses otorisasi baru selalu memicu error `400 Bad Request`.
  - **Solusi:** Memperbarui backend untuk mendeteksi `username` (login) dan URL avatar secara dinamis dengan memanggil endpoint `/user` milik GitHub API menggunakan token yang diberikan. Ini menghilangkan kebutuhan input username manual dan memperbaiki kegagalan otorisasi.
- **Error Handling Handal Dekripsi Kunci ([src/app/api/repos/sync/route.ts](file:///D:/DEV/2026/V2%20Beye%20Dev%20Report/src/app/api/repos/sync/route.ts)):**
  - **Masalah:** Mengubah kunci enkripsi (`DATA_ENCRYPTION_KEY`) di file `.env.local` memicu kegagalan dekripsi (`bad decrypt`) pada token lama yang terenkripsi dengan kunci default, menghasilkan error `500 Internal Server Error` saat melakukan sinkronisasi repositori.
  - **Solusi:** Membungkus proses dekripsi token dalam blok `try-catch` dan mengembalikan respon error `400 Bad Request` yang informatif dalam Bahasa Indonesia untuk menginstruksikan pengguna agar menghubungkan ulang akun mereka alih-alih melempar error crash server (500).

### 2. Implementasi Live Auto-Sync di Halaman Laporan ([src/app/api/reports/route.ts](file:///D:/DEV/2026/V2%20Beye%20Dev%20Report/src/app/api/reports/route.ts))
- **Background Auto-Sync Cache (5 Menit):** 
  - Menambahkan logika sinkronisasi otomatis latar belakang setiap kali pengguna memuat Laporan Kerja (Dashboard).
  - Untuk mencegah kelambatan loading halaman dan menghindari pembatasan kuota (*rate limits*) API GitHub, sistem mengecek timestamp `updated_at`. Jika repositori belum diperbarui dalam 5 menit terakhir, backend akan otomatis melakukan penarikan commit (maks. 30) dan PR (maks. 15) terbaru secara langsung dan memperbarui database.
  - Jika kurang dari 5 menit, data langsung diambil dari database lokal secara instan. Developer tidak perlu lagi menekan tombol "Sinkronisasi" secara manual di halaman Akun.

### 3. Peningkatan Rentang Tanggal Laporan Harian (Daily Report Lookback)
- **7-day Lookback Window:** 
  - **Masalah:** Laporan harian secara ketat membatasi data commit/PR hanya pada kalender hari ini (00:00 - 23:59), sehingga jika developer belum melakukan commit baru hari ini, laporan akan menampilkan data kosong (0 commits), padahal mereka ingin melaporkan aktivitas kemarin atau hari sebelumnya.
  - **Solusi:** Mengatur kueri pencarian commit dan PR di backend (akses Developer & Management) dengan *lookback window* 7 hari khusus untuk tipe laporan `daily`. Laporan harian kini dapat menampilkan riwayat commit/PR 7 hari terakhir agar referensi pekerjaan tetap tersedia, sementara data laporan itu sendiri di database tetap terpetakan unik untuk tanggal hari ini.

### 4. Peningkatan UI/UX Responsif di Sisi Manajemen ([src/components/reports/ManagementDashboard.tsx](file:///D:/DEV/2026/V2%20Beye%20Dev%20Report/src/components/reports/ManagementDashboard.tsx))
- **Detail Commit Terintegrasi Per Laporan:** Memperbarui backend dan antarmuka `DevReportItem` di [src/types/report.ts](file:///D:/DEV/2026/V2%20Beye%20Dev%20Report/src/types/report.ts) untuk melampirkan data commit dan PR spesifik milik masing-masing developer ke dalam rekapitulasi laporan yang diakses oleh Manajer.
- **Tampilan Collapsible Aktivitas GitHub Developer:** Kartu log laporan developer di dashboard Manajer kini dilengkapi tombol ekspansi interaktif untuk menampilkan daftar commit dan PR rinci (termasuk SHA, waktu commit, badge pembuat, pesan commit, dan baris kode `+`/`-`) secara rapi saat dibutuhkan.
- **Interaksi Klik Galeri Repositori Aktif (GitHub Connected Repos):** 
  - Manajer dapat mengklik kartu repositori aktif untuk melihat riwayat commit spesifik repositori tersebut.
  - Kartu yang dipilih akan menerima sorotan visual yang jelas (border biru aksen, background tinted, shadow-md, dan scale-up hover).
- **Responsive Modal & Mobile Bottom Sheet Overlay (React Portals):**
  - **Masalah:** Terkadang posisi modal detail repositori berubah atau tidak selalu terpusat (tidak center) karena modal dirender di dalam pohon komponen yang memiliki kontainer bertransformasi (`transform`/`scale` dari Bento grid). Hal ini membuat elemen `fixed` diposisikan relatif terhadap kontainer tersebut dan bergeser saat halaman digulirkan.
  - **Solusi:** Membungkus modal detail repositori di `ManagementDashboard.tsx` dan modal koneksi akun di `accounts/page.tsx` menggunakan **React Portals** (`createPortal`) untuk dirender langsung di bawah `document.body`. Ini menjamin modal selalu berada di luar elemen bertransformasi, sehingga posisi modal selalu terpusat (center) sempurna di desktop dan berperilaku sebagai Bottom Sheet yang stabil di mobile.
  - **Di Mobile:** Untuk menghindari keharusan menggulung halaman (*scrolling*) ke bagian paling bawah di layar kecil, detail commit repositori yang diklik kini muncul sebagai **Bottom Sheet** yang meluncur naik (*slide up*) dari bawah layar (seperti aplikasi native iOS/Android).
  - **Di Desktop:** Tampil sebagai **Centered Modal Dialog** yang elegan dengan efek latar belakang blur (*glassmorphism backdrop*).
  - Dilengkapi tombol penutup yang ergonomis dan fungsionalitas klik area luar (*backdrop click*) untuk menutup panel detail secara instan.

---

## Tanggal: 12 Juni 2026

Dokumen ini adalah rekapitulasi detail dari seluruh aktivitas pengembangan, perbaikan *bug*, dan refactoring arsitektur yang telah dilakukan untuk memastikan stabilitas, keamanan, dan fungsionalitas aplikasi di lingkungan produksi (Vercel).

---

### 1. Audit & Peningkatan Keamanan (Security Hardening)
- **Implementasi Middleware:** Mengonfigurasi `src/middleware.ts` untuk memblokir akses ke rute `/api/*` bagi pengguna tanpa sesi aktif, sekaligus mengarahkan pengguna yang sudah login menjauhi rute publik.
- **Validasi Kepemilikan Data:** Menambahkan pemeriksaan *Role-Based Access Control* (RBAC) dengan *Supabase Admin* di semua rute API (`/api/reports`, `/api/accounts`, `/api/repos/sync`, `/api/repos/toggle`) untuk memastikan *user* hanya dapat mengakses/memodifikasi repositori yang terhubung ke akun mereka sendiri.
- **Perbaikan Enkripsi:** Menstandarisasi modul `src/lib/crypto.ts` untuk enkripsi AES-256 pada *Personal Access Token* (PAT) GitHub.

### 2. Refactoring Arsitektur Komponen (Clean Code)
Aplikasi sebelumnya bergantung pada berkas `src/app/dashboard/reports/page.tsx` yang sangat monolitik (hampir 1.000 baris). Proses refactoring yang dilakukan:
- **`DashboardLayout`**: Membuat komponen *wrapper* layout universal di `src/components/layout/DashboardLayout.tsx` untuk menangani *Header*, *Footer*, *Mobile Nav*, dan state tema (Gelap/Terang) agar tidak berulang di setiap halaman.
- **Pemisahan Entitas Laporan**: 
  - `DeveloperDashboard`: Antarmuka spesifik untuk aktivitas pengembang.
  - `ManagementDashboard`: Antarmuka rekapitulasi untuk level manajemen.
  - `ExportPanel`: Panel untuk mengekspor (PDF/Excel) laporan kerja.
  - `StarRating`: Komponen utilitas visual *rating*.
- **`src/types/report.ts`**: Menambahkan deklarasi *TypeScript interfaces* (`CommitItem`, `PRItem`, dll) untuk menjaga konsistensi data antara *frontend* dan backend.

### 3. Implementasi Paginasi API GitHub
Berdasarkan masalah keterbatasan pengambilan data repositori berskala besar (batas 100/page API GitHub):
- **`accounts/route.ts`**: Menyisipkan algoritma paginasi dinamis (*while loop*) agar aplikasi dapat mengindeks semua repositori yang dimiliki *user* (tanpa batas).
- **`sync/route.ts`**: Menerapkan batas aman (*rate-limit handling*) untuk iterasi paginasi pengambilan hingga maksimal 5 halaman `commits` (500 commits) dan 3 halaman `pull_requests` (300 PRs) dalam satu sesi sinkronisasi demi mencegah terjadinya kelebihan beban jaringan.

### 4. Penanganan Galat Lingkungan Produksi (Vercel Fixes)
- **CORS & RSC Routing Error:** Mengubah metode usang `Response.redirect` menjadi `NextResponse.redirect` pada Next.js middleware agar tidak memicu pemblokiran CORS saat aplikasi melakukan *prefetching* atau *React Server Components (RSC) fetch*.
- **TypeScript & Auth.js Types:** Menyelesaikan keluhan sistem saat *build time* dengan menerapkan asersi `as string` (Type casting) pada tipe data sesi kustom di `src/auth.ts`.
- **400 Bad Request di Toggle/Sync API:** Menyelaraskan atribut objek payload JSON dari backend API (`repo_id` dan `isVisible`) agar persis seperti skema *interface* UI frontend (`id` dan `is_visible`), sehingga mencegah *state mapping* yang bernilai `undefined`.
- **500 Internal Server Error Diagnosis:** Menyelesaikan investigasi yang mengungkap bahwa eror 500 berasal dari asersi variabel lingkungan `SUPABASE_SERVICE_ROLE_KEY` yang tidak termuat sebelum aplikasi di-*redeploy* ulang oleh server Vercel.

---
*Laporan ini berfungsi sebagai landasan dasar historis untuk pembaruan fitur keesokan harinya.*
