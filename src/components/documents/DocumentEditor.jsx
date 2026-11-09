import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
    FiBold,
    FiItalic,
    FiList,
    FiRotateCcw,
    FiRotateCw,
    FiShare2,
    FiType,
} from "react-icons/fi";
import useDocumentSocket from "../../hooks/useDocumentSocket";
import DocumentDetailsPanel from "./DocumentDetailsPanel";

const canEditPermission = (permission) =>
    ["WRITE", "OWNER"].includes(
        String(permission || "").toUpperCase()
    );

function ToolbarButton({
    label,
    active = false,
    disabled = false,
    onClick,
    children,
}) {
    return (
        <button
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={active}
            disabled={disabled}
            onClick={onClick}
            className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2 transition disabled:cursor-not-allowed disabled:opacity-40 ${
                active
                    ? "bg-[#2878D5] text-white"
                    : "text-[#D8E7F8] hover:bg-[#24476B]"
            }`}
        >
            {children}
        </button>
    );
}

export default function DocumentEditor({
    document,
    onShare,
    onAI,
    onOpenWhiteboard,
}) {
    const documentId = document?.id || document?._id;

    const permission = String(
        document?.userPermission || "READ"
    ).toUpperCase();

    const canWrite = canEditPermission(permission);

    const editorRef = useRef(null);
    const [connectionError, setConnectionError] = useState("");

    const handleRemoteUpdate = useCallback((payload) => {
        const currentEditor = editorRef.current;
        const remoteContent = payload?.content;

        if (remoteContent == null || !currentEditor) return;

        const currentContent = currentEditor.getJSON();

        if (
            JSON.stringify(currentContent) !==
            JSON.stringify(remoteContent)
        ) {
            currentEditor.commands.setContent(
                remoteContent,
                { emitUpdate: false }
            );
        }
    }, []);

    const {
        status: socketStatus,
        error: socketError,
        emitDocumentUpdate,
    } = useDocumentSocket({
        documentId,
        enabled: Boolean(documentId && canWrite),
        onDocumentUpdate: handleRemoteUpdate,
    });

    const editor = useEditor(
        {
            extensions: [StarterKit],
            content: document?.content || "",
            editable: canWrite,
            immediatelyRender: false,

            onUpdate: ({ editor: currentEditor }) => {
                const sent = emitDocumentUpdate(
                    currentEditor.getJSON()
                );

                setConnectionError(
                    sent
                        ? ""
                        : "Not connected. Your latest edit is queued and will be sent after reconnection."
                );
            },

            editorProps: {
                attributes: {
                    class: "min-h-[420px] w-full max-w-none px-4 py-5 text-sm leading-7 text-[#EAF2FF] outline-none sm:px-6",
                    "aria-label": "Document editor",
                },
            },
        },
        [documentId]
    );

    useEffect(() => {
        editorRef.current = editor;
    }, [editor]);

    useEffect(() => {
        if (editor) {
            editor.setEditable(canWrite);
        }
    }, [editor, canWrite]);

    useEffect(() => {
        if (!editor || document?.content == null) return;

        const currentContent = editor.getJSON();

        if (
            JSON.stringify(currentContent) !==
            JSON.stringify(document.content)
        ) {
            editor.commands.setContent(
                document.content,
                { emitUpdate: false }
            );
        }
    }, [editor, document?.content, documentId]);

    if (!documentId) {
        return (
            <div
                role="alert"
                className="rounded-xl border border-red-400/30 bg-red-950/40 p-5 text-sm text-red-200"
            >
                Document information is unavailable.
            </div>
        );
    }

    if (!editor) {
        return (
            <div
                className="animate-pulse rounded-xl border border-[#355D83] bg-[#142B45] p-6"
                aria-label="Loading editor"
                aria-busy="true"
            >
                <div className="h-6 w-1/3 rounded bg-[#355574]" />
                <div className="mt-6 h-64 rounded bg-[#102D4B]" />
            </div>
        );
    }

    const connectionLabel = {
        connected: "Live connection",
        connecting: "Connecting...",
        disconnected: "Offline",
        error: "Connection issue",
    }[socketStatus] || "Connection unavailable";

    return (
        <section className="w-full min-w-0 space-y-4">
            <div className="grid min-w-0 grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-[#355D83] bg-[#142B45]/95 shadow-[0_10px_35px_rgba(0,0,0,0.2)]">
                    <header className="flex flex-col gap-3 border-b border-[#355D83] p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                            <h1 className="break-words text-lg font-semibold text-white">
                                {document.title || "Untitled document"}
                            </h1>

                            <p className="mt-1 text-xs text-[#A9BED6]">
                                Version {document.version ?? "—"}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {!canWrite && (
                                <span className="rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-200">
                                    View Only
                                </span>
                            )}

                            {canWrite && onAI && (
                                <button
                                    type="button"
                                    onClick={() => onAI(editor)}
                                    className="min-h-9 rounded-lg border border-[#52789E] bg-[#102D4B] px-3 text-sm font-medium text-[#D8E7F8] transition hover:bg-[#24476B]"
                                >
                                    AI Assistant
                                </button>
                            )}

                            {canWrite && onShare && (
                                <button
                                    type="button"
                                    onClick={() => onShare(document)}
                                    className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-[#2878E8] px-3 text-sm font-semibold text-white transition hover:bg-[#3D8BFA]"
                                >
                                    <FiShare2 />
                                    Share
                                </button>
                            )}
                        </div>
                    </header>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#355D83] bg-[#102D4B]/70 px-3 py-2">
                        <div className="flex flex-wrap items-center gap-1">
                            <ToolbarButton
                                label="Bold"
                                active={editor.isActive("bold")}
                                disabled={!canWrite}
                                onClick={() =>
                                    editor.chain().focus().toggleBold().run()
                                }
                            >
                                <FiBold />
                            </ToolbarButton>

                            <ToolbarButton
                                label="Italic"
                                active={editor.isActive("italic")}
                                disabled={!canWrite}
                                onClick={() =>
                                    editor.chain().focus().toggleItalic().run()
                                }
                            >
                                <FiItalic />
                            </ToolbarButton>

                            <ToolbarButton
                                label="Heading"
                                active={editor.isActive("heading", { level: 2 })}
                                disabled={!canWrite}
                                onClick={() =>
                                    editor.chain().focus()
                                        .toggleHeading({ level: 2 }).run()
                                }
                            >
                                <FiType />
                            </ToolbarButton>

                            <ToolbarButton
                                label="Bullet list"
                                active={editor.isActive("bulletList")}
                                disabled={!canWrite}
                                onClick={() =>
                                    editor.chain().focus()
                                        .toggleBulletList().run()
                                }
                            >
                                <FiList />
                            </ToolbarButton>

                            <ToolbarButton
                                label="Undo"
                                disabled={!canWrite || !editor.can().undo()}
                                onClick={() =>
                                    editor.chain().focus().undo().run()
                                }
                            >
                                <FiRotateCcw />
                            </ToolbarButton>

                            <ToolbarButton
                                label="Redo"
                                disabled={!canWrite || !editor.can().redo()}
                                onClick={() =>
                                    editor.chain().focus().redo().run()
                                }
                            >
                                <FiRotateCw />
                            </ToolbarButton>
                        </div>

                        <span
                            role="status"
                            aria-live="polite"
                            className={`text-xs ${
                                socketStatus === "connected"
                                    ? "text-emerald-300"
                                    : "text-amber-200"
                            }`}
                        >
                            {canWrite ? connectionLabel : "Read-only"}
                        </span>
                    </div>

                    {(socketError || connectionError) && canWrite && (
                        <div
                            role="status"
                            className="border-b border-amber-300/20 bg-amber-400/10 px-4 py-2 text-xs text-amber-100"
                        >
                            {connectionError || socketError}
                        </div>
                    )}

                    <div className="min-h-[420px] min-w-0 flex-1 overflow-y-auto bg-[#102842]/65">
                        <EditorContent editor={editor} />
                    </div>

                    <footer className="border-t border-[#355D83] px-4 py-2 text-xs text-[#A9BED6]">
                        {canWrite
                            ? "Document changes are sent through the live document connection."
                            : "You have read-only access to this document."}
                    </footer>
                </div>

                <DocumentDetailsPanel
                    document={document}
                    onOpenWhiteboard={onOpenWhiteboard}
                />
            </div>
        </section>
    );
}