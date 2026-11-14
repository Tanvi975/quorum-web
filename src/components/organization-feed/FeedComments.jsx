
import { useCallback, useEffect, useState } from "react";
import {
    createPostComment,
    getPostComments,
} from "../../services/organizationFeedService";

export default function FeedComments({ organizationId, postId }) {
    const [comments, setComments] = useState([]);
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");

    const loadComments = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await getPostComments(
                organizationId,
                postId,
                { limit: 20 }
            );

            const result = response?.data;
            setComments(
                Array.isArray(result?.comments)
                    ? result.comments
                    : Array.isArray(result)
                        ? result
                        : []
            );
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                "Unable to load comments."
            );
        } finally {
            setLoading(false);
        }
    }, [organizationId, postId]);

    useEffect(() => {
        loadComments();
    }, [loadComments]);


    const handleSubmit = async (event) => {
        event.preventDefault();
    
        if (!content.trim()) return;
    
        try {
            setSending(true);
            setError("");
    
            await createPostComment(
                organizationId,
                postId,
                content.trim()
            );
    
            setContent("");
            await loadComments();
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                "Unable to add comment."
            );
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="mt-4 border-t border-white/10 pt-4">
            <h4 className="mb-3 font-semibold text-white">Comments</h4>

            <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    placeholder="Write a comment..."
                    className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm text-white outline-none"
                />
                <button
                    type="submit"
                    disabled={sending || !content.trim()}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                    {sending ? "Sending..." : "Send"}
                </button>
            </form>

            {error && (
                <p className="mt-3 text-sm text-red-300">{error}</p>
            )}

            {loading ? (
                <p className="mt-4 text-sm text-[#B6C6D9]">
                    Loading comments...
                </p>
            ) : comments.length === 0 ? (
                <p className="mt-4 text-sm text-[#B6C6D9]">
                    No comments yet. Start the conversation.
                </p>
            ) : (
                <div className="mt-4 space-y-3">
                    {comments.map((comment) => (
                        <div
                            key={comment.id || comment._id}
                            className="rounded-xl bg-white/5 p-3"
                        >
                            <p className="text-sm font-semibold text-white">
                                {comment.author?.name || comment.user?.name || "Member"}
                            </p>
                            <p className="mt-1 whitespace-pre-wrap text-sm text-[#D0E1F3]">
                                {comment.content}
                            </p>
                            {comment.createdAt && (
                                <p className="mt-2 text-xs text-[#8FA5BF]">
                                    {new Date(comment.createdAt).toLocaleString()}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
