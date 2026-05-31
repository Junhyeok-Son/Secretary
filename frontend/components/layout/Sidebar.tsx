"use client";

import { Bot, CalendarDays, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "chat" | "calendar" | "knowledge";

export function Sidebar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const items: { id: Tab; icon: React.ReactNode; label: string }[] = [
    { id: "chat", icon: <Bot className="h-5 w-5" />, label: "채팅" },
    { id: "calendar", icon: <CalendarDays className="h-5 w-5" />, label: "일정" },
    { id: "knowledge", icon: <Brain className="h-5 w-5" />, label: "지식" },
  ];

  return (
    <aside className="w-16 flex flex-col items-center py-4 gap-2 border-r bg-muted/30">
      <div className="mb-4">
        <Bot className="h-7 w-7 text-primary" />
      </div>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          className={cn(
            "flex flex-col items-center gap-1 p-2 rounded-xl w-12 h-12 justify-center transition-colors text-muted-foreground hover:text-foreground hover:bg-muted",
            active === item.id && "bg-primary/10 text-primary",
          )}
          title={item.label}
        >
          {item.icon}
        </button>
      ))}
    </aside>
  );
}
