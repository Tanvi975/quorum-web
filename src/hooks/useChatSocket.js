import { useEffect, useState } from "react";
import { io } from "socket.io-client";

export default function useChatSocket() {
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);
    const [connectionError, setConnectionError] = useState("");

    useEffect(() => {
        const accessToken = localStorage.getItem("accessToken");

        if (!accessToken) {
            setConnectionError("Please log in to use chat.");
            return;
        }

        const instance = io(
            import.meta.env.VITE_API_URL, {
                auth: { token: accessToken },
                transports: ["websocket", "polling"],
                withCredentials: true,
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
            setConnectionError(error.message || "Unable to connect to chat.");
        });

        return () => {
            instance.disconnect();
            setSocket(null);
            setConnected(false);
        };
    }, []);

    return { socket, connected, connectionError };
}