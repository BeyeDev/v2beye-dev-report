import { EpicItem, TaskItem, DevReportItem } from "@/types/report";
import { StarRating } from "./StarRating";

interface ManagementDashboardProps {
  managementData: {
    stats: {
      sprintName: string;
      completedTasks: number;
      activeBugs: number;
      progressPercent: number;
    };
    epics: EpicItem[];
    activeTasks: TaskItem[];
    reports: DevReportItem[];
  } | null;
}

export function ManagementDashboard({ managementData }: ManagementDashboardProps) {
  return (
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
        </div>
      </div>
    </div>
  );
}
