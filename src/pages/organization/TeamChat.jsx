
import { useCallback, useEffect, useRef, useState } from "react";
import {
    FaArrowLeft,
    FaPaperPlane,
    FaThumbtack,
    FaTrash,
    FaSpinner,
  } from "react-icons/fa";
import {
  getTeamMessages,
  sendTeamMessage,
  deleteTeamMessage,
  pinTeamMessage,
} from "../../services/chatService";

import useChatSocket from "../../hooks/useChatSocket";

function getMessageId(message) {
  return message?.id || message?._id;
}

function getMessageContent(message) {
  return message?.content || "";
}

function getSenderName(message) {
  return (
    message?.sender?.name ||
    message?.senderName ||
    message?.sender?.email ||
    "Member"
  );
}

function getTime(value) {
  if (!value) return "";
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeMessages(result) {
  if (Array.isArray(result?.messages)) return result.messages;
  if (Array.isArray(result?.data?.messages)) return result.data.messages;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result)) return result;

  return [];
}

function TeamChat({ organizationId, team, onClose }) {
  const teamId = team?._id || team?.id;

  const { socket, connected, connectionError } = useChatSocket();

  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState("");
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const bottomRef = useRef(null);
  const loadedConversationRef = useRef("");

  const loadMessages = useCallback(async () => {
    if (!organizationId || !teamId) return;

    setLoading(true);
    setError("");

    try {
      const result = await getTeamMessages(organizationId, teamId);
      const loadedMessages = normalizeMessages(result);

      const nextConversationId =
        result?.conversationId ||
        result?.data?.conversationId ||
        loadedMessages[0]?.conversationId ||
        "";

      setMessages(loadedMessages);
      setConversationId(nextConversationId);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Team messages load nahi ho paaye."
      );
    } finally {
      setLoading(false);
    }
  }, [organizationId, teamId]);

  useEffect(() => {
    loadedConversationRef.current = "";
    setMessages([]);
    setConversationId("");
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (!socket || !conversationId) return;

    if (loadedConversationRef.current !== conversationId) {
      socket.emit("conversation:join", { conversationId });
      loadedConversationRef.current = conversationId;
    }

    function handleNewMessage(message) {
      if (!message) return;

      const incomingConversationId =
        message.conversationId ||
        message.conversation?.id ||
        message.conversation?._id;

      if (
        incomingConversationId &&
        String(incomingConversationId) !== String(conversationId)
      ) {
        return;
      }

      if (!incomingConversationId) return;

      setMessages((previous) => {
        const incomingId = getMessageId(message);

        if (
          incomingId &&
          previous.some(
            (item) => String(getMessageId(item)) === String(incomingId)
          )
        ) {
          return previous;
        }

        return [...previous, message];
      });
    }

    socket.on("message:new", handleNewMessage);

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.emit("conversation:leave", { conversationId });
      loadedConversationRef.current = "";
    };
  }, [socket, conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(event) {
    event.preventDefault();

    const content = messageText.trim();

    if (!content || sending) return;

    setSending(true);
    setError("");

    try {
      const result = await sendTeamMessage(organizationId, teamId, {
        content,
      });

      const newMessage =
        result?.message ||
        result?.data?.message ||
        result;

      if (newMessage && (getMessageId(newMessage) || newMessage.content)) {
        setMessages((previous) => {
          const newId = getMessageId(newMessage);

          if (
            newId &&
            previous.some(
              (item) => String(getMessageId(item)) === String(newId)
            )
          ) {
            return previous;
          }

          return [...previous, newMessage];
        });
      }

      setMessageText("");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Message send nahi hua. Please retry karo."
      );
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(message) {
    const messageId = getMessageId(message);

    if (!messageId) {
      setError("Message ID missing hai.");
      return;
    }

    if (!window.confirm("Kya tum ye message delete karna chahte ho?")) {
      return;
    }

    setError("");

    try {
      await deleteTeamMessage(organizationId, teamId, messageId);

      setMessages((previous) =>
        previous.filter(
          (item) => String(getMessageId(item)) !== String(messageId)
        )
      );

      setActionMessage("Message deleted.");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Message delete nahi hua. Ho sakta hai permission na ho."
      );
    }
  }

  async function handlePin(message) {
    const messageId = getMessageId(message);

    if (!messageId) {
      setError("Message ID missing hai.");
      return;
    }

    setError("");

    try {
      await pinTeamMessage(organizationId, teamId, messageId);
      setActionMessage("Pin request successful.");
      await loadMessages();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Message pin nahi hua. Pin permission check karo."
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-6">
      <section className="flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0b1930] shadow-2xl">
        <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white"
              aria-label="Back to teams"
            >
              <FaArrowLeft />
            </button>

            <div className="min-w-0">
              <h2 className="truncate font-semibold text-white">
                {team?.name || "Team Chat"}
              </h2>
              <p className="text-xs text-slate-400">
                {connected ? "Connected" : "Connecting to chat..."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/10"
          >
            Close
          </button>
        </header>

        {connectionError && (
          <p className="border-b border-amber-400/20 bg-amber-400/10 px-4 py-2 text-xs text-amber-200">
            Realtime connection issue. REST messaging may still work.
          </p>
        )}

        {error && (
          <div className="flex items-start justify-between gap-3 border-b border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
            <span>{error}</span>
            <button type="button" onClick={() => setError("")}>
              ×
            </button>
          </div>
        )}

        {actionMessage && (
          <button
            type="button"
            onClick={() => setActionMessage("")}
            className="border-b border-blue-400/20 bg-blue-400/10 px-4 py-2 text-left text-xs text-blue-200"
          >
            {actionMessage} ×
          </button>
        )}

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
          {loading ? (
            <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-400">
              <FaSpinner className="animate-spin" />
              Loading team messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="font-medium text-slate-200">No messages yet</p>
              <p className="mt-1 text-sm text-slate-400">
                Team ke saath conversation yahan start karo.
              </p>
            </div>
          ) : (
            messages.map((message, index) => {
              const messageId = getMessageId(message) || `message-${index}`;
              const isSystem =
                !message.senderId && !message.sender;

              if (isSystem) {
                return (
                  <div
                    key={messageId}
                    className="text-center text-xs text-slate-500"
                  >
                    {getMessageContent(message) || "Team membership updated"}
                  </div>
                );
              }

              return (
                <article
                  key={messageId}
                  className="group rounded-xl border border-white/[0.06] bg-white/[0.035] p-3 sm:p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-blue-200">
                        {getSenderName(message)}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-100">
                        {getMessageContent(message)}
                      </p>

                      {message.fileUrl && (
                        <a
                          href={message.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-block text-sm text-blue-300 underline"
                        >
                          {message.fileName || "Open attachment"}
                        </a>
                      )}

                      <p className="mt-2 text-[11px] text-slate-500">
                        {getTime(message.createdAt)}
                        {message.isPinned ? " · Pinned" : ""}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                      <button
                        type="button"
                        title="Pin message"
                        onClick={() => handlePin(message)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-blue-300"
                      >
                      <FaThumbtack />
                      </button>

                      <button
                        type="button"
                        title="Delete message"
                        onClick={() => handleDelete(message)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-300"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}

          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={handleSend}
          className="flex items-end gap-3 border-t border-white/10 p-3 sm:p-4"
        >
          <textarea
            rows={1}
            maxLength={20000}
            value={messageText}
            onChange={(event) => setMessageText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder="Message your team..."
            className="max-h-32 min-h-11 flex-1 resize-y rounded-xl border border-white/10 bg-[#071326] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-400"
          />

          <button
            type="submit"
            disabled={sending || !messageText.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Send message"
          >
            {sending ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
          </button>
        </form>
      </section>
    </div>
  );
}

export default TeamChat;
