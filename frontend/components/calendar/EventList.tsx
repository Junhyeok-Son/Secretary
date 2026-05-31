"use client";

import { useEvents } from "@/hooks/useEvents";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, RefreshCw, Zap } from "lucide-react";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";

function formatEventDate(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const dateStr = isToday(s) ? "TODAY" : isTomorrow(s) ? "TOMORROW" : format(s, "MM.dd EEE", { locale: ko }).toUpperCase();
  const timeStr = `${format(s, "HH:mm")} — ${format(e, "HH:mm")}`;
  return { dateStr, timeStr };
}

export function EventList({ sessionId }: { sessionId: string }) {
  const { events, loading, reload, remove } = useEvents(sessionId);

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-400/10">
        <div className="flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-cyan-400" />
          <span className="text-xs tracking-[0.2em] text-cyan-400 uppercase font-medium">Schedule Matrix</span>
        </div>
        <button
          onClick={reload}
          disabled={loading}
          className="w-7 h-7 rounded border border-cyan-400/20 flex items-center justify-center text-cyan-400/50 hover:text-cyan-400 hover:border-cyan-400/40 transition-colors"
        >
          <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
        </button>
      </div>

      <ScrollArea className="flex-1">
        {events.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <p className="text-xs text-cyan-400/30 tracking-widest">// NO SCHEDULED EVENTS</p>
            <p className="text-[10px] text-cyan-400/15">AI에게 일정 추가를 요청하세요</p>
          </div>
        )}

        <div className="flex flex-col gap-0 px-3 py-2">
          {events.map((ev, i) => {
            const { dateStr, timeStr } = formatEventDate(ev.start_at, ev.end_at);
            const past = isPast(new Date(ev.end_at));
            const today = isToday(new Date(ev.start_at));
            const tomorrow = isTomorrow(new Date(ev.start_at));

            return (
              <div
                key={ev.id}
                className={cn(
                  "group relative flex items-center gap-3 px-3 py-3 rounded border-l-2 mb-2 transition-all",
                  past
                    ? "border-l-cyan-900/50 bg-transparent opacity-30"
                    : today
                    ? "border-l-cyan-400 bg-cyan-400/5 shadow-[inset_0_0_20px_rgba(0,212,255,0.03)]"
                    : tomorrow
                    ? "border-l-purple-400 bg-purple-400/5"
                    : "border-l-cyan-400/20 bg-transparent hover:bg-cyan-400/3"
                )}
              >
                {/* 왼쪽 시간 블록 */}
                <div className="flex-shrink-0 w-16 text-right">
                  <p className={cn(
                    "text-[10px] font-bold tracking-wider",
                    today ? "text-cyan-400" : tomorrow ? "text-purple-400" : "text-cyan-400/40"
                  )}>
                    {dateStr}
                  </p>
                  <p className="text-[10px] text-cyan-400/30 mt-0.5">{timeStr}</p>
                </div>

                {/* 구분선 */}
                <div className={cn(
                  "w-px h-8 flex-shrink-0",
                  today ? "bg-cyan-400/40" : tomorrow ? "bg-purple-400/40" : "bg-cyan-400/10"
                )} />

                {/* 이벤트 정보 */}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium truncate",
                    today ? "text-cyan-100" : "text-cyan-200/70"
                  )}>
                    {ev.title}
                  </p>
                  {ev.location && (
                    <p className="text-[10px] text-cyan-400/30 truncate mt-0.5">{ev.location}</p>
                  )}
                </div>

                {/* 삭제 버튼 */}
                <button
                  onClick={() => remove(ev.id)}
                  className="flex-shrink-0 w-6 h-6 rounded border border-red-400/0 flex items-center justify-center text-red-400/0 group-hover:border-red-400/30 group-hover:text-red-400/50 hover:!text-red-400 hover:!border-red-400/60 transition-all"
                >
                  <Trash2 className="h-3 w-3" />
                </button>

                {/* TODAY 뱃지 */}
                {today && (
                  <span className="absolute top-1 right-8 text-[8px] text-cyan-400 tracking-widest opacity-60">LIVE</span>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
