
import { useCallback, useEffect, useRef, useState } from "react";
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
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
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

        if (!remoteContent || !currentEditor) return;

        const currentContent = currentEditor.getJSON();

        if (
            JSON.stringify(currentContent) !==
            JSON.stringify(remoteContent)
        ) {
            currentEditor.commands.setContent(remoteContent, {
                emitUpdate: false,
            });
        }
    }, []);

    const {
        status: socketStatus,
        error: socketError,
        emitDocumentUpdate,
    } = useDocumentSocket({
        documentId,
        enabled: Boolean(documentId),
        onDocumentUpdate: handleRemoteUpdate,
    });

    const editor = useEditor({
        extensions: [StarterKit],
        content: document?.content || "",
        editable: canWrite,
        immediatelyRender: false,

        onUpdate: ({ editor: currentEditor }) => {
            const content = currentEditor.getJSON();

            const emitted = emitDocumentUpdate(content);

            if (!emitted) {
                setConnectionError(
                    "Live connection unavailable. Your latest changes may not be shared."
                );
            } else {
                setConnectionError("");
            }
        },

        editorProps: {
            attributes: {
                class:
                    "min-h-[360px] w-full max-w-none px-4 py-5 text-sm leading-7 text-gray-800 outline-none dark:text-gray-100 sm:px-6",
                "aria-label": "Document editor",
            },
        },
    });

    useEffect(() => {
        editorRef.current = editor;
    }, [editor]);

    useEffect(() => {
        if (!editor) return;

        editor.setEditable(canWrite);
    }, [editor, canWrite]);

    useEffect(() => {
        if (!editor || !document?.content) return;

        const currentContent = editor.getJSON();

        if (
            JSON.stringify(currentContent) !==
            JSON.stringify(document.content)
        ) {
            editor.commands.setContent(document.content, {
                emitUpdate: false,
            });
        }
    }, [editor, document?.content, documentId]);

    if (!documentId) {
        return (
            <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
            >
                Document information is unavailable.
            </div>
        );
    }

    if (!editor) {
        return (
            <div
                className="animate-pulse rounded-xl border border-gray-200 p-6 dark:border-gray-700"
                aria-label="Loading editor"
                aria-busy="true"
            >
                <div className="h-6 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="mt-6 h-64 rounded bg-gray-100 dark:bg-gray-800" />
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
                <div className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                    <header className="flex flex-col gap-3 border-b border-gray-200 p-4 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                            <h1 className="break-words text-lg font-semibold text-gray-900 dark:text-white">
                                {document.title || "Untitled document"}
                            </h1>

                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Version {document.version ?? "—"}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {!canWrite && (
                                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                    View Only
                                </span>
                            )}

                            {canWrite && onAI && (
                                <button
                                    type="button"
                                    onClick={() => onAI(editor)}
                                    className="min-h-9 rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                                >
                                    AI Assistant
                                </button>
                            )}

                            {canWrite && onShare && (
                                <button
                                    type="button"
                                    onClick={() => onShare(document)}
                                    className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-medium text-white transition hover:bg-blue-700"
                                >
                                    <FiShare2 />
                                    Share
                                </button>
                            )}
                        </div>
                    </header>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-3 py-2 dark:border-gray-700">
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
                                    editor.chain().focus().toggleHeading({ level: 2 }).run()
                                }
                            >
                                <FiType />
                            </ToolbarButton>

                            <ToolbarButton
                                label="Bullet list"
                                active={editor.isActive("bulletList")}
                                disabled={!canWrite}
                                onClick={() =>
                                    editor.chain().focus().toggleBulletList().run()
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
                            className={`text-xs ${
                                socketStatus === "connected"
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-amber-600 dark:text-amber-400"
                            }`}
                            role="status"
                            aria-live="polite"
                        >
                            {connectionLabel}
                        </span>
                    </div>

                    {(socketError || connectionError) && canWrite && (
                        <div
                            role="status"
                            className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300"
                        >
                            {connectionError || socketError}
                        </div>
                    )}

                    <div className="min-h-[360px] min-w-0 flex-1 overflow-y-auto">
                        <EditorContent editor={editor} />
                    </div>

                    <footer className="border-t border-gray-200 px-4 py-2 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                        {canWrite
                            ? "Changes are shared through the live document connection."
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
