"use client";

import { useState } from "react";
import { saveSecret } from "@/lib/auth";

export function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [secret, setSecret] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secret.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001"}/api/v1/events/`,
        { headers: { Authorization: `Bearer ${secret}` } },
      );
      if (res.status === 401) { setError("// ACCESS DENIED: invalid key"); return; }
      saveSecret(secret);
      onLogin();
    } catch {
      setError("// ERROR: server unreachable");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-8 px-8 scanline">
      {/* 배경 스캔라인 효과 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent animate-pulse" style={{ top: "30%" }} />
        <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-purple-400/20 to-transparent animate-pulse" style={{ top: "70%", animationDelay: "1s" }} />
      </div>

      <div className="relative flex flex-col items-center gap-3 animate-flicker">
        {/* 로고 */}
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-cyan-400/50 flex items-center justify-center animate-pulse-glow">
            <span className="text-2xl neon-text font-bold">S</span>
          </div>
          <div className="absolute -inset-1 rounded-full border border-cyan-400/20 animate-ping" />
        </div>

        <h1 className="text-3xl font-bold tracking-[0.3em] neon-text">SECRETARY</h1>
        <p className="text-xs tracking-[0.5em] text-cyan-400/60 uppercase">AI Interface v1.0</p>
      </div>

      <form onSubmit={handleSubmit} className="relative w-full max-w-xs flex flex-col gap-4">
        <div className="text-xs text-cyan-400/50 font-mono mb-1">
          <span className="neon-text">›</span> ENTER ACCESS KEY
        </div>

        <div className="relative">
          <input
            type="password"
            placeholder="••••••••••••"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            autoFocus
            className="w-full bg-transparent neon-border rounded px-4 py-3 text-sm text-cyan-300 placeholder-cyan-900 outline-none focus:border-cyan-400/70 focus:shadow-[0_0_15px_rgba(0,212,255,0.2)] transition-all font-mono tracking-widest"
          />
          {secret && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-cyan-400 animate-blink" />
          )}
        </div>

        {error && (
          <p className="text-xs text-red-400 font-mono">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !secret.trim()}
          className="neon-glow-btn rounded px-4 py-3 text-sm font-bold tracking-[0.2em] uppercase disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
            </span>
          ) : "// AUTHENTICATE"}
        </button>
      </form>

      <p className="text-[10px] text-cyan-400/20 tracking-widest">ENCRYPTED · SINGLE-USER MODE</p>
    </div>
  );
}
