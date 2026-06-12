"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface CommitItem {
  sha: string;
  msg: string;
  repo: string;
  additions: number;
  deletions: number;
}

interface PRItem {
  number: number;
  title: string;
  repo: string;
  state: "merged" | "open" | "closed";
}

export default function ReportsPage() {
  const { data: session } = useSession();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [reportType, setReportType] = useState<"daily" | "weekly" | "monthly">("daily");

  // Set theme otomatis berdasarkan role pengguna
  useEffect(() => {
    if (session?.user) {
      const role = (session.user as any).role;
      if (role === "Manajemen") {
        setTheme("light");
      } else {
        setTheme("dark");
      }
    }
  }, [session]);
  
  // State input catatan manual developer
  const [manualNotes, setManualNotes] = useState(
    "1. Melakukan koordinasi pagi (Daily Standup) terkait migrasi database.\n2. Riset implementasi enkripsi AES-256 pada level Supabase PostgreSQL.\n3. Optimasi performa loading data timeline dengan caching local state."
  );
  const [blockers, setBlockers] = useState("Tidak ada kendala berarti hari ini.");
  
  // State untuk melacak status ekspor
  const [isExporting, setIsExporting] = useState<"none" | "pdf" | "excel" | "share">("none");

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Mock data commits hari ini
  const commits: CommitItem[] = [
    { sha: "394016c2", msg: "feat: implement multi-step registration form with client-side image compression", repo: "yudiasmoro-star/v3dsc17-ownhost", additions: 142, deletions: 12 },
    { sha: "02eaadb0", msg: "feat: implement PWA update banner and initialize layout configuration", repo: "BeyeDev/MyMaiyah-TWS", additions: 64, deletions: 4 },
    { sha: "8b723db1", msg: "docs: update README.md with project-specific documentation", repo: "BeyeDev/web-mili-dev", additions: 15, deletions: 1 },
  ];

  // Mock data PRs
  const prs: PRItem[] = [
    { number: 42, title: "feat: implement local storage draft persistence for registration", repo: "yudiasmoro-star/v3dsc17-ownhost", state: "merged" },
    { number: 18, title: "refactor: migrate database schemas to self-hosted MySQL", repo: "BeyeDev/OWNV4-DSC17-2026", state: "open" },
  ];

  // Trigger export simulation
  const handleExport = (type: "pdf" | "excel" | "share") => {
    setIsExporting(type);
    setTimeout(() => {
      setIsExporting("none");
      alert(
        type === "pdf"
          ? "Sukses mengekspor Laporan Kerja ke PDF!"
          : type === "excel"
          ? "Sukses mengekspor Laporan Kerja ke file Excel!"
          : "Link laporan berhasil disalin ke clipboard! Siap dibagikan."
      );
    }, 2000);
  };

  // Judul berdasarkan tipe laporan
  const getReportTitle = () => {
    if (reportType === "daily") return "Laporan Harian Kerja Developer (Daily Report)";
    if (reportType === "weekly") return "Laporan Mingguan Kerja Developer (Weekly Report)";
    return "Laporan Bulanan Kerja Developer (Monthly Report)";
  };

  const getReportPeriod = () => {
    if (reportType === "daily") return "12 Juni 2026 (Hari Ini)";
    if (reportType === "weekly") return "08 Juni 2026 - 12 Juni 2026 (Minggu Ini)";
    return "Mei 2026 - Juni 2026 (Bulan Ini)";
  };

  return (
    <div className={`${theme} min-h-screen flex flex-col transition-colors duration-300 bg-[var(--color-bg)] text-[var(--color-text-primary)] font-sans`}>
      {/* Header */}
      <header className="fixed top-4 left-4 right-4 z-50 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 cursor-pointer">
            <svg className="w-8 h-8 text-[var(--color-accent-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="font-mono font-bold text-lg tracking-wider">DevReport</span>
          </Link>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-border)] text-[var(--color-text-secondary)] font-mono">Reports</span>
        </div>

        <nav className="hidden md:flex items-center gap-6 font-mono text-sm">
          <Link href="/accounts" className="hover:text-[var(--color-accent-success)] transition-colors">Akun GitHub</Link>
          <Link href="/dashboard/reports" className="text-[var(--color-accent-success)] border-b border-[var(--color-accent-success)] pb-1 font-bold">Laporan</Link>
          <Link href="/" className="hover:text-[var(--color-accent-success)] transition-colors">Halaman Utama</Link>
        </nav>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-border)] transition-all cursor-pointer"
            title="Ganti Mode Tampilan"
          >
            {theme === "dark" ? (
              <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10 5 5 0 000-10z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          <Link href="/" className="px-4 py-2 text-sm font-mono font-semibold rounded-xl bg-[var(--color-border)] hover:opacity-90 transition-all cursor-pointer">
            Keluar
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="pt-28 pb-16 px-6 max-w-7xl mx-auto w-full flex-1 flex flex-col gap-6">
        {/* Title and Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-6">
          <div>
            <h1 className="text-3xl font-extrabold font-mono tracking-tight">Pusat Laporan Kerja</h1>
            <p className="text-[var(--color-text-secondary)] mt-1">Hasilkan laporan aktivitas teragregasi dari data GitHub dan catatan manual.</p>
          </div>

          {/* Report Type Tabs */}
          <div className="flex gap-2 p-1 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] self-start md:self-auto">
            <button
              onClick={() => setReportType("daily")}
              className={`px-4 py-2 text-xs font-mono font-semibold rounded-xl transition-all cursor-pointer ${reportType === "daily" ? "bg-[var(--color-accent-success)] text-white" : "hover:bg-[var(--color-border)]"}`}
            >
              Harian
            </button>
            <button
              onClick={() => setReportType("weekly")}
              className={`px-4 py-2 text-xs font-mono font-semibold rounded-xl transition-all cursor-pointer ${reportType === "weekly" ? "bg-[var(--color-accent-success)] text-white" : "hover:bg-[var(--color-border)]"}`}
            >
              Mingguan
            </button>
            <button
              onClick={() => setReportType("monthly")}
              className={`px-4 py-2 text-xs font-mono font-semibold rounded-xl transition-all cursor-pointer ${reportType === "monthly" ? "bg-[var(--color-accent-success)] text-white" : "hover:bg-[var(--color-border)]"}`}
            >
              Bulanan
            </button>
          </div>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Interactive Preview & Manual Input */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Manual Context Input (Hanya untuk Developer) */}
            {(!session || (session.user as any).role === "Developer") && (
            <div className="bento-card bg-[var(--color-card)] border border-[var(--color-border)] p-6">
              <h2 className="text-base font-mono font-bold uppercase tracking-wider mb-4 border-b border-[var(--color-border)] pb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-[var(--color-accent-info)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Catatan Konteks Kerja Manual (Developer Input)
              </h2>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono font-semibold text-[var(--color-text-secondary)]">
                    Konteks Aktivitas Non-GitHub (Meeting, Riset, Debugging Lokal, dll.)
                  </label>
                  <textarea
                    rows={4}
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    className="w-full px-4 py-3 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] focus:outline-none focus:border-[var(--color-accent-success)] transition-colors font-mono"
                    placeholder="Masukkan poin-poin pekerjaan Anda hari ini..."
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono font-semibold text-[var(--color-text-secondary)]">
                    Kendala / Blocker Kerja
                  </label>
                  <input
                    type="text"
                    value={blockers}
                    onChange={(e) => setBlockers(e.target.value)}
                    className="w-full px-4 py-3 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] focus:outline-none focus:border-[var(--color-accent-success)] transition-colors font-mono"
                    placeholder="Masukkan blocker jika ada..."
                  />
                </div>
              </div>
            </div>
            )}

            {/* Generated Report Preview Card */}
            <div className="bento-card bg-[var(--color-card)] border border-[var(--color-border)] p-6">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4 mb-6">
                <div>
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Preview Output Laporan</span>
                  <h2 className="text-lg font-bold mt-1">{getReportTitle()}</h2>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono text-[var(--color-text-secondary)] block">Periode Pelaporan</span>
                  <span className="text-sm font-mono font-semibold text-[var(--color-accent-success)]">{getReportPeriod()}</span>
                </div>
              </div>

              {/* Dual theme logic display */}
              {!session || (session.user as any).role === "Developer" ? (
                /* Developer View (Detailed & Code-focused) */
                <div className="flex flex-col gap-6">
                  {/* Commits List */}
                  <div>
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-accent-info)] mb-3 flex items-center gap-1.5">
                      <span className="w-1.5 h-3 rounded bg-[var(--color-accent-info)]"></span>
                      GitHub Commits ({commits.length})
                    </h3>
                    <div className="flex flex-col gap-3">
                      {commits.map((commit, idx) => (
                        <div key={idx} className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] flex items-center justify-between gap-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-mono font-bold text-[var(--color-accent-info)]">{commit.sha}</span>
                            <span className="text-xs font-semibold mt-1 leading-relaxed">{commit.msg}</span>
                            <span className="text-[10px] text-[var(--color-text-secondary)] font-mono mt-0.5">{commit.repo}</span>
                          </div>
                          <div className="flex gap-2 text-[10px] font-mono shrink-0">
                            <span className="text-[var(--color-accent-success)] bg-emerald-500/10 px-2 py-0.5 rounded">+{commit.additions}</span>
                            <span className="text-red-500 bg-red-500/10 px-2 py-0.5 rounded">-{commit.deletions}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pull Requests List */}
                  <div>
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-accent-success)] mb-3 flex items-center gap-1.5">
                      <span className="w-1.5 h-3 rounded bg-[var(--color-accent-success)]"></span>
                      Pull Requests ({prs.length})
                    </h3>
                    <div className="flex flex-col gap-3">
                      {prs.map((pr, idx) => (
                        <div key={idx} className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-xs font-mono text-[var(--color-text-secondary)]">{pr.repo}</span>
                            <span className="text-xs font-semibold mt-0.5">#{pr.number}: {pr.title}</span>
                          </div>
                          <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full ${pr.state === "merged" ? "bg-emerald-500/10 text-[var(--color-accent-success)] border border-emerald-500/20" : "bg-indigo-500/10 text-[var(--color-accent-info)] border border-indigo-500/20"}`}>
                            {pr.state}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Management View (Summary & High-level features) */
                <div className="flex flex-col gap-6">
                  {/* High level features finished */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent-info)] mb-3 flex items-center gap-1.5">
                      <span className="w-1.5 h-3 rounded bg-[var(--color-accent-info)]"></span>
                      Fitur / Pekerjaan Terselesaikan
                    </h3>
                    <ul className="list-disc pl-5 flex flex-col gap-2.5 text-sm leading-relaxed">
                      <li>
                        <strong>Form Registrasi Multi-Step</strong>: Berhasil mengimplementasikan formulir pendaftaran bertahap lengkap dengan kompresi gambar di sisi client untuk mempercepat proses upload data submission.
                      </li>
                      <li>
                        <strong>banner Update PWA</strong>: Mengintegrasikan sistem deteksi pembaruan aplikasi otomatis untuk memastikan pengguna selalu mendapatkan versi web app terbaru.
                      </li>
                      <li>
                        <strong>Perapian README Dokumentasi</strong>: Memperbarui panduan dokumentasi proyek dan instruksi staging deployment.
                      </li>
                    </ul>
                  </div>

                  {/* Summary Metric Badges */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]">
                      <span className="text-xs text-[var(--color-text-secondary)] block">Skala Kontribusi GitHub</span>
                      <div className="text-lg font-bold mt-1 text-[var(--color-accent-info)]">3 Kompilasi Pekerjaan Utama</div>
                    </div>
                    <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]">
                      <span className="text-xs text-[var(--color-text-secondary)] block">Total Perubahan Baris Kode</span>
                      <div className="text-lg font-bold mt-1 text-[var(--color-accent-success)]">221 Penambahan / 17 Pengurangan</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Displaying Manual Notes in the report */}
              <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-accent-warning)] mb-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-3 rounded bg-[var(--color-accent-warning)]"></span>
                  Catatan Manual Developer
                </h3>
                <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-xs font-mono leading-relaxed whitespace-pre-line">
                  {manualNotes || "Belum ada catatan manual ditambahkan."}
                </div>
              </div>

              {/* Displaying Blockers */}
              <div className="mt-4">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-red-500 mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-3 rounded bg-red-500"></span>
                  Kendala & Blockers
                </h3>
                <div className="p-3 rounded-xl border border-red-500/15 bg-[var(--color-bg)] text-xs font-mono text-red-400">
                  {blockers || "Tidak ada kendala."}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Export Panel */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="bento-card bg-[var(--color-card)] border border-[var(--color-border)] p-6">
              <h2 className="text-base font-mono font-bold uppercase tracking-wider mb-4 border-b border-[var(--color-border)] pb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-[var(--color-accent-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Ekspor & Bagikan Laporan
              </h2>

              <p className="text-xs text-[var(--color-text-secondary)] mb-6 leading-relaxed">
                Hasilkan laporan pekerjaan resmi untuk dikirimkan kepada atasan atau divisi manajemen dalam format pilihan Anda.
              </p>

              <div className="flex flex-col gap-3">
                {/* PDF Export */}
                <button
                  onClick={() => handleExport("pdf")}
                  disabled={isExporting !== "none"}
                  className="w-full py-3 px-4 font-mono font-semibold rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-border)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-wait"
                >
                  {isExporting === "pdf" ? (
                    <>
                      <svg className="w-5 h-5 animate-spin text-[var(--color-accent-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 15.89M21 21v-5h-.581" />
                      </svg>
                      Mengekspor PDF...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      Ekspor Laporan PDF
                    </>
                  )}
                </button>

                {/* Excel Export */}
                <button
                  onClick={() => handleExport("excel")}
                  disabled={isExporting !== "none"}
                  className="w-full py-3 px-4 font-mono font-semibold rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-border)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-wait"
                >
                  {isExporting === "excel" ? (
                    <>
                      <svg className="w-5 h-5 animate-spin text-[var(--color-accent-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 15.89M21 21v-5h-.581" />
                      </svg>
                      Mengekspor Excel...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H3a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Ekspor Excel (.xlsx)
                    </>
                  )}
                </button>

                {/* Share Link */}
                <button
                  onClick={() => handleExport("share")}
                  disabled={isExporting !== "none"}
                  className="w-full py-3 px-4 font-mono font-semibold rounded-xl bg-[var(--color-accent-success)] text-white hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isExporting === "share" ? (
                    "Menyalin Link..."
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 10.742l4.028-2.014m0 4.544l-4.028-2.014m5.673-3.137A3 3 0 1119 7.843 3 3 0 0114.332 7.843zM7 10a3 3 0 11-6 0 3 3 0 016 0zm11 8a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Bagikan Link Laporan
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Audit Log Hint */}
            <div className="bento-card bg-[var(--color-card)] border border-[var(--color-border)] p-6">
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-[var(--color-accent-warning)] mb-2">🔒 Keamanan Akses</h3>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                Setiap kali perwakilan manajemen melihat atau mengekspor laporan Anda, sistem akan secara otomatis mencatatnya di panel <strong>Audit Log</strong> untuk transparansi penuh.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-10 px-6 border-t border-[var(--color-border)] bg-[var(--color-card)]/55 text-center text-xs text-[var(--color-text-secondary)]">
        <p>© 2026 PT Mili Cipta Karya. All rights reserved.</p>
      </footer>
    </div>
  );
}
