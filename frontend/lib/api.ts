import { getSecret } from "./auth";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001";
const WS_BASE = BASE.replace(/^http/, "ws");

function authHeaders(): Record<string, string> {
  const secret = getSecret();
  return secret ? { Authorization: `Bearer ${secret}` } : {};
}

export type Event = {
  id: string;
  title: string;
  description?: string;
  start_at: string;
  end_at: string;
  location?: string;
  status: "confirmed" | "tentative" | "cancelled";
};

export type Knowledge = {
  id: string;
  content: string;
  source?: string;
  tags: string[];
  created_at: string;
};

// ── Events ──────────────────────────────────────────────────────────────────

export async function fetchEvents(start?: string, end?: string): Promise<Event[]> {
  const params = new URLSearchParams();
  if (start) params.set("start", start);
  if (end) params.set("end", end);
  const res = await fetch(`${BASE}/api/v1/events/?${params}`, {
    headers: authHeaders(),
  });
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) throw new Error("Failed to fetch events");
  return res.json();
}

export async function createEvent(payload: Omit<Event, "id">): Promise<Event> {
  const res = await fetch(`${BASE}/api/v1/events/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create event");
  return res.json();
}

export async function deleteEvent(id: string): Promise<void> {
  await fetch(`${BASE}/api/v1/events/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

// ── Knowledge ────────────────────────────────────────────────────────────────

export async function addKnowledge(content: string, tags: string[] = []): Promise<Knowledge> {
  const res = await fetch(`${BASE}/api/v1/knowledge/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ content, source: "manual", tags }),
  });
  if (!res.ok) throw new Error("Failed to add knowledge");
  return res.json();
}

// ── Chat SSE ─────────────────────────────────────────────────────────────────

export async function* streamChat(
  message: string,
  sessionId: string,
  signal?: AbortSignal,
): AsyncGenerator<string> {
  const res = await fetch(`${BASE}/api/v1/chat/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ message, session_id: sessionId }),
    signal,
  });
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.body) return;
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const raw = line.slice(5).trim();
      if (raw === "[DONE]") return;
      try {
        const data = JSON.parse(raw);
        if (data.delta) yield data.delta;
      } catch {}
    }
  }
}

// ── WebSocket helpers ─────────────────────────────────────────────────────────

export function makeCalendarWS(sessionId: string): WebSocket {
  const secret = getSecret();
  return new WebSocket(`${WS_BASE}/ws/${sessionId}?secret=${encodeURIComponent(secret)}`);
}
