
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiPlus, FiRefreshCw, FiGrid, FiArrowRight } from "react-icons/fi";
import { listWhiteboards, createWhiteboard } from "../services/whiteboardService";

const getBoardId = (board) => board?.id || board?._id || board?.whiteboardId;

const getBoards = (result) => {
    if (Array.isArray(result)) return result;
    if (!result || typeof result !== "object") return [];
    return result.whiteboards || result.boards || result.items || result.data?.whiteboards || result.data?.boards || result.data?.items || [];
};

export default function OrganizationWhiteboards({ organizationId }) {
    const navigate = useNavigate();
    const [boards, setBoards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [boardName, setBoardName] = useState("");
    const [error, setError] = useState("");

    const loadBoards = useCallback(async () => {
        if (!organizationId) {
            setError("Organisation information is missing.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError("");

        try {
            const result = await listWhiteboards({ organizationId, page: 1, limit: 100 });
            setBoards(getBoards(result));
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || "Could not load whiteboards.");
        } finally {
            setLoading(false);
        }
    }, [organizationId]);

    useEffect(() => {
        loadBoards();
    }, [loadBoards]);

    const openBoard = (id) => {
        navigate(`/whiteboards/${encodeURIComponent(id)}?organizationId=${encodeURIComponent(organizationId)}`);
    };

    const handleCreate = async (event) => {
        event.preventDefault();

        const name = boardName.trim();
        if (!name || creating) return;

        setCreating(true);
        setError("");

        try {
            const result = await createWhiteboard({
                name,
                organizationId,
                content: {
                    elements: [],
                    viewState: {
                        zoom: 1,
                        scrollX: 0,
                        scrollY: 0,
                        backgroundColor: "#FFFFFF",
                    },
                },
            });

            const board = result?.whiteboard || result?.board || result?.data?.whiteboard || result?.data?.board || result?.data || result;
            const id = getBoardId(board);

            if (!id) throw new Error("The server did not return a whiteboard ID.");

            openBoard(id);
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || "Could not create whiteboard.");
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-semibold text-white">Whiteboards</h2>
                    <p className="mt-1 text-sm text-white/60">Create and collaborate on shared organisation whiteboards.</p>
                </div>

                <div className="flex items-center gap-2">
                    <button type="button" onClick={loadBoards} disabled={loading} className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white transition hover:bg-white/10 disabled:opacity-50" title="Refresh whiteboards">
                        <FiRefreshCw className={loading ? "animate-spin" : ""} />
                    </button>
                    <button type="button" onClick={() => setShowCreate((value) => !value)} className="flex items-center gap-2 rounded-lg bg-[#0066FF] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0057DB]">
                        <FiPlus size={16} />
                        Create whiteboard
                    </button>
                </div>
            </div>

            {error && (
                <div role="alert" className="rounded-lg border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {error}
                </div>
            )}

            {showCreate && (
                <form onSubmit={handleCreate} className="flex flex-col gap-3 rounded-xl border border-white/10 bg-[#0B2344] p-4 sm:flex-row">
                    <input
                        value={boardName}
                        onChange={(event) => setBoardName(event.target.value)}
                        placeholder="Enter whiteboard name"
                        maxLength={120}
                        required
                        className="min-w-0 flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/40 focus:border-[#38BDF8]"
                    />
                    <button type="submit" disabled={creating || !boardName.trim()} className="rounded-lg bg-[#0066FF] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0057DB] disabled:opacity-50">
                        {creating ? "Creating..." : "Create"}
                    </button>
                    <button type="button" onClick={() => setShowCreate(false)} className="rounded-lg border border-white/15 px-4 py-2.5 text-sm text-white/75 transition hover:bg-white/5">
                        Cancel
                    </button>
                </form>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-16 text-sm text-white/60">
                    <FiRefreshCw className="mr-2 animate-spin" />
                    Loading whiteboards...
                </div>
            ) : boards.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.03] px-5 py-14 text-center">
                    <FiGrid className="mx-auto mb-3 text-3xl text-[#38BDF8]" />
                    <h3 className="text-base font-semibold text-white">No whiteboards yet</h3>
                    <p className="mt-1 text-sm text-white/55">Create your first shared whiteboard for this organisation.</p>
                    <button type="button" onClick={() => setShowCreate(true)} className="mt-5 rounded-lg bg-[#0066FF] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0057DB]">
                        Create your first whiteboard
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {boards.map((board) => {
                        const id = getBoardId(board);
                        if (!id) return null;

                        return (
                            <button
                                type="button"
                                key={String(id)}
                                onClick={() => openBoard(id)}
                                className="group flex min-h-36 flex-col justify-between rounded-xl border border-white/10 bg-[#0B2344] p-4 text-left transition hover:border-[#38BDF8]/60 hover:bg-[#102C50]"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0066FF]/15 text-[#38BDF8]">
                                        <FiGrid size={20} />
                                    </div>
                                    <FiArrowRight className="text-white/40 transition group-hover:translate-x-1 group-hover:text-[#38BDF8]" />
                                </div>
                                <div className="mt-5 min-w-0">
                                    <h3 className="truncate text-sm font-semibold text-white">{board.name || "Untitled whiteboard"}</h3>
                                    <p className="mt-1 text-xs text-white/50">Open whiteboard</p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
