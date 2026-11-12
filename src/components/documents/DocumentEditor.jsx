
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
    FiCode,
    FiMinus,
    FiMessageSquare,
    FiRefreshCw,
    FiAlignLeft,
} from "react-icons/fi";

import useDocumentSocket from "../../hooks/useDocumentSocket";
import DocumentDetailsPanel from "./DocumentDetailsPanel";
import { runDocumentAI } from "../../services/documentService";

const canEditPermission = (permission) =>
    ["WRITE", "EDIT", "OWNER"].includes(
        String(permission || "").toUpperCase()
    );

function ToolbarButton({
    label,
    active,
    disabled,
    onClick,
    children,
}) {
    return (
        <button
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={Boolean(active)}
            disabled={disabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={onClick}
            className={`flex h-9 min-w-9 items-center justify-center gap-1 rounded-lg px-2 transition disabled:cursor-not-allowed disabled:opacity-40 ${
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
    onOpenWhiteboard,
}) {
    const documentId = document?.id || document?._id;

    const permission = String(
        document?.userPermission || document?.permission || "READ"
    ).toUpperCase();

    const canWrite = canEditPermission(permission);

    const editorRef = useRef(null);

    const [toolbarVersion, setToolbarVersion] = useState(0);

    const [aiOpen, setAiOpen] = useState(false);
    const [aiAction, setAiAction] = useState("summarize");
    const [aiPrompt, setAiPrompt] = useState("");
    const [aiResult, setAiResult] = useState("");
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState("");
    const handleRemoteUpdate = useCallback((payload) => {
        const currentEditor = editorRef.current;
        const remoteContent = payload?.content;

        if (!currentEditor || remoteContent == null) return;

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
        enabled: Boolean(documentId && canWrite),
        onDocumentUpdate: handleRemoteUpdate,
    });
    const editor = useEditor(
        {
            extensions: [
                StarterKit.configure({
                    heading: {
                        levels: [1, 2, 3],
                    },
                    bulletList: {
                        keepMarks: true,
                        keepAttributes: true,
                    },
                    orderedList: {
                        keepMarks: true,
                        keepAttributes: true,
                    },
                }),
            ],

            content: document?.content || "",

            editable: canWrite,

            immediatelyRender: false,

            onUpdate: ({ editor: currentEditor }) => {
                emitDocumentUpdate(currentEditor.getJSON());
                setToolbarVersion((value) => value + 1);
            },

            onSelectionUpdate: () => {
                setToolbarVersion((value) => value + 1);
            },

            editorProps: {
                attributes: {
                    class: [
                        "document-prose",
                        "min-h-[480px]",
                        "w-full",
                        "max-w-none",
                        "px-4",
                        "py-5",
                        "text-sm",
                        "leading-7",
                        "text-[#EAF2FF]",
                        "outline-none",
                        "sm:px-6",

                        // List styling: Tailwind reset override.
                        "[&_ul]:list-disc",
                        "[&_ul]:pl-8",
                        "[&_ul]:my-3",
                        "[&_ol]:list-decimal",
                        "[&_ol]:pl-8",
                        "[&_ol]:my-3",
                        "[&_li]:list-item",
                        "[&_li]:pl-1",
                        "[&_li]:my-1",
                        "[&_ul_ul]:[list-style-type:circle]",
                        "[&_ul_ul_ul]:[list-style-type:square]",
                        "[&_ol_ol]:[list-style-type:lower-alpha]",
                        "[&_ol_ol_ol]:[list-style-type:lower-roman]",

                        // Heading styling.
                        "[&_h1]:text-3xl",
                        "[&_h1]:font-bold",
                        "[&_h1]:my-5",
                        "[&_h2]:text-2xl",
                        "[&_h2]:font-bold",
                        "[&_h2]:my-4",
                        "[&_h3]:text-xl",
                        "[&_h3]:font-semibold",
                        "[&_h3]:my-3",

                        // Other formatting.
                        "[&_blockquote]:border-l-4",
                        "[&_blockquote]:border-[#60A5FA]",
                        "[&_blockquote]:pl-4",
                        "[&_blockquote]:my-4",
                        "[&_blockquote]:text-[#B8CCE3]",
                        "[&_pre]:bg-[#091D32]",
                        "[&_pre]:border",
                        "[&_pre]:border-[#355D83]",
                        "[&_pre]:rounded-lg",
                        "[&_pre]:p-4",
                        "[&_pre]:my-4",
                        "[&_pre]:overflow-x-auto",
                        "[&_code]:font-mono",
                        "[&_code]:bg-[#24476B]",
                        "[&_code]:rounded",
                        "[&_code]:px-1",
                        "[&_hr]:border-[#52789E]",
                        "[&_hr]:my-6",
                        "[&_strong]:font-bold",
                        "[&_em]:italic",
                    ].join(" "),

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
            editor.commands.setContent(document.content, {
                emitUpdate: false,
            });
        }
    }, [editor, document?.content, documentId]);

    const toggleBold = () => {
        editor?.chain().focus().toggleBold().run();
    };

    const toggleItalic = () => {
        editor?.chain().focus().toggleItalic().run();
    };

    const toggleHeading = (level) => {
        editor?.chain().focus().toggleHeading({ level }).run();
    };

    const toggleBulletList = () => {
        editor?.chain().focus().toggleBulletList().run();
    };

    const toggleOrderedList = () => {
        editor?.chain().focus().toggleOrderedList().run();
    };

    const toggleBlockquote = () => {
        editor?.chain().focus().toggleBlockquote().run();
    };

    const toggleCodeBlock = () => {
        editor?.chain().focus().toggleCodeBlock().run();
    };

    const insertDivider = () => {
        editor?.chain().focus().setHorizontalRule().run();
    };

    const undo = () => {
        editor?.chain().focus().undo().run();
    };

    const redo = () => {
        editor?.chain().focus().redo().run();
    };

    // AI assistant.
    const handleAI = async () => {
        if (!editor || !canWrite) return;

        const selectedText = editor.state.doc.textBetween(
            editor.state.selection.from,
            editor.state.selection.to,
            "\n"
        ).trim();

        if (!selectedText && aiAction !== "custom") {
            setAiError("Select some document text first.");
            return;
        }

        if (aiAction === "custom" && !aiPrompt.trim()) {
            setAiError("Enter instructions for the AI assistant.");
            return;
        }

        setAiLoading(true);
        setAiError("");
        setAiResult("");

        try {
            const response = await runDocumentAI(documentId, {
                action: aiAction,
                selectedText: selectedText || aiPrompt,
                prompt: aiPrompt,
            });

            const result =
                response?.completion ||
                response?.result ||
                response?.text ||
                "";

            if (!result) {
                throw new Error(
                    "The AI service returned an empty response."
                );
            }

            setAiResult(result);
        } catch (error) {
            setAiError(
                error?.response?.data?.message ||
                error?.message ||
                "Unable to generate AI response."
            );
        } finally {
            setAiLoading(false);
        }
    };

    const replaceSelection = () => {
        if (!editor || !aiResult) return;

        const { from, to } = editor.state.selection;

        editor
            .chain()
            .focus()
            .insertContentAt({ from, to }, aiResult)
            .run();

        setAiOpen(false);
        setAiResult("");
    };

    const insertAtCursor = () => {
        if (!editor || !aiResult) return;

        editor
            .chain()
            .focus()
            .insertContent(aiResult)
            .run();

        setAiOpen(false);
        setAiResult("");
    };

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
                aria-busy="true"
            >
                <div className="h-6 w-1/3 rounded bg-[#355574]" />
                <div className="mt-6 h-64 rounded bg-[#102D4B]" />
            </div>
        );
    }
    void toolbarVersion;

    const connectionLabel = {
        connected: "Live connection",
        connecting: "Connecting...",
        disconnected: "Offline",
        error: "Connection issue",
    }[socketStatus] || "Connection unavailable";

    const runCommand = (callback) => {
        if (!canWrite || !editor) return;
        callback();
    };

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

                            {canWrite && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setAiOpen((value) => !value);
                                        setAiError("");
                                    }}
                                    className="min-h-9 rounded-lg border border-[#52789E] bg-[#102D4B] px-3 text-sm font-medium text-[#D8E7F8] hover:bg-[#24476B]"
                                >
                                    <span className="inline-flex items-center gap-2">
                                        <FiMessageSquare />
                                        AI Assistant
                                    </span>
                                </button>
                            )}

                            {canWrite && onShare && (
                                <button
                                    type="button"
                                    onClick={() => onShare(document)}
                                    className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-[#2878E8] px-3 text-sm font-semibold text-white hover:bg-[#3D8BFA]"
                                >
                                    <FiShare2 />
                                    Share
                                </button>
                            )}
                        </div>
                    </header>
                    <div className="flex flex-wrap items-center gap-1 border-b border-[#355D83] bg-[#102D4B]/70 px-3 py-2">

                        <ToolbarButton
                            label="Bold"
                            active={editor.isActive("bold")}
                            disabled={!canWrite}
                            onClick={() => runCommand(toggleBold)}
                        >
                            <FiBold />
                        </ToolbarButton>

                        <ToolbarButton
                            label="Italic"
                            active={editor.isActive("italic")}
                            disabled={!canWrite}
                            onClick={() => runCommand(toggleItalic)}
                        >
                            <FiItalic />
                        </ToolbarButton>

                        <span className="mx-1 h-6 w-px bg-[#355D83]" />

                        <ToolbarButton
                            label="Heading 1"
                            active={editor.isActive("heading", { level: 1 })}
                            disabled={!canWrite}
                            onClick={() => runCommand(() => toggleHeading(1))}
                        >
                            H1
                        </ToolbarButton>

                        <ToolbarButton
                            label="Heading 2"
                            active={editor.isActive("heading", { level: 2 })}
                            disabled={!canWrite}
                            onClick={() => runCommand(() => toggleHeading(2))}
                        >
                            H2
                        </ToolbarButton>

                        <ToolbarButton
                            label="Heading 3"
                            active={editor.isActive("heading", { level: 3 })}
                            disabled={!canWrite}
                            onClick={() => runCommand(() => toggleHeading(3))}
                        >
                            H3
                        </ToolbarButton>

                        <span className="mx-1 h-6 w-px bg-[#355D83]" />

                        <ToolbarButton
                            label="Bullet list"
                            active={editor.isActive("bulletList")}
                            disabled={!canWrite}
                            onClick={() => runCommand(toggleBulletList)}
                        >
                            <FiList />
                        </ToolbarButton>

                        <ToolbarButton
                            label="Numbered list"
                            active={editor.isActive("orderedList")}
                            disabled={!canWrite}
                            onClick={() => runCommand(toggleOrderedList)}
                        >
                            <FiAlignLeft />
                            <span className="text-[10px] font-bold">1.</span>
                        </ToolbarButton>

                        <span className="mx-1 h-6 w-px bg-[#355D83]" />

                        <ToolbarButton
                            label="Blockquote"
                            active={editor.isActive("blockquote")}
                            disabled={!canWrite}
                            onClick={() => runCommand(toggleBlockquote)}
                        >
                            <FiMessageSquare />
                        </ToolbarButton>

                        <ToolbarButton
                            label="Code block"
                            active={editor.isActive("codeBlock")}
                            disabled={!canWrite}
                            onClick={() => runCommand(toggleCodeBlock)}
                        >
                            <FiCode />
                        </ToolbarButton>

                        <ToolbarButton
                            label="Horizontal divider"
                            disabled={!canWrite}
                            onClick={() => runCommand(insertDivider)}
                        >
                            <FiMinus />
                        </ToolbarButton>

                        <span className="mx-1 h-6 w-px bg-[#355D83]" />

                        <ToolbarButton
                            label="Undo"
                            disabled={!canWrite || !editor.can().undo()}
                            onClick={() => runCommand(undo)}
                        >
                            <FiRotateCcw />
                        </ToolbarButton>

                        <ToolbarButton
                            label="Redo"
                            disabled={!canWrite || !editor.can().redo()}
                            onClick={() => runCommand(redo)}
                        >
                            <FiRotateCw />
                        </ToolbarButton>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-b border-[#355D83] px-4 py-2 text-xs">
                        <span
                            className={
                                socketStatus === "connected"
                                    ? "text-emerald-300"
                                    : "text-amber-200"
                            }
                        >
                            {canWrite ? connectionLabel : "Read-only"}
                        </span>

                        <span className="text-[#A9BED6]">
                            {canWrite
                                ? "Changes sync through live connection"
                                : "You have read-only access"}
                        </span>
                    </div>

                    {socketStatus === "error" && socketError && canWrite && (
                        <div
                            role="status"
                            className="border-b border-amber-300/20 bg-amber-400/10 px-4 py-2 text-xs text-amber-100"
                        >
                            {socketError}
                        </div>
                    )}

                    {/* Editor body */}
                    <div className="min-h-[480px] min-w-0 flex-1 overflow-y-auto bg-[#102842]/65">
                        <EditorContent editor={editor} />
                    </div>

                    {/* AI Assistant */}
                    {aiOpen && canWrite && (
                        <section className="border-t border-[#355D83] bg-[#102D4B] p-4">

                            <div className="mb-3 flex items-center justify-between">
                                <h3 className="font-semibold text-white">
                                    AI writing assistant
                                </h3>

                                <button
                                    type="button"
                                    onClick={() => setAiOpen(false)}
                                    className="text-xs text-[#A9BED6] hover:text-white"
                                >
                                    Close
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {[
                                    ["summarize", "Summarize"],
                                    ["rewrite", "Rewrite"],
                                    ["expand", "Expand"],
                                    ["fix_grammar", "Fix grammar"],
                                    ["action_items", "Action items"],
                                    ["custom", "Custom"],
                                ].map(([value, label]) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => {
                                            setAiAction(value);
                                            setAiResult("");
                                            setAiError("");
                                        }}
                                        className={`rounded-lg border px-3 py-2 text-xs ${
                                            aiAction === value
                                                ? "border-[#55A0FF] bg-[#2878D5] text-white"
                                                : "border-[#52789E] text-[#D8E7F8] hover:bg-[#24476B]"
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>

                            {aiAction === "custom" && (
                                <textarea
                                    value={aiPrompt}
                                    onChange={(event) =>
                                        setAiPrompt(event.target.value)
                                    }
                                    placeholder="Tell the AI what to do..."
                                    rows={3}
                                    className="mt-3 w-full rounded-lg border border-[#52789E] bg-[#142B45] p-3 text-sm text-white outline-none focus:border-[#55A0FF]"
                                />
                            )}

                            {aiError && (
                                <p
                                    role="alert"
                                    className="mt-3 text-xs text-red-300"
                                >
                                    {aiError}
                                </p>
                            )}

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    disabled={aiLoading}
                                    onClick={handleAI}
                                    className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-[#2878E8] px-4 text-sm font-semibold text-white disabled:opacity-50"
                                >
                                    {aiLoading && (
                                        <FiRefreshCw className="animate-spin" />
                                    )}

                                    {aiLoading
                                        ? "Generating..."
                                        : "Generate"}
                                </button>

                                <span className="text-xs text-[#A9BED6]">
                                    Select text in the document before generating.
                                </span>
                            </div>

                            {aiResult && (
                                <div className="mt-4 rounded-lg border border-[#52789E] bg-[#142B45] p-3">
                                    <p className="mb-2 text-xs font-semibold text-[#8CC4FF]">
                                        AI result
                                    </p>

                                    <div className="max-h-56 overflow-y-auto whitespace-pre-wrap text-sm text-[#EAF2FF]">
                                        {aiResult}
                                    </div>

                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={replaceSelection}
                                            className="rounded-lg bg-[#2878E8] px-3 py-2 text-xs font-semibold text-white"
                                        >
                                            Replace selection
                                        </button>

                                        <button
                                            type="button"
                                            onClick={insertAtCursor}
                                            className="rounded-lg border border-[#52789E] px-3 py-2 text-xs text-white"
                                        >
                                            Insert at cursor
                                        </button>
                                    </div>
                                </div>
                            )}
                        </section>
                    )}
                    <footer className="border-t border-[#355D83] px-4 py-2 text-xs text-[#A9BED6]">
                        {canWrite
                            ? "Your document changes are synchronized through the live document connection."
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
