# Sistem Desain — Mili Cipta Karya DevReport

> **PANDUAN RETRIEVAL HIERARKIS:**
> 1. Saat membangun halaman spesifik (misal: `/dashboard/commits`), selalu periksa terlebih dahulu apakah ada file override di `design-system/mili-cipta-karya-devreport/pages/[nama-halaman].md`.
> 2. Jika ada, ikuti aturan override di file tersebut. Jika tidak, ikuti aturan di dokumen **MASTER.md** ini secara ketat.

---

## 1. Gambaran Umum Proyek
* **Nama Proyek**: Mili Cipta Karya DevReport (DevReport)
* **Deskripsi**: Dashboard pelaporan kerja otomatis terintegrasi GitHub untuk developer dan manajemen.
* **Pendekatan Estetika**: **Bento Box Grid** dengan **Soft UI Evolution** (Hybrid Soft Depth).
* **Konsep Utama**: **Dual-Theme & Dual-View UI**
  * **Developer View (Dark Mode by default)**: Fokus pada efisiensi, data teknis detail, nuansa IDE/Terminal yang presisi namun bersih (bukan cyberpunk dystopian yang kasar).
  * **Management View (Light Mode by default)**: Fokus pada ringkasan KPI, visualisasi tren, bahasa non-teknis, dan keterbacaan tingkat tinggi di layar laptop maupun mobile.

---

## 2. Palet Warna (Tailwind & CSS Variables)

Aplikasi ini menggunakan warna dasar bertema slate dengan aksen hijau emerald untuk merepresentasikan integrasi dan status sukses (seperti commit/push/merge).

### A. Developer View (Dark Mode - Default)
| Peran Warna | Hex Code | Variabel CSS | Deskripsi |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | `#090D16` | `--color-bg` | Latar belakang utama halaman gelap pekat. |
| **Card Background** | `#121824` | `--color-card` | Latar belakang card bento (warna solid). |
| **Card Border** | `#1E293B` | `--color-border` | Batas card halus (slate-800). |
| **Primary Text** | `#F8FAFC` | `--color-text-primary` | Keterbacaan teks utama (slate-50). |
| **Secondary Text** | `#94A3B8` | `--color-text-secondary`| Teks deskripsi/keterangan (slate-400). |
| **Accent Primary (Success)**| `#10B981` | `--color-accent-success`| Aksen hijau emerald (merge, active, success). |
| **Accent Secondary (Info)**| `#6366F1` | `--color-accent-info` | Aksen indigo (commits, branches, push events). |
| **Accent Alert (Warning)** | `#F59E0B` | `--color-accent-warning`| Aksen amber orange (issues open, blockers). |

### B. Management View (Light Mode)
| Peran Warna | Hex Code | Variabel CSS | Deskripsi |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | `#F8FAFC` | `--color-bg` | Latar belakang halaman terang dan bersih (slate-50). |
| **Card Background** | `#FFFFFF` | `--color-card` | Latar belakang card bento putih bersih. |
| **Card Border** | `#E2E8F0` | `--color-border` | Batas card abu-abu halus (slate-200). |
| **Primary Text** | `#0F172A` | `--color-text-primary` | Keterbacaan teks utama (slate-900). |
| **Secondary Text** | `#475569` | `--color-text-secondary`| Teks deskripsi/keterangan (slate-600). |
| **Accent Primary (Success)**| `#059669` | `--color-accent-success`| Hijau emerald kontras tinggi (safe for accessibility). |
| **Accent Secondary (Info)**| `#4F46E5` | `--color-accent-info` | Indigo kontras tinggi. |
| **Accent Alert (Warning)** | `#D97706` | `--color-accent-warning`| Amber kontras tinggi. |

---

## 3. Tipografi

Untuk menyeimbangkan nuansa teknis developer dan profesionalitas manajemen, kita menggunakan kombinasi font sans-serif modern dengan monospace premium.

* **Heading & Monospace Elements (SHA, Commits, Code, Numbers)**: **`JetBrains Mono`**
  * *Alasan*: Font monospace terbaik untuk membaca pesan commit, statistik tambahan `+additions / -deletions`, dan visualisasi angka.
* **Body Text, Labels, UI Elements**: **`Inter`** atau **`Plus Jakarta Sans`**
  * *Alasan*: Sangat bersih, keterbacaan tinggi pada ukuran kecil, dan terlihat modern pada layar dashboard.

**CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
```

**Penerapan Kelas Tailwind:**
* Font UI/Body: `font-sans` (Inter)
* Font Teknis/Angka: `font-mono` (JetBrains Mono)

---

## 4. Sistem Layout: Bento Box Grid

Tata letak halaman utama (`/dashboard`) harus menggunakan pendekatan **Bento Box Grid** dengan properti berikut:
1. **Asymmetric Spanning**:
   - Card KPI Utama (Total Commit, PR, Active Repos) menggunakan ukuran kecil (`col-span-1` atau `col-span-2`).
   - Contribution Heatmap menggunakan card lebar (`col-span-4` atau `col-span-full`).
   - Timeline Aktivitas & Ringkasan Laporan Harian diletakkan bersandingan (`col-span-2` dan `col-span-2`).
2. **Spacing & Gaps**:
   - Gunakan `gap-4` (16px) untuk resolusi tablet ke atas.
   - Gunakan `gap-3` (12px) untuk tampilan mobile (di mana bento grid akan otomatis mengalir menjadi 1 kolom vertikal).
3. **Rounded Corners & Borders**:
   - Sudut kartu bento menggunakan `rounded-2xl` (16px) untuk memberikan kesan modern, bersahabat, dan *soft*.
   - Setiap kartu harus memiliki batas border super tipis (`border border-slate-800` di mode gelap, `border border-slate-200` di mode terang).

---

## 5. Spesifikasi Komponen & Efek Visual

### A. Bento Cards (Soft Depth)
Kartu bento tidak boleh terlihat datar (flat), tetapi juga tidak boleh menggunakan shadow yang terlalu tebal dan kotor.
```css
/* Mode Gelap (Developer) */
.bento-card-dark {
  background-color: #121824;
  border: 1px solid #1E293B;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -2px rgba(0, 0, 0, 0.2);
  transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1);
}

.bento-card-dark:hover {
  border-color: #334155;
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -4px rgba(0, 0, 0, 0.3);
}

/* Mode Terang (Management) */
.bento-card-light {
  background-color: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.05), 0 2px 4px -2px rgba(15, 23, 42, 0.05);
  transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1);
}

.bento-card-light:hover {
  border-color: #CBD5E1;
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.08);
}
```

### B. Floating Navbar
Sesuai prinsip desain modern:
* Letakkan navbar melayang (floating) dengan kelas CSS `fixed top-4 left-4 right-4 z-50`.
* Tambahkan efek kaca (`backdrop-blur-md bg-opacity-80`) untuk memberikan kedalaman visual yang premium.

### C. Hover State pada Klik
Semua tombol, link repo, dan item timeline yang dapat diklik **wajib** memiliki:
* `cursor-pointer`
* Efek transisi warna/shadow dengan kelas `transition-all duration-200 ease-in-out`
* Untuk card atau badge, tambahkan sedikit scale mikro: `hover:scale-[1.01]`

---

## 6. Anti-Patterns (Aturan Larangan)

Demi menjaga kualitas visual yang tetap premium dan profesional:
* ❌ **Jangan menggunakan emoji sebagai ikon UI utama** (misal: menggunakan 🚀 untuk push, 📁 untuk repo). **Wajib** gunakan ikon SVG dari pustaka yang konsisten (seperti Lucide React atau Heroicons).
* ❌ **Jangan menggunakan warna neon yang terlalu mencolok pada teks panjang** di mode gelap karena merusak keterbacaan (gunakan warna teks `#F8FAFC` or `#94A3B8`). Aksen warna neon hanya untuk badge kecil, lampu indikator status, atau chart border.
* ❌ **Jangan biarkan scrollbar horizontal muncul di mobile screen**. Grid harus responsif (`grid-cols-1 md:grid-cols-2 lg:grid-cols-4`).
* ❌ **Jangan menyembunyikan status loading**. Setiap card bento yang membutuhkan waktu untuk memuat data (fetching GitHub API) **wajib** menggunakan *skeleton loading effect* (efek kilau abu-abu mengalir).

---

## 7. Pre-Delivery Checklist (Daftar Periksa Akhir)

Sebelum menyerahkan kode UI dashboard, pastikan poin-poin berikut telah terpenuhi:

- [ ] **Aksesibilitas Kontras Teks**: Kontras rasio teks terhadap latar belakang minimal 4.5:1 untuk teks biasa dan 3:1 untuk teks besar (memenuhi standar WCAG AA).
- [ ] **Responsivitas Grid**: Diuji pada lebar layar `375px` (mobile), `768px` (tablet), `1024px` (laptop kecil), dan `1440px` (desktop).
- [ ] **Ikon SVG Konsisten**: Semua ikon berasal dari Lucide React / Heroicons. Tidak ada campuran gaya ikon (outline vs solid harus konsisten).
- [ ] **Indikator Sync Terakhir**: Terdapat penunjuk waktu kapan data GitHub terakhir kali disinkronkan di pojok dashboard.
- [ ] **Indikator Interaksi**: Tombol dan item list memiliki style hover yang jelas dan responsive, serta transisi animasi minimal 150ms.
- [ ] **Floating Navbar Safe-Zone**: Ruang atas halaman (`pt-24`) sudah diatur agar konten utama tidak tertutup navbar yang melayang.
