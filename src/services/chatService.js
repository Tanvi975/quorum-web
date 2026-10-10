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

export async function getMessages(conversationId, limit = 20, cursor) {
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
