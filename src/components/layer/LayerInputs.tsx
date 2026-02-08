"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface LayerInputsProps {
  roomId: Id<"rooms">;
  threadId: Id<"threads">;
  language: "ja" | "en";
}

const FIXED_QUESTIONS = [
  {
    id: "goal",
    ja: "この議論で決めたいゴールは？",
    en: "What is the main goal of this discussion?",
  },
  {
    id: "constraints",
    ja: "制約（期限/予算/体制）は？",
    en: "What are the constraints (time/budget/team)?",
  },
  {
    id: "risks",
    ja: "想定リスクは？",
    en: "What are the expected risks?",
  },
  {
    id: "success",
    ja: "成功の判断基準は？",
    en: "What is the success criterion?",
  },
];

export default function LayerInputs({ roomId, threadId, language }: LayerInputsProps) {
  const existingInputs = useQuery(api.layerInputs.getLayerInputs, { threadId });
  const saveInputs = useMutation(api.layerInputs.saveLayerInputs);

  const [memo, setMemo] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [discussionNote, setDiscussionNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!existingInputs) {
      return;
    }

    setMemo(existingInputs.memo ?? "");
    if (existingInputs.questionnaire && typeof existingInputs.questionnaire === "object") {
      setAnswers(existingInputs.questionnaire as Record<string, string>);
    }

    if (existingInputs.interview && typeof existingInputs.interview === "object") {
      const interview = existingInputs.interview as Record<string, unknown>;
      const note = typeof interview.discussionNote === "string" ? interview.discussionNote : "";
      setDiscussionNote(note);
    }
  }, [existingInputs]);

  const onSave = async () => {
    setSaving(true);
    try {
      await saveInputs({
        roomId,
        threadId,
        memo: memo.trim() ? memo.trim() : undefined,
        questionnaire:
          Object.keys(answers).length > 0
            ? JSON.stringify(answers)
            : undefined,
        interview:
          discussionNote.trim().length > 0
            ? JSON.stringify({ discussionNote: discussionNote.trim() })
            : undefined,
      });
      alert(language === "ja" ? "保存しました" : "Saved");
    } catch (error: any) {
      alert(error.message || (language === "ja" ? "保存に失敗しました" : "Failed to save"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 rounded-lg border border-border bg-card p-4">
      <div>
        <h3 className="text-lg font-semibold text-fg">
          {language === "ja" ? "簡易ディスカッション入力" : "Quick Discussion Input"}
        </h3>
        <p className="mt-1 text-xs text-muted-fg">
          {language === "ja"
            ? "固定質問で要点を揃え、自由記述で深掘りします"
            : "Use fixed prompts for alignment, then add free-form detail"}
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-fg">
          {language === "ja" ? "メモ" : "Memo"}
        </label>
        <textarea
          value={memo}
          onChange={(event) => setMemo(event.target.value)}
          rows={3}
          placeholder={language === "ja" ? "背景や補足を記入..." : "Background notes..."}
          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-fg focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="space-y-3">
        {FIXED_QUESTIONS.map((question) => (
          <div key={question.id}>
            <label className="mb-1 block text-sm text-muted-fg">
              {language === "ja" ? question.ja : question.en}
            </label>
            <input
              value={answers[question.id] ?? ""}
              onChange={(event) =>
                setAnswers((prev) => ({
                  ...prev,
                  [question.id]: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder={language === "ja" ? "入力..." : "Type your answer..."}
            />
          </div>
        ))}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-fg">
          {language === "ja" ? "自由記述（議論メモ）" : "Free-form Discussion Note"}
        </label>
        <textarea
          value={discussionNote}
          onChange={(event) => setDiscussionNote(event.target.value)}
          rows={4}
          placeholder={
            language === "ja"
              ? "判断の背景、未解決論点、次アクションなど..."
              : "Context, unresolved points, next actions..."
          }
          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-fg focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <button
        onClick={onSave}
        disabled={saving}
        className="w-full rounded-lg bg-primary px-4 py-2 font-medium text-primary-fg transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "..." : language === "ja" ? "保存" : "Save"}
      </button>
    </div>
  );
}
