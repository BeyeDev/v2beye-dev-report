interface ExportPanelProps {
  isExporting: "none" | "pdf" | "excel" | "share";
  handleExport: (type: "pdf" | "excel" | "share") => void;
}

export function ExportPanel({ isExporting, handleExport }: ExportPanelProps) {
  return (
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
  );
}
