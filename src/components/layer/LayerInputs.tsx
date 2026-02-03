// src/components/layer/LayerInputs.tsx
// 3レイヤー入力（メモ/アンケート/インタビュー）

"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

interface LayerInputsProps {
  roomId: Id<"rooms">;
  threadId: Id<"threads">;
  language: "ja" | "en";
}

// アンケートの固定質問（最大5問）
const QUESTIONNAIRE_QUESTIONS = [
  { id: "deadline", label: "期限はありますか？", type: "text" },
  { id: "budget", label: "予算はありますか？", type: "text" },
  { id: "stake", label: "利害関係はありますか？", type: "text" },
  { id: "decision_target", label: "決定対象はありますか？", type: "text" },
  { id: "priority", label: "優先度は？", type: "text" },
];

// インタビューの条件と質問テンプレート
const INTERVIEW_CONDITIONS = {
  hasDeadline: { label: "期限あり", questions: ["期限はいつまでですか？", "なぜその期限なのですか？", "期限を守れない場合の影響は？"] },
  hasBudget: { label: "予算あり", questions: ["予算の上限は？", "予算の出所は？", "予算が不足した場合の対応は？"] },
  hasStrongStake: { label: "利害関係が強い", questions: ["誰が影響を受けますか？", "影響の大きさは？", "対立する意見はありますか？"] },
};

export default function LayerInputs({ roomId, threadId, language }: LayerInputsProps) {
  const [memo, setMemo] = useState("");
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState<Record<string, string>>({});
  const [interviewAnswers, setInterviewAnswers] = useState<Record<string, string>>({});
  const [showInterview, setShowInterview] = useState(false);
  const [interviewQuestions, setInterviewQuestions] = useState<string[]>([]);

  const existingInputs = useQuery(api.layerInputs.getLayerInputs, { threadId });
  const saveInputs = useMutation(api.layerInputs.saveLayerInputs);

  // 既存の入力を読み込む
  useEffect(() => {
    if (existingInputs) {
      setMemo(existingInputs.memo ?? "");
      if (existingInputs.questionnaire) {
        setQuestionnaireAnswers(existingInputs.questionnaire);
      }
      if (existingInputs.interview) {
        setInterviewAnswers(existingInputs.interview);
        setShowInterview(true);
      }
    }
  }, [existingInputs]);

  // アンケート回答からインタビュー表示条件をチェック
  useEffect(() => {
    const conditions: string[] = [];
    if (questionnaireAnswers.deadline) conditions.push("hasDeadline");
    if (questionnaireAnswers.budget) conditions.push("hasBudget");
    if (questionnaireAnswers.stake) conditions.push("hasStrongStake");

    if (conditions.length > 0) {
      const questions: string[] = [];
      conditions.forEach((cond) => {
        const condData = INTERVIEW_CONDITIONS[cond as keyof typeof INTERVIEW_CONDITIONS];
        if (condData) {
          questions.push(...condData.questions);
        }
      });
      setInterviewQuestions(questions);
      setShowInterview(true);
    } else {
      setShowInterview(false);
      setInterviewAnswers({});
    }
  }, [questionnaireAnswers]);

  const handleSave = async () => {
    try {
      await saveInputs({
        roomId,
        threadId,
        memo: memo || undefined,
        questionnaire: Object.keys(questionnaireAnswers).length > 0 ? JSON.stringify(questionnaireAnswers) : undefined,
        interview: Object.keys(interviewAnswers).length > 0 ? JSON.stringify(interviewAnswers) : undefined,
      });
      alert(language === "ja" ? "保存しました" : "Saved");
    } catch (error: any) {
      alert(error.message || (language === "ja" ? "保存に失敗しました" : "Failed to save"));
    }
  };

  return (
    <div className="space-y-6 p-4 bg-card border border-border rounded-lg">
      <h3 className="text-lg font-semibold text-fg">
        {language === "ja" ? "3レイヤー入力" : "3-Layer Input"}
      </h3>

      {/* メモ欄（常に表示） */}
      <div>
        <label className="block text-sm font-medium text-fg mb-2">
          {language === "ja" ? "メモ" : "Memo"}
        </label>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder={language === "ja" ? "自由記述..." : "Free text..."}
          className="w-full px-3 py-2 border border-border rounded-lg bg-bg text-fg focus:outline-none focus:ring-2 focus:ring-primary/20"
          rows={4}
        />
      </div>

      {/* アンケート（広く浅い固定質問） */}
      <div>
        <label className="block text-sm font-medium text-fg mb-2">
          {language === "ja" ? "アンケート" : "Questionnaire"}
        </label>
        <div className="space-y-3">
          {QUESTIONNAIRE_QUESTIONS.map((q) => (
            <div key={q.id}>
              <label className="block text-sm text-muted-fg mb-1">{q.label}</label>
              <input
                type="text"
                value={questionnaireAnswers[q.id] ?? ""}
                onChange={(e) =>
                  setQuestionnaireAnswers({ ...questionnaireAnswers, [q.id]: e.target.value })
                }
                className="w-full px-3 py-2 border border-border rounded-lg bg-bg text-fg focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder={language === "ja" ? "回答を入力..." : "Enter answer..."}
              />
            </div>
          ))}
        </div>
      </div>

      {/* インタビュー（条件付き表示） */}
      {showInterview && interviewQuestions.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-fg mb-2">
            {language === "ja" ? "インタビュー" : "Interview"}
          </label>
          <div className="space-y-3">
            {interviewQuestions.map((question, idx) => (
              <div key={idx}>
                <label className="block text-sm text-muted-fg mb-1">{question}</label>
                <textarea
                  value={interviewAnswers[question] ?? ""}
                  onChange={(e) =>
                    setInterviewAnswers({ ...interviewAnswers, [question]: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-bg text-fg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  rows={2}
                  placeholder={language === "ja" ? "回答を入力..." : "Enter answer..."}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 保存ボタン */}
      <button
        onClick={handleSave}
        className="w-full px-4 py-2 rounded-lg bg-primary text-primary-fg font-medium hover:bg-primary/90 transition-colors"
      >
        {language === "ja" ? "保存" : "Save"}
      </button>
    </div>
  );
}
