"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: "reports" | "accounts";
}

export function DashboardLayout({ children, activeTab }: DashboardLayoutProps) {
  const { data: session } = useSession();
  const [theme, setTheme] = useState("dark");
  
  useEffect(() => {
    const saved = localStorage.getItem("mc-theme") || "dark";
    setTheme(saved);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("mc-theme", next);
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const isDeveloper = !session || session.user.role === "Developer";

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 bg-[var(--color-bg)] text-[var(--color-text-primary)] font-sans`}>
      {/* Header */}
      <header className="fixed top-4 left-4 right-4 z-50 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 cursor-pointer">
            <svg className="w-8 h-8 text-[var(--color-accent-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="font-mono font-bold text-lg tracking-wider hidden sm:inline">DevReport</span>
          </Link>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-border)] text-[var(--color-text-secondary)] font-mono">
            {activeTab === "reports" ? "Reports" : "Panel"}
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-6 font-mono text-sm">
          {isDeveloper && (
            <Link 
              href="/accounts" 
              className={`hover:text-[var(--color-accent-success)] transition-colors ${activeTab === 'accounts' ? 'text-[var(--color-accent-success)] border-b border-[var(--color-accent-success)] pb-1 font-bold' : ''}`}
            >
              Akun GitHub
            </Link>
          )}
          <Link 
            href="/dashboard/reports" 
            className={`hover:text-[var(--color-accent-success)] transition-colors ${activeTab === 'reports' ? 'text-[var(--color-accent-success)] border-b border-[var(--color-accent-success)] pb-1 font-bold' : ''}`}
          >
            Laporan
          </Link>
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

          <button onClick={() => signOut({ callbackUrl: '/' })} className="px-4 py-2 text-sm font-mono font-semibold rounded-xl bg-[var(--color-border)] hover:opacity-90 transition-all cursor-pointer">
            Keluar
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="pt-28 pb-24 md:pb-16 px-6 max-w-7xl mx-auto w-full flex-1 flex flex-col gap-6">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-card)]/90 backdrop-blur-md border-t border-[var(--color-border)] px-6 py-3.5 flex items-center justify-around shadow-2xl">
        <Link 
          href="/dashboard/reports" 
          className={`flex flex-col items-center gap-1.5 text-[10px] font-mono transition-colors ${activeTab === 'reports' ? 'text-[var(--color-accent-success)] font-bold' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-accent-success)]'}`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={activeTab === 'reports' ? 2.5 : 2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Laporan
        </Link>
        
        {isDeveloper && (
          <Link 
            href="/accounts" 
            className={`flex flex-col items-center gap-1.5 text-[10px] font-mono transition-colors ${activeTab === 'accounts' ? 'text-[var(--color-accent-success)] font-bold' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-accent-success)]'}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={activeTab === 'accounts' ? 2.5 : 2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Akun GitHub
          </Link>
        )}

        <button 
          onClick={() => signOut({ callbackUrl: '/' })} 
          className="flex flex-col items-center gap-1.5 text-[10px] font-mono text-[var(--color-text-secondary)] hover:text-[var(--color-accent-success)] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Keluar
        </button>
      </div>

      {/* Footer */}
      <footer className="mt-auto py-10 pb-28 md:pb-10 px-6 border-t border-[var(--color-border)] bg-[var(--color-card)]/55 text-center text-xs text-[var(--color-text-secondary)]">
        <p>© 2026 PT Mili Cipta Karya. All rights reserved.</p>
      </footer>
    </div>
  );
}
