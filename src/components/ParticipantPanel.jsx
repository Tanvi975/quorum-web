
import { useEffect, useRef, useState } from "react";
import {
  FiMic,
  FiMicOff,
  FiVideo,
  FiVideoOff,
  FiX,
  FiSend,
  FiCopy,
  FiCheck,
  FiLink,
} from "react-icons/fi";

function statusValue(item, keys) {
  for (const key of keys) {
    if (typeof item?.[key] === "boolean") {
      return item[key];
    }
  }
  return null;
}

function getParticipantId(participant) {
  return String(
    participant?.userId ||
      participant?.id ||
      participant?._id ||
      participant?.peerId ||
      ""
  );
}

function getParticipantName(participant, fallback = "Participant") {
  const name =
    participant?.name ||
    participant?.username ||
    participant?.user?.name ||
    fallback;

  return String(name).trim() || fallback;
}

function getMessageContent(message) {
  const content = message?.content ?? message?.message ?? "";
  return typeof content === "string" ? content : String(content);
}

function getMessageSender(message) {
  return (
    message?.name ||
    message?.senderName ||
    message?.userName ||
    message?.user?.name ||
    message?.sender?.name ||
    "Participant"
  );
}

export default function ParticipantPanel({
  isOpen = false,
  activeTab = "participants",
  onTabChange = () => {},
  onClose = () => {},
  participants = [],
  messages = [],
  user,
  isHost = false,
  chatInput = "",
  setChatInput = () => {},
  onSendMessage = () => {},
  meetingCode = "",
  meetingLink = "",
}) {
  const endRef = useRef(null);
  const [copyStatus, setCopyStatus] = useState("");

  useEffect(() => {
    if (isOpen && activeTab === "chat") {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, activeTab]);

  useEffect(() => {
    setCopyStatus("");
  }, [activeTab]);

  if (!isOpen) return null;

  const selfId = String(user?.id || user?._id || user?.userId || "");

  async function copyText(value, label) {
    if (!value) {
      setCopyStatus(`${label} is unavailable.`);
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setCopyStatus(`${label} copied successfully.`);
    } catch {
      setCopyStatus(
        "Unable to copy automatically. Please copy the text manually."
      );
    }
  }

  function send(event) {
    event.preventDefault();

    const content = chatInput.trim();
    if (!content) return;

    onSendMessage(content);
    setChatInput("");
  }

  const tabs = [
    { id: "participants", label: "People" },
    { id: "chat", label: "Chat" },
    { id: "info", label: "Meeting Info" },
  ];

  return (
    <aside className="flex h-full max-h-full min-h-0 w-[min(380px,calc(100vw-1rem))] shrink-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0B2344] shadow-xl max-sm:w-[calc(100vw-1rem)]">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-3 py-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">Meeting panel</h2>

          <p className="text-[11px] text-white/50">
            {activeTab === "participants"
              ? `${participants.length} participant${
                  participants.length === 1 ? "" : "s"
                }`
              : activeTab === "chat"
                ? "Messages in this meeting"
                : "Share meeting details"}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close meeting panel"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white"
        >
          <FiX size={17} />
        </button>
      </header>

      {/* Meeting panel tabs */}
      <div
        className="grid shrink-0 grid-cols-3 gap-1 border-b border-white/10 p-2"
        role="tablist"
        aria-label="Meeting panel tabs"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`min-w-0 rounded-lg px-1.5 py-2 text-xs font-medium transition sm:px-2 sm:text-sm ${
              activeTab === tab.id
                ? "bg-[#0066FF] text-white"
                : "text-white/65 hover:bg-white/5"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Participants */}
      {activeTab === "participants" && (
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
          {participants.length === 0 ? (
            <p className="py-8 text-center text-xs text-white/50">
              No participants yet.
            </p>
          ) : (
            participants.map((participant, index) => {
              const id = getParticipantId(participant);
              const self = Boolean(id && id === selfId);
              const name = getParticipantName(
                participant,
                self ? "You" : "Participant"
              );

              const muted = statusValue(participant, [
                "isMuted",
                "muted",
              ]);

              const videoOff = statusValue(participant, [
                "isVideoOff",
                "cameraOff",
                "videoOff",
              ]);

              return (
                <div
                  key={id || `${name}-${index}`}
                  className="flex items-center gap-3 rounded-lg bg-white/5 p-2.5"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#4C698E] text-sm font-semibold">
                    {name.charAt(0).toUpperCase() || "?"}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {name}
                      {self ? " (You)" : ""}
                    </p>

                    <p className="mt-1 text-[11px] text-white/45">
                      {participant.role ||
                        (self && isHost ? "Organizer" : "Meeting guest")}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {muted === true ? (
                      <FiMicOff
                        title="Muted"
                        className="text-red-400"
                        size={15}
                      />
                    ) : muted === false ? (
                      <FiMic
                        title="Microphone on"
                        className="text-emerald-400"
                        size={15}
                      />
                    ) : (
                      <span className="text-[10px] text-white/40">
                        Mic —
                      </span>
                    )}

                    {videoOff === true ? (
                      <FiVideoOff
                        title="Camera off"
                        className="text-red-300"
                        size={15}
                      />
                    ) : videoOff === false ? (
                      <FiVideo
                        title="Camera on"
                        className="text-emerald-300"
                        size={15}
                      />
                    ) : (
                      <span className="text-[10px] text-white/40">
                        Cam —
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Chat */}
      {activeTab === "chat" && (
        <>
          <div
            className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3"
            aria-live="polite"
            aria-relevant="additions"
          >
            {messages.length === 0 ? (
              <p className="mt-8 text-center text-xs text-white/45">
                No messages yet. Start the conversation.
              </p>
            ) : (
              messages.map((message, index) => (
                <div
                  key={
                    message._id ||
                    message.id ||
                    `${message.createdAt || ""}-${index}`
                  }
                  className="rounded-lg bg-white/10 p-2.5"
                >
                  <p className="text-xs font-semibold text-blue-200">
                    {getMessageSender(message)}
                  </p>

                  <p className="mt-1 whitespace-pre-wrap break-words text-sm text-white">
                    {getMessageContent(message)}
                  </p>
                </div>
              ))
            )}

            <div ref={endRef} />
          </div>

          <form
            onSubmit={send}
            className="flex shrink-0 gap-2 border-t border-white/10 p-3"
          >
            <input
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              placeholder="Type a message..."
              aria-label="Chat message"
              className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/10 px-3 py-2.5 text-sm outline-none placeholder:text-white/35 focus:border-blue-400"
            />

            <button
              type="submit"
              disabled={!chatInput.trim()}
              aria-label="Send message"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FiSend size={16} />
            </button>
          </form>
        </>
      )}

      {/* Meeting Info */}
      {activeTab === "info" && (
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <FiLink className="text-blue-300" size={18} />
              <h3 className="text-sm font-semibold">Invite people</h3>
            </div>

            <p className="text-xs leading-relaxed text-white/55">
              Share the meeting code or invitation link with people you want
              to invite to this meeting.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="mb-2 text-xs font-medium text-white/55">
              MEETING CODE
            </p>

            <p className="mb-3 break-all text-lg font-semibold tracking-wider text-white">
              {meetingCode || "Not available"}
            </p>

            <button
              type="button"
              onClick={() => copyText(meetingCode, "Meeting code")}
              disabled={!meetingCode}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/10 px-3 py-2.5 text-sm font-medium transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FiCopy size={15} />
              Copy meeting code
            </button>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="mb-2 text-xs font-medium text-white/55">
              INVITATION LINK
            </p>

            <p className="mb-3 break-all text-sm leading-relaxed text-blue-200">
              {meetingLink || "Meeting link unavailable"}
            </p>

            <button
              type="button"
              onClick={() => copyText(meetingLink, "Invitation link")}
              disabled={!meetingLink}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0066FF] px-3 py-2.5 text-sm font-medium text-white transition hover:bg-[#0057DB] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FiCopy size={15} />
              Copy invitation link
            </button>
          </div>

          {copyStatus && (
            <p
              role="status"
              className="break-words rounded-lg bg-white/5 p-3 text-xs text-emerald-300"
            >
              {copyStatus}
            </p>
          )}

          <p className="text-[11px] leading-relaxed text-white/40">
            Anyone with this invitation link may be able to request to join
            the meeting. The host may need to admit them.
          </p>
        </div>
      )}
    </aside>
  );
}
