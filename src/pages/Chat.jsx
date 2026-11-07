import { useCallback, useEffect, useRef, useState } from "react";
import {
  getConversations,
  searchUsers,
  startDirectChat,
  getMessages,
  createGroupConversation,
  addGroupParticipants,
  promoteGroupAdmin,
  demoteGroupAdmin,
  removeGroupParticipant,
  leaveGroupConversation,
  updateGroupConversation,
  getConversationPresence,
  getVoiceUploadSignature,
  getChatUploadSignature,
  addMessageReaction,
  editConversationMessage,
  forwardConversationMessages,
  deleteConversationMessage,
  getMessageReactionDetails,
  searchConversationMessages,
  createChatPoll,
  voteOnChatPoll,
} from "../services/chatService";
import {
  FiSearch,
  FiPlus,
  FiPaperclip,
  FiSend,
  FiInfo,
  FiMessageSquare,
  FiX,
  FiBookmark,
  FiArrowLeft,
  FiMenu,
  FiBarChart2,
} from "react-icons/fi";
import { saveItem } from "../services/savedItemsService";
import { useAuth } from "../context/AuthContext";
import useChatSocket from "../hooks/useChatSocket";
import { useNavigate } from "react-router-dom";
import MessageActions from "../components/chat/MessageActions";
import MessageReactions from "../components/chat/MessageReactions";
import ReplyPreview from "../components/chat/ReplyPreview";
import VoiceRecorder from "../components/chat/VoiceRecorder";
import VoiceMessage from "../components/chat/VoiceMessage";
import ForwardMessagesModal from "../components/chat/ForwardMessagesModal";

function getUser(participant) {
  return participant?.user || participant || {};
}

function getUserId(person) {
  return person?.id || person?._id || person?.userId;
}

function getUserName(person) {
  return person?.name || person?.fullName || person?.email || "User";
}
function renderMessageText(text, mentionedUsers = []) {
  const names = mentionedUsers
    .map((person) => person?.name)
    .filter(Boolean);

  if (!names.length) return text;

  const escapedNames = names.map((name) =>
    name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );

  const pattern = new RegExp(
    `(@(?:${escapedNames.join("|")}))(?=$|\\s|[.,!?])`,
    "gi"
  );

  return text.split(pattern).map((part, index) => {
    const isMention = names.some(
      (name) => part.toLowerCase() === `@${name}`.toLowerCase()
    );

    return isMention ? (
      <span
        key={index}
        className="font-semibold text-[#85B6FF]"
      >
        {part}
      </span>
    ) : (
      part
    );
  });
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
function getConversationName(conversation, currentUserId) {
  if (conversation?.type === "group") {
    return conversation.name || "Group chat";
  }

  return getUserName(
    getOtherParticipant(conversation, currentUserId)
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
    text: item?.content || item?.text || "",
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

function Avatar({ name, src, color = "#AAB5C5", size = 34, rounded = "rounded-full" }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden ${rounded} font-semibold text-[#172A40]`}
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.35 }}
      aria-label={`${name || "User"} avatar`}
    >
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        name?.charAt(0)?.toUpperCase() || "?"
      )}
    </div>
  );
}

function getAvatarUrl(person) {
  return person?.avatarUrl || person?.avatar || person?.profilePicture ||
    person?.profileImage || person?.photoUrl || person?.imageUrl || "";
}

function getFriendlyError(error, fallback = "Something went wrong. Please try again.") {
  const status = error?.response?.status;
  if (!navigator.onLine) return "You are offline. Check your connection.";
  if (status === 401 || status === 403) return "You do not have permission to do that.";
  if (status === 404) return "This item is no longer available.";
  if (status === 413) return "This file is too large.";
  if (status === 429) return "Please wait a moment and try again.";
  if (status >= 500) return "Chat is temporarily unavailable. Try again soon.";
  if (error?.name === "TimeoutError") return "The request timed out. Please try again.";
  return fallback;
}

function IconButton({ children, onClick, label, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      disabled={disabled}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/75 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
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
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const [olderMessagesCursor, setOlderMessagesCursor] = useState(null);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [selectedMentionUserIds, setSelectedMentionUserIds] = useState([]);
const [mentionQuery, setMentionQuery] = useState(null);
const [mentionStart, setMentionStart] = useState(-1);
const [showInfo, setShowInfo] = useState(false);
  const [showMobileContacts, setShowMobileContacts] = useState(true);
  const [searchMode, setSearchMode] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [readBoundary, setReadBoundary] = useState({});
  const [presenceByUser, setPresenceByUser] = useState({});
  const [showGroupModal, setShowGroupModal] = useState(false);
const [groupName, setGroupName] = useState("");
const [groupSearch, setGroupSearch] = useState("");
const [groupUsers, setGroupUsers] = useState([]);
const [selectedGroupUsers, setSelectedGroupUsers] = useState([]);
const [creatingGroup, setCreatingGroup] = useState(false);
const [groupError, setGroupError] = useState("");
const [showAddMembersModal, setShowAddMembersModal] = useState(false);
const [addMemberSearch, setAddMemberSearch] = useState("");
const [addMemberUsers, setAddMemberUsers] = useState([]);
const [selectedAddMembers, setSelectedAddMembers] = useState([]);
const [addingMembers, setAddingMembers] = useState(false);
const [addMembersError, setAddMembersError] = useState("");
const [updatingMemberId, setUpdatingMemberId] = useState(null);
const [removingMemberId, setRemovingMemberId] = useState(null);
const [leavingGroup, setLeavingGroup] = useState(false);
const [showRenameGroup, setShowRenameGroup] = useState(false);
const [renamedGroup, setRenamedGroup] = useState("");
const [renamedAvatar, setRenamedAvatar] = useState("");
const [groupAvatar, setGroupAvatar] = useState("");
const fileInputRef = useRef(null);
const [uploadingFile, setUploadingFile] = useState(false);
const [saveMessage, setSaveMessage] = useState("");
const [savedMessageIds, setSavedMessageIds] = useState(() => new Set());
const [replyTarget, setReplyTarget] = useState(null);
const [editingMessage, setEditingMessage] = useState(null);
const [editDraft, setEditDraft] = useState("");
const [forwardTargetMessageIds, setForwardTargetMessageIds] = useState([]);
const [forwarding, setForwarding] = useState(false);
const [messageActionError, setMessageActionError] = useState("");
const [pendingDelete, setPendingDelete] = useState(null);
const [selectedForwardIds, setSelectedForwardIds] = useState([]);
const [renderTimestamp] = useState(() => Date.now());
const [reactionPickerFor, setReactionPickerFor] = useState(null);
const [reactionDetails, setReactionDetails] = useState(null);
const [reactionDetailsLoading, setReactionDetailsLoading] = useState(false);
const [showPollComposer, setShowPollComposer] = useState(false);
const [pollQuestion, setPollQuestion] = useState("");
const [pollOptions, setPollOptions] = useState(["", ""]);
const [pollMultiple, setPollMultiple] = useState(false);
const [creatingPoll, setCreatingPoll] = useState(false);
const [messageSearchOpen, setMessageSearchOpen] = useState(false);
const [messageSearchQuery, setMessageSearchQuery] = useState("");
const [messageSearchResults, setMessageSearchResults] = useState([]);
const [messageSearching, setMessageSearching] = useState(false);
const messageElementRefs = useRef({});
  const messageEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const searchRequestRef = useRef(0);
  const activeConversationRef = useRef(null);
  const messagesRef = useRef([]);
  const typingTimeoutRef = useRef(null);
  const navigate = useNavigate();

  const activeContact = activeConversation
  ? getOtherParticipant(activeConversation, currentUserId)
  : {};

const activeContactId = getUserId(activeContact);

const activeContactPresence = activeContactId
  ? presenceByUser[String(activeContactId)]
  : null;

const activeContactStatus = activeContactPresence?.isOnline
  ? "Online"
  : activeContactPresence?.lastSeen
    ? `Last seen ${new Date(activeContactPresence.lastSeen).toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short",
      })}`
    : "Offline";
    const activeIsGroup = activeConversation?.type === "group";
    const mentionUsers = activeIsGroup
  ? (activeConversation?.participants || [])
      .map((participant) => ({
        ...getUser(participant),
        id: participant?.userId || getUserId(getUser(participant)),
      }))
      .filter(
        (person) =>
          person.id &&
          String(person.id) !== String(currentUserId)
      )
  : [];

const filteredMentionUsers =
  mentionQuery !== null
    ? mentionUsers.filter((person) =>
        getUserName(person)
          .toLowerCase()
          .includes(mentionQuery.toLowerCase())
      )
    : [];
    const activeConversationName = activeConversation
      ? getConversationName(activeConversation, currentUserId)
      : "";
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
      const list = Array.isArray(response?.conversations)
      ? response.conversations
      : Array.isArray(response?.data?.conversations)
        ? response.data.conversations
        : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
            ? response
            : [];

          setConversations(
            list.map((item) =>
              String(item.id) === String(activeConversationRef.current?.id)
                ? { ...item, unreadCount: 0 }
                : item
            )
          );

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
    if (!activeConversation?.id || activeConversation.type === "group") {
      return;
    }
  
    let cancelled = false;
  
    async function loadPresence() {
      try {
        const result = await getConversationPresence(activeConversation.id);
  
        if (cancelled) return;
  
        setPresenceByUser((previous) => ({
          ...previous,
          ...(result?.presences || {}),
        }));
      } catch (err) {
        console.error("Unable to load conversation presence:", err);
      }
    }
  
    loadPresence();
  
    return () => {
      cancelled = true;
    };
  }, [activeConversation?.id, activeConversation?.type]);
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
    if (!showGroupModal || !groupSearch.trim()) {
      setGroupUsers([]);
      return;
    }
  
    let cancelled = false;
  
    const timer = setTimeout(async () => {
      try {
        const response = await searchUsers(groupSearch.trim());
  
        const users = Array.isArray(response?.data?.users)
          ? response.data.users
          : Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response?.users)
              ? response.users
              : Array.isArray(response)
                ? response
                : [];
  
        if (!cancelled) {
          setGroupUsers(
            users.filter(
              (person) =>
                String(getUserId(person)) !== String(currentUserId)
            )
          );
        }
      } catch {
        if (!cancelled) setGroupUsers([]);
      }
    }, 300);
  
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [showGroupModal, groupSearch, currentUserId]);
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
      if (!normalized.mine && getMessageId(normalized)) {
        socket.emit("message:read", {
          conversationId,
          messageId: getMessageId(normalized),
        });
      }

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
    const handleConversationUpdated = (payload) => {
      const updated = payload?.conversation || payload;
      if (!updated?.id) return;

      setConversations((previous) =>
        previous.map((item) =>
          String(item.id) === String(updated.id) ? { ...item, ...updated } : item
        )
      );

      if (String(activeConversationRef.current?.id) === String(updated.id)) {
        setActiveConversation((previous) => ({
          ...previous,
          ...updated,
        }));
      }
    };

    const handleConversationRemoved = (payload) => {
      if (
        String(activeConversationRef.current?.id) ===
        String(payload?.conversationId)
      ) {
        setActiveConversation(null);
        setMessages([]);
        setError("You were removed from this group.");
      }
      loadConversations();
    };

    socket.on("message:new", handleNewMessage);
    socket.on("conversation:update", handleConversationUpdate);
    socket.on("conversation:updated", handleConversationUpdated);
    socket.on("conversation:removed", handleConversationRemoved);

const handleMessageRead = (data) => {
    if (
      String(data.conversationId) !==
      String(activeConversationRef.current?.id)
    ) {
      return;
    }
  
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
  const handlePresenceOnline = (data) => {
    if (!data?.userId) return;
  
    setPresenceByUser((previous) => ({
      ...previous,
      [String(data.userId)]: {
        isOnline: true,
        lastSeen: null,
      },
    }));
  };
  
  const handlePresenceOffline = (data) => {
    if (!data?.userId) return;
  
    setPresenceByUser((previous) => ({
      ...previous,
      [String(data.userId)]: {
        isOnline: false,
        lastSeen: data.lastSeen || null,
      },
    }));
  };
  
  socket.on("presence:online", handlePresenceOnline);
  socket.on("presence:offline", handlePresenceOffline);

  const handleTypingStart = (data) => {
    if (String(data?.conversationId) !== String(conversationId)) return;
    const typingUserId = data?.userId || data?.senderId;
    if (!typingUserId || String(typingUserId) === String(currentUserId)) return;

    setTypingUsers((previous) =>
      previous.includes(String(typingUserId))
        ? previous
        : [...previous, String(typingUserId)]
    );
  };

  const handleTypingStop = (data) => {
    if (String(data?.conversationId) !== String(conversationId)) return;
    const typingUserId = data?.userId || data?.senderId;
    if (!typingUserId) return;

    setTypingUsers((previous) =>
      previous.filter((id) => id !== String(typingUserId))
    );
  };

  socket.on("typing:start", handleTypingStart);
  socket.on("typing:stop", handleTypingStop);

    const handleReactionUpdated = (payload) => {
      if (String(payload?.conversationId) !== String(conversationId)) return;
      setMessages((previous) => previous.map((item) => String(getMessageId(item)) === String(payload.messageId) ? { ...item, reactions: payload.reactions || item.reactions || [] } : item));
    };
    const handleMessageUpdated = (payload) => {
      if (String(payload?.conversationId) !== String(conversationId)) return;
      setMessages((previous) => previous.map((item) => String(getMessageId(item)) === String(payload.id || payload.messageId) ? normalizeMessage({ ...item, ...payload }, currentUserId) : item));
    };
    const handleMessageDeleted = (payload) => {
      if (String(payload?.conversationId) !== String(conversationId)) return;
      const id = String(payload.messageId || payload.message?.id);
      if (payload.deleteForEveryone) {
        setMessages((previous) => previous.map((item) => String(getMessageId(item)) === id ? { ...item, ...(payload.message || {}), content: "", text: "", fileUrl: null, fileType: null, audioWaveform: [], isDeleted: true } : item));
      } else if (payload.deletedForMe) {
        setMessages((previous) => previous.filter((item) => String(getMessageId(item)) !== id));
      }
    };
    socket.on("message:reaction_updated", handleReactionUpdated);
    socket.on("message:updated", handleMessageUpdated);
    socket.on("message:deleted", handleMessageDeleted);
    const handlePollUpdated = (payload) => {
      if (String(payload?.conversationId) !== String(conversationId)) return;
      setMessages((previous) => previous.map((item) =>
        String(getMessageId(item)) === String(payload.messageId)
          ? { ...item, poll: payload.poll || item.poll }
          : item
      ));
    };
    socket.on("poll:updated", handlePollUpdated);

    return () => {
      socket.emit("conversation:leave", { conversationId });
      socket.off("message:new", handleNewMessage);
      socket.off("conversation:update", handleConversationUpdate);
      socket.off("conversation:updated", handleConversationUpdated);
      socket.off("conversation:removed", handleConversationRemoved);
      socket.off("message:read", handleMessageRead);
      socket.off("presence:online", handlePresenceOnline);
      socket.off("presence:offline", handlePresenceOffline);
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
      socket.off("message:reaction_updated", handleReactionUpdated);
      socket.off("message:updated", handleMessageUpdated);
      socket.off("message:deleted", handleMessageDeleted);
      socket.off("poll:updated", handlePollUpdated);
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
    setTypingUsers([]);
    setOlderMessagesCursor(null);
    setHasOlderMessages(false);

    async function loadHistory() {
      setLoadingMessages(true);
      setMessages([]);

      try {
        const response = await getMessages(activeConversation.id);
        const result = response?.data?.data ?? response?.data ?? response;

        const list = Array.isArray(result?.messages)
          ? result.messages
          : Array.isArray(result)
            ? result
            : [];

       
if (!cancelled) {
    
const normalizedList = list
.map((item) => normalizeMessage(item, currentUserId))
.sort((a, b) => {
  const timeA = new Date(a.createdAt).getTime();
  const timeB = new Date(b.createdAt).getTime();

  return timeA - timeB;
});

setMessages(normalizedList);
setOlderMessagesCursor(result?.nextCursor || null);
setHasOlderMessages(Boolean(result?.hasNextPage && result?.nextCursor));

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

  const loadOlderMessages = useCallback(async () => {
    if (
      !activeConversation?.id ||
      !olderMessagesCursor ||
      loadingOlderMessages ||
      !hasOlderMessages
    ) {
      return;
    }

    setLoadingOlderMessages(true);
    const conversationId = activeConversation.id;

    try {
      const response = await getMessages(conversationId, 50, olderMessagesCursor);
      const result = response?.data?.data ?? response?.data ?? response;
      const olderList = Array.isArray(result?.messages) ? result.messages : [];

      const normalizedOlder = olderList
        .map((item) => normalizeMessage(item, currentUserId))
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      setMessages((previous) => {
        const existingIds = new Set(
          previous.map((item) => String(getMessageId(item) || item.clientMessageId))
        );
        const uniqueOlder = normalizedOlder.filter((item) => {
          const id = String(getMessageId(item) || item.clientMessageId);
          return id && !existingIds.has(id);
        });
        return [...uniqueOlder, ...previous];
      });

      setOlderMessagesCursor(result?.nextCursor || null);
      setHasOlderMessages(Boolean(result?.hasNextPage && result?.nextCursor));
    } catch (err) {
      setError(getFriendlyError(err, "Could not load older messages."));
    } finally {
      setLoadingOlderMessages(false);
    }
  }, [
    activeConversation?.id,
    olderMessagesCursor,
    loadingOlderMessages,
    hasOlderMessages,
    currentUserId,
  ]);

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
  function handleMessageChange(event) {
    const value = event.target.value;
    const cursorPosition = event.target.selectionStart;
  
    setMessage(value);
    if (activeConversation?.id && socket && connected) {
      socket.emit("typing:start", { conversationId: activeConversation.id });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("typing:stop", { conversationId: activeConversation.id });
        typingTimeoutRef.current = null;
      }, 1800);
    }
  
    setSelectedMentionUserIds((previous) =>
      previous.filter((id) => {
        const person = mentionUsers.find(
          (item) => String(item.id) === String(id)
        );
  
        return person && value.includes(`@${getUserName(person)}`);
      })
    );
  
    const textBeforeCursor = value.slice(0, cursorPosition);
    const match = textBeforeCursor.match(/(^|\s)@([^\s@]*)$/);
  
    if (activeIsGroup && match) {
      setMentionQuery(match[2]);
      setMentionStart(match.index + match[1].length);
    } else {
      setMentionQuery(null);
      setMentionStart(-1);
    }
  }
  
  function selectMentionUser(person) {
    const userName = getUserName(person);
    const cursorPosition = messageInputRef.current?.selectionStart ?? message.length;
  
    const beforeMention = message.slice(0, mentionStart);
    const afterMention = message.slice(cursorPosition);
    const insertedText = `@${userName} `;
  
    const updatedMessage =
      beforeMention + insertedText + afterMention;
  
    setMessage(updatedMessage);
  
    setSelectedMentionUserIds((previous) =>
      previous.includes(person.id)
        ? previous
        : [...previous, person.id]
    );
  
    setMentionQuery(null);
    setMentionStart(-1);
  
    requestAnimationFrame(() => {
      const nextCursor = beforeMention.length + insertedText.length;
      messageInputRef.current?.focus();
      messageInputRef.current?.setSelectionRange(nextCursor, nextCursor);
    });
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
        mentions: activeIsGroup ? selectedMentionUserIds : [],
        ...(replyTarget?.id ? { replyToId: replyTarget.id } : {}),
      },
      (timeoutError, response) => {
        setSending(false);

        if (timeoutError) {
          setError("Message acknowledgement timed out. Please retry.");
          return;
        }

        if (!response?.success) {
          setError("Message could not be sent. Please try again.");
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

        socket.emit("typing:stop", {
          conversationId: activeConversation.id,
        });
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }

        setMessage("");
        setReplyTarget(null);
        setEditingMessage(null);
        setSelectedMentionUserIds([]);
        setMentionQuery(null);
        setMentionStart(-1);
        loadConversations();
      }
    );
  }

  async function handleFileSelected(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !activeConversation?.id) return;
    if (!socket || !connected) {
      setMessageActionError("Chat server is disconnected. Please try again.");
      return;
    }
    const fileType = file.type.startsWith("image/") ? "image"
      : file.type.startsWith("video/") ? "video"
        : file.type.startsWith("audio/") ? "audio" : "file";

    setUploadingFile(true);
    setMessageActionError("");
    try {
      const signature = await getChatUploadSignature("chat_attachments");
      const { uploadUrl, timestamp, signature: signedValue, apiKey, folder } = signature || {};
      if (!uploadUrl || !timestamp || !signedValue || !apiKey || !folder) {
        throw new Error("The attachment upload signature is incomplete.");
      }
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", String(timestamp));
      formData.append("signature", signedValue);
      formData.append("folder", folder);
      const uploadResponse = await fetch(uploadUrl, { method: "POST", body: formData });
      const uploadedFile = await uploadResponse.json();
      if (!uploadResponse.ok || !uploadedFile.secure_url) {
        throw new Error("ATTACHMENT_UPLOAD_FAILED");
      }

      const clientMessageId = crypto.randomUUID();
      const saved = await emitChatAction("message:send", {
        conversationId: activeConversation.id,
        clientMessageId,
        content: "",
        fileUrl: uploadedFile.secure_url,
        fileType,
        fileName: file.name,
        fileSize: file.size,
      });
      const savedMessage = normalizeMessage({
        ...(saved?.data || saved), conversationId: activeConversation.id,
        senderId: currentUserId, sender: user, clientMessageId,
        fileUrl: uploadedFile.secure_url, fileType, fileName: file.name, fileSize: file.size,
      }, currentUserId);
      setMessages((previous) => previous.some((item) =>
        String(getMessageId(item)) === String(getMessageId(savedMessage)) || item.clientMessageId === clientMessageId
      ) ? previous : [...previous, savedMessage]);
      loadConversations();
    } catch (uploadError) {
      setMessageActionError(getFriendlyError(uploadError, "Could not send the attachment."));
    } finally {
      setUploadingFile(false);
    }
  }

  function emitChatAction(eventName, payload) {
    return new Promise((resolve, reject) => {
      if (!socket || !connected) { reject(new Error("Chat server is disconnected. Please try again.")); return; }
      socket.timeout(10000).emit(eventName, payload, (timeoutError, response) => {
        if (timeoutError) { reject(new Error("The chat server did not respond. Please try again.")); return; }
        if (!response?.success) { reject(new Error("ACTION_FAILED")); return; }
        resolve(response.data || response);
      });
    });
  }

  async function handleReaction(item, emoji) {
    try {
      setMessageActionError("");
      const messageId = getMessageId(item);
      const result = await emitChatAction("message:react", { conversationId: activeConversation.id, messageId, emoji });
      if (result?.reactions) setMessages((previous) => previous.map((entry) => String(getMessageId(entry)) === String(messageId) ? { ...entry, reactions: result.reactions } : entry));
    } catch (err) {
      try {
        const result = await addMessageReaction(activeConversation.id, getMessageId(item), emoji);
        if (result?.reactions) setMessages((previous) => previous.map((entry) => String(getMessageId(entry)) === String(getMessageId(item)) ? { ...entry, reactions: result.reactions } : entry));
      } catch (fallbackError) { setMessageActionError(getFriendlyError(fallbackError, "Could not complete this action.")); }
    }
  }

  async function openReactionDetails(item, emoji) {
    if (!activeConversation?.id || !getMessageId(item)) return;
    setReactionDetails({ message: item, emoji, data: null });
    try {
      setReactionDetailsLoading(true);
      const details = await getMessageReactionDetails(activeConversation.id, getMessageId(item), emoji);
      setReactionDetails({ message: item, emoji, data: details });
    } catch (detailsError) {
      setMessageActionError(getFriendlyError(detailsError, "Could not load reactions."));
      setReactionDetails(null);
    } finally {
      setReactionDetailsLoading(false);
    }
  }

  function beginReply(item) {
    setReplyTarget({ ...item, id: getMessageId(item), senderName: item.sender?.name || (item.mine ? "You" : "User"), content: item.text || item.content });
    setEditingMessage(null);
    messageInputRef.current?.focus();
  }

  function beginEdit(item) {
    const createdAt = item.createdAt ? new Date(item.createdAt).getTime() : 0;
    if (!createdAt || Date.now() - createdAt > 24 * 60 * 60 * 1000) {
      setMessageActionError("Messages can only be edited within 24 hours of sending.");
      return;
    }
    setEditingMessage(item);
    setEditDraft(item.text || item.content || "");
    setReplyTarget(null);
  }

  async function saveEditedMessage() {
    const content = editDraft.trim();
    if (!content || !editingMessage) return;
    try {
      const messageId = getMessageId(editingMessage);
      const updated = await emitChatAction("message:edit", { conversationId: activeConversation.id, messageId, content });
      setMessages((previous) => previous.map((item) => String(getMessageId(item)) === String(messageId) ? normalizeMessage({ ...item, ...(updated || {}), content, isEdited: true }, currentUserId) : item));
      setEditingMessage(null);
      setEditDraft("");
    } catch (err) {
      try {
        const updated = await editConversationMessage(activeConversation.id, getMessageId(editingMessage), content);
        setMessages((previous) => previous.map((item) => String(getMessageId(item)) === String(getMessageId(editingMessage)) ? normalizeMessage({ ...item, ...(updated || {}), content, isEdited: true }, currentUserId) : item));
        setEditingMessage(null);
      } catch (fallbackError) { setMessageActionError(getFriendlyError(fallbackError, "Could not complete this action.")); }
    }
  }

  async function confirmDeleteMessage(deleteForEveryoneOverride) {
    if (!pendingDelete) return;
    const { item } = pendingDelete;
    const deleteForEveryone = Boolean(deleteForEveryoneOverride);
    const messageId = getMessageId(item);
    try {
      await emitChatAction("message:delete", { conversationId: activeConversation.id, messageId, deleteForEveryone });
      if (deleteForEveryone) setMessages((previous) => previous.map((entry) => String(getMessageId(entry)) === String(messageId) ? { ...entry, text: "", content: "", fileUrl: null, fileType: null, audioWaveform: [], isDeleted: true } : entry));
      else setMessages((previous) => previous.filter((entry) => String(getMessageId(entry)) !== String(messageId)));
      setPendingDelete(null);
    } catch (err) {
      try {
        await deleteConversationMessage(activeConversation.id, messageId, deleteForEveryone);
        if (deleteForEveryone) setMessages((previous) => previous.map((entry) => String(getMessageId(entry)) === String(messageId) ? { ...entry, text: "", content: "", fileUrl: null, fileType: null, audioWaveform: [], isDeleted: true } : entry));
        else setMessages((previous) => previous.filter((entry) => String(getMessageId(entry)) !== String(messageId)));
        setPendingDelete(null);
      } catch (fallbackError) { setMessageActionError(getFriendlyError(fallbackError, "Could not complete this action.")); }
    }
  }

  async function forwardSelectedMessages(targetConversationIds) {
    setForwarding(true);
    try {
      const messageIds = forwardTargetMessageIds;
      try {
        await emitChatAction("message:forward", { messageIds, targetConversationIds });
      } catch {
        await forwardConversationMessages(messageIds, targetConversationIds);
      }
      setForwardTargetMessageIds([]);
      setSelectedForwardIds([]);
      loadConversations();
    } catch (err) {
      setMessageActionError(getFriendlyError(err, "Could not forward the messages."));
    } finally { setForwarding(false); }
  }

  async function sendVoiceMessage(recording) {
    if (!activeConversation?.id || !socket || !connected) throw new Error("Connect to chat before sending a voice message.");
    if (!recording?.blob?.size) throw new Error("The voice recording is empty.");
    const extension = recording.mimeType?.includes("mp4") ? "m4a" : "webm";
    const fileName = `voice_note_${crypto.randomUUID()}.${extension}`;
    const signature = await getVoiceUploadSignature();
    const { uploadUrl, timestamp, signature: signedValue, apiKey, folder } = signature || {};
    if (!uploadUrl || !timestamp || !signedValue || !apiKey || !folder) throw new Error("The voice upload signature is incomplete.");
    const formData = new FormData();
    formData.append("file", recording.blob, fileName);
    formData.append("api_key", apiKey);
    formData.append("timestamp", String(timestamp));
    formData.append("signature", signedValue);
    formData.append("folder", folder);
    const upload = await fetch(uploadUrl, { method: "POST", body: formData });
    const uploaded = await upload.json();
    if (!upload.ok || !uploaded.secure_url) throw new Error("VOICE_UPLOAD_FAILED");
    const clientMessageId = crypto.randomUUID();
    const saved = await emitChatAction("message:send", {
      conversationId: activeConversation.id, clientMessageId, content: "",
      fileUrl: uploaded.secure_url, fileType: "voice", fileName, fileSize: recording.blob.size,
      audioDuration: recording.duration, audioWaveform: recording.waveform,
    });
    const normalized = normalizeMessage({ ...(saved?.data || saved), conversationId: activeConversation.id,
      senderId: currentUserId, sender: user, clientMessageId, fileUrl: uploaded.secure_url,
      fileType: "voice", fileName, fileSize: recording.blob.size,
      audioDuration: recording.duration, audioWaveform: recording.waveform,
    }, currentUserId);
    setMessages((previous) => previous.some((item) =>
      String(getMessageId(item)) === String(getMessageId(normalized)) || item.clientMessageId === clientMessageId
    ) ? previous : [...previous, normalized]);
    loadConversations();
  }

  async function handleCreatePoll(event) {
    event.preventDefault();
    const options = pollOptions.map((option) => option.trim()).filter(Boolean);
    if (!activeConversation?.id || !pollQuestion.trim() || options.length < 2) {
      setMessageActionError("Enter a poll question and at least two options.");
      return;
    }
    try {
      setCreatingPoll(true);
      setMessageActionError("");
      const response = await createChatPoll(activeConversation.id, {
        question: pollQuestion.trim(), options, allowMultipleAnswers: pollMultiple,
      });
      const created = response?.message || response;
      if (created?.id || created?._id) {
        const normalized = normalizeMessage({ ...created, senderId: currentUserId, sender: user }, currentUserId);
        setMessages((previous) => [...previous, normalized]);
      } else {
        const refreshed = await getMessages(activeConversation.id);
        const data = refreshed?.data?.data ?? refreshed?.data ?? refreshed;
        setMessages((data?.messages || []).map((item) => normalizeMessage(item, currentUserId)));
      }
      setShowPollComposer(false); setPollQuestion(""); setPollOptions(["", ""]); setPollMultiple(false);
      loadConversations();
    } catch (pollError) {
      setMessageActionError(getFriendlyError(pollError, "Could not create the poll."));
    } finally { setCreatingPoll(false); }
  }

  async function handleVotePoll(item, optionId) {
    const poll = item.poll;
    const pollId = poll?.id || item.pollId;
    if (!pollId) return;
    const selected = poll?.userVotedOptionIds || [];
    const optionIds = poll?.allowMultipleAnswers
      ? (selected.includes(optionId) ? selected.filter((id) => id !== optionId) : [...selected, optionId])
      : (selected.includes(optionId) ? [] : [optionId]);
    try {
      const updated = await voteOnChatPoll(activeConversation.id, pollId, optionIds);
      const nextPoll = updated?.poll || updated;
      setMessages((previous) => previous.map((entry) => String(getMessageId(entry)) === String(getMessageId(item)) ? { ...entry, poll: nextPoll } : entry));
    } catch (voteError) {
      setMessageActionError(getFriendlyError(voteError, "Your vote could not be saved."));
    }
  }

  async function runMessageSearch(query) {
    setMessageSearchQuery(query);
    if (!query.trim() || !activeConversation?.id) { setMessageSearchResults([]); return; }
    try {
      setMessageSearching(true);
      const result = await searchConversationMessages(activeConversation.id, query.trim(), undefined, 20);
      setMessageSearchResults(result?.messages || []);
    } catch (searchError) {
      setMessageActionError(searchError.response?.data?.message || searchError.message || "Message search failed.");
    } finally { setMessageSearching(false); }
  }

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const visibleConversations = conversations.filter((conversation) =>
  getConversationName(conversation, currentUserId)
    .toLowerCase()
    .includes(search.trim().toLowerCase())
);


  function startNewChat() {
    setSearch("");
    setSearchResults([]);
    setError("");
    setSearchMode(true);
    setShowMobileContacts(true);
  
    requestAnimationFrame(() => {
      document.getElementById("conversation-search")?.focus();
    });
  }
  const toggleGroupUser = (person) => {
    const id = getUserId(person);
  
    if (!id) return;
  
    setSelectedGroupUsers((previous) =>
      previous.some(
        (item) => String(getUserId(item)) === String(id)
      )
        ? previous.filter(
            (item) => String(getUserId(item)) !== String(id)
          )
        : [...previous, person]
    );
  };
  
  const handleCreateGroup = async (event) => {
    event.preventDefault();
  
    if (!groupName.trim()) {
      setGroupError("Please enter a group name.");
      return;
    }
  
    if (selectedGroupUsers.length === 0) {
      setGroupError("Select at least one member.");
      return;
    }
  
    try {
      setCreatingGroup(true);
      setGroupError("");
  
      const response = await createGroupConversation({
        name: groupName.trim(),
        avatar: groupAvatar.trim() || null,
        participantIds: selectedGroupUsers
          .map(getUserId)
          .filter(Boolean),
      });
  
      const newGroup = response?.data?.data ?? response?.data ?? response;
  
      if (!newGroup?.id) {
        throw new Error("The server did not return the created group.");
      }
  
      await loadConversations();
  
     
      setConversations((previous) => [
        newGroup,
        ...previous.filter(
          (item) => String(item.id) !== String(newGroup.id)
        ),
      ]);
  
      setActiveConversation(newGroup);
      setShowGroupModal(false);
      setGroupName("");
      setGroupAvatar("");
      setGroupSearch("");
      setGroupUsers([]);
      setSelectedGroupUsers([]);
      setShowMobileContacts(false);
    } catch (err) {
      setGroupError(getFriendlyError(err, "Could not create the group."));
    } finally {
      setCreatingGroup(false);
    }
  };
  const isCurrentUserOwner =
    activeIsGroup &&
    Boolean(activeConversation?.ownerId) &&
    String(activeConversation.ownerId) === String(currentUserId);
  const activeIsGroupAdmin =
  activeIsGroup &&
  (isCurrentUserOwner ||
    activeConversation?.participants?.some((participant) => {
      const participantId =
        participant?.userId || getUserId(getUser(participant));

      return (
        String(participantId) === String(currentUserId) &&
        participant?.role === "admin"
      );
    }));

useEffect(() => {
  if (!showAddMembersModal || !addMemberSearch.trim()) {
    setAddMemberUsers([]);
    return;
  }

  let cancelled = false;

  const timer = setTimeout(async () => {
    try {
      const response = await searchUsers(addMemberSearch.trim());

      const users = Array.isArray(response?.data?.users)
        ? response.data.users
        : Array.isArray(response?.data)
          ? response.data
          : [];

      const existingIds = new Set(
        (activeConversation?.participants || []).map((participant) =>
          String(
            participant?.userId || getUserId(getUser(participant))
          )
        )
      );

      if (!cancelled) {
        setAddMemberUsers(
          users.filter(
            (person) =>
              getUserId(person) &&
              String(getUserId(person)) !== String(currentUserId) &&
              !existingIds.has(String(getUserId(person)))
          )
        );
      }
    } catch {
      if (!cancelled) {
        setAddMemberUsers([]);
        setAddMembersError("Could not search users.");
      }
    }
  }, 300);

  return () => {
    cancelled = true;
    clearTimeout(timer);
  };
}, [
  showAddMembersModal,
  addMemberSearch,
  activeConversation,
  currentUserId,
]);

const handleAddMembers = async (event) => {
  event.preventDefault();

  if (!activeConversation?.id || selectedAddMembers.length === 0) {
    setAddMembersError("Select at least one member.");
    return;
  }

  try {
    setAddingMembers(true);
    setAddMembersError("");

    const response = await addGroupParticipants(
      activeConversation.id,
      selectedAddMembers.map(getUserId).filter(Boolean)
    );

    const updatedGroup = response?.data?.data ?? response?.data;

    if (!updatedGroup?.id) {
      throw new Error("The server did not return updated group details.");
    }

    setActiveConversation((previous) => ({
      ...previous,
      ...updatedGroup,
    }));

    setConversations((previous) =>
      previous.map((item) =>
        String(item.id) === String(updatedGroup.id)
          ? { ...item, ...updatedGroup }
          : item
      )
    );

    await loadConversations();

    setShowAddMembersModal(false);
    setAddMemberSearch("");
    setAddMemberUsers([]);
    setSelectedAddMembers([]);
  } catch (err) {
    setAddMembersError(getFriendlyError(err, "Could not add members."));
  } finally {
    setAddingMembers(false);
  }
};
const refreshActiveGroup = async () => {
  const response = await getConversations();

  const list = Array.isArray(response?.data?.conversations)
  ? response.data.conversations
  : Array.isArray(response?.data?.data?.conversations)
    ? response.data.data.conversations
    : Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response)
        ? response
        : [];

  setConversations(list);

  const updatedGroup = list.find(
    (item) =>
      String(item.id) === String(activeConversationRef.current?.id)
  );

  if (updatedGroup) {
    setActiveConversation(updatedGroup);
  }
};


const handlePromoteAdmin = async (participant) => {
  const person = getUser(participant);
  const userId = participant?.userId || getUserId(person);

  if (!activeIsGroupAdmin) {
    setError("Only group admins or owner can promote members.");
    return;
  }

  if (!activeConversation?.id || !userId) return;

  try {
    setUpdatingMemberId(String(userId));
    setError("");

    await promoteGroupAdmin(activeConversation.id, userId);
    await refreshActiveGroup();
  } catch (err) {
    setError(
      err.response?.data?.message ||
        "Could not promote this member."
    );
  } finally {
    setUpdatingMemberId(null);
  }
};

const handleDemoteAdmin = async (participant) => {
  const person = getUser(participant);
  const userId =
    participant?.userId || getUserId(person);

  if (!activeConversation?.id || !userId) return;

  try {
    setUpdatingMemberId(String(userId));
    setError("");

    await demoteGroupAdmin(activeConversation.id, userId);
    await refreshActiveGroup();
  } catch (err) {
    setError(
      err.response?.data?.message ||
        "Could not remove admin privileges."
    );
  } finally {
    setUpdatingMemberId(null);
  }
};

const handleRemoveMember = async (participant) => {
  const person = getUser(participant);
  const userId = participant?.userId || getUserId(person);

  if (!activeConversation?.id || !userId) return;

  if (String(userId) === String(currentUserId)) {
    setError("Admins cannot kick themselves. Use Leave Group to leave.");
    return;
  }

  const isTargetOwner =
    Boolean(activeConversation?.ownerId) &&
    String(userId) === String(activeConversation.ownerId);

  const isTargetAdmin =
    participant?.role === "admin" || isTargetOwner;

  if (isTargetOwner) {
    setError("Nobody can remove the group owner.");
    return;
  }

  if (isTargetAdmin && !isCurrentUserOwner) {
    setError("Only the group owner can remove an admin.");
    return;
  }

  if (!window.confirm(`Remove ${getUserName(person)} from this group?`)) {
    return;
  }

  try {
    setRemovingMemberId(String(userId));
    setError("");

    await removeGroupParticipant(activeConversation.id, userId);
    await refreshActiveGroup();
  } catch (err) {
    setError(
      err.response?.data?.message ||
        "Could not remove this member."
    );
  } finally {
    setRemovingMemberId(null);
  }
};

const handleLeaveGroup = async () => {
  if (!activeConversation?.id || !activeIsGroup) return;

  if (!window.confirm("Are you sure you want to leave this group?")) {
    return;
  }

  try {
    setLeavingGroup(true);
    setError("");

    const conversationId = activeConversation.id;

    await leaveGroupConversation(conversationId, currentUserId);

    setConversations((previous) =>
      previous.filter(
        (item) => String(item.id) !== String(conversationId)
      )
    );

    setActiveConversation((previous) =>
      String(previous?.id) === String(conversationId) ? null : previous
    );

    setMessages([]);
    await loadConversations();
  } catch (err) {
    setError(
      err.response?.data?.message ||
        "Could not leave the group."
    );
  } finally {
    setLeavingGroup(false);
  }
};

const handleRenameGroup = async (event) => {
  event.preventDefault();

  if (!activeConversation?.id || !renamedGroup.trim()) {
    setError("Enter a group name.");
    return;
  }

  try {
    setError("");

    await updateGroupConversation(activeConversation.id, {
      name: renamedGroup.trim(),
      avatar: renamedAvatar.trim() || null,
    });

    await refreshActiveGroup();

    setShowRenameGroup(false);
    setRenamedGroup("");
    setRenamedAvatar("");
  } catch (err) {
    setError(
      err.response?.data?.message ||
      "Could not update group details." 
    );
  }
};
  const handleSaveMessage = async (item) => {
    const messageId = item.id || item._id;
    if (!messageId) return;
  
    const id = String(messageId);
  
    if (savedMessageIds.has(id)) return;
  
    try {
      const isFile = Boolean(item.fileUrl);
  
      await saveItem({
        itemType: isFile ? "FILE" : "MESSAGE",
        itemId: messageId,
      });
  
      setSavedMessageIds((previous) => {
        const updated = new Set(previous);
        updated.add(id);
        return updated;
      });
  
      setSaveMessage("Message bookmarked successfully!");
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not save bookmark.");
    }
  };

const [isChatSaved, setIsChatSaved] = useState(false);
useEffect(() => {
  setIsChatSaved(false);
}, [activeConversation?.id]);

const handleSaveConversation = async () => {
  if (!activeConversation?.id) {
    setSaveMessage("Please select a chat first.");
    return;
  }

  try {
    await saveItem({
      itemType: "CHAT",
      itemId: activeConversation.id,
    });
    
    setIsChatSaved(true);
    setSaveMessage("Chat bookmarked successfully!");
    setError("");
  } catch (err) {
    setSaveMessage(
      err.response?.data?.message || "Could not save chat."
    );
  }
};


  return (
    <div
      className="h-[100dvh] min-h-0 overflow-hidden p-0 text-white sm:p-3 lg:p-5"
      style={{
        backgroundColor: "#062C5F",
        backgroundImage:
          "linear-gradient(to bottom, #213F70 0%, #315A8A 35%, #506D9A 65%, #7698C5 100%)",
      }}
    >
        {saveMessage && (
      <div
        role="status"
        className="fixed left-3 right-3 top-3 z-[100] mx-auto w-fit max-w-[calc(100vw-1.5rem)] rounded-lg border border-[#3B8068] bg-[#193D35] px-3 py-3 text-xs font-medium text-white shadow-lg sm:left-auto sm:right-5 sm:top-5 sm:px-4 sm:text-sm"
      >
        {saveMessage}
        <button
          onClick={() => setSaveMessage("")}
          className="ml-3 text-[#A7DCC8]"
          aria-label="Dismiss message"
        >
          ✕
        </button>
      </div>
    )}
      <div className="mx-auto flex h-[100dvh] min-h-0 w-full max-w-[1440px] flex-col overflow-hidden rounded-none border-0 bg-white/10 shadow-[0_20px_40px_rgba(10,35,65,0.22)] backdrop-blur-md sm:h-[calc(100dvh-24px)] sm:rounded-2xl sm:border sm:border-white/25 lg:h-[calc(100dvh-40px)]">
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-white/20 bg-[#102842]/75 px-2.5 backdrop-blur-md sm:h-14 sm:px-4">
          <div className="flex items-center gap-2">
          <button
  type="button"
  onClick={() => setShowMobileContacts((prev) => !prev)}
  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-white/85 transition hover:bg-white/10 md:hidden"
  aria-label="Toggle conversations"
  title="Toggle conversations"
>
  <FiMenu size={22} />
</button>
          <button
      type="button"
      onClick={() => navigate("/dashboard")}
      className="rounded-md p-2 text-white/80 hover:bg-white/10"
      aria-label="Back to dashboard"
    >
      <FiArrowLeft size={20} />
    </button>
            <span className="text-sm font-semibold tracking-wide text-white">
              Quorum
            </span>
            <span className="ml-1 hidden text-xs text-white/65 sm:inline">
              / Messages
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                connected ? "bg-[#38BDF8]" : "bg-red-400"
              }`}
            />
            <span className="text-[11px] text-white/75">
              {connected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 gap-1.5 p-1.5 sm:gap-3 sm:p-3">
            <aside
              className={`${
                showMobileContacts ? "flex" : "hidden"
              } min-h-0 w-full shrink-0 flex-col rounded-xl border border-white/20 bg-[#102842]/55 p-2.5 shadow-sm backdrop-blur-md md:flex md:w-[245px] md:p-3 lg:w-[265px] xl:w-[275px]`}
            >
         <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">
         Conversations
         </h2>
         <span className="rounded-md bg-white/10 px-2 py-1 text-[10px] text-white/75">
         {conversations.length}
         </span>
         </div>

         <div className="relative mb-4">
         <FiSearch
         className="absolute left-3 top-1/2 -translate-y-1/2 text-white/65"
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
         className="min-w-0 flex-1 rounded-lg border border-white/15 bg-[#101b35]/70 pl-9 pr-8 py-2 text-sm text-white outline-none transition-all placeholder:text-white/45 focus:border-blue-400/70 focus:bg-[#142344]"
         />
          {search && (
           <button
          type="button"
          onClick={() => setSearch("")}
           className="absolute right-2 top-1/2 -translate-y-1/2 text-white/75"
           aria-label="Clear search"
             >
            <FiX size={13} />
            </button>
             )}
            </div>

              {searchMode ? (
                <>
             <p className="mb-2 text-[10px] font-semibold uppercase tracking-[1.2px] text-white/65">
             Find people
             </p>
             <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
              {search.trim() && searching && (
              <p className="p-2 text-xs text-white/75">
              Searching users...
              </p>
              )}
             {searchResults.map((person) => (
              <button
             type="button"
             key={getUserId(person)}
            onClick={() => openUserChat(person)}
             className="flex w-full items-center gap-2.5 rounded-md border border-transparent p-2 text-left hover:bg-white/10"
              >
             <Avatar name={getUserName(person)} size={31} />
             <div className="min-w-0 flex-1">
             <p className="truncate text-[11px] font-semibold text-white">
               {getUserName(person)}
               </p>
               <p className="truncate text-[10px] text-white/70">
                {person.email || "Start direct chat"}
                </p>
                </div>
                  <FiPlus size={14} />
                  </button>
                    ))}
                    {search.trim() && !searching && searchResults.length === 0 && (
                      <p className="px-2 py-5 text-center text-xs text-white/60">
                        No users found
                      </p>
                    )}
                    {!search.trim() && (
                      <p className="px-2 py-5 text-center text-xs text-white/60">
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
                    className="mt-3 h-9 rounded-md border border-white/25 text-xs text-white/85 hover:bg-white/10"
                  >
                    Back to conversations
                  </button>
                </>
              ) : (
                <>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[1.2px] text-white/65">
                    Direct conversations
                  </p>
                  <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
                    {loadingConversations && (
                      <p className="p-2 text-xs text-white/75">
                        Loading conversations...
                      </p>
                    )}
                    {!loadingConversations &&
                   visibleConversations.map((conversation) => {
                    const conversationName = getConversationName(
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
                            
                 setConversations((previous) =>
                   previous.map((item) =>
                   String(item.id) === String(conversation.id)
                   ? { ...item, unreadCount: 0 }
                   : item
                   )
                     );
                            
                     setShowMobileContacts(false);
                     setError("");
                     }}
                     className={`flex w-full items-center gap-2.5 rounded-md border p-2 text-left transition ${
                       active
                      ? "border-[#85B6FF]/70 bg-gradient-to-r from-[#0066FF] to-[#0148B3]/25"
                      : "border-transparent hover:bg-white/10"
                        }`}
                          >
                            <Avatar name={conversationName} size={31} />
                            <div className="min-w-0 flex-1">
                           <div className="flex items-center justify-between gap-1">
                           <span className="truncate text-[11px] font-semibold text-white">
                          {conversationName}
                        </span>
                              </div>
                              <p className="mt-1 truncate text-[10px] text-white/70">
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
                      <p className="px-2 py-5 text-center text-xs text-white/60">
                        No conversations yet. Start a new chat.
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={startNewChat}
                    className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-md bg-gradient-to-r from-[#0066FF] to-[#0148B3] text-xs font-semibold text-white transition hover:brightness-110"
                  >
                    <FiPlus size={15} />
                    New Chat
                  </button>
                  <button
  type="button"
  onClick={() => {
    setGroupError("");
    setGroupName("");
    setGroupSearch("");
    setGroupUsers([]);
    setSelectedGroupUsers([]);
    setShowGroupModal(true);
  }}
  className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-md border border-white/30 text-xs font-semibold text-white/90 transition hover:bg-white/10"
>
  <FiPlus size={15} />
  New Group
</button>
                </>
              )}
            </aside>

<main
  className={`${
    showMobileContacts ? "hidden md:flex" : "flex"
   } min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-white/25 bg-white/10 shadow-sm backdrop-blur-md`}
>
            {activeConversation ? (
              <>
               <div className="flex min-h-[58px] shrink-0 items-center justify-between gap-1 border-b border-white/20 bg-[#102842]/55 px-2 sm:px-4">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Avatar name={activeConversationName} size={35} />
                    <div className="min-w-0">
                    <h2 className="truncate text-xs font-semibold text-white sm:text-sm">
                   {activeConversationName}
                   </h2>
                   <p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-white/75">
  <span
className={`h-1.5 w-1.5 rounded-full ${
  activeIsGroup
    ? "bg-[#38BDF8]"
    : activeContactPresence?.isOnline
      ? "bg-[#22C55E]"
      : "bg-[#7D8C9D]"
}`}
  />
  {activeIsGroup
    ? `Group · ${activeConversation?.participants?.length || 0} members`
    : activeContactStatus}
</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-0 sm:gap-0.5">
                    <IconButton label="Search messages" onClick={() => setMessageSearchOpen((open) => !open)}><FiSearch size={16} /></IconButton>
                    <IconButton label="Create a poll" onClick={() => setShowPollComposer(true)}><FiBarChart2 size={16} /></IconButton>
                  {activeIsGroupAdmin && (
                   <IconButton
                  label="Add members"
                 onClick={() => {
                setAddMembersError("");
                  setAddMemberSearch("");
                setSelectedAddMembers([]);
              setShowAddMembersModal(true);
                }}
              >
               <FiPlus size={16} />
            </IconButton>
              )}
                   <IconButton
                   label="Contact information"
                   onClick={() => setShowInfo(true)}
                 >
                   <FiInfo size={16} />
                 </IconButton>
                                     
                 <IconButton
                label={isChatSaved ? "Chat bookmarked" : "Save chat"}
             onClick={handleSaveConversation}
           >
         <FiBookmark
         size={16}
         className={isChatSaved ? "text-[#1687F8]" : "text-white/75"}
          fill={isChatSaved ? "currentColor" : "none"}
          />
           </IconButton>
                  </div>
                </div>

                {messageSearchOpen && (
                  <div className="shrink-0 border-b border-white/15 bg-[#102842]/70 p-3">
                    <input autoFocus value={messageSearchQuery} onChange={(event) => runMessageSearch(event.target.value)} placeholder="Search messages in this chat..." className="w-full rounded-xl border border-white/15 bg-[#0b1730]/80 px-3 py-2.5 text-xs text-white outline-none placeholder:text-white/45 focus:border-blue-400/70" />
                    {messageSearchQuery.trim() && <div className="mt-2 max-h-36 space-y-1 overflow-y-auto">
                      {messageSearching && <p className="px-2 py-1 text-[11px] text-white/60">Searching...</p>}
                      {!messageSearching && messageSearchResults.map((result) => <button key={result.id || result._id} type="button" onClick={() => messageElementRefs.current[String(result.id || result._id)]?.scrollIntoView({ behavior: "smooth", block: "center" })} className="block w-full truncate rounded-lg px-2 py-2 text-left text-[11px] text-white/80 hover:bg-white/10">{result.content || result.text || result.fileName || "Attachment"}</button>)}
                      {!messageSearching && messageSearchResults.length === 0 && <p className="px-2 py-1 text-[11px] text-white/50">No matching messages.</p>}
                    </div>}
                  </div>
                )}

                {error && (
                  <div className="flex items-center justify-between gap-3 border-b border-red-900/50 bg-red-950/30 px-4 py-2 text-xs text-red-200">
                    <span>{error}</span>
                    <button type="button" onClick={() => setError("")} aria-label="Dismiss error">
                      <FiX size={14} />
                    </button>
                  </div>
                )}

             <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto overscroll-contain px-3 py-4 sm:px-5 sm:py-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <div className="mb-1 flex items-center justify-center gap-2">
                    <span className="rounded-full border border-white/25 bg-[#315A8A]/45 px-3 py-1 text-[9px] text-white/75">Messages</span>
                    {selectedForwardIds.length > 0 && <button type="button" onClick={() => setForwardTargetMessageIds(selectedForwardIds)} className="rounded-full bg-blue-600 px-3 py-1 text-[9px] font-semibold text-white">Forward {selectedForwardIds.length} selected</button>}
                  </div>
                  {hasOlderMessages && !loadingMessages && (
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={loadOlderMessages}
                        disabled={loadingOlderMessages}
                        className="rounded-full border border-white/20 bg-[#102842]/70 px-3 py-1.5 text-[10px] text-white/80 hover:bg-white/10 disabled:opacity-50"
                      >
                        {loadingOlderMessages ? "Loading older messages..." : "Load older messages"}
                      </button>
                    </div>
                  )}
                  {loadingMessages && (
                    <p className="text-center text-xs text-white/75">
                      Loading messages...
                    </p>
                  )}
                  {!loadingMessages &&
                    messages.map((item, index) => {
                      const messageId = getMessageId(item);
                      const createdAt = item.createdAt ? new Date(item.createdAt).getTime() : 0;
                      const withinEditWindow = createdAt > 0 && renderTimestamp - createdAt <= 24 * 60 * 60 * 1000;
                      const canEdit = item.mine && withinEditWindow && !item.isDeleted && !item.fileUrl && Boolean(messageId);
                      const canDeleteForEveryone = item.mine || activeIsGroupAdmin;
                      const reply = item.replyTo;
                      const senderKey = String(item.senderId || getUserId(item.sender) || "unknown");
                      const previousItem = messages[index - 1];
                      const previousSenderKey = previousItem
                        ? String(previousItem.senderId || getUserId(previousItem.sender) || "unknown")
                        : "";
                      const showSenderAvatar = !item.mine && (
                        index === 0 || previousItem?.mine || previousSenderKey !== senderKey
                      );
                      const senderName = getUserName(item.sender);
                      const senderAvatar = getAvatarUrl(item.sender);
                      return (
                        <div key={messageId || item.clientMessageId || index} ref={(node) => { if (messageId) messageElementRefs.current[String(messageId)] = node; }} className={`flex w-full items-end gap-2 ${item.mine ? "justify-end" : "justify-start"}`}>
                          {!item.mine && (
                            <div className="w-8 shrink-0">
                              {showSenderAvatar && (
                                <Avatar name={senderName} src={senderAvatar} size={30} />
                              )}
                            </div>
                          )}
                          <div className={`group relative max-w-[92%] break-words rounded-2xl px-3 py-2.5 shadow-md sm:max-w-[75%] sm:px-4 ${item.mine ? "rounded-br-md border border-[#1267B6] bg-[#1A3048] text-white" : "rounded-bl-md border border-white/20 bg-[#1A3048] text-[#E4ECF5]"}`}>
                            {activeIsGroup && !item.mine && showSenderAvatar && (
                              <p className="mb-1 text-[10px] font-semibold text-sky-200">{senderName}</p>
                            )}
                            {reply && (
                              <button type="button" onClick={() => messageElementRefs.current[String(reply.id || reply._id)]?.scrollIntoView({ behavior: "smooth", block: "center" })} className="mb-2 block w-full rounded border-l-2 border-blue-400 bg-black/15 px-2 py-1 text-left">
                                <span className="block text-[9px] font-semibold text-blue-200">{reply.sender?.name || "Reply"}</span>
                                <span className="block truncate text-[10px] text-white/70">{reply.isDeleted ? "This message was deleted" : reply.content || reply.text || (reply.fileType === "voice" ? "Voice message" : "Attachment")}</span>
                              </button>
                            )}
                            {item.isDeleted ? (
                              <p className="text-[11px] italic text-white/55">This message was deleted</p>
                            ) : (
                              <>
                                {item.isForwarded && <p className="mb-1 text-[9px] italic text-white/50">↗ Forwarded</p>}
                                {item.text && <p className="whitespace-pre-wrap break-words text-[11px] leading-[1.65] sm:text-xs">{renderMessageText(item.text, item.mentionedUsers)}</p>}
                                {item.fileUrl && item.fileType === "voice" && <VoiceMessage message={item} />}
                                {item.fileUrl && item.fileType === "image" && <a href={item.fileUrl} target="_blank" rel="noreferrer"><img src={item.fileUrl} alt="Chat attachment" className="max-h-60 max-w-[240px] rounded-xl object-contain" /></a>}
                                {item.fileUrl && item.fileType === "video" && <video src={item.fileUrl} controls className="max-w-[260px]" />}
                                {item.fileUrl && item.fileType === "audio" && <audio src={item.fileUrl} controls className="w-full max-w-full" />}
                                {item.fileUrl && item.fileType === "file" && <a href={item.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-black/15 px-3 py-2 text-xs text-blue-200 underline">{item.fileName || "Open attachment"}</a>}
                                {item.poll && <div className="mt-2 min-w-[220px] max-w-full rounded-xl border border-white/15 bg-[#0b1730]/65 p-3 sm:min-w-[260px]">
                                  <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-white"><FiBarChart2 className="text-blue-300" />{item.poll.question}</div>
                                  <div className="space-y-2">{(item.poll.options || []).map((option) => {
                                    const voted = (item.poll.userVotedOptionIds || []).includes(option.id);
                                    const percentage = Math.max(0, Math.min(100, Number(option.percentage || 0)));
                                    return <button key={option.id} type="button" onClick={() => handleVotePoll(item, option.id)} className={`relative w-full overflow-hidden rounded-lg border px-3 py-2 text-left text-[11px] ${voted ? "border-blue-300/70" : "border-white/15 hover:border-white/35"}`}><span className="absolute inset-y-0 left-0 bg-blue-500/20" style={{ width: `${percentage}%` }} /><span className="relative flex items-center justify-between gap-2 text-white"><span>{option.text}</span><span className="shrink-0 text-white/70">{percentage}% · {option.voteCount || 0}</span></span></button>;
                                  })}</div>
                                  <p className="mt-2 text-[9px] text-white/45">{item.poll.totalVotes || 0} votes · {item.poll.allowMultipleAnswers ? "Multiple choices" : "Choose one"}</p>
                                </div>}
                                {item.isEdited && <span className="ml-1 text-[9px] italic text-white/45">edited</span>}
                              </>
                            )}
                            {!item.isDeleted && <MessageReactions reactions={item.reactions || []} currentUserId={currentUserId} onReact={(emoji) => handleReaction(item, emoji)} onDetails={(emoji) => openReactionDetails(item, emoji)} />}
                            {reactionPickerFor === String(messageId) && (
  <div className="mt-2 flex gap-1 rounded-lg border border-white/15 bg-[#0b1730] p-2">
    {["👍", "❤️", "😂", "😮", "😢", "🙏"].map((emoji) => (
      <button
        key={emoji}
        type="button"
        onClick={() => {
          handleReaction(item, emoji);
          setReactionPickerFor(null);
        }}
        className="rounded-md p-1.5 text-lg transition hover:bg-white/10"
      >
        {emoji}
      </button>
    ))}
  </div>
)}
                            <div className={`mt-1.5 flex items-center justify-end gap-1 text-[9px] ${item.mine ? "text-[#D2E9FF]" : "text-[#8FA5BB]"}`}>
  <span>{item.time}</span>
  {item.mine && (
    <span
      title={Number(item.seq || 0) > 0 && Number(item.seq) <= Number(readBoundary[activeConversation.id]?.seq || 0) ? "Read" : "Sent"}
      className={Number(item.seq || 0) > 0 && Number(item.seq) <= Number(readBoundary[activeConversation.id]?.seq || 0) ? "font-bold text-[#38BDF8]" : "text-white/55"}
    >
      ✓{Number(item.seq || 0) > 0 && Number(item.seq) <= Number(readBoundary[activeConversation.id]?.seq || 0) ? "✓" : ""}
    </span>
  )}
</div>

{!item.isDeleted && (
 <MessageActions
 align={item.mine ? "right" : "left"}
 canEdit={canEdit}
 canDeleteForEveryone={canDeleteForEveryone}
 isSaved={savedMessageIds.has(String(item.id || item._id))}
 isSelected={selectedForwardIds.includes(String(messageId))}
 onReply={() => beginReply(item)}
 onReact={() => setReactionPickerFor(String(messageId))}
 onEdit={() => beginEdit(item)}
 onForward={() => setForwardTargetMessageIds([String(messageId)])}
 onDelete={() => setPendingDelete({ item, deleteForEveryone: canDeleteForEveryone })}
 onSave={() => handleSaveMessage(item)}
 onSelectForward={() => {
   setSelectedForwardIds((previous) =>
     previous.includes(String(messageId))
       ? previous.filter((id) => id !== String(messageId))
       : [...previous, String(messageId)]
   );
 }}
/>
)}
                          </div>
                        </div>
                      );
                    })}
                  {typingUsers.length > 0 && (
                    <p className="px-2 py-1 text-[10px] italic text-white/70">
                      Someone is typing...
                    </p>
                  )}
                  <div ref={messageEndRef} />
                </div>

                <form
                  onSubmit={sendMessage}
                  className="shrink-0 border-t border-white/20 bg-white/5 p-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] sm:px-4 sm:py-3.5"
                >
                  {replyTarget && <ReplyPreview reply={replyTarget} onCancel={() => setReplyTarget(null)} />}
                  {editingMessage && <div className="mb-2 flex items-center gap-2 rounded-lg border-l-2 border-amber-400 bg-white/5 px-3 py-2"><input value={editDraft} onChange={(event) => setEditDraft(event.target.value)} className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none" aria-label="Edit message" /><button type="button" onClick={saveEditedMessage} className="text-[10px] text-blue-200">Save</button><button type="button" onClick={() => setEditingMessage(null)} className="text-[10px] text-white/60">Cancel</button></div>}
                  {messageActionError && <div className="mb-2 flex items-center justify-between gap-2 rounded-lg bg-red-950/40 px-3 py-2 text-[10px] text-red-200"><span>{messageActionError}</span><button type="button" onClick={() => setMessageActionError("")} aria-label="Dismiss">×</button></div>}
                  <div className="flex min-h-[52px] items-center gap-2 rounded-xl border border-white/15 bg-[#0b1730]/80 px-2 shadow-inner transition-all focus-within:border-blue-400/60">
                  <IconButton
  label="Attach file"
  onClick={() => fileInputRef.current?.click()}
  disabled={uploadingFile || !activeConversation}
>
  <FiPaperclip size={15} />
</IconButton>
<input
  ref={fileInputRef}
  type="file"
  hidden
  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip"
  onChange={handleFileSelected}
/>
<div className="relative min-w-0 flex-1">
  <input
    ref={messageInputRef}
    value={message}
    onChange={handleMessageChange}
    placeholder={`Send message to ${activeConversationName}...`}
    className="w-full min-w-0 bg-transparent py-2 text-xs text-white outline-none placeholder:text-white/50"
  />

  {activeIsGroup &&
    mentionQuery !== null &&
    filteredMentionUsers.length > 0 && (
      <div className="absolute bottom-full left-0 z-50 mb-2 max-h-52 w-full min-w-[190px] overflow-y-auto rounded-lg border border-white/20 bg-[#102842] p-1.5 shadow-xl">
        {filteredMentionUsers.map((person) => (
          <button
            key={person.id}
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => selectMentionUser(person)}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left transition hover:bg-white/10"
          >
            <Avatar name={getUserName(person)} size={28} />

            <span className="min-w-0 flex-1 truncate text-xs text-white">
              {getUserName(person)}
            </span>
          </button>
        ))}
      </div>
    )}

  {activeIsGroup &&
    mentionQuery !== null &&
    filteredMentionUsers.length === 0 && (
      <div className="absolute bottom-full left-0 z-50 mb-2 w-full rounded-lg border border-white/20 bg-[#102842] px-3 py-2 text-xs text-white/70 shadow-xl">
        No group members found.
      </div>
    )}
</div>
                    <IconButton label="Create poll" onClick={() => setShowPollComposer(true)} disabled={!activeConversation}><FiBarChart2 size={16} /></IconButton>
                    <VoiceRecorder disabled={!activeConversation || !connected || uploadingFile || sending} onSend={sendVoiceMessage} onError={setMessageActionError} />
                    <button
                      type="submit"
                      disabled={!message.trim() || sending || !connected || Boolean(editingMessage)}
                      aria-label="Send message"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-r from-[#0066FF] to-[#0148B3] text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <FiSend size={14} />
                    </button>
                  </div>
                  {sending && (
                    <p className="mt-1 text-[10px] text-white/75">Sending...</p>
                  )}

                </form>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center p-6">
                <div className="max-w-sm text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#1A3048] text-blue-100">
                    <FiMessageSquare size={32} />
                  </div>
                  <h2 className="mt-5 text-xl font-bold text-white">Your messages</h2>
                  <p className="mt-2 text-sm leading-6 text-white/75">
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

         
          {reactionDetails && (
            <div className="fixed inset-0 z-[98] flex items-end justify-center bg-black/65 p-0 sm:items-center sm:p-3" role="dialog" aria-modal="true" aria-labelledby="reaction-details-title">
              <section className="max-h-[75vh] w-full max-w-sm overflow-hidden rounded-t-2xl border border-white/15 bg-[#102842] shadow-2xl sm:rounded-2xl">
                <header className="flex items-center justify-between border-b border-white/10 px-4 py-3"><div><h3 id="reaction-details-title" className="text-sm font-semibold text-white">Reactions {reactionDetails.emoji || ""}</h3><p className="text-[10px] text-white/50">People who reacted to this message</p></div><button type="button" onClick={() => setReactionDetails(null)} className="rounded-lg p-2 text-white/60 hover:bg-white/10" aria-label="Close reactions"><FiX /></button></header>
                <div className="max-h-[55vh] overflow-y-auto p-3">
                  {reactionDetailsLoading ? <p className="py-6 text-center text-xs text-white/60">Loading reactions...</p> : (reactionDetails.data?.reactions || []).length ? reactionDetails.data.reactions.map((reaction) => <div key={reaction.id || `${reaction.userId}-${reaction.emoji}`} className="flex items-center gap-3 rounded-lg px-2 py-2"><Avatar name={reaction.user?.name || reaction.user?.email || "User"} size={32} /><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-white">{reaction.user?.name || "User"}</p><p className="text-[10px] text-white/45">{reaction.isMe ? "You" : "Participant"}</p></div><span>{reaction.emoji}</span></div>) : <p className="py-6 text-center text-xs text-white/55">No reaction details available.</p>}
                </div>
              </section>
            </div>
          )}
          {showPollComposer && <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/70 p-3" role="dialog" aria-modal="true" aria-labelledby="chat-poll-title">
            <form onSubmit={handleCreatePoll} className="w-full max-w-md rounded-2xl border border-white/20 bg-[#102842] p-4 shadow-2xl sm:p-5">
              <div className="mb-4 flex items-center justify-between"><div><h3 id="chat-poll-title" className="text-sm font-semibold text-white">Create a poll</h3><p className="mt-1 text-[11px] text-white/55">Ask your chat and collect votes.</p></div><button type="button" onClick={() => setShowPollComposer(false)} className="rounded-lg p-2 text-white/65 hover:bg-white/10" aria-label="Close poll composer"><FiX /></button></div>
              <label className="mb-2 block text-[11px] font-medium text-white/75">Question</label><input value={pollQuestion} onChange={(event) => setPollQuestion(event.target.value)} maxLength={180} placeholder="Ask a question..." className="mb-4 w-full rounded-xl border border-white/15 bg-[#0b1730]/80 px-3 py-2.5 text-xs text-white outline-none focus:border-blue-400" />
              <div className="mb-2 flex items-center justify-between"><label className="text-[11px] font-medium text-white/75">Options</label><span className="text-[10px] text-white/40">At least 2</span></div>
              <div className="space-y-2">{pollOptions.map((option, index) => <div key={index} className="flex gap-2"><input value={option} onChange={(event) => setPollOptions((previous) => previous.map((value, i) => i === index ? event.target.value : value))} maxLength={100} placeholder={`Option ${index + 1}`} className="min-w-0 flex-1 rounded-lg border border-white/15 bg-[#0b1730]/80 px-3 py-2.5 text-xs text-white outline-none focus:border-blue-400" />{pollOptions.length > 2 && <button type="button" onClick={() => setPollOptions((previous) => previous.filter((_, i) => i !== index))} className="rounded-lg px-2 text-white/50 hover:bg-white/10" aria-label="Remove option"><FiX /></button>}</div>)}</div>
              {pollOptions.length < 6 && <button type="button" onClick={() => setPollOptions((previous) => [...previous, ""])} className="mt-2 text-[11px] font-medium text-blue-200 hover:text-white">+ Add option</button>}
              <label className="mt-4 flex items-center gap-2 text-[11px] text-white/70"><input type="checkbox" checked={pollMultiple} onChange={(event) => setPollMultiple(event.target.checked)} /> Allow multiple answers</label>
              {messageActionError && <p className="mt-3 text-[11px] text-red-200">{messageActionError}</p>}
              <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setShowPollComposer(false)} className="rounded-lg border border-white/20 px-4 py-2 text-xs text-white/75">Cancel</button><button type="submit" disabled={creatingPoll} className="rounded-lg bg-gradient-to-r from-[#0066FF] to-[#0148B3] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{creatingPoll ? "Creating..." : "Create poll"}</button></div>
            </form>
          </div>}
          {forwardTargetMessageIds.length > 0 && <ForwardMessagesModal conversations={conversations} getConversationName={(conversation) => getConversationName(conversation, currentUserId)} currentConversationId={activeConversation?.id} loading={forwarding} onClose={() => { setForwardTargetMessageIds([]); setSelectedForwardIds([]); }} onForward={forwardSelectedMessages} />}
          {pendingDelete && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/65 p-3" role="dialog" aria-modal="true"><div className="w-full max-w-sm rounded-xl border border-white/20 bg-[#102842] p-4"><h3 className="text-sm font-semibold text-white">Delete message?</h3><p className="mt-2 text-xs text-white/70">Choose how you want to delete this message.</p><div className="mt-4 flex flex-wrap justify-end gap-2"><button type="button" onClick={() => setPendingDelete(null)} className="rounded-lg border border-white/20 px-3 py-2 text-xs text-white">Cancel</button><button type="button" onClick={() => confirmDeleteMessage(false)} className="rounded-lg border border-white/20 px-3 py-2 text-xs text-white">Delete for me</button>{pendingDelete.item.mine || activeIsGroupAdmin ? <button type="button" onClick={() => confirmDeleteMessage(true)} className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white">Delete for everyone</button> : null}</div></div></div>}
          {showInfo && activeConversation && (
 
<aside className="fixed inset-0 z-40 flex w-full min-h-0 flex-col overflow-y-auto rounded-none border border-white/20 bg-[#102842]/95 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md sm:inset-y-3 sm:left-auto sm:right-3 sm:w-[300px] sm:rounded-lg sm:p-4 lg:static lg:inset-auto lg:z-auto lg:w-[240px] lg:shrink-0 lg:rounded-lg lg:border lg:bg-[#102842]/55 lg:p-3 xl:w-[260px]">
    <div className="mb-5 flex items-center justify-between">
      <h2 className="text-xs font-semibold text-white">
        {activeIsGroup ? "Group info" : "Contact info"}
      </h2>
      <IconButton
        label="Close contact information"
        onClick={() => setShowInfo(false)}
      >
        <FiX size={14} />
      </IconButton>
    </div>

    {activeIsGroup ? (
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
        <div className="border-b border-white/25 pb-3 text-center">
          <div className="flex justify-center">
            <Avatar name={activeConversationName} size={52} />
          </div>
          <h3 className="mt-3 break-words text-sm font-semibold text-white">
            {activeConversationName}
          </h3>
          <p className="mt-1 text-[10px] text-white/70">
            {activeConversation?.participants?.length || 0} members
          </p>

          {activeIsGroupAdmin && (
            <button
              type="button"
              onClick={() => {
                setRenamedGroup(activeConversation.name || "");
                setRenamedAvatar(activeConversation.avatar || "");
                setShowRenameGroup(true);
              }}
              className="mt-3 w-full rounded-md border border-white/30 px-3 py-2 text-xs text-white hover:bg-white/10"
            >
              Edit Group Details
            </button>
          )}
        </div>

        <div>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-white/65">
            Members
          </p>

          {(activeConversation?.participants || []).map((participant) => {
            const person = getUser(participant);
            const userId = participant?.userId || getUserId(person);
            const isCurrentUser = String(userId) === String(currentUserId);
            const isTargetOwner =
            Boolean(activeConversation?.ownerId) &&
            String(activeConversation.ownerId) === String(userId);
          const isTargetAdmin =
            participant?.role === "admin" || isTargetOwner;

            return (
              <div
                key={String(userId)}
                className="mb-3 rounded-md bg-white/10 p-2"
              >
                <div className="flex items-center gap-2">
                  <Avatar name={getUserName(person)} size={28} />
                  <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                      <p className="truncate text-[11px] text-white">
                        {getUserName(person)}
                        {isCurrentUser ? " (You)" : ""}
                      </p>
                      {isTargetOwner && (
                        <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-amber-300">
                          Owner
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-white/70">
                    {isTargetOwner
                        ? "Group Owner"
                        : isTargetAdmin
                          ? "Admin"
                          : "Member"}
                    </p>
                  </div>
                </div>

                {!isCurrentUser && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {activeIsGroupAdmin && !isTargetAdmin && (
                      <button
                        type="button"
                        disabled={updatingMemberId === String(userId)}
                        onClick={() => handlePromoteAdmin(participant)}
                        className="rounded border border-white/30 px-2 py-1 text-[10px] text-white disabled:opacity-50"
                      >
                        {updatingMemberId === String(userId)
                          ? "Updating..."
                          : "Make admin"}
                    </button>
                     )}
       {isCurrentUserOwner && isTargetAdmin && !isTargetOwner && (
                      <button
                        type="button"
                        disabled={updatingMemberId === String(userId)}
                        onClick={() => handleDemoteAdmin(participant)}
                        className="rounded border border-white/30 px-2 py-1 text-[10px] text-white disabled:opacity-50"
                      >
                        {updatingMemberId === String(userId)
                          ? "Updating..."
                          : "Dismiss as Admin"}
                      </button>
                    )}

                    {!isTargetOwner &&
                      (isTargetAdmin
                        ? isCurrentUserOwner
                        : activeIsGroupAdmin) && (
                        <button
                          type="button"
                          disabled={removingMemberId === String(userId)}
                          onClick={() => handleRemoveMember(participant)}
                          className="rounded border border-red-800 px-2 py-1 text-[10px] text-red-300 disabled:opacity-50"
                        >
                          {removingMemberId === String(userId)
                            ? "Removing..."
                            : "Remove"}
                        </button>
                      )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          disabled={leavingGroup}
          onClick={handleLeaveGroup}
          className="mt-auto rounded-md border border-red-800 px-3 py-2 text-xs text-red-300 disabled:opacity-50"
        >
          {leavingGroup ? "Leaving..." : "Leave Group"}
        </button>
      </div>
    ) : (
      <>
        <div className="flex flex-col items-center border-b border-white/25 pb-5 text-center">
          <Avatar name={getUserName(activeContact)} size={52} />
          <h3 className="mt-3 text-sm font-semibold text-white">
            {getUserName(activeContact)}
          </h3>
        </div>

        <div className="border-b border-white/25 py-4">
          <p className="mb-3 text-[9px] font-semibold uppercase tracking-[1px] text-white/65">
            Contact details
          </p>
          <p className="mb-1 text-[10px] text-white/65">Name</p>
          <p className="break-words text-xs text-[#E6EDF5]">
            {getUserName(activeContact)}
          </p>
        </div>

      </>
    )}
  </aside>
)}

      {showGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#061426]/70 p-2 backdrop-blur-sm sm:p-4">
          <form
            onSubmit={handleCreateGroup}
            className="my-auto flex max-h-[calc(100dvh-1rem)] w-full max-w-md flex-col overflow-y-auto rounded-xl border border-white/25 bg-[#102842]/95 p-3 shadow-2xl backdrop-blur-xl sm:max-h-[85vh] sm:p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">
                Create a group
              </h2>
              <button
                type="button"
                onClick={() => setShowGroupModal(false)}
                className="rounded-md p-2 text-white/75 hover:bg-white/10"
                aria-label="Close group dialog"
              >
                <FiX size={17} />
              </button>
            </div>

            <label className="mb-1 text-xs text-white/85">
              Group name
            </label>
            <input
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
              maxLength={80}
              placeholder="Enter group name"
              className="mb-3 h-10 rounded-md border border-white/25 bg-[#062C5F]/30 px-3 text-sm text-white outline-none placeholder:text-white/50 focus:border-[#85B6FF]"
              />
  
              <label className="mb-1 text-xs text-white/85">
                Group icon / avatar URL (optional)
              </label>
              <input
                value={groupAvatar}
                onChange={(event) => setGroupAvatar(event.target.value)}
                placeholder="https://... (optional)"
              className="mb-4 h-10 rounded-md border border-white/25 bg-[#062C5F]/30 px-3 text-sm text-white outline-none placeholder:text-white/50 focus:border-[#85B6FF]"
            />

            <label className="mb-1 text-xs text-white/85">
              Search and select members
            </label>
            <input
              value={groupSearch}
              onChange={(event) => setGroupSearch(event.target.value)}
              placeholder="Search by name or email"
              className="mb-3 h-10 rounded-md border border-white/25 bg-[#062C5F]/30 px-3 text-sm text-white outline-none placeholder:text-white/50 focus:border-[#85B6FF]"
            />

            {selectedGroupUsers.length > 0 && (
              <p className="mb-2 text-xs text-blue-100">
                {selectedGroupUsers.length} member(s) selected
              </p>
            )}

            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
              {!groupSearch.trim() && (
                <p className="py-5 text-center text-xs text-white/60">
                  Search for people to add to your group.
                </p>
              )}

              {groupSearch.trim() &&
                groupUsers.map((person) => {
                  const id = getUserId(person);
                  const selected = selectedGroupUsers.some(
                    (item) =>
                      String(getUserId(item)) === String(id)
                  );

                  return (
                    <button
                      type="button"
                      key={id}
                      onClick={() => toggleGroupUser(person)}
                      className={`flex w-full items-center gap-3 rounded-md p-2 text-left ${
                        selected
                          ? "bg-gradient-to-r from-[#0066FF] to-[#0148B3]/20"
                          : "hover:bg-white/10"
                      }`}
                    >
                      <Avatar name={getUserName(person)} size={32} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-white">
                          {getUserName(person)}
                        </p>
                        <p className="truncate text-[10px] text-white/70">
                          {person.email || ""}
                        </p>
                      </div>
                      <span className="text-xs text-blue-100">
                        {selected ? "Selected ✓" : "Select"}
                      </span>
                    </button>
                  );
                })}

              {groupSearch.trim() && groupUsers.length === 0 && (
                <p className="py-5 text-center text-xs text-white/60">
                  No users found. Try another search.
                </p>
              )}
            </div>

            {groupError && (
              <p className="mt-3 text-xs text-red-300">
                {groupError}
              </p>
            )}

            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowGroupModal(false)}
                className="w-full rounded-md border border-white/30 px-4 py-2.5 text-xs text-white/90 hover:bg-white/10 sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creatingGroup}
                className="w-full rounded-md bg-gradient-to-r from-[#0066FF] to-[#0148B3] px-4 py-2.5 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-50 sm:w-auto"
              >
                {creatingGroup ? "Creating..." : "Create Group"}
              </button>
            </div>
          </form>
        </div>
      )}
{showAddMembersModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#061426]/70 p-2 backdrop-blur-sm sm:p-4">
    <form
      onSubmit={handleAddMembers}
      className="my-auto flex max-h-[calc(100dvh-1rem)] w-full max-w-md flex-col overflow-y-auto rounded-xl border border-white/25 bg-[#102842]/95 p-3 backdrop-blur-xl sm:max-h-[85vh] sm:p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">
          Add Members
        </h2>
        <button
          type="button"
          onClick={() => setShowAddMembersModal(false)}
          className="p-2 text-white/75"
          aria-label="Close"
        >
          <FiX size={17} />
        </button>
      </div>

      <input
        value={addMemberSearch}
        onChange={(event) => setAddMemberSearch(event.target.value)}
        placeholder="Search by name or email"
        className="mb-3 h-10 rounded-md border border-white/25 bg-[#062C5F]/30 px-3 text-sm text-white outline-none"
      />

      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
        {addMemberUsers.map((person) => {
          const id = getUserId(person);
          const selected = selectedAddMembers.some(
            (item) => String(getUserId(item)) === String(id)
          );

          return (
            <button
              type="button"
              key={id}
              onClick={() =>
                setSelectedAddMembers((previous) =>
                  selected
                    ? previous.filter(
                        (item) =>
                          String(getUserId(item)) !== String(id)
                      )
                    : [...previous, person]
                )
              }
              className={`flex w-full items-center gap-3 rounded-md p-2 text-left ${
                selected ? "bg-gradient-to-r from-[#0066FF] to-[#0148B3]/20" : "hover:bg-white/10"
              }`}
            >
              <Avatar name={getUserName(person)} size={32} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-white">
                  {getUserName(person)}
                </p>
                <p className="truncate text-[10px] text-white/70">
                  {person.email || ""}
                </p>
              </div>
              <span className="text-xs text-blue-100">
                {selected ? "Selected ✓" : "Select"}
              </span>
            </button>
          );
        })}

        {addMemberSearch.trim() && addMemberUsers.length === 0 && (
          <p className="py-5 text-center text-xs text-white/60">
            No new members found.
          </p>
        )}
      </div>

      <p className="mt-2 text-xs text-white/75">
        {selectedAddMembers.length} member(s) selected
      </p>

      {addMembersError && (
        <p className="mt-2 text-xs text-red-300">{addMembersError}</p>
      )}

      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => setShowAddMembersModal(false)}
          className="w-full rounded-md border border-white/30 px-4 py-2.5 text-xs text-white sm:w-auto"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={addingMembers || selectedAddMembers.length === 0}
          className="w-full rounded-md bg-gradient-to-r from-[#0066FF] to-[#0148B3] px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50 sm:w-auto"
        >
          {addingMembers ? "Adding..." : "Add Members"}
        </button>
      </div>
    </form>
  </div>
)}
{showRenameGroup && (
  <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#061426]/70 p-2 backdrop-blur-sm sm:p-4">
    <form
      onSubmit={handleRenameGroup}
      className="my-auto max-h-[calc(100dvh-1rem)] w-full max-w-sm overflow-y-auto rounded-xl border border-white/25 bg-[#102842]/95 p-3 shadow-2xl backdrop-blur-xl sm:p-5"
    >
      <h2 className="mb-4 text-base font-semibold text-white">
      Edit Group Details
      </h2>
      <label className="mb-1 block text-xs text-white/85">Group name</label>
      <input
        value={renamedGroup}
        onChange={(event) => setRenamedGroup(event.target.value)}
        maxLength={80}
        required
        placeholder="Enter group name"
        className="mb-3 h-10 w-full rounded-md border border-white/25 bg-[#062C5F]/30 px-3 text-sm text-white outline-none focus:border-[#85B6FF]"
        />
  
        <label className="mb-1 block text-xs text-white/85">Group avatar URL (optional)</label>
        <input
          value={renamedAvatar}
          onChange={(event) => setRenamedAvatar(event.target.value)}
          placeholder="https://... (optional)"
          className="mb-4 h-10 w-full rounded-md border border-white/25 bg-[#062C5F]/30 px-3 text-sm text-white outline-none focus:border-[#85B6FF]"
      />

      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => {
            setShowRenameGroup(false);
            setRenamedGroup("");
            setRenamedAvatar("");
          }}
          className="rounded-md border border-white/30 px-3 py-2 text-xs text-white"
        >
          Cancel
        </button>

        <button
          type="submit"
          className="rounded-md bg-gradient-to-r from-[#0066FF] to-[#0148B3] px-3 py-2 text-xs font-semibold text-white"
        >
          Save
        </button>
      </div>
    </form>
  </div>
)}
        </div>
      </div>
    </div>
  );
}