"use client";

import { useRef, useEffect, useState, KeyboardEvent } from "react";
import { useChat } from "@/hooks/useChat";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Square } from "lucide-react";
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
      {/* 메시지 목록 */}
      <ScrollArea className="flex-1 px-4 py-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-2">
            <p className="text-lg font-medium">안녕하세요!</p>
            <p className="text-sm">일정을 추가하거나 무엇이든 물어보세요.</p>
          </div>
        )}
        <div className="flex flex-col gap-4 pb-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex",
                msg.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm",
                )}
              >
                {msg.content}
                {msg.pending && !msg.content && (
                  <span className="inline-flex gap-1">
                    <span className="animate-bounce delay-0">·</span>
                    <span className="animate-bounce delay-150">·</span>
                    <span className="animate-bounce delay-300">·</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        <div ref={bottomRef} />
      </ScrollArea>

      {/* 입력창 */}
      <div className="border-t px-4 py-3 flex gap-2 items-end">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="메시지를 입력하세요... (Enter로 전송, Shift+Enter 줄바꿈)"
          className="resize-none min-h-[44px] max-h-32 text-sm"
          rows={1}
          disabled={loading}
        />
        {loading ? (
          <Button size="icon" variant="outline" onClick={stop} className="shrink-0">
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button size="icon" onClick={handleSend} className="shrink-0" disabled={!input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
