
import { useState } from "react";
import {
    deleteOrganizationPost,
    togglePostPin,
    togglePostReaction,
} from "../../services/organizationFeedService";
import FeedComments from "./FeedComments";
import ConfirmDialog from "../ConfirmDialog";

const reactions = ["👍", "❤️", "🎉", "👏", "🔥"];

export default function FeedPostCard({
    post,
    organizationId,
    role,
    onPostUpdated,
    onPostDeleted,
}) {
    const [showComments, setShowComments] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const isAdmin = ["ORG_ADMIN", "TEAM_HEAD"].includes(
        String(role || "").toUpperCase()
    );

    const handleReaction = async (emoji) => {
        try {
            setBusy(true);
            setError("");

            const response = await togglePostReaction(
                organizationId,
                post.id,
                emoji
            );

            const updatedReactions = response?.data?.reactions;
            if (updatedReactions) {
                onPostUpdated({
                    ...post,
                    reactions: updatedReactions,
                });
            }
        } catch (err) {
            setError(err?.response?.data?.message || "Reaction failed.");
        } finally {
            setBusy(false);
        }
    };

    const handlePin = async () => {
        try {
            setBusy(true);
            setError("");

            const response = await togglePostPin(organizationId, post.id);
            const updatedPost = response?.data?.post;

            onPostUpdated(
                updatedPost || {
                    ...post,
                    isPinned: !post.isPinned,
                }
            );
        } catch (err) {
            setError(err?.response?.data?.message || "Unable to update pin.");
        } finally {
            setBusy(false);
        }
    };

    const handleDelete = async () => {
        try {
            setBusy(true);
            setError("");

            await deleteOrganizationPost(organizationId, post.id);

            onPostDeleted(post.id);
            setShowDeleteDialog(false);
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                "Unable to delete post."
            );
        } finally {
            setBusy(false);
        }
    };

    const date = post.createdAt
        ? new Date(post.createdAt).toLocaleString()
        : "";

    return (
        <article className="rounded-2xl border border-white/15 bg-white/[0.07] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    {post.author?.avatar ? (
                        <img
                            src={post.author.avatar}
                            alt=""
                            className="h-10 w-10 rounded-full object-cover"
                        />
                    ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">
                            {(post.author?.name || "U").charAt(0).toUpperCase()}
                        </div>
                    )}

                    <div>
                        <p className="font-semibold text-white">
                            {post.author?.name || "Organization member"}
                        </p>
                        <p className="text-xs text-[#B6C6D9]">{date}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs text-sky-300">
                        {post.category}
                    </span>
                    {post.isPinned && (
                        <span className="text-xs text-amber-300">
                            📌 Pinned
                        </span>
                    )}
                </div>
            </div>

            {post.targetTeam?.name && (
                <p className="mt-3 text-xs text-sky-300">
                    Team spotlight: {post.targetTeam.name}
                </p>
            )}

            {post.title && (
                <h3 className="mt-4 text-lg font-semibold text-white">
                    {post.title}
                </h3>
            )}

            {post.content && (
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#D0E1F3]">
                    {post.content}
                </p>
            )}

            {post.fileUrl && (
                post.fileType === "image" ? (
                    <img
                        src={post.fileUrl}
                        alt={post.fileName || "Post attachment"}
                        className="mt-4 max-h-96 w-full rounded-xl object-contain"
                    />
                ) : (
                    <a
                        href={post.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-block text-sm text-sky-300 underline"
                    >
                        Open attachment: {post.fileName || "View file"}
                    </a>
                )
            )}

            {error && (
                <p className="mt-3 text-sm text-red-300">{error}</p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
                {reactions.map((emoji) => {
                    const reaction = post.reactions?.find(
                        (item) => item.emoji === emoji
                    );

                    return (
                        <button
                            key={emoji}
                            type="button"
                            disabled={busy}
                            onClick={() => handleReaction(emoji)}
                            className={`rounded-lg border px-3 py-1.5 text-sm ${
                                reaction?.reactedByMe
                                    ? "border-blue-400 bg-blue-500/20"
                                    : "border-white/15 bg-white/5"
                            } text-white disabled:opacity-50`}
                        >
                            {emoji} {reaction?.count || ""}
                        </button>
                    );
                })}

                <button
                    type="button"
                    onClick={() => setShowComments((value) => !value)}
                    className="ml-auto text-sm text-[#B6C6D9] hover:text-white"
                >
                    💬 {post.commentCount || 0} Comments
                </button>

                {isAdmin && (
                    <button
                        type="button"
                        disabled={busy}
                        onClick={handlePin}
                        className="text-sm text-amber-300 disabled:opacity-50"
                    >
                        {post.isPinned ? "Unpin" : "Pin"}
                    </button>
                )}

                {isAdmin && (
                    <button
                        type="button"
                        disabled={busy}
                        onClick={() => setShowDeleteDialog(true)}
                        className="text-sm text-red-300 disabled:opacity-50"
                    >
                        Delete
                    </button>
                )}
            </div>

            {showComments && (
                <FeedComments
                    organizationId={organizationId}
                    postId={post.id}
                />
            )}

            <ConfirmDialog
                open={showDeleteDialog}
                type="delete"
                title="Delete this post?"
                message="Are you sure you want to delete this post? This action cannot be undone."
                confirmText="Delete Post"
                onConfirm={handleDelete}
                onCancel={() => setShowDeleteDialog(false)}
                loading={busy}
            />
        </article>
    );
}
