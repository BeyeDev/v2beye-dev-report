\#\# Konsep Dashboard Pelaporan Kerja Developer — "Mili Cipta Karya DevReport"

---

## **1\. Gambaran Umum**

| Aspek | Keterangan |
| ----- | ----- |
| Nama (usulan) | **DevReport** / **MCK Work Dashboard** |
| Tujuan | Pelaporan kerja developer ke perusahaan secara otomatis, detail, dan real-time |
| Sumber data utama | GitHub (multi-akun developer) |
| Pengguna | 3 peran: **Developer** (pemilik data), **Manajemen/Divisi** (viewer), **Admin** (pengelola akses) |
| Stack | Next.js (App Router), GitHub API, database, auth |

---

## **2\. Peran Pengguna & Hak Akses (RBAC)**

| Peran | Hak Akses |
| ----- | ----- |
| **Developer** | Menghubungkan akun GitHub (bisa lebih dari satu), mengatur repo mana yang ditampilkan, menambah catatan/konteks kerja manual, melihat semua data miliknya |
| **Manajemen / Divisi** | Read-only: melihat ringkasan, detail aktivitas, laporan harian/mingguan/bulanan, ekspor laporan |
| **Admin** | Mengelola user, peran, divisi, dan pengaturan organisasi |

Prinsip: developer mengontrol *apa yang dibagikan* (misal repo pribadi non-kantor bisa disembunyikan), manajemen mendapat *transparansi penuh* atas repo yang relevan dengan pekerjaan.

---

## **3\. Struktur Halaman (Sitemap)**

Copy

/                          → Landing / redirect ke login  
/login                     → Autentikasi (email \+ GitHub OAuth)

/dashboard                 → Overview (ringkasan utama)  
/dashboard/activity        → Timeline aktivitas real-time  
/dashboard/commits         → Daftar & detail commit  
/dashboard/pull-requests   → Daftar & detail PR  
/dashboard/issues          → Issue & task tracking  
/dashboard/repositories    → Daftar repo yang dipantau  
/dashboard/repositories/\[repo\] → Detail per repo  
/dashboard/reports         → Laporan harian/mingguan/bulanan \+ ekspor  
/dashboard/analytics       → Statistik & insight produktivitas  
/dashboard/calendar        → Tampilan kalender kontribusi

/accounts                  → Manajemen multi-akun GitHub (sisi developer)  
/accounts/connect          → Tambah/hubungkan akun GitHub baru

/settings                  → Pengaturan profil & visibilitas  
/settings/notifications    → Pengaturan notifikasi  
/admin                     → Panel admin (user, divisi, peran)

/admin/audit-log           → Riwayat akses (siapa melihat apa, kapan)

---

## **4\. Detail Fitur per Halaman**

### **4.1** /dashboard **— Overview**

* **Kartu ringkasan (KPI cards)**: total commit hari ini/minggu ini, PR open/merged, issue selesai, jumlah repo aktif.  
* **Grafik kontribusi** (heatmap ala GitHub contribution graph, gabungan semua akun).  
* **Aktivitas terbaru** (5–10 event terakhir: push, PR, review, comment).  
* **Status hari ini**: ringkasan otomatis "Hari ini: 8 commit di 2 repo, 1 PR merged".  
* Filter global: rentang tanggal, akun GitHub, repo, divisi.

### **4.2** /dashboard/activity **— Timeline Real-time**

* Feed kronologis semua event GitHub: push, PR opened/merged/closed, review, komentar, branch dibuat, release, dll.  
* Setiap item dapat diklik → detail (pesan commit, diff stats, link ke GitHub).  
* **Real-time** via webhook GitHub (data masuk tanpa refresh).  
* Pengelompokan per hari, dengan ringkasan harian otomatis.

### **4.3** /dashboard/commits

* Tabel commit: waktu, repo, branch, pesan, jumlah file berubah, **\+additions / −deletions**.  
* Filter: repo, branch, tanggal, akun.  
* Detail commit: daftar file yang diubah \+ statistik per file (tanpa harus menampilkan isi kode jika repo bersifat sensitif — bisa diatur).

### **4.4** /dashboard/pull-requests

* Daftar PR: status (open/merged/closed/draft), reviewer, durasi review, jumlah komentar.  
* Metrik: **lead time** (PR dibuka → merged), rasio PR merged vs closed.  
* Detail PR: deskripsi, linked issues, riwayat review.

### **4.5** /dashboard/issues

* Issue yang di-assign ke developer: status, label, milestone, estimasi vs aktual.  
* Bisa dipetakan sebagai "task list" — manajemen melihat ini sebagai daftar pekerjaan.

### **4.6** /dashboard/repositories **&** \[repo\]

* Daftar repo yang dipantau \+ toggle visibilitas (developer memilih mana yang dilaporkan).  
* Detail per repo: bahasa pemrograman, kontribusi developer di repo itu, grafik aktivitas, branch aktif, release terakhir.

### **4.7** /dashboard/reports **— Inti Pelaporan ⭐**

* **Laporan otomatis**: harian, mingguan, bulanan — digenerate dari data GitHub.  
* Isi laporan: ringkasan aktivitas, daftar pekerjaan selesai, PR merged, issue ditutup, highlight.  
* **Catatan manual developer**: kolom untuk konteks yang tidak terlihat di GitHub (meeting, riset, debugging lokal, blocker).  
* **Ekspor**: PDF / Excel / link share (untuk dikirim ke atasan).  
* Arsip laporan lama, dapat dicari.

### **4.8** /dashboard/analytics

* Tren produktivitas (grafik mingguan/bulanan).  
* Distribusi waktu kerja (jam aktif commit — *dengan disclaimer bahwa commit ≠ keseluruhan kerja*).  
* Breakdown per bahasa, per repo, per jenis aktivitas (coding vs review vs issue).  
* Perbandingan periode (bulan ini vs bulan lalu).

### **4.9** /accounts **— Manajemen Multi-Akun ⭐**

* Daftar akun GitHub yang terhubung (misal akun personal \+ akun kantor).  
* Status koneksi tiap akun (token aktif/expired).  
* Per akun: pilih repo/organisasi mana yang disinkronkan.  
* **Agregasi**: semua data dari banyak akun digabung menjadi satu identitas "developer" di dashboard.  
* Tombol sinkronisasi manual \+ indikator sinkronisasi terakhir.

### **4.10** /admin **& Audit Log**

* Kelola user, divisi, dan peran.  
* **Audit log**: catatan siapa (manajemen) mengakses laporan siapa dan kapan — penting untuk kepercayaan dua arah.

---

## **5\. Integrasi GitHub API (Konsep, Tanpa Kode)**

### **5.1 Autentikasi & Koneksi**

* **GitHub OAuth App** — developer login & memberi izin akses akun. Mendukung multi-akun (satu user dashboard ↔ banyak akun GitHub).  
* Alternatif yang lebih kuat: **GitHub App** — izin granular per repo, token lebih aman, rate limit lebih tinggi. *(Rekomendasi untuk produksi.)*  
* Token disimpan **terenkripsi** di database, dengan mekanisme refresh.

### **5.2 Strategi Pengambilan Data — Hybrid**

| Metode | Digunakan untuk | Sifat |
| ----- | ----- | ----- |
| **Webhook GitHub** | Push, PR, issue, review, release | Real-time (event masuk seketika) |
| **REST API** | Detail commit, file changes, daftar repo | On-demand / backfill |
| **GraphQL API** | Contribution graph, data agregat kompleks | Efisien, satu query banyak data |
| **Cron/Scheduled sync** | Rekonsiliasi data (jaga konsistensi), generate laporan harian | Terjadwal (misal tiap 6 jam \+ tiap tengah malam) |

### **5.3 Data yang Diambil**

* Commits (pesan, timestamp, diff stats, branch)  
* Pull Requests (status, review, durasi)  
* Issues (assignee, label, status)  
* Repositories (metadata, bahasa)  
* Events/Activity (push, fork, release, comment)  
* Contribution statistics

### **5.4 Hal Teknis yang Perlu Diperhatikan**

* **Rate limit**: 5.000 request/jam per token (REST). Solusi: caching, webhook-first, antrian (queue) untuk sync besar.  
* **Data disimpan di database sendiri** (bukan query GitHub setiap kali halaman dibuka) → dashboard cepat & punya riwayat sendiri meski data GitHub berubah/dihapus.  
* **Normalisasi multi-akun**: event dari akun berbeda diberi tag account\_id lalu diagregasi ke satu profil developer.

---

## **6\. Arsitektur Next.js (App Router)**

### **6.1 Lapisan Aplikasi**

Copy

┌─────────────────────────────────────────────┐  
│  CLIENT (Browser)                           │  
│  \- React Server Components (data berat)    │  
│  \- Client Components (chart, filter, live) │  
└──────────────────┬──────────────────────────┘  
                   │  
┌──────────────────▼──────────────────────────┐  
│  NEXT.JS (App Router)                       │  
│  \- Server Components → render data awal    │  
│  \- Route Handlers (/api/\*) → webhook,       │  
│    endpoint internal, ekspor laporan        │  
│  \- Server Actions → mutasi (settings, dll)  │  
│  \- Middleware → proteksi route \+ RBAC       │  
└──────┬───────────────────────┬──────────────┘  
       │                       │  
┌──────▼────────┐     ┌────────▼─────────────┐  
│  DATABASE     │     │  GITHUB              │  
│  (PostgreSQL) │     │  \- OAuth / GitHub App│  
│  \+ cache      │     │  \- REST / GraphQL    │  
│  (Redis,      │     │  \- Webhooks ────────►│ masuk ke /api/webhooks/github  
│   opsional)   │     └──────────────────────┘  
└───────────────┘  
       │  
┌──────▼────────────────────────┐  
│  BACKGROUND JOBS              │  
│  \- Cron: sync & laporan harian│  
│  \- Queue: backfill data besar │

└───────────────────────────────┘

### **6.2 Rekomendasi Komponen Stack**

| Lapisan | Pilihan | Alasan |
| ----- | ----- | ----- |
| Framework | Next.js 14+ (App Router) | RSC untuk performa, route handler untuk webhook |
| Auth | Auth.js (NextAuth) | Dukungan GitHub OAuth bawaan, mudah multi-provider |
| Database | PostgreSQL \+ Prisma/Drizzle | Relasional cocok untuk data commit/PR/issue |
| Cache | Redis (opsional) | Cache agregat & rate-limit handling |
| Real-time UI | SSE / polling ringan / Pusher | Update timeline tanpa refresh |
| Chart | Recharts / Chart.js | Heatmap & grafik tren |
| UI Kit | Tailwind CSS \+ shadcn/ui | Cepat, konsisten, profesional |
| Background job | Vercel Cron / BullMQ | Sync terjadwal & laporan otomatis |
| Hosting | Vercel / VPS | Sesuai kebijakan perusahaan |

### **6.3 Struktur Folder (Konseptual)**

Copy

app/  
├── (auth)/login  
├── (dashboard)/  
│   ├── dashboard/            → overview, activity, commits, dst.  
│   ├── accounts/  
│   ├── settings/  
│   └── admin/  
├── api/  
│   ├── webhooks/github/      → penerima event real-time  
│   ├── sync/                 → trigger sinkronisasi  
│   └── reports/export/       → generate PDF/Excel  
lib/  
├── github/                   → klien API, normalisasi data multi-akun  
├── auth/                     → konfigurasi auth & RBAC

└── reports/                  → logika generate laporan

### **6.4 Alur Data (End-to-End)**

1. Developer hubungkan akun GitHub → token tersimpan terenkripsi.  
2. **Backfill awal**: sistem menarik riwayat 30–90 hari ke database.  
3. **Webhook aktif**: setiap event baru masuk real-time ke database.  
4. **Cron tengah malam**: generate laporan harian otomatis.  
5. Manajemen membuka dashboard → data dirender dari database (cepat), timeline diperbarui live.  
6. Developer menambah catatan manual → laporan harian lengkap.  
7. Manajemen ekspor PDF bila perlu dokumentasi formal.

---

## **7\. Prinsip UI/UX**

* **Dua mode tampilan**: *Developer view* (kelola & lengkap) vs *Management view* (ringkas, fokus hasil, bahasa non-teknis — misal "menyelesaikan 3 fitur" bukan "merged 3 PRs").  
* **Hierarki informasi**: ringkasan dulu (KPI cards) → detail saat diklik (progressive disclosure).  
* **Dark/light mode** (developer biasanya suka dark, manajemen light).  
* **Responsif**: manajemen sering cek via HP.  
* **Empty state & loading skeleton** yang jelas saat sinkronisasi.  
* **Trust by design**: indikator "data terakhir disinkronkan pukul…", dan audit log agar transparansi berlaku dua arah.

