"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Email atau Passkey salah. Gunakan kredensial demo di bawah.");
      } else {
        router.push("/dashboard/reports");
      }
    } catch (err) {
      setError("Terjadi kesalahan sistem saat masuk.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError("");
    setIsLoading(true);

    try {
      const res = await signIn("credentials", {
        email: demoEmail,
        password: demoPass,
        redirect: false,
      });

      if (res?.error) {
        setError("Gagal masuk menggunakan akun demo.");
      } else {
        router.push("/dashboard/reports");
      }
    } catch (err) {
      setError("Terjadi kesalahan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#090D16] text-[#F8FAFC] font-sans p-6">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[20%] left-[10%] w-[300px] h-[300px] rounded-full bg-indigo-500/10 blur-[80px]"></div>
        <div className="absolute bottom-[20%] right-[10%] w-[300px] h-[300px] rounded-full bg-emerald-500/10 blur-[80px]"></div>
      </div>

      <div className="w-full max-w-md z-10 flex flex-col gap-6">
        {/* Portal Header */}
        <div className="flex flex-col items-center gap-2 text-center mb-2">
          <div className="flex items-center gap-2">
            <svg className="w-9 h-9 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="font-mono font-bold text-2xl tracking-wider">DevReport</span>
          </div>
          <p className="text-xs font-mono text-[#94A3B8] tracking-widest uppercase mt-1">PT Mili Cipta Karya</p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-[#1E293B] bg-[#121824] p-8 shadow-xl">
          <h2 className="text-lg font-bold font-mono tracking-tight text-center mb-6">Autentikasi Internal</h2>

          {error && (
            <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-xs font-mono text-center mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleCredentialsLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono font-semibold uppercase tracking-wider text-[#94A3B8]">
                Email Kantor
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dev@mili.id"
                className="w-full px-4 py-2.5 rounded-xl border border-[#1E293B] bg-[#090D16] focus:outline-none focus:border-[#10B981] transition-colors text-sm font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono font-semibold uppercase tracking-wider text-[#94A3B8]">
                Passkey / Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-[#1E293B] bg-[#090D16] focus:outline-none focus:border-[#10B981] transition-colors text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-[#10B981] hover:opacity-90 font-mono font-semibold text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? "Memproses..." : "Masuk ke Sistem"}
            </button>
          </form>

          {/* GitHub OAuth Button */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute w-full border-t border-[#1E293B]"></div>
            <span className="relative px-3 bg-[#121824] text-[10px] font-mono font-bold uppercase tracking-wider text-[#94A3B8]">atau</span>
          </div>

          <button
            onClick={() => signIn("github")}
            className="w-full py-3 rounded-xl border border-[#1E293B] hover:bg-[#1E293B] font-mono font-semibold text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.197 22 16.44 22 12.017 22 6.484 17.522 2 12 2z" />
            </svg>
            Masuk dengan GitHub
          </button>
        </div>

        {/* Demo Credentials Box */}
        <div className="rounded-2xl border border-[#1E293B]/60 bg-[#121824]/50 p-6 flex flex-col gap-3">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#10B981] flex items-center gap-1.5">
            🔑 Akun Uji Coba (Demo Logins)
          </h3>
          <p className="text-xs text-[#94A3B8] leading-relaxed font-sans">
            Gunakan kredensial berikut untuk masuk sebagai Developer atau Manajemen:
          </p>
          <div className="grid grid-cols-2 gap-3 mt-1 text-xs">
            <button
              onClick={() => handleDemoLogin("dev@mili.id", "dev123")}
              className="p-3 rounded-xl border border-[#1E293B] hover:border-[#10B981] bg-[#090D16] text-left transition-all cursor-pointer"
            >
              <span className="font-bold text-[#6366F1] block">Developer Role</span>
              <span className="font-mono text-[10px] text-[#94A3B8] block mt-1">dev@mili.id / dev123</span>
            </button>
            <button
              onClick={() => handleDemoLogin("manager@mili.id", "manager123")}
              className="p-3 rounded-xl border border-[#1E293B] hover:border-[#10B981] bg-[#090D16] text-left transition-all cursor-pointer"
            >
              <span className="font-bold text-amber-400 block">Manajemen Role</span>
              <span className="font-mono text-[10px] text-[#94A3B8] block mt-1">manager@mili.id / manager123</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
