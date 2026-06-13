# 📘 Manual Proyek — V2 Beye Dev Report

> **Versi**: 2.0  
> **Terakhir Diperbarui**: 13 Juni 2026  
> **Stack**: Next.js 16 · Supabase · NextAuth v5 · TailwindCSS 4

---

## Daftar Isi

1. [Ringkasan Proyek](#1-ringkasan-proyek)
2. [Arsitektur Sistem](#2-arsitektur-sistem)
3. [Prasyarat](#3-prasyarat)
4. [Instalasi & Setup Lokal](#4-instalasi--setup-lokal)
5. [Konfigurasi Environment Variables](#5-konfigurasi-environment-variables)
6. [Database (Supabase)](#6-database-supabase)
7. [Autentikasi & Role](#7-autentikasi--role)
8. [Fitur Utama](#8-fitur-utama)
9. [Integrasi GitHub](#9-integrasi-github)
10. [Mekanisme Sinkronisasi Data](#10-mekanisme-sinkronisasi-data)
11. [Setup GitHub Webhook](#11-setup-github-webhook)
12. [Setup Cron Job](#12-setup-cron-job)
13. [Supabase Realtime](#13-supabase-realtime)
14. [Struktur API Routes](#14-struktur-api-routes)
15. [Deployment ke Vercel](#15-deployment-ke-vercel)
16. [Troubleshooting](#16-troubleshooting)

---

## 1. Ringkasan Proyek

**V2 Beye Dev Report** adalah platform pelaporan kerja developer internal untuk **Mili Cipta Karya (MCK)**. Sistem ini mengagregasi aktivitas GitHub (commits, pull requests, issues) secara otomatis dan menggabungkannya dengan catatan manual developer untuk menghasilkan laporan kerja harian/mingguan/bulanan yang dapat diakses oleh manajemen secara real-time.

### Alur Kerja Utama

```
Developer push code ke GitHub
        ↓
GitHub Webhook → API Server → Supabase Database
        ↓
Supabase Realtime → Dashboard Manager (update instan)
```

**Developer tidak perlu klik sinkronisasi manual.** Semua data mengalir otomatis.

---

## 2. Arsitektur Sistem

```
┌──────────────┐     Webhook     ┌─────────────────────┐
│   GitHub API  │ ──────────────→│  /api/webhooks/github│
│               │                │  (push, PR, issues)  │
└───────┬───────┘                └──────────┬──────────┘
        │                                  │
        │  REST API (backup sync)          │ Upsert ke DB
        │                                  ↓
        │                         ┌────────────────┐
        │                         │    Supabase     │
        │ ← fetch commits/PRs ── │  PostgreSQL DB  │
        │                         │  + Realtime     │
        │                         └───────┬────────┘
        │                                 │
┌───────┴──────────┐              Realtime WS
│  /api/reports    │                      │
│  /api/repos/sync │                      ↓
│  /api/cron/sync  │            ┌──────────────────┐
└──────────────────┘            │   Dashboard UI    │
                                │  (Next.js Client) │
                                └──────────────────┘
```

---

## 3. Prasyarat

| Software | Versi Minimum | Keterangan |
|----------|--------------|------------|
| Node.js  | 18.x+        | Disarankan gunakan LTS terbaru |
| npm      | 9.x+         | Termasuk bersama Node.js |
| Git      | 2.x+         | Untuk version control |

### Akun Layanan yang Dibutuhkan

- **Supabase** — Database & Realtime ([supabase.com](https://supabase.com))
- **GitHub** — Personal Access Token untuk integrasi repo
- **Vercel** *(opsional)* — Untuk deployment dan cron jobs

---

## 4. Instalasi & Setup Lokal

```bash
# 1. Clone repository
git clone <repo-url>
cd "V2 Beye Dev Report"

# 2. Install dependencies
npm install

# 3. Salin template environment
# (Lihat bagian 5 untuk isi lengkap)
cp .env.example .env.local

# 4. Jalankan migration database di Supabase SQL Editor
# (Lihat bagian 6)

# 5. Jalankan development server
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000`.

---

## 5. Konfigurasi Environment Variables

Buat file `.env.local` di root proyek. Berikut semua variabel yang diperlukan:

### 🔵 Supabase

```env
# URL dan Key dari Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIs..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIs..."

# Connection string PostgreSQL (dari Supabase Dashboard → Settings → Database)
DATABASE_URL="postgresql://postgres:<password>@db.xxxxx.supabase.co:5432/postgres"
```

> [!IMPORTANT]
> `SUPABASE_SERVICE_ROLE_KEY` membypass Row Level Security. **Jangan pernah expose ke client-side.**

### 🟢 Enkripsi

```env
# Kunci AES-256 untuk mengenkripsi GitHub Personal Access Token
# WAJIB tepat 32 karakter (alfanumerik)
DATA_ENCRYPTION_KEY="d268ddbfee547166bf82e852024a07f9"
```

> [!CAUTION]
> Jika `DATA_ENCRYPTION_KEY` diubah setelah token sudah tersimpan, **semua token lama tidak bisa didekripsi**. Developer harus menghubungkan kembali akun GitHub mereka.

### 🟡 NextAuth

```env
# Secret untuk signing JWT — generate dengan: openssl rand -hex 16
AUTH_SECRET="764c24385fe35099307df9ee432bb64d"
NEXTAUTH_URL="http://localhost:3000"
```

### 🔴 Kredensial Login

```env
# Akun Developer
DEV_EMAIL="developer@perusahaan.com"
DEV_PASSWORD="password-kuat-di-sini"

# Akun Manajemen
MGR_EMAIL="manager@perusahaan.com"
MGR_PIN="83708370"
```

### 🟣 GitHub OAuth *(Opsional)*

```env
# Dibutuhkan hanya jika ingin mengaktifkan fitur "Login dengan GitHub"
# Buat di: https://github.com/settings/developers → OAuth Apps
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
```

### ⚙️ GitHub Webhook Secret

```env
# Secret untuk memverifikasi signature webhook dari GitHub
# Generate dengan: openssl rand -hex 20
# HARUS sama persis dengan yang diisi di GitHub Webhook settings
GITHUB_WEBHOOK_SECRET=""
```

**Cara membuat secret:**

```bash
# Linux/Mac
openssl rand -hex 20

# Windows (PowerShell)
-join ((1..40) | ForEach-Object { '{0:x}' -f (Get-Random -Max 16) })

# Atau gunakan generator online: https://generate-secret.vercel.app/40
```

> [!NOTE]
> Jika `GITHUB_WEBHOOK_SECRET` dikosongkan, webhook **tetap berfungsi** tetapi **tidak memverifikasi signature** — tidak aman untuk production!

### ⏰ Cron Job Secret

```env
# Secret untuk otorisasi endpoint cron sync (/api/cron/sync)
# Mencegah pihak luar memicu sinkronisasi tanpa izin
# Generate dengan: openssl rand -hex 20
CRON_SECRET=""
```

**Cara kerja:**
- Endpoint `/api/cron/sync` memeriksa header `Authorization: Bearer <CRON_SECRET>`
- Jika `CRON_SECRET` dikosongkan di `.env.local`, endpoint bisa diakses **tanpa otorisasi** (hanya untuk development)
- Di production, **WAJIB** diisi

### 🕐 Timezone

```env
TZ="Asia/Jakarta"
```

---

## 6. Database (Supabase)

### 6.1 Menjalankan Migrasi

Buka **Supabase Dashboard → SQL Editor** dan jalankan file migrasi secara berurutan:

| # | File | Deskripsi |
|---|------|-----------|
| 1 | `supabase/migrations/00001_devreport_schema.sql` | Schema 8 tabel + RLS policies |
| 2 | `supabase/migrations/00002_add_indexes.sql` | Index tambahan untuk performa |
| 3 | `supabase/migrations/00003_enable_realtime.sql` | Aktifkan Realtime untuk 4 tabel |

### 6.2 Skema Tabel

```
master_user            ← User (Developer / Manajemen / Admin)
  └── github_accounts  ← Akun GitHub terenkripsi (multi-akun)
        └── monitored_repositories  ← Repo yang dipantau
              ├── commits            ← Data commit dari GitHub
              ├── pull_requests      ← Data PR dari GitHub
              └── issues             ← Data issues dari GitHub

work_reports           ← Laporan kerja manual + auto-summary
admin_audit_logs       ← Log audit akses manajemen
```

### 6.3 Mengaktifkan Realtime

Jalankan migration `00003_enable_realtime.sql`, atau aktifkan secara manual:

1. Buka **Supabase Dashboard → Database → Replication**
2. Cari bagian **"Source"** dan klik tabel berikut untuk mengaktifkan replication:
   - `commits`
   - `pull_requests`
   - `issues`
   - `work_reports`
3. Pastikan toggle **"Enabled"** menyala untuk keempatnya

Atau via SQL:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE commits;
ALTER PUBLICATION supabase_realtime ADD TABLE pull_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE issues;
ALTER PUBLICATION supabase_realtime ADD TABLE work_reports;
```

> [!WARNING]
> Tanpa mengaktifkan replication, **dashboard tidak akan update real-time**. Pastikan langkah ini tidak terlewat.

---

## 7. Autentikasi & Role

Sistem menggunakan **NextAuth v5** dengan dua provider:

### 7.1 Credentials Provider (Aktif)

| Role | Login Dengan | Redirect |
|------|-------------|----------|
| **Developer** | Email + Passkey (password) | `/dashboard/reports` |
| **Manajemen** | PIN Akses | `/dashboard/reports` |

### 7.2 GitHub OAuth Provider (Belum Aktif)

Untuk mengaktifkan login via GitHub:
1. Buat OAuth App di [GitHub Developer Settings](https://github.com/settings/developers)
2. Set **Authorization callback URL**: `https://domain-anda.com/api/auth/callback/github`
3. Isi `GITHUB_CLIENT_ID` dan `GITHUB_CLIENT_SECRET` di `.env.local`

### 7.3 Perbedaan Akses per Role

| Fitur | Developer | Manajemen | Admin |
|-------|-----------|-----------|-------|
| Melihat commit/PR sendiri | ✅ | — | — |
| Menulis catatan manual & blocker | ✅ | — | — |
| Submit laporan | ✅ | — | — |
| Melihat semua laporan | — | ✅ | ✅ |
| Melihat progres semua repo | — | ✅ | ✅ |
| Melihat bug/issues aktif | — | ✅ | ✅ |
| Export PDF/Excel | ✅ | ✅ | ✅ |
| Mengelola user | — | — | ✅ |

---

## 8. Fitur Utama

### 8.1 Dashboard Developer
- Melihat daftar commit terbaru dari repo yang terhubung
- Melihat daftar pull request (open/merged/closed)
- Menulis catatan kerja manual (meeting, riset, koordinasi)
- Mencatat blocker/kendala
- Submit laporan ke manajemen
- Export laporan ke PDF (print) atau Excel (CSV)

### 8.2 Dashboard Manajemen
- Overview Sprint aktif dengan progress bar
- Galeri repositori aktif dengan detail commit per repo
- Daftar issues & tasks aktif
- Feed laporan developer yang sudah disubmit
- Ekspansi detail commit & PR per developer
- Milestone timeline
- Export seluruh data ke CSV

### 8.3 Halaman Akun GitHub (`/accounts`)
- Hubungkan akun GitHub dengan Personal Access Token
- Token dienkripsi AES-256 sebelum disimpan
- Multi-akun GitHub per developer
- Toggle visibilitas repositori (repo mana yang dipantau)
- Sinkronisasi manual per repositori

---

## 9. Integrasi GitHub

### 9.1 Membuat Personal Access Token (PAT)

1. Buka [github.com/settings/tokens](https://github.com/settings/tokens)
2. Klik **"Generate new token (classic)"**
3. Berikan nama, misal: `MCK-DevReport`
4. Pilih scope:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `read:user` (Read user profile data)
5. Klik **Generate token** dan salin
6. Di aplikasi, buka halaman **Akun** → Tempel token → **Hubungkan**

> [!CAUTION]
> Token hanya ditampilkan **satu kali** oleh GitHub. Simpan cadangannya di tempat aman. Token akan dienkripsi AES-256 di database.

### 9.2 Data yang Disinkronkan

| Data | Endpoint GitHub | Frekuensi |
|------|----------------|-----------|
| Commits | `GET /repos/{owner}/{repo}/commits` | Auto-sync (5 menit) + Webhook |
| Pull Requests | `GET /repos/{owner}/{repo}/pulls` | Auto-sync (5 menit) + Webhook |
| Issues | `GET /repos/{owner}/{repo}/issues` | Auto-sync (5 menit) + Webhook |
| Repo Metadata | `GET /repos/{owner}/{repo}` | Setiap sync (untuk `default_branch`) |
| Commit Stats | `GET /repos/{owner}/{repo}/commits/{sha}` | 5–10 commit terbaru per sync |

---

## 10. Mekanisme Sinkronisasi Data

Sistem menggunakan **4 lapisan sinkronisasi** untuk keandalan maksimum:

```
Lapisan 1: GitHub Webhook         → Real-time (instan, <1 detik)
Lapisan 2: Supabase Realtime      → Dashboard auto-refresh (WebSocket)
Lapisan 3: Auto-Sync on Page Load → Backup saat webhook terlewat (cooldown 5 menit)
Lapisan 4: Cron Job Berkala       → Rekonsiliasi periodik (setiap 15-60 menit)
```

### Alur Data Lengkap

1. **Developer push code** ke GitHub
2. **GitHub mengirim webhook** ke `/api/webhooks/github`
3. Webhook handler **menyimpan data** ke Supabase (commits/PRs/issues)
4. Supabase **memancarkan event Realtime** ke semua client yang terhubung
5. Dashboard **auto-refresh** tanpa reload halaman (debounce 2 detik)

**Fallback jika webhook gagal:**
- Saat user membuka dashboard, `autoSyncRepoIfNeeded()` mengecek apakah repo sudah disync dalam 5 menit terakhir
- Jika belum, fetch data terbaru dari GitHub API
- Cron job berjalan periodik untuk memastikan tidak ada data yang terlewat

---

## 11. Setup GitHub Webhook

Webhook memungkinkan GitHub mengirim notifikasi real-time ke aplikasi saat ada perubahan. **Ini adalah mekanisme sinkronisasi utama.**

### 11.1 Prasyarat

- Aplikasi harus dapat diakses publik (sudah di-deploy, atau gunakan tunnel seperti `ngrok` untuk lokal)
- `GITHUB_WEBHOOK_SECRET` sudah diisi di `.env.local`

### 11.2 Langkah Konfigurasi

1. **Buka repository** di GitHub yang ingin dipantau
2. Navigasi ke **Settings → Webhooks → Add webhook**
3. Isi form:

| Field | Nilai |
|-------|-------|
| **Payload URL** | `https://domain-anda.com/api/webhooks/github` |
| **Content type** | `application/json` |
| **Secret** | *(Isi dengan nilai `GITHUB_WEBHOOK_SECRET` yang sama persis)* |
| **Which events** | Pilih **"Let me select individual events"** |

4. Centang event berikut:
   - ✅ **Pushes** — Sinkronisasi commit baru
   - ✅ **Pull requests** — Sinkronisasi PR (open/merged/closed)
   - ✅ **Issues** — Sinkronisasi issues/tasks

5. Pastikan **"Active"** tercentang
6. Klik **Add webhook**

### 11.3 Verifikasi Webhook

Setelah dibuat, GitHub akan mengirim ping event. Cek di tab **"Recent Deliveries"**:
- ✅ **Response 200** → Webhook berhasil terhubung
- ❌ **Response 401** → `GITHUB_WEBHOOK_SECRET` tidak cocok
- ❌ **Response 500** → Cek log server untuk error

### 11.4 Testing Lokal dengan ngrok

```bash
# 1. Install ngrok
npm install -g ngrok

# 2. Jalankan aplikasi lokal
npm run dev

# 3. Buat tunnel
ngrok http 3000

# 4. Gunakan URL ngrok sebagai Payload URL di GitHub Webhook
# Contoh: https://abc123.ngrok-free.app/api/webhooks/github
```

> [!NOTE]
> Untuk setiap repository yang ingin dipantau real-time, webhook harus dikonfigurasi **secara terpisah** di masing-masing repository GitHub.

### 11.5 Keamanan Webhook

Webhook menggunakan **HMAC SHA-256 signature verification**:
- GitHub menandatangani setiap payload dengan secret yang Anda berikan
- Server memverifikasi signature menggunakan `crypto.timingSafeEqual()`
- Request dengan signature tidak valid ditolak dengan **401 Unauthorized**

---

## 12. Setup Cron Job

Cron job berfungsi sebagai **lapisan rekonsiliasi cadangan** — memastikan data tetap sinkron meskipun webhook terlewat atau gagal.

### 12.1 Endpoint

```
GET /api/cron/sync
Authorization: Bearer <CRON_SECRET>
```

**Perilaku:**
- Mengambil semua `monitored_repositories` yang `is_visible = true`
- Memaksa sync (bypass cooldown 5 menit)
- Menjalankan semua repo secara paralel dengan `Promise.allSettled`
- Jika satu repo gagal, repo lain tetap disinkronkan

### 12.2 Setup di Vercel (Direkomendasikan)

Buat file `vercel.json` di root proyek:

```json
{
  "crons": [
    {
      "path": "/api/cron/sync",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

> **Penjelasan schedule**: `*/15 * * * *` = Setiap 15 menit.

Vercel Cron secara otomatis mengirim request GET ke endpoint tersebut sesuai jadwal.

**Untuk keamanan**, set `CRON_SECRET` di Vercel:
1. Buka **Vercel Dashboard → Project → Settings → Environment Variables**
2. Tambahkan: `CRON_SECRET` = `<nilai-secret-anda>`

> [!IMPORTANT]
> Vercel Cron pada plan **Hobby** (gratis) hanya mendukung cron **sekali per hari**. Plan **Pro** mendukung hingga **setiap 1 menit**. Sesuaikan jadwal dengan plan Anda.

### 12.3 Setup Manual (Non-Vercel)

Jika tidak menggunakan Vercel, gunakan scheduler eksternal:

**Opsi A — crontab (Linux/Mac):**
```bash
# Edit crontab
crontab -e

# Tambahkan baris (setiap 15 menit):
*/15 * * * * curl -s -H "Authorization: Bearer YOUR_CRON_SECRET" https://domain-anda.com/api/cron/sync
```

**Opsi B — Task Scheduler (Windows):**
```powershell
# Buat scheduled task via PowerShell
$action = New-ScheduledTaskAction -Execute "curl.exe" -Argument '-s -H "Authorization: Bearer YOUR_CRON_SECRET" https://domain-anda.com/api/cron/sync'
$trigger = New-ScheduledTaskTrigger -RepetitionInterval (New-TimeSpan -Minutes 15) -Once -At (Get-Date)
Register-ScheduledTask -Action $action -Trigger $trigger -TaskName "DevReport-CronSync"
```

**Opsi C — GitHub Actions:**
```yaml
# .github/workflows/cron-sync.yml
name: Cron Sync
on:
  schedule:
    - cron: '*/15 * * * *'
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger sync
        run: |
          curl -s -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://domain-anda.com/api/cron/sync
```

### 12.4 Memverifikasi Cron Job

```bash
# Test manual via curl
curl -v -H "Authorization: Bearer YOUR_CRON_SECRET" https://domain-anda.com/api/cron/sync
```

**Response sukses:**
```json
{
  "success": true,
  "message": "Cron sync completed. 3 succeeded, 0 failed.",
  "timestamp": "2026-06-13T12:00:00.000Z"
}
```

**Response gagal (secret salah):**
```json
{
  "error": "Unauthorized"
}
```

---

## 13. Supabase Realtime

Dashboard menggunakan **Supabase Realtime (postgres_changes)** untuk update instan tanpa polling.

### Cara Kerja

```
Webhook → Supabase INSERT/UPDATE → Realtime Event → Dashboard auto-refresh
```

Dashboard men-subscribe ke perubahan di 4 tabel:
- `commits`
- `pull_requests`
- `issues`
- `work_reports`

Setiap kali ada perubahan, dashboard memanggil `fetchReportData()` dengan **debounce 2 detik** (menghindari flood saat batch upsert).

### Aktivasi

Pastikan Supabase Realtime sudah diaktifkan (lihat [Bagian 6.3](#63-mengaktifkan-realtime)).

---

## 14. Struktur API Routes

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| `GET` | `/api/reports?type=daily` | ✅ Session | Ambil data laporan (commits, PRs, issues, stats) |
| `POST` | `/api/reports` | ✅ Session | Simpan/submit laporan kerja developer |
| `GET` | `/api/accounts` | ✅ Session | Daftar akun GitHub + repo yang terhubung |
| `POST` | `/api/accounts` | ✅ Session | Hubungkan akun GitHub baru (dengan PAT) |
| `DELETE` | `/api/accounts` | ✅ Session | Hapus akun GitHub |
| `POST` | `/api/repos/sync` | ✅ Session | Sinkronisasi manual per repo |
| `POST` | `/api/webhooks/github` | 🔑 HMAC | Menerima event webhook dari GitHub |
| `GET` | `/api/cron/sync` | 🔑 Bearer | Cron job sinkronisasi semua repo |
| `*` | `/api/auth/*` | — | NextAuth endpoints |

> [!NOTE]
> Route `/api/webhooks/*` dan `/api/cron/*` **tidak memerlukan session login**. Mereka di-bypass dari middleware auth dan menggunakan mekanisme keamanan sendiri (HMAC signature / Bearer token).

---

## 15. Deployment ke Vercel

### 15.1 Langkah Deploy

```bash
# 1. Push ke GitHub
git add .
git commit -m "Production ready"
git push origin main

# 2. Import di Vercel
# → vercel.com → New Project → Import dari GitHub

# 3. Set Environment Variables di Vercel Dashboard
# → Settings → Environment Variables → Tambahkan semua variabel dari .env.local
```

### 15.2 Checklist Production

- [ ] Semua environment variables sudah diisi di Vercel
- [ ] `GITHUB_WEBHOOK_SECRET` diisi dan cocok dengan setting di GitHub
- [ ] `CRON_SECRET` diisi dan kuat (min. 20 karakter hex)
- [ ] `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` diisi jika pakai OAuth
- [ ] `DATA_ENCRYPTION_KEY` **sama** dengan yang digunakan saat menyimpan token
- [ ] `NEXTAUTH_URL` diubah ke domain production
- [ ] `NEXT_PUBLIC_APP_URL` diubah ke domain production
- [ ] Supabase Realtime replication sudah diaktifkan untuk 4 tabel
- [ ] GitHub Webhook sudah dikonfigurasi di setiap repo yang dipantau
- [ ] `vercel.json` sudah dibuat untuk cron schedule

### 15.3 Contoh `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/sync",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

---

## 16. Troubleshooting

### Webhook tidak menerima event

| Gejala | Penyebab | Solusi |
|--------|----------|-------|
| Response 401 di GitHub Deliveries | Secret tidak cocok | Pastikan `GITHUB_WEBHOOK_SECRET` di `.env.local` sama persis dengan di GitHub Webhook settings |
| Response 500 | `supabaseAdmin` null | Pastikan `SUPABASE_SERVICE_ROLE_KEY` diisi di environment |
| Tidak ada delivery | URL salah / tidak publik | Pastikan Payload URL benar dan server bisa diakses dari internet |

### Dashboard tidak update real-time

| Gejala | Penyebab | Solusi |
|--------|----------|-------|
| Data tidak berubah meski ada push | Realtime belum aktif | Jalankan migration `00003_enable_realtime.sql` |
| Update terlambat ~2 detik | Debounce normal | Ini disengaja untuk mencegah flood saat batch upsert |
| Console error WebSocket | Supabase URL/key salah | Periksa `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

### additions/deletions selalu 0

| Gejala | Penyebab | Solusi |
|--------|----------|-------|
| Commit lama tetap 0 | Stats hanya diambil untuk 5-10 commit terbaru | Jalankan manual sync untuk re-fetch |
| Semua commit 0 | Token tidak punya akses `repo` | Pastikan PAT memiliki scope `repo` |

### Token decryption gagal

| Gejala | Penyebab | Solusi |
|--------|----------|-------|
| Error "Gagal mendekripsi token" | `DATA_ENCRYPTION_KEY` berubah | Developer harus menghubungkan kembali akun GitHub di halaman Akun |

### Cron job gagal

| Gejala | Penyebab | Solusi |
|--------|----------|-------|
| Response 401 | `CRON_SECRET` salah/tidak ada | Pastikan header `Authorization: Bearer <secret>` dikirim |
| Response 500 | Database error | Periksa log server untuk detail error |
| Tidak jalan di Vercel | Plan Hobby limitasi | Upgrade ke Pro atau gunakan scheduler eksternal |

---

## Lampiran: Struktur Direktori Proyek

```
V2 Beye Dev Report/
├── .env.local                          ← Environment variables (JANGAN commit!)
├── next.config.ts                      ← Konfigurasi Next.js
├── package.json                        ← Dependencies
├── vercel.json                         ← Cron job config (buat manual)
├── supabase/
│   └── migrations/
│       ├── 00001_devreport_schema.sql  ← Schema database + RLS
│       ├── 00002_add_indexes.sql       ← Index tambahan
│       └── 00003_enable_realtime.sql   ← Aktifkan Realtime
└── src/
    ├── auth.ts                         ← Konfigurasi NextAuth v5
    ├── middleware.ts                    ← Auth middleware (bypass webhook & cron)
    ├── lib/
    │   ├── crypto.ts                   ← Enkripsi/dekripsi AES-256
    │   ├── supabase.ts                 ← Client Supabase (anon + admin)
    │   └── user.ts                     ← Helper getOrCreateUser
    ├── types/
    │   └── report.ts                   ← TypeScript interfaces
    ├── components/
    │   ├── layout/
    │   │   └── DashboardLayout.tsx     ← Layout utama dengan sidebar
    │   ├── reports/
    │   │   ├── DeveloperDashboard.tsx  ← UI dashboard developer
    │   │   ├── ManagementDashboard.tsx ← UI dashboard manajemen
    │   │   └── StarRating.tsx          ← Komponen rating bintang
    │   └── Providers.tsx               ← SessionProvider wrapper
    └── app/
        ├── page.tsx                    ← Halaman login
        ├── layout.tsx                  ← Root layout
        ├── globals.css                 ← Styling global
        ├── accounts/
        │   └── page.tsx               ← Halaman kelola akun GitHub
        ├── dashboard/
        │   └── reports/
        │       └── page.tsx           ← Dashboard laporan (Developer & Manager)
        └── api/
            ├── auth/[...nextauth]/    ← NextAuth API routes
            ├── accounts/route.ts      ← CRUD akun GitHub
            ├── reports/route.ts       ← GET/POST laporan + auto-sync
            ├── repos/sync/route.ts    ← Sinkronisasi manual per repo
            ├── webhooks/github/
            │   └── route.ts           ← Webhook handler real-time
            └── cron/sync/
                └── route.ts           ← Cron job endpoint
```
