"use client";

import { useEvents } from "@/hooks/useEvents";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, RefreshCw, CalendarDays } from "lucide-react";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";

function formatEventDate(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const dateStr = isToday(s)
    ? "오늘"
    : isTomorrow(s)
    ? "내일"
    : format(s, "M월 d일 (EEE)", { locale: ko });
  const timeStr = `${format(s, "HH:mm")} ~ ${format(e, "HH:mm")}`;
  return { dateStr, timeStr };
}

export function EventList({ sessionId }: { sessionId: string }) {
  const { events, loading, reload, remove } = useEvents(sessionId);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="font-semibold text-sm flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          다가오는 일정
        </h2>
        <Button variant="ghost" size="icon" onClick={reload} disabled={loading}>
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {events.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
            등록된 일정이 없어요
          </div>
        )}
        <div className="flex flex-col divide-y">
          {events.map((ev) => {
            const { dateStr, timeStr } = formatEventDate(ev.start_at, ev.end_at);
            const past = isPast(new Date(ev.end_at));
            return (
              <div
                key={ev.id}
                className={cn(
                  "flex items-start gap-3 px-4 py-3 group hover:bg-muted/50 transition-colors",
                  past && "opacity-50",
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{ev.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {dateStr} · {timeStr}
                  </p>
                  {ev.location && (
                    <p className="text-xs text-muted-foreground truncate">{ev.location}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {isToday(new Date(ev.start_at)) && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">오늘</Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                    onClick={() => remove(ev.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
