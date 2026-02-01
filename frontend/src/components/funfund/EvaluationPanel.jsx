import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, Award } from "lucide-react";

const EvaluationPanel = ({ proposal, onSubmit, onClose }) => {
  const [vote, setVote] = useState("positive");
  const [stake, setStake] = useState("100");
  const [reasoning, setReasoning] = useState("");
  const [ceremonyState, setCeremonyState] = useState(null);

  const handleSubmit = async () => {
    if (!reasoning.trim()) return;

    // Start ceremony
    setCeremonyState('preparing');
    await new Promise(resolve => setTimeout(resolve, 600));
    
    setCeremonyState('committing');
    await new Promise(resolve => setTimeout(resolve, 1400));
    
    const evaluation = {
      author: "You",
      targetId: proposal.id,
      vote,
      stake: parseInt(stake) || 0,
      reasoning
    };
    
    onSubmit(evaluation);
    
    setCeremonyState('committed');
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setCeremonyState(null);
    onClose();
  };

  return (
    <>
      {/* Ceremony Overlay */}
      {ceremonyState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className={`absolute inset-0 transition-all duration-700 ${
              ceremonyState === 'preparing' ? 'bg-black/60' :
              ceremonyState === 'committing' ? 'bg-black/90' :
              'bg-black/40'
            }`}
          />
          
          <div className="relative z-10 text-center space-y-6">
            {ceremonyState === 'preparing' && (
              <div className="animate-in fade-in zoom-in duration-500">
                <div className="text-2xl text-white/80 font-light">判断を準備しています...</div>
              </div>
            )}
            
            {ceremonyState === 'committing' && (
              <div className="animate-in fade-in zoom-in duration-700 space-y-4">
                <Award className="h-16 w-16 text-yellow-400 mx-auto animate-pulse" />
                <div className="text-5xl font-bold text-white tracking-tight animate-pulse">
                  判断中
                </div>
                <div className="text-lg text-white/70 space-y-1">
                  <div className="flex items-center justify-center gap-3">
                    <span className={`px-4 py-2 rounded-lg font-semibold ${
                      vote === "positive" ? "bg-green-500/20 text-green-300" :
                      vote === "neutral" ? "bg-gray-500/20 text-gray-300" :
                      "bg-red-500/20 text-red-300"
                    }`}>
                      {vote === "positive" ? "✓ 賛成" : vote === "neutral" ? "○ 中立" : "✗ 反対"}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-400">{stake} stake</div>
                </div>
              </div>
            )}
            
            {ceremonyState === 'committed' && (
              <div className="animate-in fade-in zoom-in duration-500">
                <div className="text-3xl text-white font-medium">判断が完了しました ✓</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Panel */}
      <div className="w-80 border-l border-border flex flex-col bg-commit">
        {/* Header */}
        <div className="h-12 px-4 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-text-tertiary" />
            <h2 className="text-sm font-medium text-text-primary">判断する</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onClose}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        
        {/* Content */}
        <div className="flex-1 p-4 space-y-4 overflow-auto">
          {/* Proposal Title */}
          <div className="p-3 bg-surface rounded border border-border">
            <div className="text-xs text-text-tertiary mb-1">議題</div>
            <div className="text-sm font-medium text-text-primary">{proposal.title}</div>
          </div>
          
          {/* Vote Selection */}
          <div>
            <label className="text-xs font-medium text-text-tertiary mb-2 block">投票</label>
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
                      : "border-border text-text-tertiary hover:bg-surface"
                  }`}
                >
                  {v === "positive" ? "✓" : v === "neutral" ? "○" : "✗"}
                </button>
              ))}
            </div>
          </div>
          
          {/* Stake */}
          <div>
            <label className="text-xs font-medium text-text-tertiary mb-2 block">Stake</label>
            <Input
              type="number"
              value={stake}
              onChange={(e) => setStake(e.target.value)}
              className="text-sm"
            />
          </div>
          
          {/* Reasoning */}
          <div>
            <label className="text-xs font-medium text-text-tertiary mb-2 block">理由</label>
            <Textarea
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
              placeholder="判断の理由を記入してください..."
              className="min-h-[120px] text-sm"
            />
          </div>
          
          {/* Warning */}
          <div className="p-3 bg-warning/10 border border-warning/20 rounded text-xs text-text-secondary">
            ⚠️ この判断は取り消すことができません。慎重に検討してください。
          </div>
          
          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={!reasoning.trim() || ceremonyState !== null}
            className="w-full"
          >
            判断を確定する
          </Button>
        </div>
      </div>
    </>
  );
};

export default EvaluationPanel;