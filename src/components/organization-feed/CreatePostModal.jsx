
import { useState } from "react";
import { createOrganizationPost } from "../../services/organizationFeedService";

export default function CreatePostModal({
    organizationId,
    role,
    teams = [],
    onClose,
    onCreated,
}) {
    const isAdmin = ["ORG_ADMIN", "TEAM_HEAD"].includes(
        String(role || "").toUpperCase()
    );

    const [type, setType] = useState("GENERAL");
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [targetTeamId, setTargetTeamId] = useState("");
    const [targetUserId, setTargetUserId] = useState("");
    const [file, setFile] = useState(null);
    const [isPinned, setIsPinned] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!content.trim() && !file) {
            setError("Please enter a message or attach a file.");
            return;
        }

        if (type === "MILESTONE" && !targetTeamId) {
            setError("Please select a team for the team spotlight.");
            return;
        }

        if (type === "BIRTHDAY" && !targetUserId.trim()) {
            setError("Please enter the member ID.");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const payload = new FormData();
            payload.append("category", type);

            if (title.trim()) payload.append("title", title.trim());
            if (content.trim()) payload.append("content", content.trim());
            if (file) payload.append("file", file);

            if (type === "MILESTONE" && targetTeamId) {
                payload.append("targetTeamId", targetTeamId);
            }

            if (type === "BIRTHDAY" && targetUserId.trim()) {
                payload.append("targetUserId", targetUserId.trim());
                payload.append("mentionedUserIds", JSON.stringify([targetUserId.trim()]));
            }

            if (isPinned) payload.append("isPinned", "true");

            await createOrganizationPost(organizationId, payload);
            onCreated();
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                err?.message ||
                "Unable to create post."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
           <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden rounded-2xl border border-white/15 bg-[#172438] p-6">
                <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white">
                        Create Organization Post
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-xl text-white"
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-2 block text-sm text-[#D0E1F3]">
                            Post type
                        </label>
                        <select
                            value={type}
                            onChange={(event) => setType(event.target.value)}
                            className="w-full rounded-xl border border-white/15 bg-[#25364D] px-4 py-3 text-white"
                        >
                            <option value="GENERAL">General Update</option>
                            {isAdmin && (
                                <>
                                    <option value="FESTIVAL">Festival</option>
                                    <option value="ANNOUNCEMENT">Official Announcement</option>
                                </>
                            )}
                            <option value="MILESTONE">Team Spotlight / Milestone</option>
                            <option value="BIRTHDAY">Birthday / Member Spotlight</option>
                            <option value="PROMOTION">Promotion</option>
                        </select>
                    </div>

                    {type === "MILESTONE" && (
                        <div>
                            <label className="mb-2 block text-sm text-[#D0E1F3]">
                                Select team
                            </label>
                            <select
                                value={targetTeamId}
                                onChange={(event) => setTargetTeamId(event.target.value)}
                                className="w-full rounded-xl border border-white/15 bg-[#25364D] px-4 py-3 text-white"
                            >
                                <option value="">Choose a team</option>
                                {teams.map((team) => {
                                    const id = team._id || team.id;
                                    return (
                                        <option key={id} value={id}>
                                            {team.name}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                    )}

                    {type === "BIRTHDAY" && (
                        <div>
                            <label className="mb-2 block text-sm text-[#D0E1F3]">
                                Member ID
                            </label>
                            <input
                                value={targetUserId}
                                onChange={(event) => setTargetUserId(event.target.value)}
                                placeholder="Enter the member's user ID"
                                className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white"
                            />
                        </div>
                    )}

                    <div>
                        <label className="mb-2 block text-sm text-[#D0E1F3]">
                            Title (optional)
                        </label>
                        <input
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            placeholder="Enter post title"
                            className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-[#D0E1F3]">
                            Message
                        </label>
                        <textarea
                            value={content}
                            onChange={(event) => setContent(event.target.value)}
                            rows={5}
                            placeholder="Share something with your organization..."
                            className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white outline-none"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-[#D0E1F3]">
                            Attachment (optional)
                        </label>
                        <input
                            type="file"
                            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
                            onChange={(event) => setFile(event.target.files?.[0] || null)}
                            className="w-full text-sm text-[#D0E1F3]"
                        />
                        {file && (
                            <p className="mt-1 text-xs text-sky-300">
                                Selected: {file.name}
                            </p>
                        )}
                    </div>

                    {isAdmin && (
                        <label className="flex items-center gap-2 text-sm text-white">
                            <input
                                type="checkbox"
                                checked={isPinned}
                                onChange={(event) => setIsPinned(event.target.checked)}
                            />
                            Pin this post
                        </label>
                    )}

                    {error && (
                        <p className="text-sm text-red-300">{error}</p>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-white/20 px-4 py-2 text-white"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-xl bg-blue-600 px-5 py-2 font-semibold text-white disabled:opacity-50"
                        >
                            {loading ? "Publishing..." : "Publish"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
