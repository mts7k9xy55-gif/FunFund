import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const EvaluationForm = ({ onSubmit, onCancel, language }) => {
  const [vote, setVote] = useState("positive");
  const [stake, setStake] = useState("100");
  const [reasoning, setReasoning] = useState("");

  return (
    <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
      <div className="space-y-3">
        {/* Vote */}
        <div>
          <label className="text-sm font-medium text-text-primary mb-2 block">
            {language === "ja" ? "投票" : "Vote"}
          </label>
          <div className="flex gap-2">
            {["positive", "neutral", "negative"].map((v) => (
              <button
                key={v}
                onClick={() => setVote(v)}
                className={`flex-1 px-3 py-2 rounded text-sm font-medium border transition-colors ${
                  vote === v
                    ? v === "positive"
                      ? "bg-green-100 border-green-300 text-green-700"
                      : v === "neutral"
                      ? "bg-gray-100 border-gray-300 text-gray-700"
                      : "bg-red-100 border-red-300 text-red-700"
                    : "border-border bg-white text-text-tertiary hover:bg-surface"
                }`}
              >
                {v === "positive" ? "✓" : v === "neutral" ? "○" : "✗"}
              </button>
            ))}
          </div>
        </div>

        {/* Stake */}
        <div>
          <label className="text-sm font-medium text-text-primary mb-2 block">
            Stake
          </label>
          <Input
            type="number"
            value={stake}
            onChange={(e) => setStake(e.target.value)}
            className="text-base"
          />
        </div>

        {/* Reasoning */}
        <div>
          <label className="text-sm font-medium text-text-primary mb-2 block">
            {language === "ja" ? "理由" : "Reasoning"}
          </label>
          <Textarea
            value={reasoning}
            onChange={(e) => setReasoning(e.target.value)}
            placeholder={language === "ja" ? "判断の理由を記入..." : "Explain your evaluation..."}
            className="min-h-[80px] text-base"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={() => onSubmit({ vote, stake: parseInt(stake), reasoning })}
            disabled={!reasoning.trim()}
            size="sm"
          >
            {language === "ja" ? "判断を確定" : "Confirm"}
          </Button>
          <Button
            onClick={onCancel}
            variant="outline"
            size="sm"
          >
            {language === "ja" ? "キャンセル" : "Cancel"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EvaluationForm;