import { CommitItem, PRItem } from "@/types/report";
import { ExportPanel } from "./ExportPanel";

interface DeveloperDashboardProps {
  commits: CommitItem[];
  prs: PRItem[];
  manualNotes: string;
  setManualNotes: (v: string) => void;
  blockers: string;
  setBlockers: (v: string) => void;
  isSaving: boolean;
  isSubmitted: boolean;
  handleSaveReport: (submit: boolean) => void;
  reportTitle: string;
  reportPeriod: string;
  isExporting: "none" | "pdf" | "excel" | "share";
  handleExport: (type: "pdf" | "excel" | "share") => void;
}

export function DeveloperDashboard({
  commits,
  prs,
  manualNotes,
  setManualNotes,
  blockers,
  setBlockers,
  isSaving,
  isSubmitted,
  handleSaveReport,
  reportTitle,
  reportPeriod,
  isExporting,
  handleExport,
}: DeveloperDashboardProps) {
  // Group commits by repository
  const groupedCommits: Record<string, { repo: string; commits: CommitItem[]; latestDate: Date }> = {};
  commits.forEach(commit => {
    const repoName = commit.repo;
    if (!groupedCommits[repoName]) {
      groupedCommits[repoName] = {
        repo: repoName,
        commits: [],
        latestDate: new Date(0)
      };
    }
    groupedCommits[repoName].commits.push(commit);
    const commitDate = commit.date ? new Date(commit.date) : new Date(0);
    if (commitDate > groupedCommits[repoName].latestDate) {
      groupedCommits[repoName].latestDate = commitDate;
    }
  });

  const sortedGroups = Object.values(groupedCommits).sort(
    (a, b) => b.latestDate.getTime() - a.latestDate.getTime()
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Interactive Preview & Manual Input */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        
        {/* Manual Context Input */}
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

            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-2">
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

        {/* Generated Report Preview Card */}
        <div className="bento-card bg-[var(--color-card)] border border-[var(--color-border)] p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--color-border)] pb-4 mb-6 gap-3">
            <div className="min-w-0">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Preview Output Laporan</span>
              <h2 className="text-base sm:text-lg font-bold mt-1 flex items-center gap-2 flex-wrap">
                <span className="break-words">{reportTitle}</span>
                {isSubmitted ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-[var(--color-accent-success)] border border-emerald-500/20 shrink-0">Submitted</span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">Draft</span>
                )}
              </h2>
            </div>
            <div className="text-left sm:text-right shrink-0">
              <span className="text-xs font-mono text-[var(--color-text-secondary)] block">Periode Pelaporan</span>
              <span className="text-sm font-mono font-semibold text-[var(--color-accent-success)]">{reportPeriod}</span>
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
                {sortedGroups.length > 0 ? (
                  sortedGroups.map((group) => (
                    <div key={group.repo} className="flex flex-col gap-3 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-sm">
                      <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2">
                        <h4 className="text-xs font-mono font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
                          <span className="w-1.5 h-3 rounded bg-[var(--color-accent-info)]/80"></span>
                          {group.repo}
                        </h4>
                        <span className="text-[10px] font-mono text-[var(--color-text-secondary)] bg-[var(--color-border)]/50 px-2 py-0.5 rounded-md">
                          {group.commits.length} commit{group.commits.length > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex flex-col gap-2.5">
                          {group.commits.map((commit, idx) => (
                          <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 pl-3 border-l-2 border-[var(--color-border)] hover:border-[var(--color-accent-info)] transition-colors">
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-mono font-bold text-[var(--color-accent-info)]">{commit.sha.substring(0, 8)}</span>
                                <span className="text-[9px] text-[var(--color-text-secondary)] font-mono">
                                  {commit.date ? new Date(commit.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}
                                </span>
                              </div>
                              <span className="text-xs font-semibold mt-1 leading-relaxed text-[var(--color-text-primary)] break-words">{commit.msg}</span>
                            </div>
                            <div className="flex gap-1.5 text-[9px] font-mono shrink-0 pl-3 sm:pl-0">
                              <span className="text-[var(--color-accent-success)] bg-emerald-500/10 px-1.5 py-0.5 rounded">+{commit.additions}</span>
                              <span className="text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">-{commit.deletions}</span>
                            </div>
                          </div>
                        ))}
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
                    <div key={idx} className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-mono text-[var(--color-text-secondary)]">{pr.repo}</span>
                        <span className="text-xs font-semibold mt-0.5 break-words">#{pr.number}: {pr.title}</span>
                      </div>
                      <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full shrink-0 self-start sm:self-auto ${pr.state === "merged" ? "bg-emerald-500/10 text-[var(--color-accent-success)] border border-emerald-500/20" : "bg-indigo-500/10 text-[var(--color-accent-info)] border border-indigo-500/20"}`}>
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
      {/* Right Column: Export Panel */}
      <ExportPanel isExporting={isExporting} handleExport={handleExport} />
    </div>
  );
}
