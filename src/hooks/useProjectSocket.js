import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

const SOCKET_URL =
    import.meta.env.VITE_SOCKET_URL ||
    import.meta.env.VITE_API_URL;

export default function useProjectSocket({
    conversationId,
    onTaskUpdated,
    onDeliverableReviewed,
    onMemberUpdated,
    onResourceUpdated
}) {
    const socketRef = useRef(null);

    useEffect(() => {
        if (!conversationId || !SOCKET_URL) return;

        const socket = io(SOCKET_URL, {
            withCredentials: true,
            transports: ["websocket", "polling"]
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            socket.emit("conversation:join", { conversationId });
        });

        socket.on("project:task_created", (data) => {
            onTaskUpdated ?.(data);
        });

        socket.on("project:task_updated", (data) => {
            onTaskUpdated ?.(data);
        });

        socket.on("project:task_status_changed", (data) => {
            onTaskUpdated ?.(data);
        });

        socket.on("project:deliverable_submitted", (data) => {
            onTaskUpdated ?.(data);
        });

        socket.on("project:deliverable_reviewed", (data) => {
            onDeliverableReviewed ?.(data);
            onTaskUpdated ?.(data);
        });

        socket.on("project:member_joined", (data) => {
            onMemberUpdated ?.(data);
        });

        socket.on("project:member_removed", (data) => {
            onMemberUpdated ?.(data);
        });

        socket.on("project:resource_added", (data) => {
            onResourceUpdated ?.(data);
        });

        return () => {
            socket.emit("conversation:leave", { conversationId });
            socket.disconnect();
            socketRef.current = null;
        };
    }, [
        conversationId,
        onTaskUpdated,
        onDeliverableReviewed,
        onMemberUpdated,
        onResourceUpdated
    ]);

    return socketRef;
}