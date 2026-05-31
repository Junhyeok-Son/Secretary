"use client";

import { useRef, useEffect, useState, KeyboardEvent } from "react";
import { useChat } from "@/hooks/useChat";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Square, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

export function ChatPanel({ sessionId }: { sessionId: string }) {
  const { messages, loading, send, stop } = useChat(sessionId);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    send(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 px-4 py-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="text-center">
              <p className="text-xs text-cyan-400/40 tracking-widest uppercase mb-4">// SYSTEM ONLINE</p>
              <div className="flex flex-col gap-1 text-xs text-cyan-400/25 font-mono">
                <p>› AI 비서가 준비되었습니다.</p>
                <p>› 일정 추가, 지식 검색, 대화 가능.</p>
                <p className="flex items-center gap-1">
                  › 입력 대기 중
                  <span className="w-1.5 h-3 bg-cyan-400/40 animate-blink inline-block ml-1" />
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 pb-2">
          {messages.map((msg, i) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-2",
                msg.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              {msg.role === "assistant" && (
                <div className="flex-shrink-0 w-5 h-5 rounded border border-cyan-400/40 flex items-center justify-center mt-0.5">
                  <Terminal className="h-3 w-3 text-cyan-400" />
                </div>
              )}

              <div
                className={cn(
                  "max-w-[78%] px-3 py-2 text-sm whitespace-pre-wrap leading-relaxed rounded",
                  msg.role === "user"
                    ? "bg-purple-900/30 border border-purple-400/30 text-purple-100 rounded-br-none"
                    : "bg-cyan-950/40 border border-cyan-400/20 text-cyan-100/90 rounded-bl-none",
                )}
              >
                {msg.role === "assistant" && (
                  <span className="text-[10px] text-cyan-400/50 block mb-1 tracking-wider">SECRETARY.AI</span>
                )}
                {msg.role === "user" && (
                  <span className="text-[10px] text-purple-400/50 block mb-1 tracking-wider">YOU</span>
                )}
                {msg.content}
                {msg.pending && !msg.content && (
                  <span className="inline-flex gap-1 items-center">
                    <span className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce" />
                    <span className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
                    <span className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                  </span>
                )}
                {msg.pending && msg.content && (
                  <span className="inline-block w-1.5 h-3.5 bg-cyan-400 animate-blink ml-0.5 align-middle" />
                )}
              </div>

              {msg.role === "user" && (
                <div className="flex-shrink-0 w-5 h-5 rounded border border-purple-400/40 flex items-center justify-center mt-0.5">
                  <span className="text-[9px] text-purple-400 font-bold">U</span>
                </div>
              )}
            </div>
          ))}
        </div>
        <div ref={bottomRef} />
      </ScrollArea>

      {/* 입력창 */}
      <div className="border-t border-cyan-400/10 px-4 py-3">
        <div className="flex gap-2 items-end neon-border rounded p-2">
          <span className="text-cyan-400/50 text-sm self-center pb-0.5 flex-shrink-0">›</span>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="명령을 입력하세요..."
            rows={1}
            disabled={loading}
            className="flex-1 bg-transparent text-sm text-cyan-100 placeholder-cyan-900 outline-none resize-none min-h-[24px] max-h-28 font-mono"
            style={{ fieldSizing: "content" } as React.CSSProperties}
          />
          {loading ? (
            <button
              onClick={stop}
              className="flex-shrink-0 w-8 h-8 rounded border border-red-400/50 flex items-center justify-center text-red-400 hover:bg-red-400/10 transition-colors"
            >
              <Square className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="flex-shrink-0 w-8 h-8 rounded neon-glow-btn flex items-center justify-center disabled:opacity-20"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <p className="text-[10px] text-cyan-400/20 mt-1 px-1">Enter 전송 · Shift+Enter 줄바꿈</p>
      </div>
    </div>
  );
}
