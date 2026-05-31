"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { EventList } from "@/components/calendar/EventList";
import { KnowledgePanel } from "@/components/KnowledgePanel";
import { LoginScreen } from "@/components/LoginScreen";
import { getSecret, clearSecret } from "@/lib/auth";
import { LogOut, Wifi } from "lucide-react";

const SESSION_ID = "default-session";
type Tab = "chat" | "calendar" | "knowledge";

const TAB_LABELS: Record<Tab, string> = {
  chat: "// NEURAL_CHAT",
  calendar: "// SCHEDULE_MATRIX",
  knowledge: "// KNOWLEDGE_DB",
};

export default function Home() {
  const [tab, setTab] = useState<Tab>("chat");
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => { setAuthed(!!getSecret()); }, []);
  if (authed === null) return null;
  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar active={tab} onChange={setTab} />

      <main className="flex flex-col flex-1 overflow-hidden">
        {/* 헤더 */}
        <header className="flex items-center justify-between px-4 h-10 border-b border-cyan-400/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-[11px] tracking-[0.15em] text-cyan-400/80 font-medium">
              {TAB_LABELS[tab]}
            </span>
            <span className="text-[10px] text-cyan-400/20">|</span>
            <span className="text-[10px] text-cyan-400/25 tracking-widest">SECRETARY.AI</span>
          </div>
          <div className="flex items-center gap-2">
            <Wifi className="h-3 w-3 text-green-400/60" />
            <span className="text-[9px] text-green-400/40 tracking-widest">ONLINE</span>
            <button
              onClick={() => { clearSecret(); setAuthed(false); }}
              title="로그아웃"
              className="ml-2 w-6 h-6 rounded border border-cyan-400/10 flex items-center justify-center text-cyan-400/20 hover:text-red-400/60 hover:border-red-400/30 transition-colors"
            >
              <LogOut className="h-3 w-3" />
            </button>
          </div>
        </header>

        {/* 패널 */}
        <div className={`flex flex-col flex-1 overflow-hidden ${tab === "chat" ? "" : "hidden"}`}>
          <ChatPanel sessionId={SESSION_ID} />
        </div>
        {tab === "calendar" && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <EventList sessionId={SESSION_ID} />
          </div>
        )}
        {tab === "knowledge" && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <KnowledgePanel />
          </div>
        )}
      </main>
    </div>
  );
}
