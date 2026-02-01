const REACTION_TYPES = [
  { type: "agree", label: "Agree", emoji: "👍" },
  { type: "consider", label: "Consider", emoji: "🤔" },
  { type: "concern", label: "Concern", emoji: "⚠️" },
];

const ReactionBar = ({ reactions, targetId, onReaction }) => {
  // Count reactions by type
  const counts = {};
  reactions.forEach((reaction) => {
    counts[reaction.reactionType] = (counts[reaction.reactionType] || 0) + 1;
  });

  return (
    <div className="flex gap-2 ml-2">
      {REACTION_TYPES.map((rt) => (
        <button
          key={rt.type}
          onClick={() => onReaction(targetId, rt.type)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border transition-all ${
            counts[rt.type]
              ? "border-border-strong bg-surface text-text-primary"
              : "border-border bg-background text-text-tertiary hover:bg-surface"
          }`}
        >
          <span className="text-sm">{rt.emoji}</span>
          {counts[rt.type] && (
            <span className="text-xs font-medium">{counts[rt.type]}</span>
          )}
        </button>
      ))}
    </div>
  );
};

export default ReactionBar;