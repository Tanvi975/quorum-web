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
            setError("Please write a post or attach a file.");
            return;
        }

        if (text.length > 20000) {
            setError("Your post must be 20,000 characters or fewer.");
            return;
        }

        setSubmitting(true);
        setError("");

        try {
            let uploadedMeta = null;

            if (attachment?.file && !attachment.fileUrl) {
                setStatusMessage("Uploading attachment...");
                uploadedMeta = await uploadAttachment(attachment.file);
            } else if (attachment?.fileUrl) {
                uploadedMeta = {
                    fileUrl: attachment.fileUrl,
                    fileType: attachment.fileType,
                    fileName: attachment.fileName,
                    fileSize: attachment.fileSize,
                };
            }

            setStatusMessage("Publishing post...");

            await onSubmit?.({
                content: text,
                ...(selectedChannelId
                    ? { channelId: selectedChannelId }
                    : {}),
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
            setError("Could not publish your post. Please try again.");
        } finally {
            setSubmitting(false);
            setStatusMessage("");
        }
    }

    return (
        <section className="overflow-hidden rounded-2xl border border-white/20 bg-[#2A4F74]/95 text-white shadow-lg">
            <div className="border-b border-white/15 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
                    Community feed
                </p>

                <h2 className="mt-1 text-lg font-bold text-white">
                    Start a discussion
                </h2>

                <p className="mt-1 text-sm text-blue-100/80">
                    {channelName
                        ? `Publishing to #${channelName}`
                        : "Share an update, link or file with your community."}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 bg-[#365F86]/60 p-5">
                <textarea
                    value={content}
                    onChange={(event) => {
                        setContent(event.target.value);
                        if (error) setError("");
                    }}
                    maxLength={20000}
                    rows={4}
                    disabled={disabled || submitting}
                    placeholder="What would you like to share with the community?"
                    className="max-h-40 w-full resize-y overflow-y-auto rounded-xl border border-white/20 bg-[#214B73] px-4 py-4 text-sm leading-6 text-white outline-none placeholder:text-blue-100/65 focus:border-blue-300 focus:ring-2 focus:ring-blue-300/20 disabled:opacity-50"
                />

                <div className="flex justify-end">
                    <span
                        className={`text-xs ${
                            content.length > 19000
                                ? "text-amber-200"
                                : "text-blue-100/75"
                        }`}
                    >
                        {content.length.toLocaleString()} / 20,000
                    </span>
                </div>

                <CommunityAttachments
                    value={attachment}
                    onChange={setAttachment}
                    disabled={disabled || submitting}
                />

                {statusMessage && (
                    <p
                        role="status"
                        className="animate-pulse text-xs font-medium text-blue-100"
                    >
                        {statusMessage}
                    </p>
                )}

                {error && (
                    <p role="alert" className="text-sm text-red-300">
                        {error}
                    </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/20 pt-4">
                    <span className="text-xs text-blue-100/75">
                        Images, documents and files supported · Max 25 MiB
                    </span>

                    <button
                        type="submit"
                        disabled={
                            disabled ||
                            submitting ||
                            (!content.trim() && !attachment)
                        }
                        className="rounded-xl bg-[#0068FF] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-950/30 transition hover:bg-[#1678FF] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {submitting ? "Publishing..." : "Publish post →"}
                    </button>
                </div>
            </form>
        </section>
    );
                    }