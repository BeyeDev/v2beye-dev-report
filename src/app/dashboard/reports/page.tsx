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

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${count} stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`w-3.5 h-3.5 ${i < count ? "text-amber-500 fill-amber-500" : "text-gray-300 dark:text-gray-700"}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function ReportsPage() {
  const { data: session } = useSession();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [reportType, setReportType] = useState<"daily" | "weekly" | "monthly">("daily");
  const isManager = session?.user && (session.user as any).role === "Manajemen";

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
          {(!session || (session.user as any).role === "Developer") && (
            <Link href="/accounts" className="hover:text-[var(--color-accent-success)] transition-colors">Akun GitHub</Link>
          )}
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
      <main className="pt-28 pb-24 md:pb-16 px-6 max-w-7xl mx-auto w-full flex-1 flex flex-col gap-6">
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

        {isManager ? (
          /* Management Dashboard Layout (Bento Grid) */
          <div className="flex flex-col gap-6">
            {/* Bento Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Sprint Progress Card */}
              <div className="bento-card bg-[var(--color-card)] border border-[var(--color-border)] p-6 flex flex-col justify-between gap-4">
                <div>
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Siklus Sprint Aktif</span>
                  <h3 className="text-2xl font-bold mt-1 text-[var(--color-text-primary)]">Sprint 12 (Q2)</h3>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-[var(--color-text-secondary)]">Kemajuan Tugas</span>
                    <span className="font-bold text-[var(--color-accent-success)]">75% Selesai</span>
                  </div>
                  <div className="w-full bg-[var(--color-bg)] rounded-full h-2 overflow-hidden border border-[var(--color-border)]">
                    <div className="bg-gradient-to-r from-emerald-400 to-teal-500 h-2 rounded-full transition-all duration-500" style={{ width: "75%" }} />
                  </div>
                </div>
              </div>

              {/* Completed Tasks Card */}
              <div className="bento-card bg-[var(--color-card)] border border-[var(--color-border)] p-6 flex flex-col justify-between gap-2">
                <div>
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Pekerjaan Terselesaikan</span>
                  <h3 className="text-3xl font-extrabold mt-2 text-[var(--color-accent-info)]">14</h3>
                </div>
                <div className="text-xs text-[var(--color-text-secondary)] font-mono leading-relaxed mt-2">
                  • 11 Fitur Utama & Dokumentasi<br />
                  • 3 Perbaikan Bug Kritis
                </div>
              </div>

              {/* Active Bugs Card */}
              <div className="bento-card bg-[var(--color-card)] border border-[var(--color-border)] p-6 flex flex-col justify-between gap-2">
                <div>
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Kendala / Bug Aktif</span>
                  <h3 className="text-3xl font-extrabold mt-2 text-red-500">2</h3>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs text-red-500 font-mono">Resiko Rendah (Tidak Memblokir Rilis)</span>
                </div>
              </div>
            </div>

            {/* Main Bento Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column (2/3 width) */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                {/* Epics Gallery */}
                <div className="bento-card bg-[var(--color-card)] border border-[var(--color-border)] p-6">
                  <h2 className="text-base font-mono font-bold uppercase tracking-wider mb-4 border-b border-[var(--color-border)] pb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-[var(--color-accent-info)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Epics & Inisiatif Utama (High-Level Progress)
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    {/* Epic Card 1 */}
                    <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] flex flex-col justify-between gap-4 hover:border-[var(--color-accent-info)]/30 transition-all cursor-pointer">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-sm font-bold leading-tight">Form Registrasi Multi-Step</h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">In Progress</span>
                        </div>
                        <p className="text-[11px] text-[var(--color-text-secondary)] mt-1 leading-relaxed">Formulir pendaftaran bertahap dengan kompresi gambar otomatis.</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <StarRating count={4} />
                          <span className="font-bold text-[var(--color-text-secondary)]">80% Selesai</span>
                        </div>
                        <div className="w-full bg-[var(--color-card)] rounded-full h-1.5 overflow-hidden">
                          <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: "80%" }} />
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-[var(--color-text-secondary)] font-mono mt-1">
                          <span>Owner:</span>
                          <span className="font-bold text-[var(--color-text-primary)]">BeyeDev</span>
                        </div>
                      </div>
                    </div>

                    {/* Epic Card 2 */}
                    <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] flex flex-col justify-between gap-4 hover:border-[var(--color-accent-info)]/30 transition-all cursor-pointer">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-sm font-bold leading-tight">PWA Auto-Update Banner</h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">Completed</span>
                        </div>
                        <p className="text-[11px] text-[var(--color-text-secondary)] mt-1 leading-relaxed">Sistem deteksi pembaruan otomatis untuk pengguna PWA.</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <StarRating count={2} />
                          <span className="font-bold text-[var(--color-text-secondary)]">100% Selesai</span>
                        </div>
                        <div className="w-full bg-[var(--color-card)] rounded-full h-1.5 overflow-hidden">
                          <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: "100%" }} />
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-[var(--color-text-secondary)] font-mono mt-1">
                          <span>Owner:</span>
                          <span className="font-bold text-[var(--color-text-primary)]">BeyeDev</span>
                        </div>
                      </div>
                    </div>

                    {/* Epic Card 3 */}
                    <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] flex flex-col justify-between gap-4 hover:border-[var(--color-accent-info)]/30 transition-all cursor-pointer">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-sm font-bold leading-tight">Migrasi Database & Supabase</h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">In Progress</span>
                        </div>
                        <p className="text-[11px] text-[var(--color-text-secondary)] mt-1 leading-relaxed">Migrasi skema database utama ke infrastruktur cloud Supabase.</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <StarRating count={5} />
                          <span className="font-bold text-[var(--color-text-secondary)]">50% Selesai</span>
                        </div>
                        <div className="w-full bg-[var(--color-card)] rounded-full h-1.5 overflow-hidden">
                          <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: "50%" }} />
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-[var(--color-text-secondary)] font-mono mt-1">
                          <span>Owner:</span>
                          <span className="font-bold text-[var(--color-text-primary)]">BeyeDev</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simplified Active Issues */}
                <div className="bento-card bg-[var(--color-card)] border border-[var(--color-border)] p-6">
                  <h2 className="text-base font-mono font-bold uppercase tracking-wider mb-4 border-b border-[var(--color-border)] pb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-[var(--color-accent-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    Daftar Tugas Aktif (Simplified Tasks Log)
                  </h2>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead>
                        <tr className="border-b border-[var(--color-border)] text-[var(--color-text-secondary)]">
                          <th className="pb-3 font-semibold">Nama Tugas</th>
                          <th className="pb-3 font-semibold text-center">Tipe</th>
                          <th className="pb-3 font-semibold text-center">Tingkat Kesulitan</th>
                          <th className="pb-3 font-semibold text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-border)]">
                        <tr className="hover:bg-[var(--color-border)]/20 transition-colors">
                          <td className="py-3 font-sans font-semibold text-[var(--color-text-primary)]">Migrasi Database & Skema Migrasi Supabase</td>
                          <td className="py-3 text-center">
                            <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 text-[10px]">Task</span>
                          </td>
                          <td className="py-3 flex justify-center"><StarRating count={5} /></td>
                          <td className="py-3 text-right">
                            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 font-bold text-[10px]">In Progress</span>
                          </td>
                        </tr>
                        <tr className="hover:bg-[var(--color-border)]/20 transition-colors">
                          <td className="py-3 font-sans font-semibold text-[var(--color-text-primary)]">Optimasi Cache Timeline State Lokal</td>
                          <td className="py-3 text-center">
                            <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 text-[10px]">Task</span>
                          </td>
                          <td className="py-3 flex justify-center"><StarRating count={3} /></td>
                          <td className="py-3 text-right">
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold text-[10px]">Completed</span>
                          </td>
                        </tr>
                        <tr className="hover:bg-[var(--color-border)]/20 transition-colors">
                          <td className="py-3 font-sans font-semibold text-[var(--color-text-primary)]">Fix Bug Memory Leak di Staging Upload</td>
                          <td className="py-3 text-center">
                            <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-500 border border-red-500/20 text-[10px]">Bug</span>
                          </td>
                          <td className="py-3 flex justify-center"><StarRating count={4} /></td>
                          <td className="py-3 text-right">
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold text-[10px]">Resolved</span>
                          </td>
                        </tr>
                        <tr className="hover:bg-[var(--color-border)]/20 transition-colors">
                          <td className="py-3 font-sans font-semibold text-[var(--color-text-primary)]">Riset Implementasi Enkripsi AES-256 Supabase</td>
                          <td className="py-3 text-center">
                            <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 text-[10px]">Task</span>
                          </td>
                          <td className="py-3 flex justify-center"><StarRating count={3} /></td>
                          <td className="py-3 text-right">
                            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 font-bold text-[10px]">In Progress</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Column (1/3 width) */}
              <div className="lg:col-span-1 flex flex-col gap-6">
                {/* Milestone Timeline */}
                <div className="bento-card bg-[var(--color-card)] border border-[var(--color-border)] p-6">
                  <h2 className="text-base font-mono font-bold uppercase tracking-wider mb-4 border-b border-[var(--color-border)] pb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-[var(--color-accent-warning)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Milestone Timeline
                  </h2>

                  <div className="flex flex-col gap-4 mt-2 font-mono text-xs">
                    {/* Milestone 1 */}
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <span className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-[8px] text-white font-bold">✓</span>
                        <div className="w-0.5 h-12 bg-emerald-500" />
                      </div>
                      <div>
                        <div className="font-bold text-[var(--color-text-primary)]">Integrasi Supabase & Schema SQL</div>
                        <div className="text-[10px] text-[var(--color-text-secondary)] mt-0.5">10 Juni 2026</div>
                        <div className="text-[10px] text-[var(--color-accent-success)] font-semibold mt-1">Selesai (Di-deploy ke staging)</div>
                      </div>
                    </div>

                    {/* Milestone 2 */}
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <span className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center text-[8px] text-white font-bold">⌛</span>
                        <div className="w-0.5 h-12 bg-[var(--color-border)]" />
                      </div>
                      <div>
                        <div className="font-bold text-[var(--color-text-primary)]">Staging Internal & Review Form</div>
                        <div className="text-[10px] text-[var(--color-text-secondary)] mt-0.5">15 Juni 2026</div>
                        <div className="text-[10px] text-amber-500 font-semibold mt-1">Sedang Berjalan (Testing manual)</div>
                      </div>
                    </div>

                    {/* Milestone 3 */}
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <span className="w-4 h-4 rounded-full bg-[var(--color-border)] border border-[var(--color-border)] flex items-center justify-center text-[8px]" />
                      </div>
                      <div>
                        <div className="font-bold text-[var(--color-text-secondary)]">Production Deployment</div>
                        <div className="text-[10px] text-[var(--color-text-secondary)] mt-0.5">22 Juni 2026</div>
                        <div className="text-[10px] text-[var(--color-text-secondary)] mt-1">Belum Dimulai</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Export Card */}
                <div className="bento-card bg-[var(--color-card)] border border-[var(--color-border)] p-6">
                  <h2 className="text-base font-mono font-bold uppercase tracking-wider mb-4 border-b border-[var(--color-border)] pb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-[var(--color-accent-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Ekspor & Bagikan Laporan
                  </h2>

                  <p className="text-xs text-[var(--color-text-secondary)] mb-6 leading-relaxed">
                    Hasilkan laporan pekerjaan resmi untuk dikirimkan kepada pemangku kepentingan dalam format pilihan Anda.
                  </p>

                  <div className="flex flex-col gap-3">
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

                {/* Access Security Card */}
                <div className="bento-card bg-[var(--color-card)] border border-[var(--color-border)] p-6">
                  <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-[var(--color-accent-warning)] mb-2">🔒 Keamanan Akses</h3>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    Setiap akses manajemen ke dashboard ini dipantau secara ketat dan dicatat di dalam <strong>Audit Log</strong> demi integritas data.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Developer Dashboard Layout (Original) */
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
        )}
      </main>
      
      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-card)]/90 backdrop-blur-md border-t border-[var(--color-border)] px-6 py-3.5 flex items-center justify-around shadow-2xl">
        <Link 
          href="/dashboard/reports" 
          className="flex flex-col items-center gap-1.5 text-[10px] font-mono text-[var(--color-accent-success)] font-bold transition-all"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Laporan
        </Link>
        
        {(!session || (session.user as any).role === "Developer") && (
          <Link 
            href="/accounts" 
            className="flex flex-col items-center gap-1.5 text-[10px] font-mono text-[var(--color-text-secondary)] hover:text-[var(--color-accent-success)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Akun GitHub
          </Link>
        )}

        <Link 
          href="/" 
          className="flex flex-col items-center gap-1.5 text-[10px] font-mono text-[var(--color-text-secondary)] hover:text-[var(--color-accent-success)] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Keluar
        </Link>
      </div>

      {/* Footer */}
      <footer className="mt-auto py-10 pb-28 md:pb-10 px-6 border-t border-[var(--color-border)] bg-[var(--color-card)]/55 text-center text-xs text-[var(--color-text-secondary)]">
        <p>© 2026 PT Mili Cipta Karya. All rights reserved.</p>
      </footer>
    </div>
  );
}
