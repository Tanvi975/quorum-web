import api from "./api";

const BASE = "/api/notifications";

export const notificationService = {
    getNotifications: (page = 1, limit = 20, unreadOnly = false) =>
        api.get(BASE, {
            params: { page, limit, unreadOnly },
        }),

    getUnreadCount: () =>
        api.get(`${BASE}/unread-count`),

    markAsRead: (id) =>
        api.patch(`${BASE}/${encodeURIComponent(id)}/read`),

    markAllAsRead: () =>
        api.patch(`${BASE}/read-all`),

    deleteNotification: (id) =>
        api.delete(`${BASE}/${encodeURIComponent(id)}`),

    getPreferences: () =>
        api.get(`${BASE}/preferences`),

    updatePreference: (preference) =>
        api.put(`${BASE}/preferences`, preference),
};