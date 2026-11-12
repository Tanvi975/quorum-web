import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL =
    import.meta.env.VITE_API_URL || window.location.origin;

function readAccessToken() {
    try {
        const user = JSON.parse(localStorage.getItem("user") || "null");

        return (
            localStorage.getItem("accessToken") ||
            localStorage.getItem("token") ||
            user?.accessToken ||
            ""
        );
    } catch {
        return (
            localStorage.getItem("accessToken") ||
            localStorage.getItem("token") ||
            ""
        );
    }
}

export default function useDocumentSocket({
    documentId,
    enabled = true,
    onDocumentUpdate,
}) {
    const socketRef = useRef(null);
    const callbackRef = useRef(onDocumentUpdate);
    const pendingContentRef = useRef(null);
    const updateTimerRef = useRef(null);

    const [status, setStatus] = useState("disconnected");
    const [error, setError] = useState("");

    useEffect(() => {
        callbackRef.current = onDocumentUpdate;
    }, [onDocumentUpdate]);

    useEffect(() => {
        if (!documentId || !enabled) {
            setStatus("disconnected");
            setError("");
            return undefined;
        }
        setStatus("connecting");
        setError("");
        let disposed = false;
        const token = readAccessToken();

        const socket = io(SOCKET_URL, {
            withCredentials: true,
            transports: ["websocket", "polling"],
            auth: { token },
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });

        socketRef.current = socket;

        const flushPending = () => {
            if (!socket.connected || pendingContentRef.current === null) {
                return;
            }

            if (updateTimerRef.current) {
                clearTimeout(updateTimerRef.current);
                updateTimerRef.current = null;
            }

            socket.emit("document:update", {
                documentId,
                content: pendingContentRef.current,
            });

            pendingContentRef.current = null;
        };

        const handleConnect = () => {
            if (disposed) return;

            setStatus("connected");
            setError("");

            socket.emit("document:join", { documentId });
            flushPending();
        };

        const handleDisconnect = () => {
            if (!disposed) setStatus("disconnected");
        };

        const handleConnectError = (connectError) => {
            if (disposed) return;

            setStatus("error");
            setError(
                connectError?.message ||
                "Document connection failed. Reconnecting..."
            );
        };

        const handleRemoteUpdate = (payload = {}) => {
            if (disposed) return;

            const incomingId = payload.documentId ?? payload.id;

            if (
                incomingId != null &&
                String(incomingId) !== String(documentId)
            ) {
                return;
            }

            callbackRef.current?.(payload);
        };

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("connect_error", handleConnectError);
        socket.on("document:updated", handleRemoteUpdate);

        if (socket.connected) handleConnect();

        return () => {
            disposed = true;

            if (updateTimerRef.current) {
                clearTimeout(updateTimerRef.current);
                updateTimerRef.current = null;
            }

            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
            socket.off("connect_error", handleConnectError);
            socket.off("document:updated", handleRemoteUpdate);

            if (socket.connected) {
                socket.emit("document:leave", { documentId });
            }

            socket.disconnect();

            if (socketRef.current === socket) {
                socketRef.current = null;
            }
        };
    }, [documentId, enabled]);

    const emitDocumentUpdate = useCallback((content) => {
        if (!documentId || !enabled) return false;

        pendingContentRef.current = content;

        const socket = socketRef.current;

        if (!socket?.connected) return false;

        if (updateTimerRef.current) {
            clearTimeout(updateTimerRef.current);
        }

        updateTimerRef.current = setTimeout(() => {
            updateTimerRef.current = null;

            if (!socket.connected || pendingContentRef.current === null) {
                return;
            }

            socket.emit("document:update", {
                documentId,
                content: pendingContentRef.current,
            });

            pendingContentRef.current = null;
        }, 300);

        return true;
    }, [documentId, enabled]);

    return {
        status: !documentId || !enabled ? "disconnected" : status,
        error: !documentId || !enabled ? "" : error,
        emitDocumentUpdate,
    };
}
