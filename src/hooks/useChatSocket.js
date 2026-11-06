import { useEffect, useState } from "react";
import { io } from "socket.io-client";

export default function useChatSocket() {
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);
    const [connectionError, setConnectionError] = useState("");

    useEffect(() => {
        const socketUrl =
            import.meta.env.VITE_API_URL;

        const instance = io(socketUrl, {
            auth: (callback) => {
                const accessToken = localStorage.getItem("accessToken");

                callback(
                    accessToken ? { token: accessToken } : {}
                );
            },
            transports: ["websocket", "polling"],
            withCredentials: true,
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
        });

        setSocket(instance);

        instance.on("connect", () => {
            setConnected(true);
            setConnectionError("");
        });

        instance.on("disconnect", () => {
            setConnected(false);
        });

        instance.on("connect_error", (error) => {
            setConnected(false);
            setConnectionError(
                error.message || "Unable to connect to chat."
            );
        });

        return () => {
            instance.disconnect();
            setSocket(null);
            setConnected(false);
        };
    }, []);

    return {
        socket,
        connected,
        connectionError,
    };
}