"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveSecret } from "@/lib/auth";
import { Bot } from "lucide-react";

export function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [secret, setSecret] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secret.trim()) return;
    setLoading(true);
    setError("");

    // 키 검증: 실제 API 호출로 확인
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001"}/api/v1/events/`,
        { headers: { Authorization: `Bearer ${secret}` } },
      );
      if (res.status === 401) {
        setError("잘못된 비밀 키입니다.");
        return;
      }
      saveSecret(secret);
      onLogin();
    } catch {
      setError("서버에 연결할 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-6 px-8">
      <div className="flex flex-col items-center gap-2">
        <Bot className="h-12 w-12 text-primary" />
        <h1 className="text-2xl font-bold">Secretary AI</h1>
        <p className="text-sm text-muted-foreground">비밀 키를 입력하세요</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-3">
        <Input
          type="password"
          placeholder="비밀 키"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          autoFocus
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={loading || !secret.trim()} className="w-full">
          {loading ? "확인 중..." : "로그인"}
        </Button>
      </form>
    </div>
  );
}
