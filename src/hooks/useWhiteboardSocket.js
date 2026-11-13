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

const createSnapshot = (elements, ids) => {
    const snapshot = {};

    ids.forEach((id) => {
        snapshot[id] = elements.find((item) => item.id === id) || null;
    });

    return snapshot;
};

const applySnapshot = (current, snapshot) => {
    const ids = Object.keys(snapshot);

    let next = current
        .filter((item) => !Object.prototype.hasOwnProperty.call(snapshot, item.id) || snapshot[item.id] !== null)
        .map((item) =>
            Object.prototype.hasOwnProperty.call(snapshot, item.id) ?
            snapshot[item.id] :
            item
        );

    ids.forEach((id) => {
        const savedElement = snapshot[id];

        if (savedElement && !next.some((item) => item.id === id)) {
            next.push(savedElement);
        }
    });

    return next;
};

export function useWhiteboardSocket({ boardId, meetingCode, enabled = true }) {
    const socketRef = useRef(null);

    const [elements, setElements] = useState([]);
    const elementsRef = useRef([]);

    const undoStackRef = useRef([]);
    const redoStackRef = useRef([]);

    const [historyState, setHistoryState] = useState({
        canUndo: false,
        canRedo: false,
    });

    const [viewState, setViewState] = useState(initialViewState);
    const [activeUsers, setActiveUsers] = useState([]);
    const [cursors, setCursors] = useState({});
    const [status, setStatus] = useState("disconnected");
    const [error, setError] = useState("");

    const commitElements = useCallback((nextOrUpdater) => {
        const next =
            typeof nextOrUpdater === "function" ?
            nextOrUpdater(elementsRef.current) :
            nextOrUpdater;

        elementsRef.current = next;
        setElements(next);
    }, []);

    const updateHistoryState = useCallback(() => {
        setHistoryState({
            canUndo: undoStackRef.current.length > 0,
            canRedo: redoStackRef.current.length > 0,
        });
    }, []);

    const recordHistory = useCallback((before, after) => {
        if (JSON.stringify(before) === JSON.stringify(after)) return;

        undoStackRef.current.push({ before, after });

        // Keep the latest 100 actions.
        if (undoStackRef.current.length > 100) {
            undoStackRef.current.shift();
        }

        // A new action after Undo invalidates the Redo stack.
        redoStackRef.current = [];
        updateHistoryState();
    }, [updateHistoryState]);

    useEffect(() => {
        undoStackRef.current = [];
        redoStackRef.current = [];
        updateHistoryState();

        if (!boardId || !enabled) {
            commitElements([]);
            setViewState(initialViewState);
            setActiveUsers([]);
            setCursors({});
            setStatus("disconnected");
            setError("");
            return;
        }

        let disposed = false;
        let joined = false;

        commitElements([]);
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

                    commitElements(
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

        // Remote changes update the canvas but are NOT added to local history.
        const handleElementUpdated = ({ element } = {}) => {
            if (!element ?.id) return;

            commitElements((current) => mergeElement(current, element));
        };

        const handleElementsChanged = ({ updates = [], deletes = [] } = {}) => {
            commitElements((current) =>
                applyElementChanges(current, updates, deletes)
            );
        };

        const handleCleared = () => {
            commitElements([]);
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
                current.filter(
                    (item) =>
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
            commitElements([]);
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
    }, [boardId, meetingCode, enabled, commitElements, updateHistoryState]);

    const drawElement = useCallback((element) => {
        if (!boardId || !element ?.id) return;

        const before = createSnapshot(elementsRef.current, [element.id]);
        const next = mergeElement(elementsRef.current, element);
        const after = createSnapshot(next, [element.id]);

        commitElements(next);
        recordHistory(before, after);

        socketRef.current ?.emit(
            "whiteboard:draw-element", { boardId, element },
            (response) => {
                if (response ?.success === false) {
                    setError(response.message || "Could not save drawing.");
                }
            }
        );
    }, [boardId, commitElements, recordHistory]);

    const changeElements = useCallback((updates = [], deletes = []) => {
        if (!boardId) return;

        const touchedIds = [
            ...new Set([
                ...updates.map((item) => item.id).filter(Boolean),
                ...deletes.filter(Boolean),
            ]),
        ];

        const before = createSnapshot(elementsRef.current, touchedIds);
        const next = applyElementChanges(elementsRef.current, updates, deletes);
        const after = createSnapshot(next, touchedIds);

        commitElements(next);
        recordHistory(before, after);

        socketRef.current ?.emit(
            "whiteboard:elements-change", { boardId, updates, deletes },
            (response) => {
                if (response ?.success === false) {
                    setError(response.message || "Could not update whiteboard.");
                }
            }
        );
    }, [boardId, commitElements, recordHistory]);

    const applyHistoryEntry = useCallback((snapshot) => {
        const updates = Object.values(snapshot).filter(Boolean);
        const deletes = Object.keys(snapshot).filter((id) => snapshot[id] === null);

        const next = applySnapshot(elementsRef.current, snapshot);
        commitElements(next);

        socketRef.current ?.emit(
            "whiteboard:elements-change", { boardId, updates, deletes },
            (response) => {
                if (response ?.success === false) {
                    setError(response.message || "Could not update whiteboard.");
                }
            }
        );
    }, [boardId, commitElements]);

    const undo = useCallback(() => {
        if (!boardId || undoStackRef.current.length === 0) return;

        const entry = undoStackRef.current.pop();
        applyHistoryEntry(entry.before);

        redoStackRef.current.push(entry);
        updateHistoryState();
    }, [boardId, applyHistoryEntry, updateHistoryState]);

    const redo = useCallback(() => {
        if (!boardId || redoStackRef.current.length === 0) return;

        const entry = redoStackRef.current.pop();
        applyHistoryEntry(entry.after);

        undoStackRef.current.push(entry);
        updateHistoryState();
    }, [boardId, applyHistoryEntry, updateHistoryState]);

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

        const currentElements = elementsRef.current;
        const ids = currentElements.map((item) => item.id);
        const before = createSnapshot(currentElements, ids);
        const after = createSnapshot([], ids);

        socketRef.current ?.emit(
            "whiteboard:clear", { boardId },
            (response) => {
                if (response ?.success === false) {
                    setError(response.message || "Could not clear whiteboard.");
                } else {
                    commitElements([]);
                    setCursors({});
                    recordHistory(before, after);
                }
            }
        );
    }, [boardId, commitElements, recordHistory]);

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
        undo,
        redo,
        canUndo: historyState.canUndo,
        canRedo: historyState.canRedo,
    };
}