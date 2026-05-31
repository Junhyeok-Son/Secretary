"use client";

import { useState, useRef, useCallback } from "react";
import { streamChat } from "@/lib/api";

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
};

export function useChat(sessionId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;

      const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text };
      const assistantId = crypto.randomUUID();
      const assistantMsg: Message = { id: assistantId, role: "assistant", content: "", pending: true };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setLoading(true);

      abortRef.current = new AbortController();
      try {
        for await (const delta of streamChat(text, sessionId, abortRef.current.signal)) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + delta } : m,
            ),
          );
        }
      } catch (e: unknown) {
        if (e instanceof Error && e.name !== "AbortError") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: "오류가 발생했습니다.", pending: false } : m,
            ),
          );
        }
      } finally {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, pending: false } : m)),
        );
        setLoading(false);
      }
    },
    [loading, sessionId],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { messages, loading, send, stop };
}
