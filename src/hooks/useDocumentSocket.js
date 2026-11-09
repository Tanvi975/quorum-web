import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL =
    import.meta.env.VITE_API_URL || window.location.origin;

function readAccessToken() {
    try {
        const storedUser = JSON.parse(
            localStorage.getItem("user") || "null"
        );

        return (
            localStorage.getItem("accessToken") ||
            localStorage.getItem("token") ||
            storedUser ?.accessToken ||
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

    const [status, setStatus] = useState("connecting");
    const [error, setError] = useState("");

    useEffect(() => {
        callbackRef.current = onDocumentUpdate;
    }, [onDocumentUpdate]);

    useEffect(() => {
        if (!documentId || !enabled) return undefined;

        let disposed = false;
        const token = readAccessToken();

        const socket = io(SOCKET_URL, {
            withCredentials: true,
            transports: ["websocket", "polling"],
            auth: (callback) => callback(token ? { token } : {}),
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
        });

        socketRef.current = socket;

        const handleConnect = () => {
            if (disposed) return;

            setStatus("connected");
            setError("");

            if (pendingContentRef.current !== null) {
                socket.emit("document:update", {
                    documentId,
                    content: pendingContentRef.current,
                });

                pendingContentRef.current = null;
            }
        };

        const handleDisconnect = () => {
            if (!disposed) {
                setStatus("disconnected");
            }
        };

        const handleConnectError = (connectError) => {
            if (disposed) return;

            setStatus("error");
            setError(
                connectError ?.message ||
                "Document connection failed. Reconnecting..."
            );
        };

        const handleDocumentUpdate = (payload = {}) => {
            if (disposed) return;

            const incomingId = payload.documentId ?? payload.id;

            if (
                incomingId == null ||
                String(incomingId) !== String(documentId)
            ) {
                return;
            }

            callbackRef.current ?.(payload);
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
            if (!documentId || !enabled) return false;

            pendingContentRef.current = content;

            const socket = socketRef.current;

            if (!socket ?.connected) return false;

            socket.emit("document:update", {
                documentId,
                content,
            });

            pendingContentRef.current = null;
            return true;
        }, [documentId, enabled]
    );

    return {
        status: !documentId || !enabled ? "disconnected" : status,
        error: !documentId || !enabled ? "" : error,
        emitDocumentUpdate,
    };
}
