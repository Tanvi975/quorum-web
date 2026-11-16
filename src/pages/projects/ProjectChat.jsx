
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiMessageCircle,
  FiSend,
  FiLoader,
  FiUsers,
  FiUser,
  FiInfo,
  FiX,
} from "react-icons/fi";

import { getProjectById } from "../../services/projectService";
import { getMessages } from "../../services/chatService";
import { useAuth } from "../../context/AuthContext";
import useChatSocket from "../../hooks/useChatSocket";

function getId(value) {
  if (!value) return "";

  if (typeof value === "object") {
    return String(value.id ?? value._id ?? value.userId ?? "");
  }

  return String(value);
}

function getMessageId(message) {
  return getId(message?._id ?? message?.id);
}

function getSenderId(message) {
  return getId(
    message?.senderId ??
    message?.sender?.id ??
    message?.sender?._id ??
    message?.sender
  );
}

function getMessageContent(message) {
  return message?.content ?? message?.message ?? "";
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

function getMessageList(response) {
  const result =
    response?.data?.data ??
    response?.data ??
    response;

  if (Array.isArray(result)) return result;

  return result?.messages ?? result?.data?.messages ?? [];
}

function addUniqueMessage(previous, incoming) {
  if (!incoming) return previous;

  const incomingId = getMessageId(incoming);
  const clientMessageId = incoming.clientMessageId;

  const exists = previous.some((message) => {
    return (
      (incomingId && getMessageId(message) === incomingId) ||
      (clientMessageId &&
        message.clientMessageId === clientMessageId)
    );
  });

  if (exists) return previous;

  return [...previous, incoming];
}

function getInitials(name) {
  if (!name) return "U";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getMemberList(project) {
  const members =
    project?.members ??
    project?.teamMembers ??
    project?.collaborators ??
    project?.participants ??
    [];

  return Array.isArray(members) ? members : [];
}

export default function ProjectChat() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { socket, connected, connectionError } = useChatSocket();

  const [project, setProject] = useState(null);
  const [conversationId, setConversationId] = useState("");

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const [loadingProject, setLoadingProject] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const [error, setError] = useState("");
  const [showInfo, setShowInfo] = useState(true);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const currentUserId = getId(
    user?.id ??
    user?._id ??
    user?.userId ??
    user?.sub
  );

  const userName =
    user?.name ??
    user?.fullName ??
    user?.username ??
    "User";

  const userEmail = user?.email ?? "";

  const userAvatar =
    user?.avatar ??
    user?.profilePicture ??
    user?.profileImage ??
    "";

  // Load project and its conversation ID.
  useEffect(() => {
    let active = true;

    async function loadProject() {
      try {
        setLoadingProject(true);
        setError("");

        const response = await getProjectById(projectId);

        const projectData =
          response?.data?.data ??
          response?.data ??
          response;

        if (!active) return;

        setProject(projectData);

        const id = getId(
          projectData?.conversationId ??
          projectData?.conversation?.id ??
          projectData?.conversation?._id
        );

        setConversationId(id);

        if (!id) {
          setError(
            "This project does not have a chat conversation yet."
          );
        }
      } catch (err) {
        if (active) {
          setError(
            err?.response?.data?.message ??
            "Unable to load project details."
          );
        }
      } finally {
        if (active) setLoadingProject(false);
      }
    }

    loadProject();

    return () => {
      active = false;
    };
  }, [projectId]);

  // Load previous messages.
  const loadMessages = useCallback(async () => {
    if (!conversationId) return;

    try {
      setLoadingMessages(true);
      setError("");

      const response = await getMessages(conversationId, 50);
      setMessages(getMessageList(response));
    } catch (err) {
      setError(
        err?.response?.data?.message ??
        "Unable to load chat messages."
      );
    } finally {
      setLoadingMessages(false);
    }
  }, [conversationId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Join conversation and listen for new messages.
  useEffect(() => {
    if (!socket || !connected || !conversationId) return;

    socket.emit(
      "conversation:join",
      { conversationId },
      (response) => {
        if (response?.success === false) {
          setError(
            response?.message ??
            "Unable to join project conversation."
          );
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

      setMessages((previous) =>
        addUniqueMessage(previous, incoming)
      );
    };

    socket.on("message:new", handleNewMessage);
    socket.on("chat:message:new", handleNewMessage);

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("chat:message:new", handleNewMessage);

      socket.emit("conversation:leave", {
        conversationId,
      });
    };
  }, [socket, connected, conversationId]);

  // Auto-scroll to the latest message.
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight -
      container.scrollTop -
      container.clientHeight;

    if (distanceFromBottom < 180) {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [messages]);

  // Send message.
  function handleSend(event) {
    event.preventDefault();

    const content = text.trim();

    if (!content || sending) return;

    if (!socket || !connected) {
      setError("Chat is disconnected. Please wait for reconnection.");
      return;
    }

    if (!conversationId) {
      setError("Project conversation is not available.");
      return;
    }

    const clientMessageId =
      globalThis.crypto?.randomUUID?.() ??
      `${Date.now()}-${Math.random()}`;

    setSending(true);
    setError("");

    socket.emit(
      "message:send",
      {
        conversationId,
        clientMessageId,
        content,
      },
      (response) => {
        setSending(false);

        if (!response?.success) {
          setError(
            response?.message ??
            response?.error ??
            "Message could not be sent."
          );
          return;
        }

        if (response?.data) {
          setMessages((previous) =>
            addUniqueMessage(previous, response.data)
          );
        }

        setText("");
      }
    );
  }

  if (loadingProject) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#102842] text-white">
        <div className="flex items-center gap-3 text-sm">
          <FiLoader className="animate-spin text-xl" />
          Loading project chat...
        </div>
      </main>
    );
  }

  if (!project || !conversationId) {
    return (
      <main className="flex min-h-[70vh] flex-col items-center justify-center gap-4 bg-[#102842] px-5 text-center text-white">
        <FiMessageCircle className="text-5xl text-blue-200" />

        <h2 className="text-xl font-bold">
          Project chat unavailable
        </h2>

        <p className="max-w-md text-sm text-blue-100/70">
          {error || "This project does not have an active conversation."}
        </p>

        <button
          onClick={() => navigate(`/projects/${projectId}`)}
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-500"
        >
          Back to Project
        </button>
      </main>
    );
  }

  const members = getMemberList(project);

  return (
<main className="relative flex h-[calc(100dvh-16px)] min-h-[560px] w-full min-w-0 overflow-hidden rounded-xl border border-white/15 bg-[#102842] text-white shadow-xl">

      {/* MAIN CHAT AREA */}
      <div className="flex min-w-0 flex-1 flex-col">

        {/* HEADER */}
        <header className="flex shrink-0 items-center gap-3 border-b border-white/10 bg-[#102842] px-3 py-3 sm:px-5">

          <button
            type="button"
            onClick={() => navigate(`/projects/${projectId}`)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/10 hover:text-white"
            aria-label="Back to project"
          >
            <FiArrowLeft />
          </button>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-200/20 bg-blue-300/15 text-xl text-blue-100">
            <FiMessageCircle />
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-bold sm:text-lg">
              {project.name || "Project Workspace"}
            </h1>

            <p className="text-xs text-blue-100/60">
              Project Workspace Chat
            </p>
          </div>

          <div
            title={connectionError || (connected ? "Connected" : "Connecting")}
            className={`flex shrink-0 items-center gap-2 rounded-full border px-2.5 py-1.5 text-xs ${
              connected
                ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-200"
                : "border-amber-300/25 bg-amber-400/10 text-amber-200"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                connected ? "bg-emerald-300" : "bg-amber-300"
              }`}
            />

            <span className="hidden sm:inline">
              {connected ? "Connected" : "Connecting"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowInfo((previous) => !previous)}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${
              showInfo
                ? "bg-blue-500/20 text-blue-200"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
            title="Toggle profile and project info"
            aria-label="Toggle profile and project info"
          >
            <FiUser className="text-lg" />
          </button>
        </header>

        {/* MESSAGES */}
        <section
          ref={messagesContainerRef}
          className="min-h-0 flex-1 space-y-3 overflow-x-hidden overflow-y-auto overscroll-contain bg-gradient-to-br from-[#213F70] via-[#315A8A] to-[#496C98] px-3 py-4 sm:px-6 sm:py-5"
          aria-live="polite"
        >
          {error && (
            <div
              role="alert"
              className="flex items-center justify-between gap-3 rounded-xl border border-red-300/25 bg-red-400/10 px-3 py-2 text-sm text-red-100"
            >
              <span>{error}</span>

              <button
                type="button"
                onClick={() => setError("")}
                className="text-lg"
                aria-label="Dismiss error"
              >
                ×
              </button>
            </div>
          )}

          {loadingMessages ? (
            <div className="flex h-full items-center justify-center gap-3 text-sm text-blue-100/70">
              <FiLoader className="animate-spin text-xl" />
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full min-h-48 flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-200/20 bg-blue-300/10 text-2xl text-blue-100">
                <FiUsers />
              </div>

              <h2 className="text-lg font-semibold">
                Start the conversation
              </h2>

              <p className="mt-2 max-w-xs text-sm text-blue-100/65">
                Send the first message to your project collaborators.
              </p>
            </div>
          ) : (
            messages.map((message, index) => {
              const messageId = getMessageId(message);
              const senderId = getSenderId(message);

              const isOwnMessage =
                Boolean(currentUserId) &&
                senderId === currentUserId;

              const senderName =
                message?.sender?.name ??
                message?.senderName ??
                (isOwnMessage ? "You" : "Project member");

              return (
                <article
                  key={
                    messageId ||
                    message?.clientMessageId ||
                    `${message?.createdAt}-${index}`
                  }
                  className={`flex w-full ${
                    isOwnMessage ? "justify-end" : "justify-start"
                  }`}
                >
                  <div className="max-w-[88%] min-w-0 sm:max-w-[75%]">
                    {!isOwnMessage && (
                      <p className="mb-1 px-1 text-xs font-medium text-blue-100/75">
                        {senderName}
                      </p>
                    )}

                    <div
                      className={`rounded-2xl border px-3.5 py-2.5 shadow-sm sm:px-4 ${
                        isOwnMessage
                          ? "rounded-br-sm border-blue-400/30 bg-[#0759B5] text-white"
                          : "rounded-bl-sm border-white/15 bg-[#183A60] text-blue-50"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words text-sm leading-6">
                        {getMessageContent(message)}
                      </p>

                      {message?.fileUrl && (
                        <a
                          href={message.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 block break-all text-xs text-blue-200 underline"
                        >
                          {message.fileName || "Open attachment"}
                        </a>
                      )}

                      <div className="mt-1.5 text-right text-[10px] text-blue-100/55">
                        {getMessageTime(message)}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}

          <div ref={messagesEndRef} />
        </section>

        {/* MESSAGE INPUT */}
        <form
          onSubmit={handleSend}
          className="shrink-0 border-t border-white/10 bg-[#102842] p-3 sm:px-5 sm:py-4"
        >
          <div className="flex min-w-0 items-end gap-2 rounded-xl border border-white/20 bg-[#0B2344] p-2 transition focus-within:border-blue-400">
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
              className="max-h-32 min-h-10 min-w-0 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-5 text-white outline-none placeholder:text-blue-100/45"
            />

            <button
              type="submit"
              disabled={!text.trim() || sending || !connected}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Send message"
              title="Send message"
            >
              {sending ? (
                <FiLoader className="animate-spin" />
              ) : (
                <FiSend />
              )}
            </button>
          </div>

          <p className="mt-2 px-1 text-[11px] text-blue-100/45">
            Enter to send · Shift + Enter for a new line
          </p>
        </form>
      </div>

      {showInfo && (
  <>
    {/* Mobile backdrop */}
    <button
      type="button"
      aria-label="Close workspace info"
      onClick={() => setShowInfo(false)}
      className="absolute inset-0 z-20 bg-black/50 lg:hidden"
    />

    <aside className="absolute right-0 top-0 z-30 flex h-full w-[min(85vw,320px)] shrink-0 flex-col border-l border-white/10 bg-[#102842] shadow-2xl lg:relative lg:z-0 lg:w-[280px] lg:shadow-none">

          <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
            <h2 className="text-sm font-semibold text-white">
              Workspace Info
            </h2>

            <button
              type="button"
              onClick={() => setShowInfo(false)}
              className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
              aria-label="Close workspace info"
            >
              <FiX />
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4">

            {/* CURRENT USER PROFILE */}
            <section>
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-200/60">
                <FiUser />
                My Profile
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={userName}
                    className="h-11 w-11 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-500/25 text-sm font-bold text-blue-100">
                    {getInitials(userName)}
                  </div>
                )}

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {userName}
                  </p>

                  <p className="truncate text-xs text-blue-100/55">
                    {userEmail || "Project member"}
                  </p>
                </div>
              </div>
            </section>

            {/* PROJECT DETAILS */}
            <section>
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-200/60">
                <FiInfo />
                Project Details
              </div>

              <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
                <div>
                  <p className="text-[11px] text-blue-100/45">
                    Project name
                  </p>
                  <p className="mt-1 break-words text-sm font-medium text-white">
                    {project.name || "Not available"}
                  </p>
                </div>

                {project.description && (
                  <div>
                    <p className="text-[11px] text-blue-100/45">
                      Description
                    </p>
                    <p className="mt-1 break-words text-xs leading-5 text-blue-100/75">
                      {project.description}
                    </p>
                  </div>
                )}

                {project.status && (
                  <div>
                    <p className="text-[11px] text-blue-100/45">
                      Status
                    </p>
                    <span className="mt-1 inline-flex rounded-full bg-blue-400/10 px-2.5 py-1 text-xs capitalize text-blue-200">
                      {String(project.status).replaceAll("_", " ")}
                    </span>
                  </div>
                )}
              </div>
            </section>

            {/* PROJECT MEMBERS */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-200/60">
                  <FiUsers />
                  Members
                </div>

                <span className="text-xs text-blue-100/50">
                  {members.length}
                </span>
              </div>

              {members.length > 0 ? (
                <div className="space-y-2">
                  {members.map((member, index) => {
                    const memberUser =
                      member?.user ??
                      member?.member ??
                      member;

                    const memberName =
                      memberUser?.name ??
                      memberUser?.fullName ??
                      memberUser?.username ??
                      "Project member";

                    const memberAvatar =
                      memberUser?.avatar ??
                      memberUser?.profilePicture ??
                      memberUser?.profileImage ??
                      "";

                    const memberId = getId(
                      memberUser?.id ??
                      memberUser?._id ??
                      member?.userId
                    );

                    return (
                      <div
                        key={memberId || index}
                        className="flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-white/[0.04]"
                      >
                        {memberAvatar ? (
                          <img
                            src={memberAvatar}
                            alt={memberName}
                            className="h-9 w-9 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-100">
                            {getInitials(memberName)}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-white">
                            {memberName}
                            {memberId && memberId === currentUserId
                              ? " (You)"
                              : ""}
                          </p>

                          {member?.role && (
                            <p className="text-xs capitalize text-blue-100/50">
                              {member.role}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-white/10 px-3 py-4 text-center text-xs text-blue-100/45">
                  Member details are not available.
                </p>
              )}
            </section>
          </div>
          </aside>
  </>
)}
    </main>
  );
}
