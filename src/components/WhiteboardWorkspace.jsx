
import { useCallback, useEffect, useState } from "react";
import { FiPlus, FiRefreshCw, FiX } from "react-icons/fi";
import {
  createMeetingWhiteboard,
  listMeetingWhiteboards,
  openMeetingWhiteboard,
  listWhiteboards,
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

export default function WhiteboardWorkspace({
  meetingCode,
  organizationId,
  user,
  isHost,
  participants,
  localStream,
  remoteStreams,
  isMuted,
  isVideoOff,
  onClose,
}) {
  const [boards, setBoards] = useState([]);
  const [boardId, setBoardId] = useState("");
  const [boardName, setBoardName] = useState("Meeting whiteboard");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [pageError, setPageError] = useState("");
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#0066FF");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [showBoardPicker, setShowBoardPicker] = useState(false);

  const {
    elements,
    viewState,
    activeUsers,
    cursors,
    status,
    error: socketError,
    drawElement,
    changeElements,
    moveCursor,
    clearBoard,
  } = useWhiteboardSocket({
    boardId,
    meetingCode,
    enabled: Boolean(boardId),
  });

  const loadBoards = useCallback(async () => {
    if (!meetingCode) {
      setPageError("Meeting code is missing.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setPageError("");

    try {
      const [meetingResult, organizationResult] = await Promise.allSettled([
        listMeetingWhiteboards(meetingCode),
        organizationId
          ? listWhiteboards({ organizationId, page: 1, limit: 100 })
          : Promise.resolve(null),
      ]);

      const normalizeList = (result) => {
        if (!result) return [];
        if (Array.isArray(result)) return result;
        if (Array.isArray(result.whiteboards)) return result.whiteboards;
        if (Array.isArray(result.boards)) return result.boards;
        if (Array.isArray(result.items)) return result.items;
        if (Array.isArray(result.data)) return result.data;
        if (Array.isArray(result.data?.whiteboards)) return result.data.whiteboards;
        if (Array.isArray(result.data?.boards)) return result.data.boards;
        if (Array.isArray(result.data?.items)) return result.data.items;
        return [];
      };

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
        const id = board.id || board._id || board.whiteboardId;
        if (id) merged.set(String(id), board);
      });

      const list = [...merged.values()];
      setBoards(list);
      // Prefer a board attached to this meeting so every attendee is directed
      // to the same persisted board instead of independently creating one.
      const sharedMeetingBoard = meetingBoards[0];
      const sharedId = sharedMeetingBoard && (sharedMeetingBoard.id || sharedMeetingBoard._id || sharedMeetingBoard.whiteboardId);
      if (!boardId && sharedId) {
        const normalizedId = String(sharedId);
        setBoardId(normalizedId);
        setBoardName(sharedMeetingBoard.name || "Meeting whiteboard");
        setShowBoardPicker(false);
      } else if (!boardId && list.length > 0) {
        setShowBoardPicker(true);
      }

      if (organizationId && organizationResult?.status === "rejected") {
        setPageError(
          organizationResult.reason?.response?.data?.message ||
            "Meeting boards loaded, but organization saved boards could not be loaded."
        );
      }
    } catch (err) {
      setPageError(
        err.response?.data?.message || "Could not load meeting whiteboards."
      );
    } finally {
      setLoading(false);
    }
  }, [meetingCode, boardId]);

  useEffect(() => {
    loadBoards();
  }, [loadBoards]);

  async function createBoard() {
    const name = boardName.trim();
    if (!isHost || !name || creating) return;

    setCreating(true);
    setPageError("");

    try {
      const result = await createMeetingWhiteboard(meetingCode, {
        name,
        content: initialContent,
        ...(organizationId ? { organizationId } : {}),
      });

      const board = result.whiteboard || result.board || result;
      const id = board.id || board._id;

      if (!id) {
        throw new Error("The create-board response did not include a board ID.");
      }

      setBoards((previous) => [
        board,
        ...previous.filter((item) => String(item.id || item._id) !== String(id)),
      ]);
      setBoardId(String(id));
      setShowBoardPicker(false);
    } catch (err) {
      setPageError(
        err.response?.data?.message ||
          err.message ||
          "Could not create whiteboard."
      );
    } finally {
      setCreating(false);
    }
  }

  async function selectBoard(board) {
    const id = board.id || board._id;
    if (!id) return;

    setPageError("");

    try {
      const result = await openMeetingWhiteboard(meetingCode, id);
      const openedBoard = result.whiteboard || result.board || board;
      const openedId = openedBoard.id || openedBoard._id || id;

      setBoardId(String(openedId));
      setBoardName(openedBoard.name || "Meeting whiteboard");
      setShowBoardPicker(false);
    } catch (err) {
      setPageError(
        err.response?.data?.message || "Could not open this whiteboard."
      );
    }
  }

  function handleClear() {
    if (window.confirm("Clear the whiteboard for everyone?")) {
      clearBoard();
    }
  }


  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#38BDF8]/40 bg-gradient-to-br from-[#0B2344] via-[#253348] to-[#4C698E] p-2 sm:p-3">
      <header className="flex min-h-11 shrink-0 items-center justify-between gap-2 border-b border-white/15 px-1 pb-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-semibold">
            {boardName}
          </span>
          <span className="shrink-0 rounded-full bg-black/20 px-2 py-1 text-[10px] text-white/70">
            {status}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowBoardPicker((value) => !value)}
            className="flex items-center gap-1 rounded-md bg-[#0066FF] px-2.5 py-2 text-xs font-medium hover:bg-[#0057DB]"
          >
            <FiPlus size={14} />
            Boards
          </button>
          <button
            type="button"
            onClick={loadBoards}
            title="Refresh boards"
            className="flex h-8 w-8 items-center justify-center rounded-md bg-white/10 hover:bg-white/20"
          >
            <FiRefreshCw size={14} />
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Close whiteboard"
            className="flex h-8 w-8 items-center justify-center rounded-md bg-white/10 hover:bg-white/20"
          >
            <FiX size={16} />
          </button>
        </div>
      </header>

      {(pageError || socketError) && (
        <p className="mt-2 rounded-md bg-red-500/15 px-3 py-2 text-xs text-red-200">
          {pageError || socketError}
        </p>
      )}

      {showBoardPicker && (
        <div className="mt-2 grid shrink-0 gap-3 rounded-lg border border-white/15 bg-[#0B2344] p-3 sm:grid-cols-2">
          <div className="space-y-2">
            <h2 className="text-sm font-semibold">Create a whiteboard</h2>
            {!isHost && <p className="text-xs text-white/55">The host creates the shared meeting board. Refresh to open it once it appears.</p>}
            <input
              value={boardName}
              onChange={(event) => setBoardName(event.target.value)}
              placeholder="Whiteboard name"
              className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-[#38BDF8]"
            />
            <button
              type="button"
              onClick={createBoard}
              disabled={!isHost || creating || !boardName.trim()}
              className="w-full rounded-md bg-[#0066FF] px-3 py-2 text-xs font-semibold disabled:opacity-50"
            >
              {!isHost ? "Host creates board" : creating ? "Creating..." : "Create board"}
            </button>
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-semibold">Existing boards</h2>
            {loading ? (
              <p className="text-xs text-white/50">Loading boards...</p>
            ) : boards.length === 0 ? (
              <p className="text-xs text-white/50">No boards found yet.</p>
            ) : (
              <div className="max-h-32 space-y-1 overflow-y-auto">
                {boards.map((board) => (
                  <button
                    type="button"
                    key={board.id || board._id}
                    onClick={() => selectBoard(board)}
                    className="w-full truncate rounded-md bg-white/5 px-3 py-2 text-left text-xs hover:bg-white/10"
                  >
                    {board.name || "Untitled whiteboard"}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {!boardId ? (
        <div className="flex min-h-0 flex-1 items-center justify-center p-4">
          <div className="max-w-sm text-center">
            <h2 className="mb-2 text-lg font-semibold">Meeting whiteboard</h2>
            <p className="mb-4 text-sm text-white/65">
              Create a new board or open an existing board to collaborate.
            </p>
            <button
              type="button"
              onClick={() => setShowBoardPicker(true)}
              className="rounded-md bg-[#0066FF] px-4 py-2 text-sm font-semibold"
            >
              Choose a board
            </button>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 gap-2 pt-2 sm:gap-3">
          <div className="hidden w-56 shrink-0 md:block">
          <MeetingSidebar
            user={user}
            participants={participants}
            localStream={localStream}
            remoteStreams={remoteStreams}
            isMuted={isMuted}
            isVideoOff={isVideoOff}
          />
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-[#B6C6D9]/40 bg-[#4C698E]/60 p-1.5 sm:p-3">
              <div className="mb-2 flex items-center justify-between gap-2 px-1">
                <span className="text-xs font-semibold text-white/90">
                  Whiteboard
                </span>
                <span className="text-[10px] text-white/55">
                  {activeUsers.length || participants.length} participants
                </span>
              </div>

              <div className="min-h-0 flex-1 overflow-hidden">
                <WhiteboardCanvas
                  elements={elements}
                  drawElement={drawElement}
                  changeElements={changeElements}
                  moveCursor={moveCursor}
                  tool={tool}
                  color={color}
                  strokeWidth={strokeWidth}
                  backgroundColor={viewState.backgroundColor}
                />
              </div>

              <div className="absolute bottom-3 left-1/2 z-30 flex min-h-12 max-w-[95%] -translate-x-1/2 items-center justify-center overflow-x-auto rounded-xl border border-white/30 bg-[#0B2344] p-2 shadow-2xl sm:bottom-4">
                <WhiteboardToolbar
                  tool={tool}
                  setTool={setTool}
                  color={color}
                  setColor={setColor}
                  strokeWidth={strokeWidth}
                  setStrokeWidth={setStrokeWidth}
                  onClear={handleClear}
                />
              </div>
            </div>
          </div>

        </div>
      )}

      <div className="sr-only" aria-live="polite">
        {Object.keys(cursors || {}).length} remote cursors
      </div>
    </section>
  );
}
