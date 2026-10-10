
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FiSearch,
  FiPlus,
  FiMoreHorizontal,
  FiPaperclip,
  FiSmile,
  FiSend,
  FiPhone,
  FiVideo,
  FiInfo,
  FiMessageSquare,
  FiX,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import useChatSocket from "../hooks/useChatSocket";
import {
  getConversations,
  searchUsers,
  startDirectChat,
  getMessages,
} from "../services/chatService";

function getUser(participant) {
  return participant?.user || participant || {};
}

function getUserId(person) {
  return person?.id || person?._id || person?.userId;
}

function getUserName(person) {
  return person?.name || person?.fullName || person?.email || "User";
}

function getOtherParticipant(conversation, currentUserId) {
  const participants = conversation?.participants || [];

  return (
    participants
      .map(getUser)
      .find(
        (person) =>
          String(getUserId(person)) !== String(currentUserId)
      ) || {}
  );
}

function getMessageId(message) {
  return message?.id || message?._id;
}

function normalizeMessage(item, currentUserId) {
  const sender = getUser(item?.sender);
  const senderId = item?.senderId || getUserId(sender);

  return {
    ...item,
    id: getMessageId(item) || item?.clientMessageId,
    text: item?.content || "",
    sender,
    mine: String(senderId) === String(currentUserId),
    time: item?.createdAt
      ? new Date(item.createdAt).toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        })
      : "",
  };
}

function Avatar({ name, color = "#AAB5C5", size = 34 }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-lg font-semibold text-[#172A40]"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        fontSize: size * 0.35,
      }}
    >
      {name?.charAt(0)?.toUpperCase() || "?"}
    </div>
  );
}

function IconButton({ children, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#A6B6C8] transition hover:bg-[#263F59] hover:text-white"
    >
      {children}
    </button>
  );
}

export default function Chat() {
  const { user } = useAuth();
  const { socket, connected, connectionError } = useChatSocket();

  const currentUserId = getUserId(user);

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [message, setMessage] = useState("");
  const [showInfo, setShowInfo] = useState(true);
  const [showMobileContacts, setShowMobileContacts] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [readBoundary, setReadBoundary] = useState({});

  const messageEndRef = useRef(null);
  const searchRequestRef = useRef(0);
  const activeConversationRef = useRef(null);
  const messagesRef = useRef([]);

  const activeContact = activeConversation
    ? getOtherParticipant(activeConversation, currentUserId)
    : {};

  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const loadConversations = useCallback(async () => {
    setLoadingConversations(true);

    try {
      const response = await getConversations();
      const list = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : [];

      setConversations(list);

      setActiveConversation((previous) => {
        if (!list.length) return null;

        if (previous) {
          return (
            list.find(
              (item) => String(item.id) === String(previous.id)
            ) || previous
          );
        }

        return list[0];
      });

      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not load conversations."
      );
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!search.trim() || !searchMode) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    const requestId = ++searchRequestRef.current;

    const timer = setTimeout(async () => {
      setSearching(true);

      try {
        const response = await searchUsers(search.trim());

        if (requestId !== searchRequestRef.current) return;

    
      const users = Array.isArray(response?.data?.users)
    ? response.data.users
     : Array.isArray(response?.data)
    ? response.data
    : [];
 

        setSearchResults(
          users.filter(
            (person) =>
              String(getUserId(person)) !== String(currentUserId)
          )
        );
      } catch (err) {
        if (requestId === searchRequestRef.current) {
          setSearchResults([]);
          setError(
            err.response?.data?.message ||
              "Could not search users."
          );
        }
      } finally {
        if (requestId === searchRequestRef.current) {
          setSearching(false);
        }
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [search, searchMode, currentUserId]);

  useEffect(() => {
    if (!socket || !connected || !activeConversation?.id) return;

    const conversationId = activeConversation.id;

    socket.emit("conversation:join", { conversationId });

    const handleNewMessage = (incoming) => {
      if (
        String(incoming?.conversationId) !== String(conversationId)
      ) {
        loadConversations();
        return;
      }

      const normalized = normalizeMessage(incoming, currentUserId);

      setMessages((previous) => {
        const exists = previous.some(
          (item) =>
            String(getMessageId(item)) ===
              String(getMessageId(normalized)) ||
            (incoming.clientMessageId &&
              item.clientMessageId === incoming.clientMessageId)
        );

        if (exists) return previous;

        return [...previous, normalized];
      });

      loadConversations();
    };

    const handleConversationUpdate = () => {
      loadConversations();
    };

    socket.on("message:new", handleNewMessage);
    socket.on("conversation:update", handleConversationUpdate);


const handleMessageRead = (data) => {
    if (
      String(data.conversationId) !==
      String(activeConversationRef.current?.id)
    ) {
      return;
    }
  
    const currentUserId = user?.id;
  
    if (String(data.userId) === String(currentUserId)) {
      return;
    }
  
    setReadBoundary((previous) => ({
      ...previous,
      [data.conversationId]: {
        seq: Number(data.lastReadSeq || 0),
        messageId: data.lastReadMessageId || data.messageId || null,
      },
    }));
  };
  
  socket.on("message:read", handleMessageRead);
  

    return () => {
      socket.emit("conversation:leave", { conversationId });
      socket.off("message:new", handleNewMessage);
      socket.off("conversation:update", handleConversationUpdate);
      socket.off("message:read", handleMessageRead);
    };
  }, [
    socket,
    connected,
    activeConversation?.id,
    currentUserId,
    loadConversations,
  ]);

  useEffect(() => {
    if (!activeConversation?.id) {
      setMessages([]);
      return;
    }

    let cancelled = false;

    async function loadHistory() {
      setLoadingMessages(true);
      setMessages([]);

      try {
        const response = await getMessages(activeConversation.id);
        const result = response?.data;

        const list = Array.isArray(result?.messages)
          ? result.messages
          : Array.isArray(result)
            ? result
            : [];

       
if (!cancelled) {
    const normalizedList = list.map((item) =>
      normalizeMessage(item, currentUserId)
    );
  
    setMessages(normalizedList);
  
    const lastIncomingMessage = [...normalizedList]
      .reverse()
      .find((item) => !item.mine && getMessageId(item));
  
    if (socket && connected && lastIncomingMessage) {
      socket.emit("message:read", {
        conversationId: activeConversation.id,
        messageId: getMessageId(lastIncomingMessage),
      });
    }
  }
  
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "Could not load message history."
          );
        }
      } finally {
        if (!cancelled) setLoadingMessages(false);
      }
    }

    loadHistory();

    return () => {
      cancelled = true;
    };
}, [activeConversation?.id, currentUserId, socket, connected]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function openUserChat(person) {
    const targetUserId = getUserId(person);

    if (!targetUserId) {
      setError("The selected user's ID is missing.");
      return;
    }

    setError("");

    try {
      const response = await startDirectChat(targetUserId);
      const conversation = response?.data;

      if (!conversation?.id) {
        throw new Error("No conversation ID returned by the server.");
      }

      setConversations((previous) => {
        const exists = previous.some(
          (item) => String(item.id) === String(conversation.id)
        );

        return exists
          ? previous.map((item) =>
              String(item.id) === String(conversation.id)
                ? { ...item, ...conversation }
                : item
            )
          : [conversation, ...previous];
      });

      setActiveConversation(conversation);
      setSearch("");
      setSearchResults([]);
      setSearchMode(false);
      setShowMobileContacts(false);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Could not start the conversation."
      );
    }
  }

  function sendMessage(event) {
    event.preventDefault();

    const content = message.trim();

    if (!content || sending) return;

    if (!socket || !connected) {
      setError("Chat server is disconnected. Please try again.");
      return;
    }

    if (!activeConversation?.id) {
      setError("Select a conversation before sending a message.");
      return;
    }

    const clientMessageId = crypto.randomUUID();

    setSending(true);
    setError("");

    socket.timeout(10000).emit(
      "message:send",
      {
        conversationId: activeConversation.id,
        clientMessageId,
        content,

      },
      (timeoutError, response) => {
        setSending(false);

        if (timeoutError) {
          setError("Message acknowledgement timed out. Please retry.");
          return;
        }

        if (!response?.success) {
          setError(response?.message || "Message could not be sent.");
          return;
        }

        if (response.data) {
          const savedMessage = normalizeMessage(
            { ...response.data, clientMessageId },
            currentUserId
          );

          setMessages((previous) => {
            const exists = previous.some(
              (item) =>
                String(getMessageId(item)) ===
                  String(getMessageId(savedMessage)) ||
                item.clientMessageId === clientMessageId
            );

            return exists ? previous : [...previous, savedMessage];
          });
        }

        setMessage("");
        loadConversations();
      }
    );
  }

  const visibleConversations = conversations.filter((conversation) => {
    const contact = getOtherParticipant(conversation, currentUserId);

    return getUserName(contact)
      .toLowerCase()
      .includes(search.trim().toLowerCase());
  });

  function startNewChat() {
    setSearch("");
    setSearchResults([]);
    setSearchMode(true);
    setShowMobileContacts(true);
    setTimeout(() => {
      document.getElementById("conversation-search")?.focus();
    }, 0);
  }

  return (
    <div className="min-h-screen bg-[#121419] p-3 text-[#E8EDF5] sm:p-5">
      <div className="mx-auto flex min-h-[calc(100vh-24px)] w-full max-w-[1440px] flex-col overflow-hidden rounded-lg border border-[#253D57] bg-[#0D1F33] sm:min-h-[calc(100vh-40px)]">
        <header className="flex h-11 shrink-0 items-center justify-between border-b border-[#253D57] bg-[#0D1F33] px-4">
          <div className="flex items-center gap-2">
            <FiMessageSquare className="text-[#38BDF8]" size={17} />
            <span className="text-sm font-semibold tracking-wide text-white">
              Quorum
            </span>
            <span className="ml-1 hidden text-xs text-[#7F95AB] sm:inline">
              / Messages
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                connected ? "bg-[#38BDF8]" : "bg-red-400"
              }`}
            />
            <span className="text-[11px] text-[#A6B6C8]">
              {connected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 gap-2.5 p-2.5 sm:gap-3 sm:p-3">
          {(!showMobileContacts || !activeConversation) && (
            <aside
              className={`${
                showMobileContacts ? "flex" : "hidden"
              } w-full shrink-0 flex-col rounded-lg border border-[#253D57] bg-[#192D43] p-3 md:flex md:w-[245px] lg:w-[265px] xl:w-[275px]`}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">
                  Conversations
                </h2>
                <span className="rounded-md bg-[#263F59] px-2 py-1 text-[10px] text-[#A6B6C8]">
                  {conversations.length}
                </span>
              </div>

              <div className="relative mb-4">
                <FiSearch
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8095AB]"
                  size={14}
                />
                <input
                  id="conversation-search"
                  type="text"
                  placeholder={searchMode ? "Search people..." : "Search conversations..."}
                  value={search}
                  onFocus={() => {
                    if (searchMode) return;
                    setSearchMode(false);
                  }}
                  onChange={(event) => setSearch(event.target.value)}
                  className="h-9 w-full rounded-md border border-[#304A64] bg-[#11253A] pl-9 pr-8 text-xs text-white outline-none placeholder:text-[#71869D] focus:border-[#38BDF8]"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#A6B6C8]"
                    aria-label="Clear search"
                  >
                    <FiX size={13} />
                  </button>
                )}
              </div>

              {searchMode ? (
                <>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[1.2px] text-[#7F95AB]">
                    Find people
                  </p>
                  <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
                    {search.trim() && searching && (
                      <p className="p-2 text-xs text-[#A6B6C8]">
                        Searching users...
                      </p>
                    )}
                    {searchResults.map((person) => (
                      <button
                        type="button"
                        key={getUserId(person)}
                        onClick={() => openUserChat(person)}
                        className="flex w-full items-center gap-2.5 rounded-md border border-transparent p-2 text-left hover:bg-[#20374E]"
                      >
                        <Avatar name={getUserName(person)} size={31} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[11px] font-semibold text-[#EDF3FA]">
                            {getUserName(person)}
                          </p>
                          <p className="truncate text-[10px] text-[#93A7BB]">
                            {person.email || "Start direct chat"}
                          </p>
                        </div>
                        <FiPlus size={14} />
                      </button>
                    ))}
                    {search.trim() && !searching && searchResults.length === 0 && (
                      <p className="px-2 py-5 text-center text-xs text-[#8196AC]">
                        No users found
                      </p>
                    )}
                    {!search.trim() && (
                      <p className="px-2 py-5 text-center text-xs text-[#8196AC]">
                        Type a name or email to find people.
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchMode(false);
                      setSearch("");
                    }}
                    className="mt-3 h-9 rounded-md border border-[#304A64] text-xs text-[#C3D1E0] hover:bg-[#20374E]"
                  >
                    Back to conversations
                  </button>
                </>
              ) : (
                <>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[1.2px] text-[#7F95AB]">
                    Direct conversations
                  </p>
                  <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
                    {loadingConversations && (
                      <p className="p-2 text-xs text-[#A6B6C8]">
                        Loading conversations...
                      </p>
                    )}
                    {!loadingConversations &&
                      visibleConversations.map((conversation) => {
                        const contact = getOtherParticipant(
                          conversation,
                          currentUserId
                        );
                        const lastMessage = conversation.lastMessage;
                        const active =
                          String(activeConversation?.id) ===
                          String(conversation.id);

                        return (
                          <button
                            type="button"
                            key={conversation.id}
                            onClick={() => {
                              setActiveConversation(conversation);
                              setShowMobileContacts(false);
                              setError("");
                            }}
                            className={`flex w-full items-center gap-2.5 rounded-md border p-2 text-left transition ${
                              active
                                ? "border-[#315C82] bg-[#243E59]"
                                : "border-transparent hover:bg-[#20374E]"
                            }`}
                          >
                            <Avatar name={getUserName(contact)} size={31} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="truncate text-[11px] font-semibold text-[#EDF3FA]">
                                  {getUserName(contact)}
                                </span>
                              </div>
                              <p className="mt-1 truncate text-[10px] text-[#93A7BB]">
                                {lastMessage?.content || "No messages yet"}
                              </p>
                            </div>
                            {conversation.unreadCount > 0 && (
                              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#1687F8] px-1 text-[9px] text-white">
                                {conversation.unreadCount}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    {!loadingConversations && visibleConversations.length === 0 && (
                      <p className="px-2 py-5 text-center text-xs text-[#8196AC]">
                        No conversations yet. Start a new chat.
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={startNewChat}
                    className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[#0066FF] text-xs font-semibold text-white transition hover:bg-[#1678FF]"
                  >
                    <FiPlus size={15} />
                    New Chat
                  </button>
                </>
              )}
            </aside>
          )}

          <main className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-[#253D57] bg-[#263F5B]">
            {activeConversation ? (
              <>
                <div className="flex h-[58px] shrink-0 items-center justify-between border-b border-[#35516E] bg-[#20364F] px-3 sm:px-4">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setShowMobileContacts(true)}
                      className="rounded-md p-1 text-[#A6B6C8] hover:bg-[#304A64] md:hidden"
                      aria-label="Show conversations"
                    >
                      <FiMessageSquare size={17} />
                    </button>
                    <Avatar name={getUserName(activeContact)} size={35} />
                    <div className="min-w-0">
                      <h2 className="truncate text-xs font-semibold text-white sm:text-sm">
                        {getUserName(activeContact)}
                      </h2>
                      <p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-[#9DB0C4]">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            connected ? "bg-[#38BDF8]" : "bg-[#7D8C9D]"
                          }`}
                        />
                        {connected ? "Connected" : connectionError || "Connecting..."}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <IconButton label="Audio call">
                      <FiPhone size={15} />
                    </IconButton>
                    <IconButton label="Video call">
                      <FiVideo size={16} />
                    </IconButton>
                    <IconButton
                      label="Contact information"
                      onClick={() => setShowInfo(!showInfo)}
                    >
                      <FiInfo size={16} />
                    </IconButton>
                    <IconButton label="More options">
                      <FiMoreHorizontal size={18} />
                    </IconButton>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center justify-between gap-3 border-b border-red-900/50 bg-red-950/30 px-4 py-2 text-xs text-red-200">
                    <span>{error}</span>
                    <button type="button" onClick={() => setError("")} aria-label="Dismiss error">
                      <FiX size={14} />
                    </button>
                  </div>
                )}

                <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-3 py-4 sm:px-5 sm:py-5">
                  <div className="mb-1 flex justify-center">
                    <span className="rounded-full border border-[#405B76] bg-[#20374F] px-3 py-1 text-[9px] text-[#A6B6C8]">
                      Messages
                    </span>
                  </div>
                  {loadingMessages && (
                    <p className="text-center text-xs text-[#A6B6C8]">
                      Loading messages...
                    </p>
                  )}
                  {!loadingMessages &&
                    messages.map((item, index) => (
                      <div
                        key={item.id || item.clientMessageId || index}
                        className={`flex w-full ${
                          item.mine ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[88%] rounded-md px-3 py-2 sm:max-w-[75%] ${
                            item.mine
                              ? "rounded-br-sm border border-[#1267B6] bg-[#0879D9] text-white"
                              : "rounded-bl-sm border border-[#405873] bg-[#1A3048] text-[#E4ECF5]"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words text-[11px] leading-[1.65] sm:text-xs">
                            {item.text}
                          </p>
                          <div
                            className={`mt-1.5 text-right text-[9px] ${
                              item.mine ? "text-[#D2E9FF]" : "text-[#8FA5BB]"
                            }`}
                          >
                            {item.time}
                          </div>
                        </div>
                      </div>
                    ))}
                  <div ref={messageEndRef} />
                </div>

                <form
                  onSubmit={sendMessage}
                  className="shrink-0 border-t border-[#35516E] bg-[#20364F] p-3 sm:px-4 sm:py-3.5"
                >
                  <div className="flex min-h-[42px] items-center gap-2 rounded-md border border-[#46617C] bg-[#263F59] px-2.5 focus-within:border-[#38BDF8]">
                    <IconButton label="Attach file">
                      <FiPaperclip size={15} />
                    </IconButton>
                    <input
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      placeholder={`Send message to ${getUserName(activeContact)}...`}
                      className="min-w-0 flex-1 bg-transparent py-2 text-xs text-white outline-none placeholder:text-[#91A5BB]"
                    />
                    <IconButton label="Emoji">
                      <FiSmile size={16} />
                    </IconButton>
                    <button
                      type="submit"
                      disabled={!message.trim() || sending || !connected}
                      aria-label="Send message"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#0066FF] text-white transition hover:bg-[#1678FF] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <FiSend size={14} />
                    </button>
                  </div>
                  {sending && (
                    <p className="mt-1 text-[10px] text-[#A6B6C8]">Sending...</p>
                  )}

                </form>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center p-6">
                <div className="max-w-sm text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#1A3048] text-[#38BDF8]">
                    <FiMessageSquare size={32} />
                  </div>
                  <h2 className="mt-5 text-xl font-bold text-white">Your messages</h2>
                  <p className="mt-2 text-sm leading-6 text-[#A6B6C8]">
                    Select a conversation or search for a person to start a direct chat.
                  </p>
                  {!connected && (
                    <p className="mt-4 text-sm text-red-300">
                      {connectionError || "Connecting to chat server..."}
                    </p>
                  )}
                  {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
                </div>
              </div>
            )}
          </main>

          {showInfo && activeConversation && (
            <aside className="hidden w-[190px] shrink-0 flex-col rounded-lg border border-[#253D57] bg-[#192D43] p-3 lg:flex xl:w-[220px]">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xs font-semibold text-white">Contact info</h2>
                <IconButton
                  label="Close contact information"
                  onClick={() => setShowInfo(false)}
                >
                  <FiX size={14} />
                </IconButton>
              </div>
              <div className="flex flex-col items-center border-b border-[#304A64] pb-5 text-center">
                <Avatar name={getUserName(activeContact)} size={52} />
                <h3 className="mt-3 text-sm font-semibold text-white">
                  {getUserName(activeContact)}
                </h3>
                <p className="mt-1 break-all text-[10px] text-[#94A9BE]">
                  {activeContact.email || "No email available"}
                </p>
              </div>
              <div className="border-b border-[#304A64] py-4">
                <p className="mb-3 text-[9px] font-semibold uppercase tracking-[1px] text-[#7F95AB]">
                  Contact details
                </p>
                <p className="mb-1 text-[10px] text-[#7F95AB]">Name</p>
                <p className="break-words text-xs text-[#E6EDF5]">
                  {getUserName(activeContact)}
                </p>
                <p className="mb-1 mt-4 text-[10px] text-[#7F95AB]">Email</p>
                <p className="break-all text-xs text-[#E6EDF5]">
                  {activeContact.email || "Not provided"}
                </p>
              </div>
              <div className="py-4">
                <p className="mb-3 text-[9px] font-semibold uppercase tracking-[1px] text-[#7F95AB]">
                  Shared media
                </p>
                <p className="text-[10px] text-[#8196AC]">
                  Media integration is not connected yet.
                </p>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
