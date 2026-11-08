import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

const API_URL =
    import.meta.env.VITE_SOCKET_URL ||
    import.meta.env.VITE_API_URL || "";

function readAccessToken() {
    try {
        return localStorage.getItem("accessToken") ||
            localStorage.getItem("token") ||
            JSON.parse(localStorage.getItem("user") || "null") ?.accessToken ||
            "";
    } catch {
        return "";
    }
}

export default function useProjectSocket({
    conversationId,
    onTaskUpdated,
    onDeliverableReviewed,
    onMemberUpdated,
    onResourceUpdated
}) {
    const socketRef = useRef(null);
    const callbacksRef = useRef({});
    callbacksRef.current = { onTaskUpdated, onDeliverableReviewed, onMemberUpdated, onResourceUpdated };

    useEffect(() => {
        if (!conversationId || !API_URL) return undefined;
        const socketUrl = API_URL.replace(/\/api\/?$/, "").replace(/\/$/, "");
        const token = readAccessToken();
        const socket = io(socketUrl, {
            withCredentials: true,
            transports: ["websocket", "polling"],
            ...(token ? { auth: { token: token.startsWith("Bearer ") ? token : `Bearer ${token}` } } : {}),
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000
        });
        socketRef.current = socket;

        const join = () => socket.emit("conversation:join", { conversationId });
        socket.on("connect", join);

        const taskEvents = ["project:task_created", "project:task_updated", "project:task_status_changed", "project:deliverable_submitted"];
        taskEvents.forEach(eventName => socket.on(eventName, data => callbacksRef.current.onTaskUpdated?.(data)));
        socket.on("project:deliverable_reviewed", data => {
            callbacksRef.current.onDeliverableReviewed?.(data);
            callbacksRef.current.onTaskUpdated?.(data);
        });
        socket.on("project:member_joined", data => callbacksRef.current.onMemberUpdated?.(data));
        socket.on("project:member_removed", data => callbacksRef.current.onMemberUpdated?.(data));
        socket.on("project:resource_added", data => callbacksRef.current.onResourceUpdated?.(data));

        return () => {
            socket.emit("conversation:leave", { conversationId });
            socket.removeAllListeners();
            socket.disconnect();
            if (socketRef.current === socket) socketRef.current = null;
        };
    }, [conversationId]);

    return socketRef;
}
