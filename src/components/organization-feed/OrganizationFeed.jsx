
import { useCallback, useEffect, useState } from "react";
import { getOrganizationFeed } from "../../services/organizationFeedService";
import FeedPostCard from "./FeedPostCard";
import CreatePostModal from "./CreatePostModal";

const categories = [
    { label: "All", value: "" },
    { label: "Festivals", value: "FESTIVAL" },
    { label: "Announcements", value: "ANNOUNCEMENT" },
    { label: "Milestones", value: "MILESTONE" },
    { label: "Birthdays", value: "BIRTHDAY" },
    { label: "Pinned", value: "PINNED" },
];

export default function OrganizationFeed({
    organizationId,
    role,
    teams = [],
}) {
    const [posts, setPosts] = useState([]);
    const [category, setCategory] = useState("");
    const [search, setSearch] = useState("");
    const [teamId, setTeamId] = useState("");
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState("");
    const [nextCursor, setNextCursor] = useState(null);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const canPostOfficial = ["ORG_ADMIN", "TEAM_HEAD"].includes(
        String(role || "").toUpperCase()
    );

    const loadFeed = useCallback(async (reset = true) => {
        if (!organizationId) return;

        try {
            setError("");
            reset ? setLoading(true) : setLoadingMore(true);

            const params = {
                limit: 20,
                ...(category && category !== "PINNED" ? { category } : {}),
                ...(category === "PINNED" ? { pinnedOnly: true } : {}),
                ...(teamId ? { teamId } : {}),
                ...(search.trim() ? { search: search.trim() } : {}),
                ...(!reset && nextCursor ? { cursor: nextCursor } : {}),
            };

            const response = await getOrganizationFeed(organizationId, params);
            const result = response?.data;

            if (!result || !Array.isArray(result.posts)) {
                throw new Error("Invalid feed response.");
            }

            setPosts((previous) =>
                reset ? result.posts : [...previous, ...result.posts]
            );
            setNextCursor(result.nextCursor || null);
            setHasNextPage(Boolean(result.hasNextPage));
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                err?.message ||
                "Unable to load organization feed."
            );
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [organizationId, category, search, teamId, nextCursor]);

    useEffect(() => {
        const timer = setTimeout(() => loadFeed(true), 300);
        return () => clearTimeout(timer);
    }, [organizationId, category, search, teamId]);

    const refreshFeed = () => loadFeed(true);

    const handlePostCreated = () => {
        setShowCreateModal(false);
        loadFeed(true);
    };

    const handlePostUpdated = (updatedPost) => {
        setPosts((previous) =>
            previous.map((post) =>
                post.id === updatedPost.id ? updatedPost : post
            )
        );
    };

    const handlePostDeleted = (postId) => {
        setPosts((previous) =>
            previous.filter((post) => post.id !== postId)
        );
    };

    return (
        <section className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-semibold text-white">
                        Organization Feed
                    </h2>
                    <p className="mt-1 text-sm text-[#B6C6D9]">
                        Updates, achievements and celebrations.
                    </p>
                </div>

                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={refreshFeed}
                        className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm text-white"
                    >
                        Refresh
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowCreateModal(true)}
                        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                    >
                        + New Post
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                {categories.map((item) => (
                    <button
                        key={item.value}
                        type="button"
                        onClick={() => setCategory(item.value)}
                        className={`rounded-lg px-4 py-2 text-sm ${
                            category === item.value
                                ? "bg-blue-600 text-white"
                                : "border border-white/15 bg-white/5 text-white"
                        }`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search posts..."
                    className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white outline-none"
                />

                <select
                    value={teamId}
                    onChange={(event) => setTeamId(event.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-[#212F44] px-4 py-3 text-sm text-white"
                >
                    <option value="">All teams</option>
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

            {loading ? (
                <p className="py-12 text-center text-[#B6C6D9]">
                    Loading organization feed...
                </p>
            ) : error ? (
                <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-5 text-sm text-red-100">
                    {error}
                    <button onClick={refreshFeed} className="ml-3 underline">
                        Retry
                    </button>
                </div>
            ) : posts.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/5 p-10 text-center">
                    <h3 className="font-semibold text-white">No posts yet</h3>
                    <p className="mt-2 text-sm text-[#B6C6D9]">
                        Be the first to share an update with your organization.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {posts.map((post) => (
                        <FeedPostCard
                            key={post.id}
                            post={post}
                            organizationId={organizationId}
                            role={role}
                            onPostUpdated={handlePostUpdated}
                            onPostDeleted={handlePostDeleted}
                        />
                    ))}
                </div>
            )}

            {!loading && !error && hasNextPage && (
                <button
                    type="button"
                    onClick={() => loadFeed(false)}
                    disabled={loadingMore}
                    className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                    {loadingMore ? "Loading..." : "Load more"}
                </button>
            )}

            {showCreateModal && (
                <CreatePostModal
                    organizationId={organizationId}
                    role={role}
                    teams={teams}
                    onClose={() => setShowCreateModal(false)}
                    onCreated={handlePostCreated}
                />
            )}
        </section>
    );
}
