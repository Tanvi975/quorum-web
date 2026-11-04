
export default function MessageReactions({
  reactions = [],
  currentUserId,
  onReact,
}) {
  if (!reactions.length) return null;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      {reactions.map((reaction) => {
        const mine = (reaction.users || []).some(
          (person) =>
            String(person.id || person._id) === String(currentUserId)
        );

        return (
          <button
            key={reaction.emoji}
            type="button"
            onClick={() => onReact(reaction.emoji)}
            title={`${reaction.count} reactions`}
            className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition ${
              mine
                ? "border-blue-300 bg-blue-500/25 text-white"
                : "border-white/20 bg-white/10 text-white/80 hover:bg-white/15"
            }`}
          >
            <span>{reaction.emoji}</span>
            <span>{reaction.count}</span>
          </button>
        );
      })}
    </div>
  );
}
