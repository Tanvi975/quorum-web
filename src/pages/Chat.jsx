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
} from "react-icons/fi";
import { saveItem } from "../services/savedItemsService";
import { useAuth } from "../context/AuthContext";
import useChatSocket from "../hooks/useChatSocket";
import { getChatUploadSignature } from "../services/chatService";
import { useNavigate } from "react-router-dom";

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
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/75 transition hover:bg-white/10 hover:text-white"
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
  const [selectedMentionUserIds, setSelectedMentionUserIds] = useState([]);
const [mentionQuery, setMentionQuery] = useState(null);
const [mentionStart, setMentionStart] = useState(-1);
  const [showInfo, setShowInfo] = useState(true);
  const [showMobileContacts, setShowMobileContacts] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [readBoundary, setReadBoundary] = useState({});

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

  const messageEndRef = useRef(null);
  const searchRequestRef = useRef(0);
  const activeConversationRef = useRef(null);
  const messagesRef = useRef([]);
  const navigate = useNavigate();

  const activeContact = activeConversation
    ? getOtherParticipant(activeConversation, currentUserId)
    : {};
    const activeIsGroup = activeConversation?.type === "group";
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
  
    const loggedInUserId = currentUserId;
    if (String(data.userId) === String(currentUserId)) {
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
  

    return () => {
      socket.emit("conversation:leave", { conversationId });
      socket.off("message:new", handleNewMessage);
      socket.off("conversation:update", handleConversationUpdate);
      socket.off("conversation:updated", handleConversationUpdated);
      socket.off("conversation:removed", handleConversationRemoved);
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
        const result = response?.data?.data ?? response?.data;

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

  async function handleFileSelected(event) {
    const file = event.target.files?.[0];

    // Same file ko dobara select karne ki permission
    event.target.value = "";

    if (!file || !activeConversation?.id) return;

    const getFileType = (file) => {
        if (file.type.startsWith("image/")) return "image";
        if (file.type.startsWith("video/")) return "video";
        if (file.type.startsWith("audio/")) return "audio";
        return "file";
    };

    setUploadingFile(true);

    try {
        const signature = await getChatUploadSignature();

        const { uploadUrl, timestamp, signature: signedValue, apiKey, folder } =
            signature;

        if (!uploadUrl || !timestamp || !signedValue || !apiKey || !folder) {
            throw new Error("Upload signature response is incomplete");
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", apiKey);
        formData.append("timestamp", String(timestamp));
        formData.append("signature", signedValue);
        formData.append("folder", folder);

        const uploadResponse = await fetch(uploadUrl, {
            method: "POST",
            body: formData,
        });

        const uploadedFile = await uploadResponse.json();

        if (!uploadResponse.ok || !uploadedFile.secure_url) {
            throw new Error(
                uploadedFile.error?.message || "Cloudinary upload failed"
            );
        }

        const payload = {
            conversationId: activeConversation.id,
            clientMessageId: crypto.randomUUID(),
            content: "",
            fileUrl: uploadedFile.secure_url,
            fileType: getFileType(file),
        };

        socket.emit("message:send", payload, (ack) => {
            if (!ack?.success) {
                console.error("Attachment message failed:", ack);
                alert("File upload ho gayi, lekin message send nahi hua.");
            }
        });
    } catch (error) {
        console.error("Attachment upload failed:", error);
        alert(error.message || "File upload nahi ho payi.");
    } finally {
        setUploadingFile(false);
    }
}

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
      setGroupError(
        err.response?.data?.message ||
          err.message ||
          "Could not create group."
      );
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
    setAddMembersError(
      err.response?.data?.message ||
        err.message ||
        "Could not add members."
    );
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

    await leaveGroupConversation(conversationId);

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
  try {
    const isFile = Boolean(item.fileUrl);
    await saveItem({
      itemType: isFile ? "FILE" : "MESSAGE",
      itemId: messageId,
    });
    setError("");
  } catch (err) {
    setError(err.response?.data?.message || "Could not save bookmark.");
  }
};

const [isChatSaved, setIsChatSaved] = useState(false);


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

    setSaveMessage("Chat saved successfully!");
    setError("");
  } catch (err) {
    setSaveMessage(
      err.response?.data?.message || "Could not save chat."
    );
  }
};


  return (
    <div
      className="h-screen overflow-hidden p-2 text-white sm:p-4 lg:p-5"
      style={{
        backgroundColor: "#062C5F",
        backgroundImage:
          "linear-gradient(to bottom, #213F70 0%, #315A8A 35%, #506D9A 65%, #7698C5 100%)",
      }}
    >
        {saveMessage && (
      <div
        role="status"
        className="fixed right-5 top-5 z-[100] rounded-lg border border-[#3B8068] bg-[#193D35] px-4 py-3 text-sm font-medium text-white shadow-lg"
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
      <div className="mx-auto flex h-[calc(100vh-16px)] min-h-0 w-full max-w-[1440px] flex-col overflow-hidden rounded-2xl border border-white/25 bg-white/10 shadow-[0_20px_40px_rgba(10,35,65,0.22)] backdrop-blur-md sm:h-[calc(100vh-32px)] lg:h-[calc(100vh-40px)]">
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-white/20 bg-[#102842]/75 px-4 backdrop-blur-md sm:h-14">
          <div className="flex items-center gap-2">
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

        <div className="flex min-h-0 flex-1 gap-2.5 p-2.5 sm:gap-3 sm:p-3">
        {true && (
            <aside
              className={`${
                showMobileContacts ? "flex" : "hidden"
              } w-full shrink-0 flex-col rounded-xl border border-white/20 bg-[#102842]/55 p-3 shadow-sm backdrop-blur-md md:flex md:w-[245px] lg:w-[265px] xl:w-[275px]`}
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
         className="h-9 w-full rounded-md border border-white/25 bg-[#062C5F]/30 pl-9 pr-8 text-xs text-white outline-none placeholder:text-white/50 focus:border-[#85B6FF]"
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
                    const isGroup = conversation.type === "group";
                    const contact = getOtherParticipant(conversation, currentUserId);
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
          )}

<main
  className={`${
    showMobileContacts ? "hidden md:flex" : "flex"
  } min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-white/25 bg-white/10 shadow-sm backdrop-blur-md`}
>
            {activeConversation ? (
              <>
               <div className="flex h-[58px] shrink-0 items-center justify-between border-b border-white/20 bg-[#102842]/55 px-3 sm:px-4">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Avatar name={activeConversationName} size={35} />
                    <div className="min-w-0">
                    <h2 className="truncate text-xs font-semibold text-white sm:text-sm">
                   {activeConversationName}
                   </h2>
                      <p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-white/75">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            connected ? "bg-[#38BDF8]" : "bg-[#7D8C9D]"
                          }`}
                        />
                        {activeIsGroup
  ? `Group · ${activeConversation?.participants?.length || 0} members`
  : connected
    ? "Connected"
    : connectionError || "Connecting..."}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
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
                label={isChatSaved ? "Chat saved" : "Save chat"}
                onClick={handleSaveConversation}
                 >
                <FiBookmark
                size={16}
                fill={isChatSaved ? "currentColor" : "none"}
                 />
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
                    <span className="rounded-full border border-white/25 bg-[#315A8A]/45 px-3 py-1 text-[9px] text-white/75">
                      Messages
                    </span>
                  </div>
                  {loadingMessages && (
                    <p className="text-center text-xs text-white/75">
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
                              ? "rounded-br-sm border border-[#1267B6] bg-[#1A3048] text-white"
                              : "rounded-bl-sm border border-white/25 bg-[#1A3048] text-[#E4ECF5]"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words text-[11px] leading-[1.65] sm:text-xs">
                            {item.text}
                            {item.fileUrl && item.fileType === "image" && (
    <a href={item.fileUrl} target="_blank" rel="noreferrer">
        <img
            src={item.fileUrl}
            alt="Chat attachment"
            style={{
                maxWidth: "240px",
                maxHeight: "240px",
                borderRadius: "12px",
                objectFit: "contain",
            }}
        />
    </a>
)}

{item.fileUrl && item.fileType === "video" && (
    <video
        src={item.fileUrl}
        controls
        style={{ maxWidth: "260px" }}
    />
)}

{item.fileUrl && item.fileType === "audio" && (
    <audio src={item.fileUrl} controls />
)}

{item.fileUrl && item.fileType === "file" && (
    <a href={item.fileUrl} target="_blank" rel="noreferrer">
        Open attachment
    </a>
)}
                          </p>
                          <div
                             className={`mt-1.5 flex items-center justify-between gap-2 text-[9px] ${
                              item.mine ? "text-[#D2E9FF]" : "text-[#8FA5BB]"
                            }`}
                          >
                           <button
                              type="button"
                              onClick={() => handleSaveMessage(item)}
                              title="Save bookmark"
                              className="opacity-70 hover:opacity-100"
                            >
                              <FiBookmark size={11} />
                            </button>
                            <span>{item.time}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  <div ref={messageEndRef} />
                </div>

                <form
                  onSubmit={sendMessage}
                  className="shrink-0 border-t border-white/20 bg-white/5 p-3 sm:px-4 sm:py-3.5"
                >
                  <div className="flex min-h-[42px] items-center gap-2 rounded-md border border-white/30 bg-transparent px-2.5 focus-within:border-[#85B6FF]">
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
                    <input
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      placeholder={`Send message to ${activeConversationName}...`}
                      className="min-w-0 flex-1 bg-transparent py-2 text-xs text-white outline-none placeholder:text-[#91A5BB]"
                    />
                    <button
                      type="submit"
                      disabled={!message.trim() || sending || !connected}
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

         
          {showInfo && activeConversation && (
 
<aside className="fixed inset-0 z-40 flex w-full flex-col overflow-y-auto rounded-none border border-white/20 bg-[#102842]/55 backdrop-blur-md p-4 sm:inset-y-3 sm:left-auto sm:right-3 sm:w-[300px] sm:rounded-lg lg:static lg:inset-auto lg:z-auto lg:w-[240px] lg:shrink-0 lg:rounded-lg lg:border lg:p-3 xl:w-[260px]">
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

        <div className="py-4">
          <p className="mb-3 text-[9px] font-semibold uppercase tracking-[1px] text-white/65">
            Shared media
          </p>
          <p className="text-[10px] text-white/60">
            Media integration is not connected yet.
          </p>
        </div>
      </>
    )}
  </aside>
)}

      {showGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#061426]/55 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleCreateGroup}
            className="flex max-h-[85vh] w-full max-w-md flex-col rounded-xl border border-white/25 bg-[#102842]/75 backdrop-blur-xl p-5 shadow-2xl"
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

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowGroupModal(false)}
                className="rounded-md border border-white/30 px-4 py-2 text-xs text-white/90 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creatingGroup}
                className="rounded-md bg-gradient-to-r from-[#0066FF] to-[#0148B3] px-4 py-2 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-50"
              >
                {creatingGroup ? "Creating..." : "Create Group"}
              </button>
            </div>
          </form>
        </div>
      )}
{showAddMembersModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#061426]/55 p-4 backdrop-blur-sm">
    <form
      onSubmit={handleAddMembers}
      className="flex max-h-[85vh] w-full max-w-md flex-col rounded-xl border border-white/25 bg-[#102842]/75 backdrop-blur-xl p-5"
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

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setShowAddMembersModal(false)}
          className="rounded-md border border-white/30 px-4 py-2 text-xs text-white"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={addingMembers || selectedAddMembers.length === 0}
          className="rounded-md bg-gradient-to-r from-[#0066FF] to-[#0148B3] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
        >
          {addingMembers ? "Adding..." : "Add Members"}
        </button>
      </div>
    </form>
  </div>
)}
{showRenameGroup && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#061426]/55 p-4 backdrop-blur-sm">
    <form
      onSubmit={handleRenameGroup}
      className="w-full max-w-sm rounded-xl border border-white/25 bg-[#102842]/75 backdrop-blur-xl p-5 shadow-2xl"
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

      <div className="mt-4 flex justify-end gap-2">
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