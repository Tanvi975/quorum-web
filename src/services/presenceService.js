import api from "./api";

export async function updateUserStatus({
    status,
    statusMessage = "",
    clearAfterMinutes = null,
}) {
    const response = await api.patch("/api/users/status", {
        status,
        statusMessage,
        clearAfterMinutes,
    });

    return response.data;
}

export async function resetUserStatus() {
    const response = await api.delete("/api/users/status");
    return response.data;
}

export async function getUsersPresence(userIds) {
    const response = await api.post("/api/users/presence/batch", {
        userIds,
    });

    return response.data;
}

export async function getUserPresence(userId) {
    const response = await api.get(`/api/users/${userId}/presence`);
    return response.data;
}