"use client";

import { useState } from "react";
import { addKnowledge } from "@/lib/api";
import { Database } from "lucide-react";

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
    <div className="flex flex-col h-full px-6 py-5 gap-4">
      {/* 헤더 */}
      <div className="flex items-center gap-2">
        <Database className="h-4 w-4 text-cyan-400" />
        <span className="text-xs tracking-[0.2em] text-cyan-400 uppercase font-medium">Knowledge Matrix</span>
      </div>

      <p className="text-[11px] text-cyan-400/30 leading-relaxed">
        // 기억시킬 정보를 입력하세요.<br />
        // AI가 대화 중 지식 그래프에서 참조합니다.
      </p>

      {/* 텍스트 입력 */}
      <div className="flex-1 relative neon-border rounded overflow-hidden">
        <div className="absolute top-2 left-3 text-[10px] text-cyan-400/30 tracking-widest pointer-events-none">
          // INPUT DATA
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="예: 나는 매주 월요일 오전 9시에 팀 스탠드업을 한다."
          className="w-full h-full bg-transparent text-sm text-cyan-100/80 placeholder-cyan-900 outline-none resize-none p-3 pt-7 font-mono leading-relaxed"
        />
        {content && (
          <div className="absolute bottom-2 right-3 text-[10px] text-cyan-400/20">
            {content.length} CHARS
          </div>
        )}
      </div>

      {/* 저장 버튼 */}
      <button
        onClick={handleSave}
        disabled={saving || !content.trim()}
        className={cn(
          "w-full py-3 rounded text-sm font-bold tracking-[0.2em] uppercase transition-all",
          saved
            ? "border border-green-400/50 text-green-400 bg-green-400/10 shadow-[0_0_15px_rgba(0,255,136,0.2)]"
            : "neon-glow-btn"
        )}
      >
        {saved ? "// DATA STORED ✓" : saving ? "// PROCESSING..." : "// UPLOAD TO MATRIX"}
      </button>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
