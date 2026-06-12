"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

interface GitHubAccount {
  username: string;
  avatar_url: string;
}

interface Repository {
  id: string;
  name: string;
  owner: string;
  is_visible: boolean;
}

export default function AccountsPage() {
  const { data: session } = useSession();
  
  const [showModal, setShowModal] = useState(false);
  const [githubToken, setGithubToken] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  
  const [accounts, setAccounts] = useState<GitHubAccount[]>([]);
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");

  const fetchUserData = async () => {
    try {
      const res = await fetch("/api/accounts");
      const data = await res.json();
      if (data.success) {
        setAccounts(data.accounts || []);
        setRepos(data.repos || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const toggleVisibility = async (repoId: string, currentVisibility: boolean) => {
    try {
      // Optimistic update
      setRepos(repos.map(r => r.id === repoId ? { ...r, is_visible: !currentVisibility } : r));
      
      const res = await fetch("/api/repos/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo_id: repoId, is_visible: !currentVisibility })
      });
      const data = await res.json();
      if (!data.success) {
        // Revert on failure
        setRepos(repos.map(r => r.id === repoId ? { ...r, is_visible: currentVisibility } : r));
        alert("Gagal mengubah visibilitas: " + data.error);
      }
    } catch (err) {
      console.error(err);
      // Revert on failure
      setRepos(repos.map(r => r.id === repoId ? { ...r, is_visible: currentVisibility } : r));
    }
  };

  const handleSync = async (repoId: string) => {
    try {
      const res = await fetch("/api/repos/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo_id: repoId })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Sinkronisasi berhasil! ${data.commitsCount} commit baru ditemukan.`);
      } else {
        alert("Sinkronisasi gagal: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat sinkronisasi.");
    }
  };

  const connectAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubToken) return;

    setIsConnecting(true);
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: githubToken })
      });
      const data = await res.json();
      if (data.success) {
        setGithubToken("");
        setShowModal(false);
        await fetchUserData(); // Reload list
      } else {
        alert("Gagal menghubungkan: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Gagal menghubungkan ke server.");
    } finally {
      setIsConnecting(false);
    }
  };

  // Filter repos based on search query
  const filteredRepos = repos.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.owner.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout activeTab="accounts">
      {session && session.user.role === "Manajemen" ? (
        <div className="flex-1 flex flex-col justify-center items-center gap-6 max-w-2xl mx-auto w-full">
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
        </div>
      ) : (
        <>
          {/* Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-6">
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
            {/* Left Column: Connected Accounts */}
            <div className="lg:col-span-1 space-y-4">
              <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[var(--color-text-secondary)] border-b border-[var(--color-border)] pb-2">Akun Terhubung</h2>
              
              {loading ? (
                <div className="space-y-3">
                  {[1, 2].map(i => (
                    <div key={i} className="h-20 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] animate-pulse" />
                  ))}
                </div>
              ) : accounts.length === 0 ? (
                <div className="bento-card bg-[var(--color-card)] border border-dashed border-[var(--color-border)] p-8 text-center flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-[var(--color-border)] flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-[var(--color-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <p className="text-sm font-mono text-[var(--color-text-secondary)]">Belum ada akun GitHub yang terhubung.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {accounts.map((acc) => (
                    <div key={acc.username} className="bento-card bg-[var(--color-card)] border border-[var(--color-border)] p-4 flex items-center gap-4 hover:border-[var(--color-accent-success)] transition-colors">
                      <img src={acc.avatar_url} alt={acc.username} className="w-12 h-12 rounded-full border border-[var(--color-border)]" />
                      <div>
                        <h3 className="font-mono font-bold">{acc.username}</h3>
                        <p className="text-xs text-[var(--color-text-secondary)] flex items-center gap-1 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent-success)]"></span> Aktif
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Repositories */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2">
                <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Repositori Terdeteksi</h2>
                
                {/* Search Bar */}
                <div className="relative">
                  <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input 
                    type="text" 
                    placeholder="Cari repo..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-1.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-sm font-mono focus:outline-none focus:border-[var(--color-accent-success)] transition-colors w-48 lg:w-64"
                  />
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-24 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] animate-pulse" />
                  ))}
                </div>
              ) : repos.length === 0 ? (
                <div className="bento-card bg-[var(--color-card)] border border-[var(--color-border)] p-12 text-center text-[var(--color-text-secondary)] font-mono text-sm">
                  Hubungkan akun GitHub untuk melihat daftar repositori.
                </div>
              ) : filteredRepos.length === 0 ? (
                <div className="bento-card bg-[var(--color-card)] border border-[var(--color-border)] p-12 text-center text-[var(--color-text-secondary)] font-mono text-sm">
                  Tidak ada repositori yang cocok dengan pencarian "{searchQuery}".
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredRepos.map((repo) => (
                    <div key={repo.id} className="bento-card bg-[var(--color-card)] border border-[var(--color-border)] p-5 flex flex-col justify-between gap-4 group">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0">
                          <p className="text-xs text-[var(--color-text-secondary)] font-mono truncate">{repo.owner}</p>
                          <h3 className="font-bold font-mono text-lg truncate group-hover:text-[var(--color-accent-success)] transition-colors">{repo.name}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Sync Button */}
                          <button
                            onClick={() => handleSync(repo.id)}
                            className="p-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all"
                            title="Sinkronisasi Manual"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 15.89M21 21v-5h-.581" />
                            </svg>
                          </button>
                          
                          {/* Toggle Switch */}
                          <button 
                            onClick={() => toggleVisibility(repo.id, repo.is_visible)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${repo.is_visible ? 'bg-[var(--color-accent-success)]' : 'bg-gray-400 dark:bg-gray-600'}`}
                            title={repo.is_visible ? "Sembunyikan dari Laporan" : "Tampilkan di Laporan"}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${repo.is_visible ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs font-mono">
                        <span className={`px-2 py-0.5 rounded-md ${repo.is_visible ? 'bg-[var(--color-accent-success)]/10 text-[var(--color-accent-success)] border border-[var(--color-accent-success)]/20' : 'bg-[var(--color-border)] text-[var(--color-text-secondary)]'}`}>
                          {repo.is_visible ? "Termonitor" : "Diabaikan"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Connection Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bento-card bg-[var(--color-bg)] w-full max-w-md border border-[var(--color-border)] shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between">
              <h3 className="font-mono font-bold text-lg">Hubungkan Akun GitHub</h3>
              <button onClick={() => setShowModal(false)} className="text-[var(--color-text-secondary)] hover:text-red-500 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={connectAccount} className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-mono font-semibold text-[var(--color-text-secondary)] block">Personal Access Token (PAT)</label>
                <input 
                  type="password" 
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="w-full bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-3 font-mono text-sm focus:outline-none focus:border-[var(--color-accent-success)] focus:ring-1 focus:ring-[var(--color-accent-success)] transition-all"
                  required
                />
                <p className="text-xs text-[var(--color-text-secondary)] mt-2">
                  Token membutuhkan scope <code className="bg-[var(--color-border)] px-1 py-0.5 rounded text-[var(--color-text-primary)]">repo</code> dan <code className="bg-[var(--color-border)] px-1 py-0.5 rounded text-[var(--color-text-primary)]">read:user</code>.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-mono font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-border)] transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={!githubToken || isConnecting}
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
    </DashboardLayout>
  );
}
