"use client";

import { Bot, CalendarDays, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "chat" | "calendar" | "knowledge";

const items: { id: Tab; icon: React.ReactNode; label: string; code: string }[] = [
  { id: "chat",      icon: <Bot className="h-5 w-5" />,         label: "채팅",    code: "01" },
  { id: "calendar",  icon: <CalendarDays className="h-5 w-5" />, label: "일정",    code: "02" },
  { id: "knowledge", icon: <Brain className="h-5 w-5" />,        label: "지식",    code: "03" },
];

export function Sidebar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <aside className="w-16 flex flex-col items-center py-4 gap-1 border-r border-cyan-400/10 bg-[#05050f]">
      {/* 로고 */}
      <div className="mb-6 flex flex-col items-center gap-0.5">
        <div className="w-8 h-8 rounded border border-cyan-400/40 flex items-center justify-center animate-pulse-glow">
          <span className="text-xs font-bold neon-text">S</span>
        </div>
        <span className="text-[8px] text-cyan-400/30 tracking-widest">AI</span>
      </div>

      {/* 메뉴 */}
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          title={item.label}
          className={cn(
            "relative flex flex-col items-center gap-0.5 w-12 py-3 rounded transition-all duration-200 group",
            active === item.id
              ? "text-cyan-400 bg-cyan-400/10 border border-cyan-400/30 shadow-[0_0_10px_rgba(0,212,255,0.15)]"
              : "text-cyan-400/30 hover:text-cyan-400/70 hover:bg-cyan-400/5 border border-transparent"
          )}
        >
          {/* 활성 인디케이터 */}
          {active === item.id && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-cyan-400 rounded-r shadow-[0_0_6px_rgba(0,212,255,0.8)]" />
          )}
          {item.icon}
          <span className="text-[8px] tracking-widest font-medium">{item.code}</span>
        </button>
      ))}

      {/* 하단 장식 */}
      <div className="mt-auto flex flex-col items-center gap-1">
        <div className="w-6 h-px bg-cyan-400/20" />
        <div className="w-3 h-px bg-cyan-400/10" />
      </div>
    </aside>
  );
}
