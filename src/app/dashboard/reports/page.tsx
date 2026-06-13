"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ManagementDashboard } from "@/components/reports/ManagementDashboard";
import { DeveloperDashboard } from "@/components/reports/DeveloperDashboard";
import { CommitItem, PRItem, EpicItem, TaskItem, DevReportItem } from "@/types/report";

export default function ReportsPage() {
  const { data: session } = useSession();
  const isManager = session?.user && (session.user as any).role === "Manajemen";

  const [reportType, setReportType] = useState<"daily" | "weekly" | "monthly">("daily");
  
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
  const fetchReportData = useCallback(async (isBackground = false) => {
    if (!session?.user) return;
    try {
      if (!isBackground) setLoading(true);
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
      if (!isBackground) setLoading(false);
    }
  }, [session, reportType]);

  // Initial fetch + auto-refresh every 60s for realtime-like experience
  useEffect(() => {
    fetchReportData();
    const interval = setInterval(() => fetchReportData(true), 60_000);
    return () => clearInterval(interval);
  }, [fetchReportData]);

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
        toast.success(data.message);
        setIsSubmitted(submit);
        await fetchReportData(); // Reload stats and commits
      } else {
        toast.error("Gagal menyimpan laporan: " + data.error);
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal menghubungi server untuk menyimpan laporan.");
    } finally {
      setIsSaving(false);
    }
  };

  // Trigger export simulation
  const handleExport = (type: "pdf" | "excel" | "share") => {
    setIsExporting(type);
    setTimeout(() => {
      setIsExporting("none");
      toast.success(
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

  return (
    <DashboardLayout activeTab="reports">
      {/* Title and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight">Pusat Laporan Kerja</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">Hasilkan laporan aktivitas teragregasi dari data GitHub dan catatan manual.</p>
        </div>

        {/* Report Type Tabs */}
        <div className="flex gap-2 p-1 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] self-start md:self-auto">
          <button
            onClick={() => setReportType("daily")}
            className={`px-3 sm:px-4 py-2.5 text-xs font-mono font-semibold rounded-xl transition-all cursor-pointer ${reportType === "daily" ? "bg-[var(--color-accent-success)] text-white" : "hover:bg-[var(--color-border)]"}`}
          >
            Harian
          </button>
          <button
            onClick={() => setReportType("weekly")}
            className={`px-3 sm:px-4 py-2.5 text-xs font-mono font-semibold rounded-xl transition-all cursor-pointer ${reportType === "weekly" ? "bg-[var(--color-accent-success)] text-white" : "hover:bg-[var(--color-border)]"}`}
          >
            Mingguan
          </button>
          <button
            onClick={() => setReportType("monthly")}
            className={`px-3 sm:px-4 py-2.5 text-xs font-mono font-semibold rounded-xl transition-all cursor-pointer ${reportType === "monthly" ? "bg-[var(--color-accent-success)] text-white" : "hover:bg-[var(--color-border)]"}`}
          >
            Bulanan
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-6">
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
        </div>
      ) : (
        isManager ? (
          <ManagementDashboard managementData={managementData} />
        ) : (
          <DeveloperDashboard 
            commits={commits}
            prs={prs}
            manualNotes={manualNotes}
            setManualNotes={setManualNotes}
            blockers={blockers}
            setBlockers={setBlockers}
            isSaving={isSaving}
            isSubmitted={isSubmitted}
            handleSaveReport={handleSaveReport}
            reportTitle={getReportTitle()}
            reportPeriod={getReportPeriod()}
            isExporting={isExporting}
            handleExport={handleExport}
          />
        )
      )}
    </DashboardLayout>
  );
}
