
import { useEffect, useMemo, useState } from "react";

export default function ForwardMessagesModal({
  conversations = [],
  getConversationName,
  currentConversationId,
  loading = false,
  onClose,
  onForward,
}) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [search, setSearch] = useState("");

  const availableConversations = useMemo(() => {
    return conversations.filter(
      (conversation) =>
        String(conversation.id) !== String(currentConversationId)
    );
  }, [conversations, currentConversationId]);

  const filteredConversations = availableConversations.filter(
    (conversation) =>
      (getConversationName?.(conversation) || "")
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape" && !loading) onClose?.();
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [loading, onClose]);

  function toggleRecipient(id) {
    setSelectedIds((previous) =>
      previous.includes(String(id))
        ? previous.filter((item) => item !== String(id))
        : [...previous, String(id)]
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-3">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="forward-modal-title"
        className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/20 bg-[#102842] shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-white/15 p-4">
          <div>
            <h2 id="forward-modal-title" className="text-base font-semibold text-white">
              Forward messages
            </h2>
            <p className="mt-1 text-xs text-white/60">
              Select one or more chats to forward to.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg px-3 py-2 text-white/70 hover:bg-white/10"
          >
            ✕
          </button>
        </header>

        <div className="p-4">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search people or groups..."
            className="w-full rounded-lg border border-white/20 bg-[#062C5F]/50 px-3 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-blue-400"
          />

          <p className="mt-3 text-xs text-white/60">
            {selectedIds.length} recipient(s) selected
          </p>
        </div>

        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-4 pb-4">
          {filteredConversations.length === 0 ? (
            <p className="py-8 text-center text-sm text-white/60">
              No conversations found.
            </p>
          ) : (
            filteredConversations.map((conversation) => {
              const id = String(conversation.id);
              const selected = selectedIds.includes(id);

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleRecipient(id)}
                  className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition ${
                    selected
                      ? "border-blue-400 bg-blue-500/20"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-white">
                      {getConversationName?.(conversation) ||
                        conversation.name ||
                        "Conversation"}
                    </span>
                    <span className="text-xs text-white/50">
                      {conversation.type === "group" ? "Group" : "Direct chat"}
                    </span>
                  </span>

                  <span
                    className={`ml-3 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs ${
                      selected
                        ? "border-blue-400 bg-blue-500 text-white"
                        : "border-white/40 text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                </button>
              );
            })
          )}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-white/15 p-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-white/20 px-4 py-2.5 text-sm text-white hover:bg-white/10 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={loading || selectedIds.length === 0}
            onClick={() => onForward?.(selectedIds)}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Forwarding..." : `Forward (${selectedIds.length})`}
          </button>
        </footer>
      </section>
    </div>
  );
}
