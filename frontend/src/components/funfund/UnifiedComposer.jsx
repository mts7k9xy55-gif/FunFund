import { useState } from "react";
import { Send, Lightbulb, Award, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const UnifiedComposer = ({ mode, setMode, onSubmit, activeSpace }) => {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [vote, setVote] = useState("positive");
  const [stake, setStake] = useState("100");
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [commitState, setCommitState] = useState(null); // null | 'preparing' | 'committing' | 'committed'

  const handleSubmit = async () => {
    if (!content.trim()) return;

    let newItem;
    if (mode === "flow") {
      newItem = {
        type: "COMMENT",
        author: "You",
        content,
        space: activeSpace,
        targetId: "1" // Mock: should target selected proposal
      };
      onSubmit(newItem);
      setContent("");
    } else if (mode === "commit") {
      // Enhanced commit ceremony
      setCommitState('preparing');
      await new Promise(resolve => setTimeout(resolve, 600));
      
      setCommitState('committing');
      await new Promise(resolve => setTimeout(resolve, 1400));
      
      newItem = {
        type: "EVALUATION",
        author: "You",
        targetId: "1", // Mock: should target selected proposal
        vote,
        stake: parseInt(stake) || 0,
        comment: content,
        space: activeSpace
      };
      
      onSubmit(newItem);
      
      setCommitState('committed');
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setContent("");
      setCommitState(null);
      setMode("flow");
    }
  };

  const handleProposalSubmit = () => {
    if (!content.trim()) return;

    const newItem = {
      type: "PROPOSAL",
      author: "You",
      title: title || "Untitled Proposal",
      content,
      space: activeSpace,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean)
    };

    onSubmit(newItem);
    setContent("");
    setTitle("");
    setTags("");
    setShowProposalModal(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <>
      {/* Commit Ceremony Overlay */}
      {commitState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Background with intensifying darkness */}
          <div 
            className={`absolute inset-0 transition-all duration-700 ${
              commitState === 'preparing' ? 'bg-black/60' :
              commitState === 'committing' ? 'bg-black/90' :
              'bg-black/40'
            }`}
          />
          
          {/* Content */}
          <div className="relative z-10 text-center space-y-6">
            {commitState === 'preparing' && (
              <div className="animate-in fade-in zoom-in duration-500">
                <div className="text-2xl text-white/80 font-light">Preparing commitment...</div>
              </div>
            )}
            
            {commitState === 'committing' && (
              <div className="animate-in fade-in zoom-in duration-700 space-y-4">
                <Award className="h-16 w-16 text-yellow-400 mx-auto animate-pulse" />
                <div className="text-5xl font-bold text-white tracking-tight animate-pulse">
                  Committing
                </div>
                <div className="text-lg text-white/70 space-y-1">
                  <div className="flex items-center justify-center gap-3">
                    <span className={`px-4 py-2 rounded-lg font-semibold ${
                      vote === "positive" ? "bg-green-500/20 text-green-300" :
                      vote === "neutral" ? "bg-gray-500/20 text-gray-300" :
                      "bg-red-500/20 text-red-300"
                    }`}>
                      {vote === "positive" ? "✓ Positive" : vote === "neutral" ? "○ Neutral" : "✗ Negative"}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-400">{stake} stake</div>
                </div>
              </div>
            )}
            
            {commitState === 'committed' && (
              <div className="animate-in fade-in zoom-in duration-500">
                <div className="text-3xl text-white font-medium">Committed ✓</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Proposal Modal */}
      <Dialog open={showProposalModal} onOpenChange={setShowProposalModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-accent" />
              Create Proposal
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Input
              placeholder="Proposal title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-base font-medium"
            />
            <Input
              placeholder="Tags (comma separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="text-sm"
            />
            <Textarea
              placeholder="Describe your proposal..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[200px] resize-none"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowProposalModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleProposalSubmit} disabled={!content.trim()}>
                Create Proposal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Composer */}
      <div className="border-t border-border bg-surface">
        {/* Mode Selector */}
        <div className="px-6 py-2 flex items-center gap-2 border-b border-border">
          <button
            onClick={() => setMode("flow")}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              mode === "flow"
                ? "bg-flow text-text-primary"
                : "text-text-tertiary hover:text-text-secondary"
            }`}
          >
            Flow
          </button>
          <button
            onClick={() => setShowProposalModal(true)}
            className="px-3 py-1 rounded text-xs font-medium transition-colors text-text-tertiary hover:text-text-secondary flex items-center gap-1"
          >
            <Lightbulb className="h-3 w-3" />
            Proposal
          </button>
          <button
            onClick={() => setMode("commit")}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
              mode === "commit"
                ? "bg-commit text-yellow-600"
                : "text-text-tertiary hover:text-text-secondary"
            }`}
          >
            <Award className="h-3 w-3" />
            Commit
          </button>
        </div>

        {/* Input Area */}
        <div className="px-6 py-4">
          {mode === "commit" && (
            <div className="flex gap-3 mb-3">
              <div className="flex gap-2">
                {["positive", "neutral", "negative"].map((v) => (
                  <button
                    key={v}
                    onClick={() => setVote(v)}
                    className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                      vote === v
                        ? v === "positive"
                          ? "bg-green-100 border-green-300 text-green-700"
                          : v === "neutral"
                          ? "bg-gray-100 border-gray-300 text-gray-700"
                          : "bg-red-100 border-red-300 text-red-700"
                        : "border-border text-text-tertiary"
                    }`}
                  >
                    {v === "positive" ? "✓" : v === "neutral" ? "○" : "✗"}
                  </button>
                ))}
              </div>
              <Input
                type="number"
                placeholder="Stake"
                value={stake}
                onChange={(e) => setStake(e.target.value)}
                className="w-24 text-sm"
              />
            </div>
          )}

          <div className="flex gap-2">
            <Textarea
              placeholder={
                mode === "flow"
                  ? "Add a comment..."
                  : "Evaluation reasoning..."
              }
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[60px] max-h-[120px] resize-none border-0 bg-background text-sm focus-visible:ring-0"
              disabled={commitState !== null}
            />
            <Button
              onClick={handleSubmit}
              disabled={!content.trim() || commitState !== null}
              size="icon"
              className="flex-shrink-0 h-10 w-10"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-2 text-xs text-text-tertiary">
            <kbd className="px-1.5 py-0.5 bg-surface border border-border rounded">Enter</kbd> to
            send · <kbd className="px-1.5 py-0.5 bg-surface border border-border rounded">Shift+Enter</kbd> for new line
          </div>
        </div>
      </div>
    </>
  );
};

export default UnifiedComposer;