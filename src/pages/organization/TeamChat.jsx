
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FaArrowLeft,
  FaPaperPlane,
  FaPaperclip,
  FaThumbtack,
  FaTrash,
  FaSpinner,
  FaFileAlt,
  FaUsers,
} from "react-icons/fa";

import {
  getTeamMessages,
  sendTeamMessage,
  deleteTeamMessage,
  pinTeamMessage,
} from "../../services/chatService";

import useChatSocket from "../../hooks/useChatSocket";

function getStoredUser() {
  for (const key of ["user", "currentUser", "authUser", "auth"]) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "null");
      const user = value?.user ?? value?.data?.user ?? value;

      if (user && typeof user === "object") {
        return user;
      }
    } catch {
      // Continue checking the other supported storage keys.
    }
  }

  return null;
}

function getId(value) {
  if (!value) return "";

  if (typeof value === "object") {
    return String(value._id ?? value.id ?? value.userId ?? "");
  }

  return String(value);
}

function getMessageSender(message) {
  return getId(
    message?.senderId ??
      message?.sender?._id ??
      message?.sender?.id ??
      message?.sender
  );
}

function getMessageId(message) {
  return getId(message?._id ?? message?.id);
}

function getMessageText(message) {
  return message?.content ?? message?.message ?? "";
}

function getTeamHeadId(team) {
  return getId(
    team?.teamHead ??
      team?.teamLead ??
      team?.leader ??
      team?.head ??
      team?.createdBy
  );
}

function getMessageTime(message) {
  if (!message?.createdAt) return "";

  const date = new Date(message.createdAt);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const iconButton =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400";

export default function TeamChat({
  organizationId,
  team,
  onClose,
  currentUser: currentUserProp,
}) {
  const {
    socket,
    connected,
    connectionError,
  } = useChatSocket();

  const [currentUser] = useState(
    () => currentUserProp ?? getStoredUser()
  );

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  const teamId = getId(team?._id ?? team?.id);

  const currentUserId = getId(
    currentUser?._id ??
      currentUser?.id ??
      currentUser?.userId
  );

  const teamHeadId = getTeamHeadId(team);

  const isTeamHead =
    Boolean(currentUserId && teamHeadId) &&
    currentUserId === teamHeadId;

  const teamName =
    team?.name ?? team?.teamName ?? "Team Chat";

  const loadMessages = useCallback(
    async (showLoader = false) => {
      if (!organizationId || !teamId) {
        setLoading(false);
        setError("Organization or team information is missing.");
        return;
      }

      if (showLoader) {
        setLoading(true);
      }

      try {
        const result = await getTeamMessages(
          organizationId,
          teamId
        );

        const list = Array.isArray(result)
          ? result
          : result?.messages ??
            result?.data?.messages ??
            [];

        setMessages(Array.isArray(list) ? list : []);
        setError("");
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            "Unable to load team messages."
        );
      } finally {
        setLoading(false);
      }
    },
    [organizationId, teamId]
  );

  // Load messages initially and refresh them every five seconds.
  useEffect(() => {
    loadMessages(true);

    const interval = window.setInterval(() => {
      loadMessages(false);
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [loadMessages]);

  // Join the existing Socket.IO room and listen for new messages.
  useEffect(() => {
    if (!socket || !teamId) return;

    socket.emit("conversation:join", teamId);

    const handleNewMessage = (incoming) => {
      const incomingTeamId = getId(
        incoming?.teamId ??
          incoming?.conversationId ??
          incoming?.team?._id
      );

      if (
        incomingTeamId &&
        incomingTeamId !== teamId
      ) {
        return;
      }

      loadMessages(false);
    };

    socket.on("message:new", handleNewMessage);

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.emit("conversation:leave", teamId);
    };
  }, [socket, teamId, loadMessages]);

  // Keep the conversation near the bottom when appropriate.
  useEffect(() => {
    const container = messagesContainerRef.current;

    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight -
      container.scrollTop -
      container.clientHeight;

    if (distanceFromBottom < 160) {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [messages]);

  async function handleSend(event) {
    event.preventDefault();

    if ((!text.trim() && !attachment) || sending) {
      return;
    }

    setSending(true);
    setError("");

    try {
      const formData = new FormData();

      formData.append("content", text.trim());

      if (attachment) {
        formData.append("file", attachment);
      }

      await sendTeamMessage(
        organizationId,
        teamId,
        formData
      );

      setText("");
      setAttachment(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await loadMessages(false);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Message could not be sent."
      );
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(message) {
    const messageId = getMessageId(message);

    if (!messageId) return;

    const senderId = getMessageSender(message);

    const isOwnMessage =
      Boolean(currentUserId) &&
      senderId === currentUserId;

    if (!isOwnMessage && !isTeamHead) {
      return;
    }

    setError("");

    try {
      await deleteTeamMessage(
        organizationId,
        teamId,
        messageId
      );

      setMessages((previous) =>
        previous.filter(
          (item) => getMessageId(item) !== messageId
        )
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Message could not be deleted."
      );
    }
  }

  async function handlePin(message) {
    if (!isTeamHead) return;

    const messageId = getMessageId(message);

    if (!messageId) return;

    setError("");

    try {
      await pinTeamMessage(
        organizationId,
        teamId,
        messageId
      );

      await loadMessages(false);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Message could not be pinned."
      );
    }
  }

  function handleAttachmentChange(event) {
    setAttachment(event.target.files?.[0] ?? null);
  }

  function removeAttachment() {
    setAttachment(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <main className="flex h-[min(78dvh,820px)] min-h-[420px] w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-white/25 bg-[#102541]/55 text-[#EDEFF7] shadow-2xl shadow-blue-950/25 backdrop-blur-xl">
      {/* Chat header */}
      <header className="flex shrink-0 items-center gap-3 border-b border-white/15 bg-[#102541]/65 px-3 py-3 backdrop-blur-xl sm:px-5 sm:py-4">
        <button
          type="button"
          onClick={onClose}
          className={iconButton}
          aria-label="Back to organization workspace"
          title="Back"
        >
          <FaArrowLeft />
        </button>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-300/25 bg-sky-400/10 text-sky-200">
          <FaUsers />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold text-white sm:text-lg">
            {teamName}
          </h2>

          <p className="mt-0.5 text-xs text-slate-300">
            Team conversation
          </p>
        </div>

        <span
          title={
            connectionError ||
            (connected ? "Connected" : "Connecting")
          }
          className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-2.5 py-1 text-xs ${
            connectionError
              ? "border-red-300/20 bg-red-400/10 text-red-200"
              : connected
                ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-200"
                : "border-amber-300/20 bg-amber-400/10 text-amber-200"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              connectionError
                ? "bg-red-300"
                : connected
                  ? "bg-emerald-300"
                  : "bg-amber-300"
            }`}
          />

          {connectionError
            ? "Offline"
            : connected
              ? "Connected"
              : "Connecting"}
        </span>
      </header>

      {connectionError && (
        <p className="shrink-0 px-4 pt-2 text-xs text-amber-200">
          Real-time updates are unavailable. Messages will
          continue refreshing periodically.
        </p>
      )}
      {error && (
        <div
          role="alert"
          className="mx-3 mt-3 flex shrink-0 items-start justify-between gap-3 rounded-xl border border-red-300/25 bg-red-500/10 px-3 py-2.5 text-sm text-red-100 sm:mx-5"
        >
          <p className="min-w-0 break-words">{error}</p>

          <button
            type="button"
            onClick={() => setError("")}
            className="shrink-0 rounded px-1 text-lg leading-none hover:bg-white/10"
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}
      <div
        ref={messagesContainerRef}
        className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-3 py-5 sm:px-5 sm:py-6"
        aria-live="polite"
      >
        {loading ? (
          <div className="flex h-full min-h-40 flex-col items-center justify-center gap-3 text-sm text-slate-300">
            <FaSpinner className="animate-spin text-xl text-sky-300" />
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full min-h-40 flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-400/10 text-xl text-sky-200">
              <FaPaperPlane />
            </div>

            <h3 className="text-base font-semibold text-white">
              Start the conversation
            </h3>

            <p className="mt-2 max-w-xs text-sm text-slate-300">
              Send the first message to your team.
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            const messageId = getMessageId(message);
            const senderId = getMessageSender(message);

            const isOwnMessage =
              Boolean(currentUserId) &&
              senderId === currentUserId;

            const canDelete =
              isOwnMessage || isTeamHead;

            const senderName =
              message.sender?.name ??
              message.sender?.username ??
              message.senderName ??
              message.sender?.email ??
              (isOwnMessage ? "You" : "Team member");

            const fileUrl =
              message.fileUrl ?? message.attachmentUrl;

            const fileName =
              message.fileName ?? message.attachmentName;

            return (
              <article
                key={
                  messageId ||
                  `${message.createdAt ?? "message"}-${senderId}-${index}`
                }
                className={`group flex w-full ${
                  isOwnMessage
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`flex max-w-[95%] min-w-0 items-end gap-1.5 sm:max-w-[82%] ${
                    isOwnMessage ? "flex-row-reverse" : ""
                  }`}
                >
                  <div className="min-w-0">
                    {!isOwnMessage && (
                      <p className="mb-1.5 ml-1 break-words text-xs font-medium text-sky-200">
                        {senderName}
                      </p>
                    )}

                    <div
                      className={`min-w-0 rounded-2xl border px-3.5 py-3 shadow-md shadow-black/10 sm:px-4 ${
                        isOwnMessage
                          ? "rounded-br-md border-blue-300/20 bg-gradient-to-br from-[#1557A8] to-[#123B72] text-white"
                          : "rounded-bl-md border-white/15 bg-[#192F4B]/90 text-slate-100"
                      }`}
                    >
                      {message.isPinned && (
                        <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-amber-200">
                          <FaThumbtack />
                          Pinned message
                        </div>
                      )}

                      {getMessageText(message) && (
                        <p className="whitespace-pre-wrap break-words text-sm leading-6">
                          {getMessageText(message)}
                        </p>
                      )}

                      {fileUrl && (
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 flex min-w-0 items-center gap-2 rounded-lg border border-white/15 bg-black/15 p-2.5 text-sm text-sky-100 transition hover:bg-black/25 hover:text-white"
                        >
                          <FaFileAlt className="shrink-0" />

                          <span className="break-all">
                            {fileName || "Open attachment"}
                          </span>
                        </a>
                      )}

                      <div className="mt-2 flex items-center justify-end gap-2">
                        <span className="text-[10px] text-slate-300/80">
                          {getMessageTime(message)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mb-1 flex shrink-0 flex-col gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                    {isTeamHead && (
                      <button
                        type="button"
                        onClick={() => handlePin(message)}
                        className={iconButton}
                        title="Pin message"
                        aria-label={`Pin message from ${senderName}`}
                      >
                        <FaThumbtack className="text-xs" />
                      </button>
                    )}

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDelete(message)}
                        className={`${iconButton} hover:bg-red-500/15 hover:text-red-200`}
                        title="Delete message"
                        aria-label={`Delete message from ${senderName}`}
                      >
                        <FaTrash className="text-xs" />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}

        <div ref={messagesEndRef} />
      </div>
      <form
        onSubmit={handleSend}
        className="shrink-0 border-t border-white/15 bg-[#102541]/75 px-3 py-3 backdrop-blur-xl sm:px-5 sm:py-4"
      >
        {attachment && (
          <div className="mb-3 flex min-w-0 items-center gap-2 rounded-xl border border-sky-300/20 bg-sky-400/10 px-3 py-2 text-sm text-sky-100">
            <FaPaperclip className="shrink-0" />

            <span className="min-w-0 flex-1 truncate">
              {attachment.name}
            </span>

            <button
              type="button"
              onClick={removeAttachment}
              className="rounded px-2 text-lg hover:bg-white/10"
              aria-label="Remove attachment"
            >
              ×
            </button>
          </div>
        )}

        <div className="flex min-w-0 items-end gap-2 rounded-2xl border border-white/20 bg-[#071A31]/70 p-2 transition focus-within:border-sky-300/50">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleAttachmentChange}
            aria-label="Choose an attachment"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={iconButton}
            aria-label="Attach file"
            title="Attach file"
          >
            <FaPaperclip />
          </button>

          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder="Write a message..."
            rows={1}
            className="max-h-32 min-h-9 min-w-0 flex-1 resize-y bg-transparent px-1 py-2 text-sm leading-5 text-white outline-none placeholder:text-slate-400"
          />

          <button
            type="submit"
            disabled={
              sending ||
              (!text.trim() && !attachment)
            }
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-[#1680FF] to-[#0057D9] text-white shadow-md shadow-blue-950/20 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Send message"
            title="Send message"
          >
            {sending ? (
              <FaSpinner className="animate-spin" />
            ) : (
              <FaPaperPlane />
            )}
          </button>
        </div>

        <p className="mt-2 px-1 text-[11px] text-slate-400">
          Enter to send · Shift + Enter for a new line
        </p>
      </form>
    </main>
  );
}
