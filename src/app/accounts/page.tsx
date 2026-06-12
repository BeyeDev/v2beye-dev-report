"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface GitHubAccount {
  username: string;
  avatarUrl: string;
  reposCount: number;
  status: "Active" | "Expired";
  connectedAt: string;
}

interface Repository {
  name: string;
  owner: string;
  language: string;
  commitsCount: number;
  isVisible: boolean;
  lastSynced: string;
  isSyncing?: boolean;
}

export default function AccountsPage() {
  const { data: session } = useSession();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [searchQuery, setSearchQuery] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newUsername, setNewUsername] = useState("");

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // State data untuk akun GitHub
  const [accounts, setAccounts] = useState<GitHubAccount[]>([
    {
      username: "yudiasmoro-star",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80",
      reposCount: 3,
      status: "Active",
      connectedAt: "10 Juni 2026",
    },
    {
      username: "BeyeDev",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80",
      reposCount: 4,
      status: "Active",
      connectedAt: "12 Juni 2026",
    },
  ]);

  // State data untuk repositori terpantau
  const [repos, setRepos] = useState<Repository[]>([
    { name: "v3dsc17-ownhost", owner: "yudiasmoro-star", language: "TypeScript", commitsCount: 24, isVisible: true, lastSynced: "2 jam yang lalu" },
    { name: "V2-DSC17-DASH", owner: "yudiasmoro-star", language: "TypeScript", commitsCount: 14, isVisible: true, lastSynced: "4 jam yang lalu" },
    { name: "dsc17-dash", owner: "yudiasmoro-star", language: "None", commitsCount: 0, isVisible: false, lastSynced: "Belum disinkronkan" },
    { name: "MyMaiyah-TWS", owner: "BeyeDev", language: "TypeScript", commitsCount: 18, isVisible: true, lastSynced: "1 jam yang lalu" },
    { name: "OWNV4-DSC17-2026", owner: "BeyeDev", language: "TypeScript", commitsCount: 14, isVisible: true, lastSynced: "6 jam yang lalu" },
    { name: "maiyah-news-front", owner: "BeyeDev", language: "TypeScript", commitsCount: 2, isVisible: false, lastSynced: "12 hari yang lalu" },
    { name: "web-mili-dev", owner: "BeyeDev", language: "TypeScript", commitsCount: 15, isVisible: true, lastSynced: "30 menit yang lalu" },
  ]);

  // Toggle visibilitas repo
  const handleToggleVisibility = (index: number) => {
    setRepos((prev) =>
      prev.map((r, idx) => (idx === index ? { ...r, isVisible: !r.isVisible } : r))
    );
  };

  // Simulasi sinkronisasi per repo
  const handleSyncRepo = (index: number) => {
    setRepos((prev) =>
      prev.map((r, idx) => (idx === index ? { ...r, isSyncing: true } : r))
    );

    setTimeout(() => {
      setRepos((prev) =>
        prev.map((r, idx) =>
          idx === index ? { ...r, isSyncing: false, lastSynced: "Baru saja", commitsCount: r.commitsCount + 1 } : r
        )
      );
    }, 2000);
  };

  // Hubungkan akun baru
  const handleConnectAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) return;

    setIsConnecting(true);
    setTimeout(() => {
      const newAcc: GitHubAccount = {
        username: newUsername,
        avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80",
        reposCount: 0,
        status: "Active",
        connectedAt: "Hari ini",
      };
      setAccounts((prev) => [...prev, newAcc]);
      setIsConnecting(false);
      setShowModal(false);
      setNewUsername("");
    }, 1500);
  };

  // Filter repo berdasarkan pencarian
  const filteredRepos = repos.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.owner.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-border)] text-[var(--color-text-secondary)] font-mono">Panel</span>
        </div>

        <nav className="hidden md:flex items-center gap-6 font-mono text-sm">
          <Link href="/accounts" className="text-[var(--color-accent-success)] border-b border-[var(--color-accent-success)] pb-1 font-bold">Akun GitHub</Link>
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
      {session && (session.user as any).role === "Manajemen" ? (
        <main className="pt-28 pb-16 px-6 max-w-2xl mx-auto w-full flex-1 flex flex-col justify-center items-center gap-6">
          <div className="bento-card bg-[var(--color-card)] border border-[var(--color-border)] p-8 text-center flex flex-col items-center gap-4 shadow-xl">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold font-mono tracking-tight">Akses Terbatas (Unauthorized)</h1>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed font-sans">
              Maaf, peran Anda (**Manajemen**) hanya memiliki hak akses baca-saja (Read-Only) terhadap laporan kerja developer. Anda tidak memiliki izin untuk mengelola akun GitHub atau visibilitas repositori proyek.
            </p>
            <div className="flex gap-4 mt-2">
              <Link href="/dashboard/reports" className="px-5 py-2.5 text-xs font-mono font-semibold rounded-xl bg-[var(--color-accent-success)] text-white hover:opacity-90 transition-all cursor-pointer">
                Kembali ke Laporan Kerja
              </Link>
            </div>
          </div>
        </main>
      ) : (
        <main className="pt-28 pb-16 px-6 max-w-7xl mx-auto w-full flex-1 flex flex-col gap-6">
          {/* Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold font-mono tracking-tight">Koneksi Multi-Akun</h1>
              <p className="text-[var(--color-text-secondary)] mt-1">Kelola akun GitHub Anda dan pilih repositori untuk pelaporan.</p>
            </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 font-mono font-semibold rounded-xl bg-[var(--color-accent-success)] text-white hover:opacity-90 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Hubungkan Akun Baru
          </button>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Connected Accounts List */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="bento-card bg-[var(--color-card)] border border-[var(--color-border)] p-6">
              <h2 className="text-lg font-bold font-mono mb-4 border-b border-[var(--color-border)] pb-2">Akun Terhubung</h2>
              
              <div className="flex flex-col gap-4">
                {accounts.map((acc, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]">
                    <div className="flex items-center gap-3">
                      <img src={acc.avatarUrl} alt={acc.username} className="w-12 h-12 rounded-xl object-cover border border-[var(--color-border)]" />
                      <div>
                        <span className="font-mono font-bold text-sm block">{acc.username}</span>
                        <span className="text-xs text-[var(--color-text-secondary)]">Terhubung: {acc.connectedAt}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${acc.status === "Active" ? "bg-emerald-500/10 text-[var(--color-accent-success)] border border-emerald-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"}`}>
                        {acc.status}
                      </span>
                      <span className="text-xs text-[var(--color-text-secondary)] font-mono">{acc.reposCount} Repos</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bento-card bg-[var(--color-card)] border border-[var(--color-border)] p-6">
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-[var(--color-accent-success)] mb-2">💡 Tips Keamanan</h3>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                Token akses GitHub Anda disimpan dengan enkripsi militer AES-256 di database terenkripsi kami. Anda dapat menghapus otorisasi atau memutuskan sambungan akun kapan saja dari pengaturan.
              </p>
            </div>
          </div>

          {/* Column 2 & 3: Repositories List */}
          <div className="lg:col-span-2">
            <div className="bento-card bg-[var(--color-card)] border border-[var(--color-border)] p-6 h-full flex flex-col justify-between">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-[var(--color-border)] pb-4">
                  <h2 className="text-lg font-bold font-mono">Daftar Repositori Terpantau</h2>
                  
                  {/* Search Bar */}
                  <div className="relative w-full sm:w-64">
                    <input
                      type="text"
                      placeholder="Cari repositori..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] focus:outline-none focus:border-[var(--color-accent-success)] transition-colors"
                    />
                    <svg className="w-5 h-5 absolute left-3 top-2.5 text-[var(--color-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>

                {/* Repos List */}
                <div className="flex flex-col gap-3 max-h-[450px] overflow-y-auto pr-2">
                  {filteredRepos.length > 0 ? (
                    filteredRepos.map((repo, idx) => {
                      const absoluteIdx = repos.findIndex((r) => r.name === repo.name && r.owner === repo.owner);
                      return (
                        <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] transition-all hover:border-slate-400 dark:hover:border-slate-700">
                          <div className="flex items-center gap-3">
                            {/* Toggle Visibilitas */}
                            <button
                              onClick={() => handleToggleVisibility(absoluteIdx)}
                              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${repo.isVisible ? "bg-[var(--color-accent-success)]" : "bg-slate-300 dark:bg-slate-700"}`}
                            >
                              <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${repo.isVisible ? "translate-x-5" : "translate-x-0"}`}></div>
                            </button>
                            <div>
                              <span className="font-mono text-xs text-[var(--color-text-secondary)] block">{repo.owner} /</span>
                              <span className="font-mono font-bold text-sm">{repo.name}</span>
                              <div className="flex items-center gap-3 text-[10px] text-[var(--color-text-secondary)] mt-1">
                                <span className="px-1.5 py-0.5 rounded bg-[var(--color-border)] font-mono">{repo.language}</span>
                                <span>Sinkronisasi: {repo.lastSynced}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="text-xs font-mono font-semibold">{repo.commitsCount} Commits</span>
                            <button
                              onClick={() => handleSyncRepo(absoluteIdx)}
                              disabled={repo.isSyncing}
                              className={`p-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-border)] transition-all cursor-pointer ${repo.isSyncing ? "opacity-50 cursor-wait" : ""}`}
                              title="Sinkronkan repo ini"
                            >
                              {repo.isSyncing ? (
                                <svg className="w-4 h-4 animate-spin text-[var(--color-accent-info)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 15.89M21 21v-5h-.581" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4 text-[var(--color-accent-info)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 15.89M21 21v-5h-.581" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12 text-[var(--color-text-secondary)] font-mono text-sm">
                      Tidak ada repositori ditemukan.
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--color-border)] mt-6 flex justify-between items-center text-xs text-[var(--color-text-secondary)]">
                <span>Total terpantau: {repos.filter((r) => r.isVisible).length} repo</span>
                <span className="font-mono">Terakhir sinkronisasi massal: 30 menit yang lalu</span>
              </div>
            </div>
          </div>
        </div>
      </main>
      )}

      {/* Connect Account Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl w-full max-w-md p-6 shadow-2xl transition-all scale-100">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3 mb-4">
              <h3 className="font-bold font-mono text-lg">Hubungkan Akun GitHub</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-border)] transition-all cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleConnectAccount} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                  Username GitHub
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: BeyeDev"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] focus:outline-none focus:border-[var(--color-accent-success)] transition-colors text-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                  GitHub Personal Access Token (PAT)
                </label>
                <input
                  type="password"
                  required
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] focus:outline-none focus:border-[var(--color-accent-success)] transition-colors text-sm"
                />
                <span className="text-[10px] text-[var(--color-text-secondary)] leading-relaxed">
                  Harus memiliki hak akses `repo` dan `read:user`. Token disimpan terenkripsi secara aman.
                </span>
              </div>

              <div className="flex items-center gap-3 justify-end pt-3 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-[var(--color-border)] text-sm font-mono cursor-pointer hover:bg-[var(--color-border)]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isConnecting}
                  className="px-4 py-2 rounded-xl bg-[var(--color-accent-success)] text-white text-sm font-mono font-semibold cursor-pointer hover:opacity-90 transition-all flex items-center gap-2"
                >
                  {isConnecting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 15.89M21 21v-5h-.581" />
                      </svg>
                      Menghubungkan...
                    </>
                  ) : (
                    "Otorisasi Akun"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto py-10 px-6 border-t border-[var(--color-border)] bg-[var(--color-card)]/55 text-center text-xs text-[var(--color-text-secondary)]">
        <p>© 2026 PT Mili Cipta Karya. All rights reserved.</p>
      </footer>
    </div>
  );
}
