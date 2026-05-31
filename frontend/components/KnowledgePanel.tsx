"use client";

import { useState } from "react";
import { addKnowledge } from "@/lib/api";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Brain, Plus } from "lucide-react";

export function KnowledgePanel() {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      await addKnowledge(content.trim());
      setContent("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full px-6 py-6 gap-4">
      <div className="flex items-center gap-2">
        <Brain className="h-5 w-5 text-primary" />
        <h2 className="font-semibold">지식 베이스</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        기억시키고 싶은 내용을 입력하면 AI가 대화 중 참고합니다.
      </p>
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="예: 나는 매주 월요일 오전 9시에 팀 스탠드업을 한다."
        className="flex-1 resize-none text-sm min-h-[200px]"
      />
      <Button onClick={handleSave} disabled={saving || !content.trim()} className="w-full gap-2">
        <Plus className="h-4 w-4" />
        {saved ? "저장됨!" : saving ? "저장 중..." : "지식 저장"}
      </Button>
    </div>
  );
}
