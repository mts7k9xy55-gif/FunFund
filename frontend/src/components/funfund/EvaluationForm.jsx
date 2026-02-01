import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const EvaluationForm = ({ onSubmit, onCancel, language }) => {
  const [vote, setVote] = useState("positive");
  const [stake, setStake] = useState([5]);
  const [reasoning, setReasoning] = useState("");
  const [advancedMode, setAdvancedMode] = useState(false);
  const [customStake, setCustomStake] = useState("100");

  const handleSubmit = () => {
    const finalStake = advancedMode ? parseInt(customStake) : stake[0] * 10;
    onSubmit({ vote, stake: finalStake, reasoning });
  };

  const voteOptions = {
    positive: language === "ja" ? "賛成" : "Positive",
    neutral: language === "ja" ? "中立" : "Neutral",
    negative: language === "ja" ? "反対" : "Negative"
  };

  return (
    <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
      <div className="space-y-4">
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
                className={`flex-1 px-4 py-3 rounded text-base font-medium border transition-colors ${
                  vote === v
                    ? v === "positive"
                      ? "bg-green-100 border-green-300 text-green-700"
                      : v === "neutral"
                      ? "bg-gray-100 border-gray-300 text-gray-700"
                      : "bg-red-100 border-red-300 text-red-700"
                    : "border-border bg-white text-text-tertiary hover:bg-surface"
                }`}
              >
                {voteOptions[v]}
              </button>
            ))}
          </div>
        </div>

        {/* Stake */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-text-primary">
              {language === "ja" ? "コミット強度" : "Commitment Strength"}
            </label>
            <div className="flex items-center gap-2">
              <Switch
                checked={advancedMode}
                onCheckedChange={setAdvancedMode}
                id="advanced"
              />
              <Label htmlFor="advanced" className="text-xs text-text-tertiary">
                {language === "ja" ? "詳細設定" : "Advanced"}
              </Label>
            </div>
          </div>

          {advancedMode ? (
            <Input
              type="number"
              value={customStake}
              onChange={(e) => setCustomStake(e.target.value)}
              min="1"
              max="1000"
              className="text-base"
            />
          ) : (
            <div className="space-y-2">
              <Slider
                value={stake}
                onValueChange={setStake}
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-text-tertiary">
                <span>1</span>
                <span className="font-semibold text-text-primary text-lg">{stake[0]}</span>
                <span>10</span>
              </div>
            </div>
          )}
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
            className="min-h-[100px] text-base"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={handleSubmit}
            disabled={!reasoning.trim()}
            size="sm"
            className="text-base px-6"
          >
            {language === "ja" ? "判断を確定" : "Confirm"}
          </Button>
          <Button
            onClick={onCancel}
            variant="outline"
            size="sm"
            className="text-base"
          >
            {language === "ja" ? "キャンセル" : "Cancel"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EvaluationForm;