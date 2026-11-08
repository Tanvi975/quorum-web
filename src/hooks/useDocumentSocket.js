import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL =
    import.meta.env.VITE_SOCKET_URL ||
    import.meta.env.VITE_API_URL ||
    window.location.origin;

function readAccessToken() {
    try {
        return (
            localStorage.getItem("accessToken") ||
            localStorage.getItem("token") ||
            JSON.parse(localStorage.getItem("user") || "null") ?.accessToken ||
            ""
        );
    } catch {
        return "";
    }
}

export default function useDocumentSocket({
    documentId,
    enabled = true,
    onDocumentUpdate,
}) {
    const socketRef = useRef(null);
    const callbackRef = useRef(onDocumentUpdate);

    const [status, setStatus] = useState("disconnected");
    const [error, setError] = useState("");

    useEffect(() => {
        callbackRef.current = onDocumentUpdate;
    }, [onDocumentUpdate]);

    useEffect(() => {
        if (!documentId || !enabled) {
            return undefined;
        }

        let disposed = false;


        const token = readAccessToken();

        const socket = io(SOCKET_URL, {
            withCredentials: true,
            transports: ["websocket", "polling"],
            ...(token ? {
                auth: {
                    token: token.startsWith("Bearer ") ?
                        token : `Bearer ${token}`,
                },
            } : {}),
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
        });

        socketRef.current = socket;

        const handleConnect = () => {
            if (disposed) return;

            setStatus("connected");
            setError("");
        };

        const handleDisconnect = () => {
            if (disposed) return;

            setStatus("disconnected");
        };

        const handleConnectError = () => {
            if (disposed) return;

            setStatus("error");
            setError("Document connection failed. Reconnecting...");
        };

        const handleDocumentUpdate = (payload = {}) => {
            if (disposed) return;

            const incomingId =
                payload.documentId || payload.id;

            if (!incomingId ||
                String(incomingId) !== String(documentId)
            ) {
                return;
            }

            callbackRef.current?.(payload);
        };

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("connect_error", handleConnectError);
        socket.on("document:update", handleDocumentUpdate);

        return () => {
            disposed = true;

            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
            socket.off("connect_error", handleConnectError);
            socket.off("document:update", handleDocumentUpdate);

            socket.disconnect();

            if (socketRef.current === socket) {
                socketRef.current = null;
            }
        };
    }, [documentId, enabled]);

    const emitDocumentUpdate = useCallback(
        (content) => {
            const socket = socketRef.current;

            if (!documentId || !socket?.connected) {
                return false;
            }

            socket.emit("document:update", {
                documentId,
                content,
            });

            return true;
        }, [documentId]
    );

    return {
        status: !documentId || !enabled ? "disconnected" : status,
        error: !documentId || !enabled ? "" : error,
        emitDocumentUpdate,
    };
}