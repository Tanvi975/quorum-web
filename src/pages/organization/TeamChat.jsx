import { useCallback, useEffect, useRef, useState } from "react";
import {
  FaArrowLeft,
  FaPaperPlane,
  FaThumbtack,
  FaTrash,
  FaSpinner,
  FaFileAlt,
  FaUsers,
  FaVideo,
  FaTimes,
  FaInfoCircle,
} from "react-icons/fa";

import {
  getTeamMessages,
  sendTeamMessage,
  deleteTeamMessage,
  pinTeamMessage,
} from "../../services/chatService";

import useChatSocket from "../../hooks/useChatSocket";
import { createScopedMeeting } from "../../services/meetingService";

function getStoredUser() {
  for (const key of ["user", "currentUser", "authUser", "auth"]) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "null");
      const user = value?.user ?? value?.data?.user ?? value;

      if (user && typeof user === "object") {
        return user;
      }
    } catch {
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

function getMemberName(member) {
  if (typeof member === "string") return member;

  return (
    member?.name ??
    member?.fullName ??
    member?.username ??
    member?.user?.name ??
    member?.email ??
    "Member"
  );
}

function getMemberRole(member) {
  if (typeof member === "string") return "Member";

  return (
    member?.role ??
    member?.position ??
    member?.designation ??
    member?.user?.role ??
    "Member"
  );
}

function getLocalDateTimeMin() {
  const date = new Date(Date.now() + 60000);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000)
    .toISOString()
    .slice(0, 16);
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
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sky-100/80 transition hover:bg-sky-300/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300";

export default function TeamChat({
  organizationId,
  team,
  onClose,
  currentUser: currentUserProp,
  onAddMembers,
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
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [showTeamPanel, setShowTeamPanel] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 1024
  );
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduling, setScheduling] = useState(false);
  const [scheduleNotice, setScheduleNotice] = useState("");

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const teamId = getId(team?._id ?? team?.id);

  const currentUserId = getId(
    currentUser?._id ??
      currentUser?.id ??
      currentUser?.userId
  );

  const teamHeadId = getId(
    team?.teamHeadId ??
      team?.teamLeadId ??
      team?.leaderId ??
      team?.teamHead ??
      team?.teamLead ??
      team?.leader ??
      team?.head ??
      team?.createdBy
  );
  const conversationId = getId(
    team?.conversationId ??
    team?.chatConversationId ??
    team?.conversation?._id ??
    team?.conversation?.id ??
    teamId
);
  const currentRole = String(
    currentUser?.role ?? currentUser?.designation ?? ""
  ).toLowerCase();

  const isTeamHead =
    (Boolean(currentUserId && teamHeadId) && currentUserId === teamHeadId) ||
    ["team_head", "teamhead", "team_lead", "teamlead"].includes(currentRole) ||
    team?.isTeamHead === true;

  const teamName =
    team?.name ?? team?.teamName ?? "Team Chat";

  const teamMembers = Array.isArray(team?.members)
    ? team.members
    : Array.isArray(team?.users)
      ? team.users
      : Array.isArray(team?.participants)
        ? team.participants
        : [];

  const organizationName =
    team?.organization?.name ??
    team?.organizationName ??
    team?.organization?.organizationName ??
    "Organization";

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

  useEffect(() => {
    loadMessages(true);
}, [loadMessages]);
useEffect(() => {
  if (!socket || !connected || !conversationId) return;

  socket.emit(
      "conversation:join",
      { conversationId },
      (res) => {
          if (res?.success) {
              console.log("Joined live team chat");
          }
      }
  );

  const handleNewMessage = (incoming) => {
      if (!incoming) return;

      const incomingConversationId = getId(
          incoming.conversationId
      );

      if (
          incomingConversationId &&
          incomingConversationId !== conversationId
      ) {
          return;
      }

      setMessages((previous) => {
          const incomingId = getMessageId(incoming);
          const incomingClientId = incoming.clientMessageId;

          const duplicate = previous.some((message) => {
              const existingId = getMessageId(message);

              return (
                  (incomingId && existingId === incomingId) ||
                  (
                      incomingClientId &&
                      message.clientMessageId === incomingClientId
                  )
              );
          });

          if (duplicate) return previous;

          return [...previous, incoming];
      });
  };

  socket.on("chat:message:new", handleNewMessage);

  return () => {
      socket.off("chat:message:new", handleNewMessage);

      socket.emit(
          "conversation:leave",
          { conversationId }
      );
  };

}, [socket, connected, conversationId]);

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

    if (!text.trim() || sending) {
      return;
    }

    setSending(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("content", text.trim());

      await sendTeamMessage(
        organizationId,
        teamId,
        formData
      );

      setText("");
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

  async function handleScheduleMeeting(event) {
    event.preventDefault();

    if (!organizationId || !teamId || !scheduleTime || scheduling) return;

    const scheduledStartTime = new Date(scheduleTime);

    if (
      Number.isNaN(scheduledStartTime.getTime()) ||
      scheduledStartTime <= new Date()
    ) {
      setError("Please select a future date and time.");
      return;
    }

    setScheduling(true);
    setError("");
    setScheduleNotice("");

    try {
      const meeting = await createScopedMeeting({
        title: scheduleTitle.trim() || `${teamName} Meeting`,
        scopeType: "TEAM",
        organizationId,
        teamId,
        scheduledStartTime: scheduledStartTime.toISOString(),
      });

      setShowScheduleModal(false);
      setScheduleTitle("");
      setScheduleTime("");

      setScheduleNotice(
        meeting?.code
          ? `Meeting scheduled successfully. Meeting code: ${meeting.code}`
          : "Meeting scheduled successfully. Team members will be notified."
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Unable to schedule the team meeting."
      );
    } finally {
      setScheduling(false);
    }
  }

  return (
<main className="relative flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-xl border border-white/25 bg-white/10 text-white shadow-[0_20px_40px_rgba(10,35,65,0.22)] backdrop-blur-md max-md:h-[calc(100dvh-80px)]"
    style={{
      backgroundImage: "linear-gradient(to bottom, #213F70 0%, #315A8A 45%, #506D9A 100%)"
    }}>
    <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-white/20 bg-[#102842]/90 px-2 py-2.5 text-white backdrop-blur-md sm:gap-3 sm:px-5 sm:py-4">
      <button
        type="button"
        onClick={onClose}
        className={iconButton}
        aria-label="Back to organization workspace"
        title="Back"
      >
        <FaArrowLeft />
      </button>

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white">
  <FaUsers />
</div>

      <div className="min-w-0 flex-1">
        <h2 className="truncate text-base font-semibold text-white sm:text-lg">
          {teamName}
        </h2>
        <p className="mt-0.5 text-xs text-sky-100/65">
          Team conversation
        </p>
      </div>

      <button
        type="button"
        onClick={() => {
          setError("");
          setScheduleNotice("");
          setShowScheduleModal(true);
        }}
        className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-sky-300/30 bg-[#1B4B7A] px-2.5 py-2 text-xs font-semibold text-sky-50 transition hover:bg-[#245D91] sm:px-3 sm:text-sm"
      >
        <FaVideo />
        <span className="hidden sm:inline">Schedule meeting</span>
        <span className="sm:hidden">Schedule</span>
      </button>

      <button
  type="button"
  onClick={() => setShowTeamPanel((value) => !value)}
  className={iconButton}
  aria-label={showTeamPanel ? "Close team details" : "Show team details"}
  title={showTeamPanel ? "Close team details" : "Team details"}
>
  {showTeamPanel ? <FaTimes /> : <FaInfoCircle />}
</button>

      <span
        title={
          connectionError ||
          (connected ? "Connected" : "Connecting")
        }
        className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-2.5 py-1 text-xs ${
          connectionError
            ? "border-red-300/25 bg-red-400/10 text-red-200"
            : connected
              ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-200"
              : "border-amber-300/25 bg-amber-400/10 text-amber-200"
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

        <span className="hidden sm:inline">
          {connectionError
            ? "Offline"
            : connected
              ? "Connected"
              : "Connecting"}
        </span>
      </span>
    </header>

    {scheduleNotice && (
      <div className="mx-3 mt-3 flex items-start justify-between gap-3 rounded-xl border border-emerald-300/25 bg-emerald-400/10 px-3 py-2.5 text-sm text-emerald-100 sm:mx-5">
        <p className="min-w-0 break-words">{scheduleNotice}</p>
        <button
          type="button"
          onClick={() => setScheduleNotice("")}
          className="shrink-0 rounded px-1 text-lg leading-none hover:bg-white/10"
          aria-label="Dismiss message"
        >
          ×
        </button>
      </div>
    )}

    {showScheduleModal && (
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget && !scheduling) {
            setShowScheduleModal(false);
          }
        }}
      >
        <section className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-[#426B96] bg-[#153656] p-4 text-slate-100 shadow-2xl shadow-black/40 sm:p-5">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-white">
                Schedule team meeting
              </h3>
              <p className="mt-1 text-sm text-sky-100/70">
                All members of {teamName} will be invited automatically.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowScheduleModal(false)}
              disabled={scheduling}
              className={iconButton}
              aria-label="Close schedule meeting"
            >
              <FaTimes />
            </button>
          </div>

          <form onSubmit={handleScheduleMeeting} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-sky-100">
                Meeting title
              </label>
              <input
                type="text"
                value={scheduleTitle}
                onChange={(event) => setScheduleTitle(event.target.value)}
                maxLength={120}
                placeholder={`${teamName} Meeting`}
                className="w-full rounded-xl border border-[#52789F] bg-[#0D2743] px-3.5 py-3 text-sm text-white outline-none placeholder:text-sky-100/45 focus:border-sky-300"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-sky-100">
                Date and time
              </label>
              <input
                type="datetime-local"
                required
                min={getLocalDateTimeMin()}
                value={scheduleTime}
                onChange={(event) => setScheduleTime(event.target.value)}
                className="w-full rounded-xl border border-[#52789F] bg-[#0D2743] px-3.5 py-3 text-sm text-white outline-none focus:border-sky-300 [color-scheme:dark]"
              />
            </div>

            <div className="rounded-xl border border-sky-300/20 bg-[#1B426A] px-3 py-2.5 text-xs leading-5 text-sky-100">
              Meeting scope: <strong>{teamName}</strong>. Other teams and organization members will not be invited.
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                disabled={scheduling}
                className="rounded-xl border border-[#52789F] px-4 py-2.5 text-sm font-semibold text-sky-100 transition hover:bg-white/10 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={scheduling || !scheduleTime}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0878F9] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {scheduling && <FaSpinner className="animate-spin" />}
                {scheduling ? "Scheduling..." : "Schedule meeting"}
              </button>
            </div>
          </form>
        </section>
      </div>
    )}

<div className="relative flex min-h-0 flex-1 items-stretch overflow-hidden">
      <section className="flex min-w-0 flex-1 flex-col">
        {connectionError && (
          <p className="shrink-0 px-4 pt-2 text-xs text-amber-200">
            Real-time updates are unavailable. Please check your connection.
          </p>
        )}

        {error && (
          <div
            role="alert"
            className="mx-3 mt-3 flex shrink-0 items-start justify-between gap-3 rounded-xl border border-red-300/25 bg-red-400/10 px-3 py-2.5 text-sm text-red-100 sm:mx-5"
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
          className="min-h-0 flex-1 space-y-2.5 overflow-x-hidden overflow-y-auto overscroll-contain bg-white/5 px-2 py-3 sm:px-5 sm:py-5"
          aria-live="polite"
        >
          {loading ? (
            <div className="flex h-full min-h-40 flex-col items-center justify-center gap-3 text-sm text-sky-100/65">
              <FaSpinner className="animate-spin text-xl text-sky-200" />
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full min-h-40 flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-300/25 bg-[#1B426A] text-xl text-sky-200">
                <FaPaperPlane />
              </div>

              <h3 className="text-base font-semibold text-white">
                Start the conversation
              </h3>

              <p className="mt-2 max-w-xs text-sm text-sky-100/65">
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
                    className={`flex max-w-[92%] min-w-0 items-end gap-1.5 sm:max-w-[82%] ${
                      isOwnMessage ? "flex-row-reverse" : ""
                    }`}
                  >
                    <div className="min-w-0">
                      {!isOwnMessage && (
                        <p className="mb-1.5 ml-1 break-words text-xs font-medium text-white/75">
                          {senderName}
                        </p>
                      )}

                      <div
                       className={`min-w-0 rounded-md border px-3 py-2 shadow-sm ${
                        isOwnMessage
                          ? "rounded-br-sm border-[#1267B6] bg-[#1A3048] text-white"
                          : "rounded-bl-sm border-white/25 bg-[#1A3048] text-[#E4ECF5]"
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
                            className="mt-2 flex min-w-0 items-center gap-2 rounded-lg border border-[#52789F] bg-[#0D2B49] p-2.5 text-sm text-sky-100 transition hover:bg-[#173D62] hover:text-white"
                          >
                            <FaFileAlt className="shrink-0" />
                            <span className="break-all">
                              {fileName || "Open attachment"}
                            </span>
                          </a>
                        )}

                        <div className="mt-2 flex items-center justify-end gap-2">
                          <span className="text-[10px] text-[#8FA5BB]">
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
    className="shrink-0 border-t border-[#173B60] bg-[#102842]/80 p-2.5 sm:px-4 sm:py-3.5"
>
<div className="flex min-h-[44px] min-w-0 items-center gap-2 rounded-lg border-2 border-[#173B60] bg-[#0B2344] px-2 transition focus-within:border-[#0066FF] sm:min-h-[46px] sm:px-2.5">
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
                className="max-h-32 min-h-9 min-w-0 flex-1 resize-none bg-transparent px-1 py-2 text-sm leading-5 text-white outline-none placeholder:text-sky-100/50"
              />

              <button
                type="submit"
                disabled={sending || !text.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gradient-to-r from-[#0066FF] to-[#0148B3] text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
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

            <p className="mt-2 px-1 text-[11px] text-sky-100/50">
              Enter to send · Shift + Enter for a new line
            </p>
          </form>
        </section>

        {showTeamPanel && (
          <>
            <button
              type="button"
              aria-label="Close team details"
              onClick={() => setShowTeamPanel(false)}
              className="fixed inset-0 z-40 cursor-default bg-black/50 backdrop-blur-sm lg:hidden"
            />
            <aside className="fixed inset-y-0 right-0 z-50 flex h-full w-[min(88vw,340px)] min-h-0 flex-col border-l border-white/20 bg-[#102842] p-3 shadow-2xl lg:relative lg:inset-auto lg:z-auto lg:h-full lg:w-[290px] lg:shrink-0 lg:bg-[#102842]/75 lg:shadow-sm">
            <div className="flex items-center justify-between border-b border-white/20 px-1 pb-4">
              <h3 className="space-y-3 rounded-md border border-white/20 bg-white/10 p-3">
                Team details
              </h3>

              <button
                type="button"
                onClick={() => setShowTeamPanel(false)}
                className={iconButton}
                aria-label="Hide team details"
                title="Hide team details"
              >
                <FaTimes className="text-lg" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1D4770] text-sky-100">
                  <FaUsers />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {teamName}
                  </p>
                  <p className="text-xs text-sky-100/60">
                    {teamMembers.length} members
                  </p>
                </div>
              </div>

              <div className="space-y-3 rounded-xl border border-[#416B98] bg-[#153656] p-3">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-sky-200/55">
                    Team ID
                  </p>
                  <p className="mt-1 break-all text-xs font-medium text-sky-100">
                    {teamId || "Not available"}
                  </p>
                </div>

                <div className="border-t border-[#416B98]/60 pt-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-sky-200/55">
                    Organization
                  </p>
                  <p className="mt-1 text-sm text-sky-100/85">
                    {organizationName}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white">
                    Members
                  </h4>
                  <span className="text-xs text-sky-100/60">
                    {teamMembers.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {(showAllMembers
                    ? teamMembers
                    : teamMembers.slice(0, 3)
                  ).map((member, index) => {
                    const memberId =
                      getId(member?._id ?? member?.id ?? member?.userId) ||
                      `${getMemberName(member)}-${index}`;

                    const memberName = getMemberName(member);

                    const initials = memberName
                      .split(/\s+/)
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")
                      .toUpperCase();

                    return (
                      <div
                        key={memberId}
                        className="flex min-w-0 items-center gap-2.5"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1D4770] text-xs font-semibold text-sky-100">
                          {initials || "M"}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-white">
                            {memberName}
                          </p>
                          <p className="truncate text-xs capitalize text-sky-100/60">
                            {getMemberRole(member)}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {teamMembers.length === 0 && (
                    <p className="text-xs leading-5 text-sky-100/60">
                      Member details are not available in the team data.
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  disabled={teamMembers.length <= 3}
                  onClick={() => setShowAllMembers((value) => !value)}
                  className="mt-4 w-full rounded-lg border border-[#52789F] px-3 py-2 text-xs font-semibold text-sky-100 transition hover:bg-[#1B426A] disabled:cursor-default disabled:opacity-50"
                >
                  {showAllMembers ? "Show less" : "View all members"}
                </button>
              </div>
            </div>
          </aside>
          </>
        )}
      </div>
    </main>
  );
}