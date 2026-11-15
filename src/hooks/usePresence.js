import { useCallback, useEffect, useState } from "react";
import {
    getUsersPresence,
    updateUserStatus,
    resetUserStatus,
} from "../services/presenceService";

export const PRESENCE_STATUSES = {
    AVAILABLE: "AVAILABLE",
    BUSY: "BUSY",
    DO_NOT_DISTURB: "DO_NOT_DISTURB",
    BE_RIGHT_BACK: "BE_RIGHT_BACK",
    AWAY: "AWAY",
    OFFLINE: "OFFLINE",
};

export default function usePresence(socket) {
    const [presences, setPresences] = useState({});

    const fetchPresences = useCallback(async(userIds) => {
        if (!Array.isArray(userIds) || userIds.length === 0) return;

        try {
            const response = await getUsersPresence(userIds);
            const data = response?.data?.presences || {};

            setPresences((previous) => ({
                ...previous,
                ...data,
            }));
        } catch (error) {
            console.error("Presence fetch failed:", error);
        }
    }, []);

    const setStatus = useCallback(async(status, statusMessage = "", clearAfterMinutes = null) => {
        const response = await updateUserStatus({
            status,
            statusMessage,
            clearAfterMinutes,
        });

        const presence = response?.data;

        if (presence?.userId) {
            setPresences((previous) => ({
                ...previous,
                [presence.userId]: {
                    ...previous[presence.userId],
                    ...presence,
                    isOnline: true,
                },
            }));
        }

        return response;
    }, []);

    const resetStatus = useCallback(async() => {
        return resetUserStatus();
    }, []);

    useEffect(() => {
        if (!socket) return;

        const handleStatusUpdate = (presence) => {
            if (!presence?.userId) return;

            setPresences((previous) => ({
                ...previous,
                [presence.userId]: {
                    ...previous[presence.userId],
                    ...presence,
                },
            }));
        };

        socket.on("presence:status-updated", handleStatusUpdate);

        return () => {
            socket.off("presence:status-updated", handleStatusUpdate);
        };
    }, [socket]);

    return {
        presences,
        fetchPresences,
        setStatus,
        resetStatus,
    };
}