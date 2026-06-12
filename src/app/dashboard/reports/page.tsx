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
  state: "merged" | "open" | "closed" | string;
}

interface EpicItem {
  name: string;
  owner: string;
  language: string;
  progress: number;
  status: string;
  difficulty: number;
}

interface TaskItem {
  id: string;
  title: string;
  repoName: string;
  type: string;
  difficulty: number;
  state: string;
}

interface DevReportItem {
  report_id: string;
  developer: string;
  notes: string;
  blockers: string;
  submittedAt: string;
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

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Developer states
  const [commits, setCommits] = useState<CommitItem[]>([]);
  const [prs, setPrs] = useState<PRItem[]>([]);
  const [manualNotes, setManualNotes] = useState("");
  const [blockers, setBlockers] = useState("");

  // Management states
  const [managementData, setManagementData] = useState<{
    stats: {
      sprintName: string;
      completedTasks: number;
      activeBugs: number;
      progressPercent: number;
    };
    epics: EpicItem[];
    activeTasks: TaskItem[];
    reports: DevReportItem[];
  } | null>(null);

  // State untuk melacak status ekspor
  const [isExporting, setIsExporting] = useState<"none" | "pdf" | "excel" | "share">("none");

  // Load report data from backend
  const fetchReportData = async () => {
    if (!session?.user) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/reports?type=${reportType}`);
      const data = await res.json();
      if (data.success) {
        if (data.isManager) {
          setManagementData({
            stats: data.stats,
            epics: data.epics,
            activeTasks: data.activeTasks,
            reports: data.reports
          });
        } else {
          setCommits(data.commits || []);
          setPrs(data.prs || []);
          setManualNotes(data.report?.manual_notes || "");
          setBlockers(data.report?.blockers || "");
          setIsSubmitted(data.report?.is_submitted || false);
        }
      }
    } catch (err) {
      console.error("Gagal memuat data laporan:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [session, reportType]);

  const handleSaveReport = async (submit: boolean) => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: reportType,
          manual_notes: manualNotes,
          blockers,
          is_submitted: submit
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setIsSubmitted(submit);
        await fetchReportData(); // Reload stats and commits
      } else {
        alert("Gagal menyimpan laporan: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Gagal menghubungi server untuk menyimpan laporan.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

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
    const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    if (reportType === "daily") return `${todayStr} (Hari Ini)`;
    if (reportType === "weekly") return "Minggu Ini (Senin - Minggu)";
    return "Bulan Ini (1 - Akhir Bulan)";
  };

  if (loading) {
    return (
      <div className={`${theme} min-h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-text-primary)] font-sans`}>
        <header className="fixed top-4 left-4 right-4 z-50 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-border)] animate-pulse" />
            <div className="w-24 h-5 rounded bg-[var(--color-border)] animate-pulse" />
          </div>
          <div className="w-32 h-8 rounded-lg bg-[var(--color-border)] animate-pulse" />
        </header>
        <main className="pt-28 pb-24 md:pb-16 px-6 max-w-7xl mx-auto w-full flex-1 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <div className="w-48 h-8 rounded bg-[var(--color-border)] animate-pulse" />
            <div className="w-96 h-4 rounded bg-[var(--color-border)] animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="h-32 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] animate-pulse" />
            <div className="h-32 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] animate-pulse" />
            <div className="h-32 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] animate-pulse" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="lg:col-span-2 h-96 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] animate-pulse" />
            <div className="lg:col-span-1 h-96 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] animate-pulse" />
          </div>
        </main>
      </div>
    );
  }

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
                  <h3 className="text-2xl font-bold mt-1 text-[var(--color-text-primary)]">
                    {managementData?.stats?.sprintName || "Sprint 12 (Q2)"}
                  </h3>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-[var(--color-text-secondary)]">Kemajuan Tugas</span>
                    <span className="font-bold text-[var(--color-accent-success)]">{managementData?.stats?.progressPercent || 75}% Selesai</span>
                  </div>
                  <div className="w-full bg-[var(--color-bg)] rounded-full h-2 overflow-hidden border border-[var(--color-border)]">
                    <div className="bg-gradient-to-r from-emerald-400 to-teal-500 h-2 rounded-full transition-all duration-500" style={{ width: `${managementData?.stats?.progressPercent || 75}%` }} />
                  </div>
                </div>
              </div>

              {/* Completed Tasks Card */}
              <div className="bento-card bg-[var(--color-card)] border border-[var(--color-border)] p-6 flex flex-col justify-between gap-2">
                <div>
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Pekerjaan Terselesaikan</span>
                  <h3 className="text-3xl font-extrabold mt-2 text-[var(--color-accent-info)]">
                    {managementData?.stats?.completedTasks ?? 14}
                  </h3>
                </div>
                <div className="text-xs text-[var(--color-text-secondary)] font-mono leading-relaxed mt-2">
                  Pekerjaan diselesaikan pada repo yang dipantau (total PR merged & task ditutup).
                </div>
              </div>

              {/* Active Bugs Card */}
              <div className="bento-card bg-[var(--color-card)] border border-[var(--color-border)] p-6 flex flex-col justify-between gap-2">
                <div>
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Kendala / Bug Aktif</span>
                  <h3 className={`text-3xl font-extrabold mt-2 ${managementData?.stats?.activeBugs && managementData.stats.activeBugs > 0 ? 'text-red-500' : 'text-[var(--color-accent-success)]'}`}>
                    {managementData?.stats?.activeBugs ?? 0}
                  </h3>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${managementData?.stats?.activeBugs && managementData.stats.activeBugs > 0 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                  <span className={`text-xs font-mono ${managementData?.stats?.activeBugs && managementData.stats.activeBugs > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                    {managementData?.stats?.activeBugs && managementData.stats.activeBugs > 0 ? 'Ada blocker yang terdeteksi' : 'Bebas blocker / bug kritis'}
                  </span>
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
                    Progres Repositori Aktif (GitHub Connected Repos)
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    {managementData?.epics && managementData.epics.length > 0 ? (
                      managementData.epics.map((epic, idx) => (
                        <div key={idx} className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] flex flex-col justify-between gap-4 hover:border-[var(--color-accent-info)]/30 transition-all cursor-pointer">
                          <div>
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="text-sm font-bold leading-tight">{epic.name}</h4>
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full shrink-0 ${epic.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>{epic.status}</span>
                            </div>
                            <p className="text-[11px] text-[var(--color-text-secondary)] mt-1 leading-relaxed">Repositori {epic.owner}/{epic.name} ({epic.language})</p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center text-[10px] font-mono">
                              <StarRating count={epic.difficulty} />
                              <span className="font-bold text-[var(--color-text-secondary)]">{epic.progress}% Selesai</span>
                            </div>
                            <div className="w-full bg-[var(--color-card)] rounded-full h-1.5 overflow-hidden">
                              <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${epic.progress}%` }} />
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-[var(--color-text-secondary)] font-mono mt-1">
                              <span>Owner:</span>
                              <span className="font-bold text-[var(--color-text-primary)]">{epic.owner}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center col-span-2 py-8 text-[var(--color-text-secondary)] font-mono text-xs">
                        Belum ada repositori aktif yang terhubung.
                      </div>
                    )}
                  </div>
                </div>

                {/* Developer Reports Feed */}
                <div className="bento-card bg-[var(--color-card)] border border-[var(--color-border)] p-6">
                  <h2 className="text-base font-mono font-bold uppercase tracking-wider mb-4 border-b border-[var(--color-border)] pb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-[var(--color-accent-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Laporan Pengembang Terbaru (Developer Work Logs)
                  </h2>

                  <div className="flex flex-col gap-4 max-h-[350px] overflow-y-auto pr-1">
                    {managementData?.reports && managementData.reports.length > 0 ? (
                      managementData.reports.map((rep, idx) => (
                        <div key={idx} className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] flex flex-col gap-2">
                          <div className="flex justify-between items-center border-b border-[var(--color-border)] pb-2">
                            <div>
                              <span className="font-mono font-bold text-sm text-[var(--color-text-primary)]">{rep.developer}</span>
                              <span className="text-[10px] text-[var(--color-text-secondary)] ml-2">({rep.submittedAt})</span>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-[var(--color-accent-success)] border border-emerald-500/20">
                              Submitted
                            </span>
                          </div>
                          <div className="text-xs font-mono whitespace-pre-line leading-relaxed text-[var(--color-text-secondary)] mt-1">
                            <span className="text-[var(--color-text-primary)] font-bold block mb-1">Catatan Manual:</span>
                            {rep.notes}
                          </div>
                          <div className="text-[11px] font-mono text-red-500 bg-red-500/5 p-2 rounded-lg border border-red-500/10 mt-1">
                            <span className="font-bold">Kendala/Blocker: </span>
                            {rep.blockers}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-[var(--color-text-secondary)] font-mono text-xs">
                        Belum ada laporan kerja pengembang yang diserahkan untuk periode ini.
                      </div>
                    )}
                  </div>
                </div>

                {/* Active Issues / Tasks Table */}
                <div className="bento-card bg-[var(--color-card)] border border-[var(--color-border)] p-6">
                  <h2 className="text-base font-mono font-bold uppercase tracking-wider mb-4 border-b border-[var(--color-border)] pb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-[var(--color-accent-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    Daftar Tugas Aktif (Issues & Tasks Log)
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
                        {managementData?.activeTasks && managementData.activeTasks.length > 0 ? (
                          managementData.activeTasks.map((task, idx) => (
                            <tr key={idx} className="hover:bg-[var(--color-border)]/20 transition-colors">
                              <td className="py-3 font-sans font-semibold text-[var(--color-text-primary)]">{task.title}</td>
                              <td className="py-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] ${task.type === 'Bug' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20'}`}>{task.type}</span>
                              </td>
                              <td className="py-3 flex justify-center"><StarRating count={task.difficulty} /></td>
                              <td className="py-3 text-right">
                                <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${task.state === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>{task.state}</span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="text-center py-6 text-[var(--color-text-secondary)] font-mono text-xs">
                              Tidak ada tugas aktif yang terdeteksi. Silakan hubungkan repositori dan jalankan sinkronisasi.
                            </td>
                          </tr>
                        )}
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
          /* Developer Dashboard Layout */
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

                    <div className="flex justify-end gap-3 mt-2">
                      <button
                        onClick={() => handleSaveReport(false)}
                        disabled={isSaving}
                        className="px-4 py-2.5 text-xs font-mono font-semibold rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-border)] transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isSaving ? "Menyimpan..." : "Simpan Draf"}
                      </button>
                      <button
                        onClick={() => handleSaveReport(true)}
                        disabled={isSaving}
                        className="px-4 py-2.5 text-xs font-mono font-semibold rounded-xl bg-[var(--color-accent-success)] text-white hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isSaving ? "Mengirim..." : isSubmitted ? "Kirim Ulang Laporan" : "Kirim Laporan"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Generated Report Preview Card */}
              <div className="bento-card bg-[var(--color-card)] border border-[var(--color-border)] p-6">
                <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4 mb-6">
                  <div>
                    <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Preview Output Laporan</span>
                    <h2 className="text-lg font-bold mt-1 flex items-center gap-2">
                      {getReportTitle()}
                      {isSubmitted ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-[var(--color-accent-success)] border border-emerald-500/20 shrink-0">Submitted</span>
                      ) : (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">Draft</span>
                      )}
                    </h2>
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
                      {commits.length > 0 ? (
                        commits.map((commit, idx) => (
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
                        ))
                      ) : (
                        <div className="text-center py-6 border border-dashed border-[var(--color-border)] rounded-xl text-[var(--color-text-secondary)] font-mono text-xs">
                          Belum ada commits dalam periode ini. Silakan jalankan sinkronisasi di halaman Akun GitHub.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pull Requests List */}
                  <div>
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-accent-success)] mb-3 flex items-center gap-1.5">
                      <span className="w-1.5 h-3 rounded bg-[var(--color-accent-success)]"></span>
                      Pull Requests ({prs.length})
                    </h3>
                    <div className="flex flex-col gap-3">
                      {prs.length > 0 ? (
                        prs.map((pr, idx) => (
                          <div key={idx} className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-xs font-mono text-[var(--color-text-secondary)]">{pr.repo}</span>
                              <span className="text-xs font-semibold mt-0.5">#{pr.number}: {pr.title}</span>
                            </div>
                            <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full ${pr.state === "merged" ? "bg-emerald-500/10 text-[var(--color-accent-success)] border border-emerald-500/20" : "bg-indigo-500/10 text-[var(--color-accent-info)] border border-indigo-500/20"}`}>
                              {pr.state}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 border border-dashed border-[var(--color-border)] rounded-xl text-[var(--color-text-secondary)] font-mono text-xs">
                          Belum ada pull requests dalam periode ini.
                        </div>
                      )}
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
