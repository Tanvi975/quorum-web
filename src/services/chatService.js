import api from "./api";

export async function getConversations() {
    const res = await api.get("/api/conversations");
    return res.data;
}

export async function searchUsers(query) {
    try {
        const res = await api.get("/api/users/search", {
            params: { q: query },
        });
        return res.data;
    } catch (error) {
        if (error.response ?.status !== 404) {
            throw error;
        }

        const res = await api.get("/api/user/search", {
            params: { q: query },
        });
        return res.data;
    }
}

export async function startDirectChat(targetUserId) {
    const res = await api.post("/api/dm", { targetUserId });
    return res.data;
}

export async function getMessages(conversationId, limit = 50, cursor) {
    const res = await api.get(
        `/api/conversations/${conversationId}/messages`, {
            params: {
                limit,
                ...(cursor ? { cursor } : {}),
            },
        }
    );

    return res.data;
}


export async function createGroupConversation({
    name,
    avatar = null,
    participantIds,
})

{
    const res = await api.post("/api/conversations/group", {
        name: name.trim(),
        avatar: avatar || undefined,
        participantIds,
        userIds: participantIds,
        members: participantIds,
        memberIds: participantIds,
    });

    return res.data;
}

export async function addGroupParticipants(conversationId, participantIds = []) {
    const res = await api.post(
        `/api/conversations/${conversationId}/participants`, {
            participantIds,
            userIds: participantIds,
            members: participantIds,
        }
    );

    return res.data;
}

export async function promoteGroupAdmin(conversationId, userId) {
    const res = await api.post(
        `/api/conversations/${conversationId}/admins`, { userId }
    );

    return res.data;
}

export async function demoteGroupAdmin(conversationId, userId) {
    const res = await api.delete(
        `/api/conversations/${conversationId}/admins/${userId}`
    );

    return res.data;
}

export async function removeGroupParticipant(conversationId, userId) {
    const res = await api.delete(
        `/api/conversations/${conversationId}/participants/${userId}`
    );

    return res.data;
}

export async function leaveGroupConversation(conversationId, userId) {
    const res = await api.delete(
        `/api/conversations/${conversationId}/participants/${userId}`
    );

    return res.data;
}

export async function updateGroupConversation(
    conversationId, { name, avatar }
) {
    const res = await api.patch(
        `/api/conversations/${conversationId}`, {
            ...(name !== undefined ? { name: name.trim() } : {}),
            ...(avatar !== undefined ? { avatar } : {}),
        }
    );

    return res.data;
}