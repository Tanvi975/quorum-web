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

const mergeElement = (current, element) => {
    if (!element ?.id) return current;

    const exists = current.some((item) => item.id === element.id);

    return exists ?
        current.map((item) => item.id === element.id ? element : item) :
        [...current, element];
};

const applyElementChanges = (current, updates = [], deletes = []) => {
    let next = current.filter((item) => !deletes.includes(item.id));

    updates.forEach((element) => {
        next = mergeElement(next, element);
    });

    return next;
};

const getResponseData = (response) =>
    response ?.data ?.data ?? response ?.data ?? response ?? {};

export function useWhiteboardSocket({ boardId, meetingCode, enabled = true }) {
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
            setViewState(initialViewState);
            setActiveUsers([]);
            setCursors({});
            setStatus("disconnected");
            setError("");
            return;
        }

        let disposed = false;
        let joined = false;

        setElements([]);
        setViewState(initialViewState);
        setActiveUsers([]);
        setCursors({});
        setStatus("connecting");
        setError("");

        const socket = io(SOCKET_URL, {
            withCredentials: true,
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socketRef.current = socket;

        const handleConnect = () => {
            if (disposed) return;

            setStatus("joining");

            socket.emit(
                "whiteboard:join", {
                    boardId,
                    ...(meetingCode ? { meetingCode } : {}),
                },
                (response) => {
                    if (disposed) return;

                    if (response && response.success === false) {
                        setStatus("error");
                        setError(response.message || "Could not join whiteboard.");
                        return;
                    }

                    const data = getResponseData(response);

                    setElements(Array.isArray(data.elements) ? data.elements : []);
                    setViewState({
                        ...initialViewState,
                        ...(data.viewState || {}),
                    });
                    setActiveUsers(Array.isArray(data.activeUsers) ? data.activeUsers : []);
                    setError("");
                    setStatus("connected");
                    joined = true;
                }
            );
        };

        const handleConnectError = (err) => {
            setStatus("error");
            setError(err ?.message || "Whiteboard connection failed.");
        };

        const handleDisconnect = () => {
            joined = false;
            setStatus("disconnected");
        };

        const handleElementUpdated = ({ element } = {}) => {
            if (!element ?.id) return;
            setElements((current) => mergeElement(current, element));
        };

        const handleElementsChanged = ({ updates = [], deletes = [] } = {}) => {
            setElements((current) => applyElementChanges(current, updates, deletes));
        };

        const handleCleared = () => {
            setElements([]);
            setCursors({});
        };

        const handleViewState = ({ viewState: nextViewState } = {}) => {
            if (!nextViewState) return;
            setViewState((current) => ({...current, ...nextViewState }));
        };

        const handleCursorMoved = (cursor = {}) => {
            const cursorId = cursor.userId || cursor.socketId;
            if (!cursorId) return;

            setCursors((current) => ({
                ...current,
                [cursorId]: cursor,
            }));
        };

        const handleUserJoined = (user = {}) => {
            const userId = user.userId || user.id;
            if (!userId) return;

            setActiveUsers((current) => [
                ...current.filter((item) => item.userId !== userId),
                {
                    userId,
                    name: user.name || "Participant",
                },
            ]);
        };

        const handleUserLeft = ({ userId, socketId } = {}) => {
            setActiveUsers((current) =>
                current.filter((item) =>
                    item.userId !== userId && item.socketId !== socketId
                )
            );

            setCursors((current) => {
                const next = {...current };
                if (userId) delete next[userId];
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

        const handleWhiteboardError = (response = {}) => {
            setError(response.message || "Whiteboard operation failed.");
        };

        socket.on("connect", handleConnect);
        socket.on("connect_error", handleConnectError);
        socket.on("disconnect", handleDisconnect);
        socket.on("whiteboard:element-updated", handleElementUpdated);
        socket.on("whiteboard:elements-changed", handleElementsChanged);
        socket.on("whiteboard:cleared", handleCleared);
        socket.on("whiteboard:view-state-updated", handleViewState);
        socket.on("whiteboard:view-state", handleViewState);
        socket.on("whiteboard:cursor-moved", handleCursorMoved);
        socket.on("whiteboard:user-joined", handleUserJoined);
        socket.on("whiteboard:user-left", handleUserLeft);
        socket.on("whiteboard:deleted", handleBoardDeleted);
        socket.on("whiteboard:error", handleWhiteboardError);

        return () => {
            disposed = true;

            if (joined) {
                socket.emit("whiteboard:leave", { boardId });
            }

            socket.off("connect", handleConnect);
            socket.off("connect_error", handleConnectError);
            socket.off("disconnect", handleDisconnect);
            socket.off("whiteboard:element-updated", handleElementUpdated);
            socket.off("whiteboard:elements-changed", handleElementsChanged);
            socket.off("whiteboard:cleared", handleCleared);
            socket.off("whiteboard:view-state-updated", handleViewState);
            socket.off("whiteboard:view-state", handleViewState);
            socket.off("whiteboard:cursor-moved", handleCursorMoved);
            socket.off("whiteboard:user-joined", handleUserJoined);
            socket.off("whiteboard:user-left", handleUserLeft);
            socket.off("whiteboard:deleted", handleBoardDeleted);
            socket.off("whiteboard:error", handleWhiteboardError);

            socket.disconnect();

            if (socketRef.current === socket) {
                socketRef.current = null;
            }
        };
    }, [boardId, meetingCode, enabled]);

    const drawElement = useCallback((element) => {
        if (!boardId || !element ?.id) return;

        setElements((current) => mergeElement(current, element));

        socketRef.current ?.emit(
            "whiteboard:draw-element", { boardId, element },
            (response) => {
                if (response ?.success === false) {
                    setError(response.message || "Could not save drawing.");
                }
            }
        );
    }, [boardId]);

    const changeElements = useCallback((updates = [], deletes = []) => {
        if (!boardId) return;

        setElements((current) => applyElementChanges(current, updates, deletes));

        socketRef.current ?.emit(
            "whiteboard:elements-change", { boardId, updates, deletes },
            (response) => {
                if (response ?.success === false) {
                    setError(response.message || "Could not update whiteboard.");
                }
            }
        );
    }, [boardId]);

    const updateViewState = useCallback((nextViewState) => {
        if (!boardId || !nextViewState) return;

        setViewState((current) => ({...current, ...nextViewState }));

        socketRef.current ?.emit(
            "whiteboard:view-state", { boardId, viewState: nextViewState },
            (response) => {
                if (response ?.success === false) {
                    setError(response.message || "Could not update view.");
                }
            }
        );
    }, [boardId]);

    const moveCursor = useCallback((x, y) => {
        if (!boardId) return;

        socketRef.current ?.emit("whiteboard:cursor-move", {
            boardId,
            x,
            y,
        });
    }, [boardId]);

    const clearBoard = useCallback(() => {
        if (!boardId) return;

        socketRef.current ?.emit(
            "whiteboard:clear", { boardId },
            (response) => {
                if (response ?.success === false) {
                    setError(response.message || "Could not clear whiteboard.");
                } else {
                    setElements([]);
                    setCursors({});
                }
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
        updateViewState,
        moveCursor,
        clearBoard,
    };
}