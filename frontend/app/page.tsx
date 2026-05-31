"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { EventList } from "@/components/calendar/EventList";
import { KnowledgePanel } from "@/components/KnowledgePanel";
import { LoginScreen } from "@/components/LoginScreen";
import { getSecret, clearSecret } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

const SESSION_ID = "default-session";
type Tab = "chat" | "calendar" | "knowledge";

export default function Home() {
  const [tab, setTab] = useState<Tab>("chat");
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    setAuthed(!!getSecret());
  }, []);

  if (authed === null) return null; // 하이드레이션 대기

  if (!authed) {
    return <LoginScreen onLogin={() => setAuthed(true)} />;
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar active={tab} onChange={setTab} />

      <main className="flex flex-1 overflow-hidden flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <span className="font-semibold text-sm">
            {tab === "chat" ? "AI 비서" : tab === "calendar" ? "일정" : "지식 베이스"}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground"
            onClick={() => { clearSecret(); setAuthed(false); }}
            title="로그아웃"
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* 패널 */}
        <div className={`flex flex-col flex-1 overflow-hidden ${tab === "chat" ? "" : "hidden"}`}>
          <ChatPanel sessionId={SESSION_ID} />
        </div>
        {tab === "calendar" && <EventList sessionId={SESSION_ID} />}
        {tab === "knowledge" && <KnowledgePanel />}
      </main>
    </div>
  );
}
