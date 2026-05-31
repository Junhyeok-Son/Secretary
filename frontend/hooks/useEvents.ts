"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchEvents, deleteEvent, makeCalendarWS, type Event } from "@/lib/api";

export function useEvents(sessionId: string) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchEvents();
      setEvents(data);
    } finally {
      setLoading(false);
    }
  }, []);

  // 초기 로딩
  useEffect(() => {
    reload();
  }, [reload]);

  // WebSocket 실시간 업데이트
  useEffect(() => {
    const ws = makeCalendarWS(sessionId);
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "event_created") {
          setEvents((prev) => [...prev, msg.data].sort(
            (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime(),
          ));
        } else if (msg.type === "event_updated") {
          setEvents((prev) => prev.map((ev) => ev.id === msg.data.id ? msg.data : ev));
        } else if (msg.type === "event_deleted") {
          setEvents((prev) => prev.filter((ev) => ev.id !== msg.data.id));
        }
      } catch {}
    };
    return () => ws.close();
  }, [sessionId]);

  const remove = useCallback(async (id: string) => {
    await deleteEvent(id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return { events, loading, reload, remove };
}
