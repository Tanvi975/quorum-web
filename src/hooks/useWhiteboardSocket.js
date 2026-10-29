import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL =
    import.meta.env.VITE_API_URL || window.location.origin;

const initialViewState = {
    zoom: 1,
    scrollX: 0,
    scrollY: 0,
    backgroundColor: "#FFFFFF",
};

export function useWhiteboardSocket({
    boardId,
    meetingCode,
    enabled = true,
}) {
    const socketRef = useRef(null);
    const [elements, setElements] = useState([]);
    const [viewState, setViewState] = useState(initialViewState);
    const [activeUsers, setActiveUsers] = useState([]);
    const [cursors, setCursors] = useState({});
    const [status, setStatus] = useState("disconnected");
    const [error, setError] = useState("");

    useEffect(() => {
        if (!boardId || !enabled) {
            setElements([]);
            setActiveUsers([]);
            setCursors({});
            setStatus("disconnected");
            return;
        }

        let disposed = false;

        const socket = io(SOCKET_URL, {
            withCredentials: true,
        });

        socketRef.current = socket;
        setStatus("connecting");
        setError("");

        const handleConnect = () => {
            setStatus("connected");
            setError("");

            socket.emit(
                "whiteboard:join", { boardId, meetingCode },
                (response) => {
                    if (disposed) return;

                    if (!response ?.success) {
                        setStatus("error");
                        setError(response ?.message || "Could not join whiteboard.");
                        return;
                    }

                    const data = response.data || {};

                    setElements(
                        Array.isArray(data.elements) ? data.elements : []
                    );
                    setViewState({
                        ...initialViewState,
                        ...(data.viewState || {}),
                    });
                    setActiveUsers(
                        Array.isArray(data.activeUsers) ? data.activeUsers : []
                    );
                    setError("");
                    setStatus("connected");
                }
            );
        };

        const handleConnectError = (err) => {
            setStatus("error");
            setError(err.message || "Whiteboard connection failed.");
        };

        const handleDisconnect = () => {
            setStatus("disconnected");
        };

        const handleElementUpdated = ({ element } = {}) => {
            if (!element ?.id) return;

            setElements((current) => {
                const exists = current.some((item) => item.id === element.id);

                return exists ?
                    current.map((item) =>
                        item.id === element.id ? element : item
                    ) : [...current, element];
            });
        };

        const handleElementsChanged = ({
            updates = [],
            deletes = [],
        } = {}) => {
            setElements((current) => {
                let next = current.filter(
                    (item) => !deletes.includes(item.id)
                );

                for (const element of updates) {
                    if (!element ?.id) continue;

                    const exists = next.some(
                        (item) => item.id === element.id
                    );

                    next = exists ?
                        next.map((item) =>
                            item.id === element.id ? element : item
                        ) : [...next, element];
                }

                return next;
            });
        };

        const handleCleared = () => {
            setElements([]);
        };

        const handleViewState = ({ viewState: nextViewState } = {}) => {
            if (!nextViewState) return;

            setViewState((current) => ({
                ...current,
                ...nextViewState,
            }));
        };

        const handleCursorMoved = (cursor = {}) => {
            if (!cursor.socketId) return;

            setCursors((current) => ({
                ...current,
                [cursor.socketId]: cursor,
            }));
        };

        const handleUserJoined = ({ socketId, user } = {}) => {
            if (!socketId || !user) return;

            setActiveUsers((current) => {
                const filtered = current.filter(
                    (item) =>
                    item.socketId !== socketId &&
                    item.userId !== user.id
                );

                return [
                    ...filtered,
                    {
                        socketId,
                        userId: user.id,
                        name: user.name,
                    },
                ];
            });
        };

        const handleUserLeft = ({ socketId, userId } = {}) => {
            setActiveUsers((current) =>
                current.filter(
                    (item) =>
                    item.socketId !== socketId &&
                    item.userId !== userId
                )
            );

            setCursors((current) => {
                const next = {...current };
                if (socketId) delete next[socketId];
                return next;
            });
        };

        const handleBoardDeleted = () => {
            setElements([]);
            setActiveUsers([]);
            setCursors({});
            setError("This whiteboard has been deleted.");
            setStatus("error");
        };

        socket.on("connect", handleConnect);
        socket.on("connect_error", handleConnectError);
        socket.on("disconnect", handleDisconnect);
        socket.on("whiteboard:element-updated", handleElementUpdated);
        socket.on("whiteboard:elements-changed", handleElementsChanged);
        socket.on("whiteboard:cleared", handleCleared);
        socket.on("whiteboard:view-state", handleViewState);
        socket.on("whiteboard:cursor-moved", handleCursorMoved);
        socket.on("whiteboard:user-joined", handleUserJoined);
        socket.on("whiteboard:user-left", handleUserLeft);
        socket.on("whiteboard:deleted", handleBoardDeleted);

        return () => {
            disposed = true;

            socket.emit("whiteboard:leave", { boardId });
            socket.disconnect();

            socket.off("connect", handleConnect);
            socket.off("connect_error", handleConnectError);
            socket.off("disconnect", handleDisconnect);
            socket.off("whiteboard:element-updated", handleElementUpdated);
            socket.off("whiteboard:elements-changed", handleElementsChanged);
            socket.off("whiteboard:cleared", handleCleared);
            socket.off("whiteboard:view-state", handleViewState);
            socket.off("whiteboard:cursor-moved", handleCursorMoved);
            socket.off("whiteboard:user-joined", handleUserJoined);
            socket.off("whiteboard:user-left", handleUserLeft);
            socket.off("whiteboard:deleted", handleBoardDeleted);

            if (socketRef.current === socket) {
                socketRef.current = null;
            }
        };
    }, [boardId, meetingCode, enabled]);

    const drawElement = useCallback(
        (element) => {
            if (!boardId || !element ?.id) return;

            setElements((current) => {
                const exists = current.some((item) => item.id === element.id);

                return exists ?
                    current.map((item) =>
                        item.id === element.id ? element : item
                    ) : [...current, element];
            });

            socketRef.current ?.emit(
                "whiteboard:draw-element", { boardId, element },
                (response) => {
                    if (!response ?.success) {
                        setError(response ?.message || "Could not save drawing.");
                    }
                }
            );
        }, [boardId]
    );

    const changeElements = useCallback(
        (updates = [], deletes = []) => {
            if (!boardId) return;

            setElements((current) => {
                let next = current.filter(
                    (item) => !deletes.includes(item.id)
                );

                for (const element of updates) {
                    if (!element ?.id) continue;

                    const exists = next.some(
                        (item) => item.id === element.id
                    );

                    next = exists ?
                        next.map((item) =>
                            item.id === element.id ? element : item
                        ) : [...next, element];
                }

                return next;
            });

            socketRef.current ?.emit(
                "whiteboard:elements-change", { boardId, updates, deletes },
                (response) => {
                    if (!response ?.success) {
                        setError(response ?.message || "Could not update whiteboard.");
                    }
                }
            );
        }, [boardId]
    );

    const moveCursor = useCallback(
        (x, y) => {
            if (!boardId) return;

            socketRef.current ?.emit("whiteboard:cursor-move", {
                boardId,
                x,
                y,
            });
        }, [boardId]
    );

    const clearBoard = useCallback(() => {
        if (!boardId) return;

        socketRef.current ?.emit(
            "whiteboard:clear", { boardId },
            (response) => {
                if (!response ?.success) {
                    setError(response ?.message || "Could not clear whiteboard.");
                    return;
                }

                setElements([]);
                setCursors({});
            }
        );
    }, [boardId]);

    return {
        elements,
        viewState,
        activeUsers,
        cursors,
        status,
        error,
        drawElement,
        changeElements,
        moveCursor,
        clearBoard,
    };
}