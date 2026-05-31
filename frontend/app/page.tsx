"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { EventList } from "@/components/calendar/EventList";
import { KnowledgePanel } from "@/components/KnowledgePanel";

const SESSION_ID = "default-session";

type Tab = "chat" | "calendar" | "knowledge";

export default function Home() {
  const [tab, setTab] = useState<Tab>("chat");

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar active={tab} onChange={setTab} />

      <main className="flex flex-1 overflow-hidden">
        <div className={`flex flex-col flex-1 overflow-hidden ${tab === "chat" ? "" : "hidden"}`}>
          <div className="px-4 py-3 border-b font-semibold text-sm">AI 비서</div>
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
