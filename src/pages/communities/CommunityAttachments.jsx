import { useEffect, useState } from "react";

const MAX_SIZE = 26214400; 

export function formatSize(bytes = 0) {
    if (!bytes || isNaN(bytes)) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function getFileType(file) {
    if (!file) return "file";
    if (file.type?.startsWith("image/")) return "image";

    const documentExtensions = [
        "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv", "rtf",
    ];
    const extension = file.name?.split(".").pop()?.toLowerCase();

    return documentExtensions.includes(extension) ? "document" : "file";
}

export function PostAttachment({ fileUrl, fileType, fileName, fileSize, onRemove, canRemove = false }) {
    if (!fileUrl) return null;

    const isImage = fileType === "image" || /\.(jpeg|jpg|png|gif|webp|svg)$/i.test(fileUrl || "");
    const isDoc = fileType === "document" || /\.(pdf|docx?|xlsx?|pptx?|txt)$/i.test(fileUrl || "");

    return (
        <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
            {isImage ? (
                <div className="group relative max-h-96 overflow-hidden bg-black/20">
                    <img
                        src={fileUrl}
                        alt={fileName || "Post attachment"}
                        loading="lazy"
                        className="max-h-96 w-full object-contain transition group-hover:scale-[1.01]"
                    />
                    <div className="flex items-center justify-between border-t border-white/10 bg-[#071B35]/90 p-2.5 text-xs text-blue-100">
                        <span className="truncate">{fileName || "Image"}</span>
                        <div className="flex items-center gap-3">
                            {fileSize && <span>{formatSize(fileSize)}</span>}
                            <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={fileName || true}
                                className="font-semibold text-blue-300 hover:text-white"
                            >
                                Open ↗
                            </a>
                            {canRemove && (
                                <button
                                    type="button"
                                    onClick={onRemove}
                                    className="text-red-300 hover:text-red-200"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-between gap-3 p-3 text-sm">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-500/20 text-xl text-blue-200">
                            {isDoc ? "📄" : "📁"}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-white">{fileName || "Attached file"}</p>
                            <p className="mt-0.5 text-xs text-blue-100/60">
                                {fileType || (isDoc ? "document" : "file")}
                                {fileSize ? ` · ${formatSize(fileSize)}` : ""}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={fileName || true}
                            className="rounded-lg bg-blue-500/20 px-3 py-1.5 text-xs font-semibold text-blue-200 transition hover:bg-blue-500/30 hover:text-white"
                        >
                            Download ↓
                        </a>
                        {canRemove && (
                            <button
                                type="button"
                                onClick={onRemove}
                                className="rounded-lg px-2 py-1.5 text-xs text-red-300 hover:bg-red-500/10"
                            >
                                Remove
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function CommunityAttachments({
    value = null,
    onChange,
    disabled = false,
}) {
    const [error, setError] = useState("");
    const [previewUrl, setPreviewUrl] = useState("");

    useEffect(() => {
        if (!value?.file) {
            setPreviewUrl(value?.fileUrl || "");
            return;
        }

        const url = URL.createObjectURL(value.file);
        setPreviewUrl(url);

        return () => URL.revokeObjectURL(url);
    }, [value]);

    function handleFile(event) {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;

        setError("");

        if (file.size <= 0) {
            setError("This file is empty.");
            return;
        }

        if (file.size > MAX_SIZE) {
            setError("File exceeds the 25 MiB limit (max 26,214,400 bytes).");
            return;
        }

        onChange?.({
            file,
            fileUrl: null,
            fileType: getFileType(file),
            fileName: file.name,
            fileSize: file.size,
        });
    }

    function removeAttachment() {
        setError("");
        onChange?.(null);
    }

    return (
        <div className="space-y-3">
            {value ? (
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
                    {value.fileType === "image" && previewUrl ? (
                        <img
                            src={previewUrl}
                            alt="Selected attachment preview"
                            className="h-16 w-16 rounded-lg object-cover"
                        />
                    ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-400/10 text-xl text-blue-200">
                            {value.fileType === "document" ? "▤" : "↗"}
                        </div>
                    )}

                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">
                            {value.fileName}
                        </p>
                        <p className="mt-1 text-xs text-blue-100/60">
                            {value.fileType} · {formatSize(value.fileSize)}
                        </p>
                    </div>

                    <button
                        type="button"
                        disabled={disabled}
                        onClick={removeAttachment}
                        className="rounded-lg px-3 py-2 text-sm text-red-200 hover:bg-red-500/10 disabled:opacity-50"
                    >
                        Remove
                    </button>
                </div>
            ) : (
                <label className={`flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-white/20 bg-white/[0.025] p-4 transition hover:border-blue-300/50 hover:bg-blue-400/[0.05] ${disabled ? "pointer-events-none opacity-50" : ""}`}>
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-400/10 text-xl text-blue-200">
                        ↥
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-white">
                            Attach a file
                        </span>
                        <span className="mt-1 block text-xs text-blue-100/55">
                            Images, documents or files · Max 25 MiB
                        </span>
                    </span>
                    <input
                        type="file"
                        disabled={disabled}
                        onChange={handleFile}
                        className="sr-only"
                    />
                </label>
            )}

            {error && (
                <p role="alert" className="text-sm text-red-200">{error}</p>
            )}
        </div>
    );
}
