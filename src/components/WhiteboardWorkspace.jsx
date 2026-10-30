
import { useCallback, useEffect, useState } from "react";
import { FiPlus, FiRefreshCw, FiX, FiTrash2 } from "react-icons/fi";
import {
    createMeetingWhiteboard,
    listMeetingWhiteboards,
    openMeetingWhiteboard,
    listWhiteboards,
    createWhiteboard,
    getWhiteboard,
    deleteWhiteboard,
} from "../services/whiteboardService";
import { useWhiteboardSocket } from "../hooks/useWhiteboardSocket";
import WhiteboardCanvas from "./WhiteboardCanvas";
import WhiteboardToolbar from "./WhiteboardToolbar";
import MeetingSidebar from "./MeetingSidebar";

const initialContent = {
    elements: [],
    viewState: {
        zoom: 1,
        scrollX: 0,
        scrollY: 0,
        backgroundColor: "#FFFFFF",
    },
};

const getErrorMessage = (error, fallback) =>
    error?.response?.data?.message || error?.message || fallback;

const getBoardId = (board) =>
    board?.id ||
    board?._id ||
    board?.whiteboardId ||
    board?.whiteboard?.id ||
    board?.whiteboard?._id;

const getBoardName = (board) =>
    board?.name || board?.whiteboard?.name || "Untitled whiteboard";

const normalizeList = (result) => {
    if (Array.isArray(result)) return result;
    if (!result || typeof result !== "object") return [];

    const candidates = [
        result.whiteboards,
        result.boards,
        result.items,
        result.data,
        result.data?.whiteboards,
        result.data?.boards,
        result.data?.items,
    ];

    return candidates.find(Array.isArray) || [];
};

const normalizeBoard = (result, fallback = {}) => {
    if (!result || typeof result !== "object") return fallback;

    const board =
        result.whiteboard ||
        result.board ||
        result.data?.whiteboard ||
        result.data?.board ||
        result.data ||
        result;

    return getBoardId(board) ? board : fallback;
};

export default function WhiteboardWorkspace({
    meetingCode,
    organizationId,
    initialBoardId,
    user,
    isHost,
    participants = [],
    localStream,
    remoteStreams,
    isMuted,
    isVideoOff,
    onClose,
}) {
    const isMeetingMode = Boolean(meetingCode);

    const [boards, setBoards] = useState([]);
    const [boardId, setBoardId] = useState(initialBoardId || "");
    const [boardName, setBoardName] = useState("Whiteboard");
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [openingBoardId, setOpeningBoardId] = useState("");
    const [deletingBoardId, setDeletingBoardId] = useState("");
    const [pageError, setPageError] = useState("");
    const [pageNotice, setPageNotice] = useState("");
    const [tool, setTool] = useState("pen");
    const [color, setColor] = useState("#0066FF");
    const [strokeWidth, setStrokeWidth] = useState(3);
    const [showBoardPicker, setShowBoardPicker] = useState(!initialBoardId);
    const [boardNameInput, setBoardNameInput] = useState(
        isMeetingMode ? "Meeting whiteboard" : "New whiteboard"
    );

    const {
        elements,
        viewState,
        activeUsers,
        cursors,
        status,
        error: socketError,
        drawElement,
        changeElements,
        updateViewState,
        moveCursor,
        clearBoard,
    } = useWhiteboardSocket({
        boardId,
        meetingCode: meetingCode || undefined,
        enabled: Boolean(boardId),
    });

    const loadBoards = useCallback(async () => {
        if (!organizationId && !meetingCode) {
            setPageError("Organisation information is missing.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setPageError("");
        setPageNotice("");

        try {
            if (!isMeetingMode) {
                const result = await listWhiteboards({
                    organizationId,
                    page: 1,
                    limit: 100,
                });

                const list = normalizeList(result);
                setBoards(list);

                if (initialBoardId) {
                    const selected = list.find(
                        (board) =>
                            String(getBoardId(board)) === String(initialBoardId)
                    );

                    const detail = await getWhiteboard(initialBoardId);
                    const openedBoard = normalizeBoard(detail, selected);

                    if (!getBoardId(openedBoard)) {
                        throw new Error("Could not load the selected whiteboard.");
                    }

                    setBoardId(String(getBoardId(openedBoard)));
                    setBoardName(getBoardName(openedBoard));
                    setBoardNameInput(getBoardName(openedBoard));
                    setShowBoardPicker(false);
                } else {
                    setBoardId("");
                    setShowBoardPicker(true);
                }

                return;
            }

            const [meetingResult, organizationResult] = await Promise.allSettled([
                listMeetingWhiteboards(meetingCode),
                organizationId
                    ? listWhiteboards({ organizationId, page: 1, limit: 100 })
                    : Promise.resolve(null),
            ]);

            if (meetingResult.status === "rejected") {
                throw meetingResult.reason;
            }

            const meetingBoards = normalizeList(meetingResult.value);
            const organizationBoards =
                organizationResult?.status === "fulfilled"
                    ? normalizeList(organizationResult.value)
                    : [];

            const merged = new Map();

            [...organizationBoards, ...meetingBoards].forEach((board) => {
                const id = getBoardId(board);
                if (id) merged.set(String(id), board);
            });

            const list = [...merged.values()];
            setBoards(list);

            if (meetingBoards.length > 0 && !boardId) {
                const selected = meetingBoards[0];
                const id = getBoardId(selected);

                if (id) {
                    setBoardId(String(id));
                    setBoardName(getBoardName(selected));
                    setBoardNameInput(getBoardName(selected));
                    setShowBoardPicker(false);
                }
            } else if (!boardId) {
                setShowBoardPicker(true);
            }

            if (organizationId && organizationResult.status === "rejected") {
                setPageNotice(
                    "Meeting boards loaded, but organisation boards could not be loaded."
                );
            }
        } catch (error) {
            setPageError(
                getErrorMessage(error, "Could not load whiteboards.")
            );
        } finally {
            setLoading(false);
        }
    }, [meetingCode, organizationId, initialBoardId, isMeetingMode]);

    useEffect(() => {
        loadBoards();
    }, [loadBoards]);

    async function createBoard() {
        const name = boardNameInput.trim();

        if (!name) {
            setPageError("Whiteboard name is required.");
            return;
        }

        if (creating || (isMeetingMode && !isHost)) return;

        setCreating(true);
        setPageError("");
        setPageNotice("");

        try {
            const payload = {
                name,
                content: initialContent,
                ...(organizationId ? { organizationId } : {}),
            };

            const result = isMeetingMode
                ? await createMeetingWhiteboard(meetingCode, payload)
                : await createWhiteboard(payload);

            const board = normalizeBoard(result);
            const id = getBoardId(board);

            if (!id) {
                throw new Error("The create-board response did not include a board ID.");
            }

            setBoards((previous) => [
                board,
                ...previous.filter(
                    (item) => String(getBoardId(item)) !== String(id)
                ),
            ]);

            setBoardId(String(id));
            setBoardName(getBoardName(board));
            setBoardNameInput(getBoardName(board));
            setShowBoardPicker(false);
        } catch (error) {
            setPageError(getErrorMessage(error, "Could not create whiteboard."));
        } finally {
            setCreating(false);
        }
    }

    async function selectBoard(board) {
        const id = getBoardId(board);

        if (!id || openingBoardId) return;

        setOpeningBoardId(String(id));
        setPageError("");
        setPageNotice("");

        try {
            let result;

            if (isMeetingMode) {
                result = await openMeetingWhiteboard(meetingCode, String(id));
            } else {
                result = await getWhiteboard(String(id));
            }

            const openedBoard = normalizeBoard(result, board);
            const openedId = getBoardId(openedBoard) || id;

            setBoardId(String(openedId));
            setBoardName(getBoardName(openedBoard));
            setBoardNameInput(getBoardName(openedBoard));
            setShowBoardPicker(false);
        } catch (error) {
            setPageError(
                getErrorMessage(error, "Could not open this whiteboard.")
            );
        } finally {
            setOpeningBoardId("");
        }
    }

    async function handleDeleteBoard(board) {
        const id = getBoardId(board);
        if (!id || deletingBoardId) return;

        const confirmed = window.confirm(
            `Delete "${getBoardName(board)}"? This action cannot be undone.`
        );

        if (!confirmed) return;

        setDeletingBoardId(String(id));
        setPageError("");

        try {
            await deleteWhiteboard(String(id));

            setBoards((previous) =>
                previous.filter(
                    (item) => String(getBoardId(item)) !== String(id)
                )
            );

            if (String(boardId) === String(id)) {
                setBoardId("");
                setBoardName("Whiteboard");
                setShowBoardPicker(true);
            }

            setPageNotice("Whiteboard deleted successfully.");
        } catch (error) {
            setPageError(
                getErrorMessage(error, "Could not delete this whiteboard.")
            );
        } finally {
            setDeletingBoardId("");
        }
    }

    function handleClear() {
        clearBoard();
    }

    const displayedParticipants =
        activeUsers.length > 0 ? activeUsers : participants;

    const socketConnected = status === "connected";

    return (
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#38BDF8]/40 bg-gradient-to-br from-[#0B2344] via-[#253348] to-[#4C698E] p-2 sm:p-3">
            <header className="flex min-h-11 shrink-0 items-center justify-between gap-2 border-b border-white/15 px-1 pb-2">
                <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-sm font-semibold text-white">
                        {boardName}
                    </span>
                    <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] ${
                        socketConnected
                            ? "bg-green-500/20 text-green-200"
                            : status === "error"
                                ? "bg-red-500/20 text-red-200"
                                : "bg-black/20 text-white/70"
                    }`}>
                        {status === "connected" ? "Connected" : status === "joining" ? "Joining..." : status === "connecting" ? "Connecting..." : status === "error" ? "Connection error" : "Disconnected"}
                    </span>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                    <button type="button" onClick={() => setShowBoardPicker((value) => !value)} className="flex items-center gap-1 rounded-md bg-[#0066FF] px-2.5 py-2 text-xs font-medium text-white transition hover:bg-[#0057DB]">
                        <FiPlus size={14} />
                        Boards
                    </button>
                    <button type="button" onClick={loadBoards} disabled={loading} title="Refresh boards" aria-label="Refresh boards" className="flex h-8 w-8 items-center justify-center rounded-md bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-50">
                        <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    </button>
                    <button type="button" onClick={onClose} title="Close whiteboard" aria-label="Close whiteboard" className="flex h-8 w-8 items-center justify-center rounded-md bg-white/10 text-white transition hover:bg-white/20">
                        <FiX size={16} />
                    </button>
                </div>
            </header>

            {(pageError || socketError || pageNotice) && (
                <div role={pageError || socketError ? "alert" : "status"} className={`mt-2 rounded-md px-3 py-2 text-xs ${pageError || socketError ? "bg-red-500/15 text-red-200" : "bg-blue-500/15 text-blue-100"}`}>
                    {pageError || socketError || pageNotice}
                </div>
            )}

            {showBoardPicker && (
                <div className="mt-2 grid shrink-0 gap-3 rounded-lg border border-white/15 bg-[#0B2344] p-3 sm:grid-cols-2">
                    <div className="space-y-2">
                        <h2 className="text-sm font-semibold text-white">Create a whiteboard</h2>
                        {isMeetingMode && !isHost && (
                            <p className="text-xs text-white/55">The meeting host can create a shared whiteboard. You can open an existing board below.</p>
                        )}
                        <input value={boardNameInput} onChange={(event) => setBoardNameInput(event.target.value)} placeholder="Whiteboard name" maxLength={120} disabled={(isMeetingMode && !isHost) || creating} className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-[#38BDF8] disabled:opacity-50" />
                        <button type="button" onClick={createBoard} disabled={(isMeetingMode && !isHost) || creating || !boardNameInput.trim()} className="w-full rounded-md bg-[#0066FF] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#0057DB] disabled:cursor-not-allowed disabled:opacity-50">
                            {creating ? "Creating..." : isMeetingMode && !isHost ? "Host creates board" : "Create board"}
                        </button>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-sm font-semibold text-white">Existing boards</h2>
                        {loading ? (
                            <p className="text-xs text-white/50">Loading boards...</p>
                        ) : boards.length === 0 ? (
                            <p className="text-xs text-white/50">No boards found yet.</p>
                        ) : (
                            <div className="max-h-48 space-y-1 overflow-y-auto">
                                {boards.map((board) => {
                                    const id = getBoardId(board);
                                    if (!id) return null;

                                    const isOpening = openingBoardId === String(id);
                                    const isDeleting = deletingBoardId === String(id);

                                    return (
                                        <div key={String(id)} className="flex items-center gap-1 rounded-md bg-white/5 px-2 py-1">
                                            <button type="button" disabled={Boolean(openingBoardId) || Boolean(deletingBoardId)} onClick={() => selectBoard(board)} className="flex min-h-9 min-w-0 flex-1 items-center justify-between gap-2 px-1 text-left text-xs text-white transition hover:bg-white/5 disabled:opacity-50">
                                                <span className="truncate">{getBoardName(board)}</span>
                                                {isOpening && <span className="shrink-0 text-white/60">Opening...</span>}
                                            </button>
                                            {!isMeetingMode && (
                                                <button type="button" disabled={Boolean(deletingBoardId)} onClick={() => handleDeleteBoard(board)} title="Delete whiteboard" aria-label={`Delete ${getBoardName(board)}`} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-red-200 transition hover:bg-red-500/20 disabled:opacity-50">
                                                    {isDeleting ? <FiRefreshCw size={13} className="animate-spin" /> : <FiTrash2 size={14} />}
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {!boardId ? (
                <div className="flex min-h-0 flex-1 items-center justify-center p-4">
                    <div className="max-w-sm text-center">
                        <h2 className="mb-2 text-lg font-semibold text-white">{isMeetingMode ? "Meeting whiteboard" : "Organisation whiteboards"}</h2>
                        <p className="mb-4 text-sm text-white/65">{isMeetingMode ? "Create a new board or open an existing board to collaborate with meeting participants." : "Create a whiteboard or select an existing board to start collaborating."}</p>
                        <button type="button" onClick={() => setShowBoardPicker(true)} className="rounded-md bg-[#0066FF] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0057DB]">Choose a board</button>
                    </div>
                </div>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden pt-2 md:flex-row sm:gap-3">
                    {isMeetingMode && (
                        <div className="hidden w-56 shrink-0 md:block">
                            <MeetingSidebar user={user} participants={participants} localStream={localStream} remoteStreams={remoteStreams} isMuted={isMuted} isVideoOff={isVideoOff} />
                        </div>
                    )}

                    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col gap-2">
                   
<div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-[#B6C6D9]/40 bg-[#4C698E]/60 p-1.5 sm:p-3">
    <div className="mb-2 flex items-center justify-between gap-2 px-1">
        <span className="text-xs font-semibold text-white/90">Whiteboard</span>
        {isMeetingMode && (
            <span className="text-[10px] text-white/55">
                {displayedParticipants.length} participants
            </span>
        )}
    </div>

    <div className="z-20 mb-2 flex w-full shrink-0 justify-center overflow-x-auto rounded-xl border border-white/30 bg-[#0B2344] p-2 shadow-2xl">
        <WhiteboardToolbar
            tool={tool}
            setTool={setTool}
            color={color}
            setColor={setColor}
            strokeWidth={strokeWidth}
            setStrokeWidth={setStrokeWidth}
            onClear={handleClear}
            disabled={!socketConnected}
        />
    </div>

    <div className="min-h-0 flex-1 overflow-hidden">
        {status === "error" ? (
            <div className="flex h-full items-center justify-center rounded-md bg-white p-4 text-center">
                <div className="max-w-sm">
                    <p className="text-sm font-medium text-gray-800">
                        Unable to connect to the whiteboard.
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                        Check your connection and try again.
                    </p>
                </div>
            </div>
        ) : (
            <WhiteboardCanvas
                elements={elements}
                drawElement={drawElement}
                changeElements={changeElements}
                moveCursor={moveCursor}
                tool={tool}
                color={color}
                strokeWidth={strokeWidth}
                backgroundColor={viewState.backgroundColor || "#FFFFFF"}
                viewState={viewState}
                updateViewState={updateViewState}
                readOnly={!socketConnected}
            />
        )}
    </div>
</div>
</div>
 </div>
                     
    
            )}

            <div className="sr-only" aria-live="polite">{Object.keys(cursors || {}).length} remote cursors</div>
        </section>
    );
}
