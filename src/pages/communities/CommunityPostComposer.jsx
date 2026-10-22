import { useState } from "react";
import CommunityAttachments from "./CommunityAttachments";
import { uploadAttachment } from "../../services/communityService";

export default function CommunityPostComposer({
    selectedChannelId = null,
    channelName = "",
    onSubmit,
    disabled = false,
}) {
    const [content, setContent] = useState("");
    const [attachment, setAttachment] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [error, setError] = useState("");

    async function handleSubmit(event) {
        event.preventDefault();

        if (submitting || disabled) return;

        const text = content.trim();

        if (!text && !attachment) {
            setError("Write something or attach a file before publishing.");
            return;
        }

        if (text.length > 10000) {
            setError("Your post must be 10,000 characters or fewer.");
            return;
        }

        setSubmitting(true);
        setError("");

        try {
            let uploadedMeta = null;

            if (attachment?.file && !attachment.fileUrl) {
                setStatusMessage("Uploading attachment to secure storage…");
                uploadedMeta = await uploadAttachment(attachment.file);
            } else if (attachment?.fileUrl) {
                uploadedMeta = {
                    fileUrl: attachment.fileUrl,
                    fileType: attachment.fileType,
                    fileName: attachment.fileName,
                    fileSize: attachment.fileSize,
                };
            }

            setStatusMessage("Publishing post…");

            await onSubmit?.({
                content: text,
                ...(selectedChannelId ? { channelId: selectedChannelId } : {}),
                ...(uploadedMeta
                    ? {
                          fileUrl: uploadedMeta.fileUrl,
                          fileType: uploadedMeta.fileType,
                          fileName: uploadedMeta.fileName,
                          fileSize: uploadedMeta.fileSize,
                      }
                    : {}),
            });

            setContent("");
            setAttachment(null);
            setStatusMessage("");
        } catch (err) {
            console.error("Post creation error:", err);
            setError(
                err.response?.data?.message ||
                err.message ||
                "Could not publish your post."
            );
        } finally {
            setSubmitting(false);
            setStatusMessage("");
        }
    }

    return (
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0C2D58] to-[#071B35] text-white shadow-xl">
            <div className="border-b border-white/10 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">
                    Community feed
                </p>
                <h2 className="mt-1 text-lg font-bold">Start a discussion</h2>
                <p className="mt-1 text-sm text-blue-100/60">
                    {channelName
                        ? `Publishing to #${channelName}`
                        : "Share an update, link or file with your community."}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-5">
                <textarea
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    maxLength={10000}
                    rows={4}
                    disabled={disabled || submitting}
                    placeholder="What would you like to share with the community?"
                    className="w-full resize-y rounded-xl border border-white/10 bg-[#06172E]/80 px-4 py-4 text-sm leading-6 text-white outline-none placeholder:text-blue-100/35 focus:border-blue-300/60 disabled:opacity-50"
                />

                <div className="flex justify-end">
                    <span className={`text-xs ${content.length > 9500 ? "text-amber-200" : "text-blue-100/45"}`}>
                        {content.length.toLocaleString()} / 10,000
                    </span>
                </div>

                <CommunityAttachments
                    value={attachment}
                    onChange={setAttachment}
                    disabled={disabled || submitting}
                />

                {statusMessage && (
                    <p className="text-xs font-medium text-blue-200 animate-pulse">
                        {statusMessage}
                    </p>
                )}

                {error && (
                    <p role="alert" className="rounded-xl border border-red-300/20 bg-red-500/10 p-3 text-sm text-red-200">
                        {error}
                    </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                    <span className="text-xs text-blue-100/50">
                        Images, documents and files supported · Max 25 MiB
                    </span>
                    <button
                        type="submit"
                        disabled={disabled || submitting || (!content.trim() && !attachment)}
                        className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-5 py-3 text-sm font-bold shadow-lg shadow-blue-950/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {submitting ? "Publishing…" : "Publish post →"}
                    </button>
                </div>
            </form>
        </section>
    );
}
