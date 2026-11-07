export default function MessageReactions({
  reactions = [],
  currentUserId,
  onReact,
  onDetails,
}) {
  if (!reactions.length) return null;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      {reactions.map((reaction) => {
        const mine = (reaction.users || []).some(
          (person) => String(person.id || person._id) === String(currentUserId)
        );

        return (
          <span
            key={reaction.emoji}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] ${
              mine
                ? "border-blue-300 bg-blue-500/25 text-white"
                : "border-white/20 bg-white/10 text-white/80"
            }`}
          >
            <button
              type="button"
              onClick={() => onReact?.(reaction.emoji)}
              aria-label={`React with ${reaction.emoji}`}
              className="leading-none"
            >
              {reaction.emoji}
            </button>
            <button
              type="button"
              onClick={() => onDetails?.(reaction.emoji)}
              title="See who reacted"
              className="min-w-3 leading-none hover:text-white"
            >
              {reaction.count}
            </button>
          </span>
        );
      })}
    </div>
  );
}
