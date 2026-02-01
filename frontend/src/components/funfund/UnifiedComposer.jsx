import { useState } from "react";
import { Send, Lightbulb, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

const UnifiedComposer = ({ mode, setMode, onSubmit, activeSpace }) => {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [vote, setVote] = useState("positive");
  const [stake, setStake] = useState("100");

  const handleSubmit = () => {
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
    } else if (mode === "proposal") {
      newItem = {
        type: "PROPOSAL",
        author: "You",
        title: title || "Untitled Proposal",
        content,
        space: activeSpace,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean)
      };
    } else if (mode === "commit") {
      newItem = {
        type: "EVALUATION",
        author: "You",
        targetId: "1", // Mock: should target selected proposal
        vote,
        stake: parseInt(stake) || 0,
        comment: content,
        space: activeSpace
      };
    }

    onSubmit(newItem);
    setContent("");
    setTitle("");
    setTags("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
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
          onClick={() => setMode("proposal")}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
            mode === "proposal"
              ? "bg-do text-accent"
              : "text-text-tertiary hover:text-text-secondary"
          }`}
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
        {mode === "proposal" && (
          <div className="space-y-2 mb-3">
            <Input
              placeholder="Proposal title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-0 bg-background text-base font-medium focus-visible:ring-0"
            />
            <Input
              placeholder="Tags (comma separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="border-0 bg-background text-sm focus-visible:ring-0"
            />
          </div>
        )}

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
              className="w-24 border-0 bg-background text-sm focus-visible:ring-0"
            />
          </div>
        )}

        <div className="flex gap-2">
          <Textarea
            placeholder={
              mode === "flow"
                ? "Add a comment..."
                : mode === "proposal"
                ? "Describe your proposal..."
                : "Evaluation reasoning..."
            }
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[60px] max-h-[120px] resize-none border-0 bg-background text-sm focus-visible:ring-0"
          />
          <Button
            onClick={handleSubmit}
            disabled={!content.trim()}
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
  );
};

export default UnifiedComposer;