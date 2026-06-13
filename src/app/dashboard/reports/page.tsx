"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ManagementDashboard } from "@/components/reports/ManagementDashboard";
import { DeveloperDashboard } from "@/components/reports/DeveloperDashboard";
import { CommitItem, PRItem, EpicItem, TaskItem, DevReportItem } from "@/types/report";
import { supabase } from "@/lib/supabase";

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

  // Debounce ref untuk Supabase Realtime agar tidak flood API saat batch upsert
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const debouncedFetch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchReportData(true), 2000);
  }, [fetchReportData]);

  // Initial fetch + Supabase Realtime subscription
  useEffect(() => {
    fetchReportData();

    // Setup Supabase Realtime subscriptions with debounce
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'commits' }, () => {
        debouncedFetch();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pull_requests' }, () => {
        debouncedFetch();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'issues' }, () => {
        debouncedFetch();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'work_reports' }, () => {
        debouncedFetch();
      })
      .subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  }, [fetchReportData, debouncedFetch]);

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

  // Handle real export functionality
  const handleExport = (type: "pdf" | "excel" | "share") => {
    setIsExporting(type);
    
    if (type === "pdf") {
      setTimeout(() => {
        setIsExporting("none");
        window.print();
        toast.success("Mempersiapkan dokumen PDF.");
      }, 500);
      return;
    }
    
    if (type === "excel") {
      setTimeout(() => {
        let csv = "SHA,Pesan Commit,Repositori,Tanggal,Additions,Deletions\n";
        
        // Deteksi role: gunakan data yang tepat
        if (isManager && managementData) {
          // Manager: kumpulkan commits dari semua epics + reports
          const allCommits = managementData.epics.flatMap(e => e.commits || []);
          allCommits.forEach(c => {
            csv += `"${c.sha}","${c.msg.replace(/"/g, '""')}","${c.repo}","${c.date || ''}","${c.additions}","${c.deletions}"\n`;
          });
        } else {
          // Developer: gunakan state commits
          commits.forEach(c => {
            csv += `"${c.sha}","${c.msg.replace(/"/g, '""')}","${c.repo}","${c.date || ''}","${c.additions}","${c.deletions}"\n`;
          });
        }
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Laporan_Kerja_${reportType}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsExporting("none");
        toast.success("Berhasil mengunduh file Excel (CSV)!");
      }, 500);
      return;
    }
    
    // Share link
    setTimeout(() => {
      navigator.clipboard.writeText(window.location.href);
      setIsExporting("none");
      toast.success("Link laporan berhasil disalin ke clipboard!");
    }, 500);
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
