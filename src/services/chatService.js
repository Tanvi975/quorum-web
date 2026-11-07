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
        if (error.response?.status !== 404) {
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
    });

    return res.data;
}

export async function addGroupParticipants(conversationId, participantIds = []) {
    const res = await api.post(
        `/api/conversations/${conversationId}/participants`, {
            participantIds,
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

export async function getChatUploadSignature(folder = "chat_attachments") {
    const response = await api.post("/api/uploads/sign", { folder });
    return response.data?.data ?? response.data;
}

export async function getTeamMessages(orgId, teamId) {
    const response = await api.get(
        `/api/organizations/${orgId}/teams/${teamId}/messages`
    );

    return response.data?.data ?? response.data;
}

export async function sendTeamMessage(orgId, teamId, messageData) {
    const response = await api.post(
        `/api/organizations/${orgId}/teams/${teamId}/messages`,
        messageData
    );

    return response.data?.data ?? response.data;
}

export async function deleteTeamMessage(orgId, teamId, messageId) {
    const response = await api.delete(
        `/api/organizations/${orgId}/teams/${teamId}/messages/${messageId}`
    );

    return response.data;
}

export async function pinTeamMessage(orgId, teamId, messageId) {
    const response = await api.post(
        `/api/organizations/${orgId}/teams/${teamId}/messages/${messageId}/pin`
    );

    return response.data?.data ?? response.data;
}
export async function getConversationPresence(conversationId) {
    const response = await api.get(
        `/api/conversations/${conversationId}/presence`
    );

    return response.data?.data ?? response.data;
}

export async function getVoiceUploadSignature() {
    return getChatUploadSignature("chat_attachments");
}

export async function searchConversationMessages(conversationId, query, cursor, limit = 20) {
    const response = await api.get(`/api/conversations/${conversationId}/search`, {
        params: { q: query, ...(cursor ? { cursor } : {}), limit },
    });
    return response.data?.data ?? response.data;
}

export async function getMessageReactionDetails(conversationId, messageId, emoji) {
    const response = await api.get(
        `/api/conversations/${conversationId}/messages/${messageId}/reactions`, { params: emoji ? { emoji } : {} }
    );
    return response.data?.data ?? response.data;
}

export async function createChatPoll(conversationId, poll) {
    const response = await api.post(`/api/conversations/${conversationId}/polls`, poll);
    return response.data?.data ?? response.data;
}

export async function voteOnChatPoll(conversationId, pollId, optionIds) {
    const response = await api.post(
        `/api/conversations/${conversationId}/polls/${pollId}/vote`, { optionIds }
    );
    return response.data?.data ?? response.data;
}

export async function addMessageReaction(conversationId, messageId, emoji) {
    const response = await api.post(`/api/conversations/${conversationId}/messages/${messageId}/reactions`, { emoji });
    return response.data?.data ?? response.data;
}

export async function editConversationMessage(conversationId, messageId, content) {
    const response = await api.patch(`/api/conversations/${conversationId}/messages/${messageId}`, { content });
    return response.data?.data ?? response.data;
}

export async function forwardConversationMessages(messageIds, targetConversationIds) {
    const response = await api.post("/api/conversations/messages/forward", { messageIds, targetConversationIds });
    return response.data?.data ?? response.data;
}

export async function deleteConversationMessage(conversationId, messageId, deleteForEveryone) {
    const response = await api.delete(`/api/conversations/${conversationId}/messages/${messageId}`, { data: { deleteForEveryone } });
    return response.data?.data ?? response.data;
}
