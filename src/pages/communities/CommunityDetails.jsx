
import { useNavigate, useParams } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import CommunityChannels from "./CommunityChannels";
import CommunityPostComposer from "./CommunityPostComposer";
import CommunityInvitations from "./CommunityInvitations";
import { PostAttachment } from "./CommunityAttachments";
import {
    getCommunityDetails,
    getCommunityMembers,
    getCommunityPosts,
    getCommunityChannelPosts,
    createCommunityPost,
    updateCommunityPost,
    deleteCommunityPost,
    getPostComments,
    createPostComment,
    updatePostComment,
    deletePostComment,
    searchCommunityUsers,
    removeCommunityMember,
    leaveCommunity,
    updateCommunity,
    deleteCommunity,
    updateCommunityMemberRole,
    transferCommunityOwnership,
} from "../../services/communityService";
import {
    FiArrowLeft,
    FiUsers,
    FiMessageSquare,
    FiInfo,
    FiSettings,
    FiPlus,
    FiSearch,
    FiUserPlus,
    FiRefreshCw,
    FiMoreVertical,
    FiTrash2,
    FiEdit2,
    FiBookmark,
} from "react-icons/fi";
import { saveItem } from "../../services/savedItemsService";

const tabs = [
    { label: "Posts", icon: FiMessageSquare },
    { label: "Members", icon: FiUsers },
    { label: "Invitations", icon: FiUserPlus },
    { label: "About", icon: FiInfo },
];

const glassCard =
    "rounded-2xl border border-white/15 bg-[#2A4F74]/95 shadow-lg";

const glassInput =
    "w-full rounded-xl border border-white/15 bg-[#214B73] px-3 py-2.5 text-sm text-white outline-none placeholder:text-blue-100/65 focus:border-[#0068FF] focus:ring-2 focus:ring-[#0068FF]/30";

const primaryButton =
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#0068FF] px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-[#1678FF] disabled:cursor-not-allowed disabled:opacity-50";

const secondaryButton =
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/15 bg-[#365F86]/70 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#426F98]";

function CommunityDetails() {
    const navigate = useNavigate();
    const { communityId } = useParams();
    const { user } = useAuth();

    const [activeTab, setActiveTab] = useState("Posts");
    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searchingMembers, setSearchingMembers] = useState(false);

    const [community, setCommunity] = useState(null);
    const [posts, setPosts] = useState([]);
    const [members, setMembers] = useState([]);

    const [loading, setLoading] = useState(false);
    const [postsLoading, setPostsLoading] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const [selectedChannelId, setSelectedChannelId] = useState(null);
    const [feedSearch, setFeedSearch] = useState("");

    const [editingPostId, setEditingPostId] = useState(null);
    const [editingPostContent, setEditingPostContent] = useState("");
    const [editingRemoveAttachment, setEditingRemoveAttachment] = useState(false);

    const [openCommentsPostId, setOpenCommentsPostId] = useState(null);
    const [commentsByPost, setCommentsByPost] = useState({});
    const [commentInputs, setCommentInputs] = useState({});
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editingCommentContent, setEditingCommentContent] = useState("");

    const [editingCommunity, setEditingCommunity] = useState(false);
    const [communityName, setCommunityName] = useState("");
    const [communityDescription, setCommunityDescription] = useState("");
    const [savingCommunity, setSavingCommunity] = useState(false);
    const [openMemberActionsId, setOpenMemberActionsId] = useState(null);
    const [pendingInvites, setPendingInvites] = useState([]);
    const [confirmDialog, setConfirmDialog] = useState(null);
    const [confirmingAction, setConfirmingAction] = useState(false);

    const currentUserId = user?.id ?? user?._id;

    const currentMember = members.find(
        (member) =>
            String(member.user?.id ?? member.user?._id ?? member.id) ===
            String(currentUserId)
    );

    const currentUserRole = currentMember?.role?.toUpperCase();
    const isOwner = currentUserRole === "OWNER";
    const isAdmin = currentUserRole === "ADMIN";
    const canManageMembers = isOwner || isAdmin;

    const loadPosts = useCallback(
        async ({ silent = false } = {}) => {
            if (!communityId) return;

            if (!silent) setPostsLoading(true);

            try {
                let response;

                if (selectedChannelId) {
                    response = await getCommunityChannelPosts(
                        communityId,
                        selectedChannelId,
                        {
                            limit: 50,
                            search: feedSearch || undefined,
                        }
                    );
                } else {
                    response = await getCommunityPosts(communityId, {
                        limit: 50,
                        search: feedSearch || undefined,
                    });
                }

                const result =
                    response?.data?.data ?? response?.data ?? response;

                const items = Array.isArray(result?.posts)
                    ? result.posts
                    : Array.isArray(result)
                    ? result
                    : [];

                setPosts((previous) => {
                    const getId = (post) => String(post.id || post._id);

                    const unchanged =
                        previous.length === items.length &&
                        previous.every((post, index) => {
                            const next = items[index];

                            return (
                                getId(post) === getId(next) &&
                                post.content === next.content &&
                                post.updatedAt === next.updatedAt &&
                                post.fileUrl === next.fileUrl
                            );
                        });

                    return unchanged ? previous : items;
                });
            } catch (err) {
                if (!silent) {
                    console.error("Failed to load posts:", err);
                }
            } finally {
                if (!silent) setPostsLoading(false);
            }
        },
        [communityId, selectedChannelId, feedSearch]
    );

    const loadCommunityData = useCallback(async () => {
        if (!communityId) {
            setError("Community ID is missing.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const detailsResponse = await getCommunityDetails(communityId);
            const detailsResult =
                detailsResponse?.data?.data ??
                detailsResponse?.data ??
                detailsResponse;

            setCommunity(detailsResult?.community ?? detailsResult);

            const membersResponse = await getCommunityMembers(communityId, {
                limit: 100,
            });

            const membersResult =
                membersResponse?.data?.data ??
                membersResponse?.data ??
                membersResponse;

            const allMembers = Array.isArray(membersResult?.members)
                ? membersResult.members
                : Array.isArray(membersResult)
                ? membersResult
                : [];

            setMembers(allMembers);
        } catch (err) {
            console.error("Failed to load community:", err);
            setError(
                "Could not load community details. Please retry."
            );
        } finally {
            setLoading(false);
        }
    }, [communityId]);

    useEffect(() => {
        loadCommunityData();
    }, [loadCommunityData]);

    useEffect(() => {
        loadPosts();

        const refreshInterval = setInterval(() => {
            loadPosts({ silent: true });
        }, 5000);

        return () => clearInterval(refreshInterval);
    }, [loadPosts]);

    useEffect(() => {
        if (!notice) return undefined;

        const timeout = setTimeout(() => setNotice(""), 3500);
        return () => clearTimeout(timeout);
    }, [notice]);

    async function handleUpdatePost(event, postId, currentPost) {
        event.preventDefault();
        const content = editingPostContent.trim();

        if (!content && (!currentPost?.fileUrl || editingRemoveAttachment)) {
            setError("A post must contain text or an attachment.");
            return;
        }

        setError("");

        try {
            const delta = {
                content,
                ...(editingRemoveAttachment ? { fileUrl: null } : {}),
            };

            await updateCommunityPost(postId, delta);
            setEditingPostId(null);
            setEditingRemoveAttachment(false);
            setNotice("Post updated successfully.");
            await loadPosts();
        } catch (err) {
            setError("Could not update post.");
        }
    }

    function handleDeletePost(postId) {
        setConfirmDialog({
            title: "Delete post?",
            message: "Are you sure you want to delete this post permanently?",
            confirmLabel: "Delete post",
            onConfirm: async () => {
                try {
                    await deleteCommunityPost(postId);
                    setNotice("Post deleted.");
                    setConfirmDialog(null);
                    await loadPosts();
                } catch (err) {
                    setError("Could not delete post.");
                }
            },
        });
    }

    async function fetchPostComments(postId) {
        try {
            const response = await getPostComments(postId, { limit: 50 });
            const result =
                response?.data?.data ?? response?.data ?? response;

            const items = Array.isArray(result?.comments)
                ? result.comments
                : Array.isArray(result)
                ? result
                : [];

            setCommentsByPost((previous) => ({
                ...previous,
                [postId]: items,
            }));
        } catch (err) {
            console.warn("Could not load comments:", err);
        }
    }

    async function handleToggleComments(postId) {
        if (openCommentsPostId === postId) {
            setOpenCommentsPostId(null);
            return;
        }

        setOpenCommentsPostId(postId);
        await fetchPostComments(postId);
    }

    async function handleCreateComment(event, postId) {
        event.preventDefault();
        const content = (commentInputs[postId] || "").trim();

        if (!content) return;

        try {
            await createPostComment(postId, content);

            setCommentInputs((previous) => ({
                ...previous,
                [postId]: "",
            }));

            setNotice("Comment added.");
            await fetchPostComments(postId);
        } catch (err) {
            setError("Could not add comment.");
        }
    }

    async function handleUpdateComment(commentId, postId) {
        const content = editingCommentContent.trim();
        if (!content) return;

        try {
            await updatePostComment(commentId, content);
            setEditingCommentId(null);
            setEditingCommentContent("");
            setNotice("Comment updated.");

            if (postId) await fetchPostComments(postId);
        } catch (err) {
            setError("Could not update comment.");
        }
    }

    function handleDeleteComment(commentId, postId) {
        setConfirmDialog({
            title: "Delete comment?",
            message: "Are you sure you want to delete this comment?",
            confirmLabel: "Delete comment",
            onConfirm: async () => {
                try {
                    await deletePostComment(commentId);
                    setNotice("Comment deleted.");
                    setConfirmDialog(null);
                    if (postId) await fetchPostComments(postId);
                } catch (err) {
                    setError("Could not delete comment.");
                }
            },
        });
    }

    async function handleSearchMembers(query) {
        setSearch(query);

        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        setSearchingMembers(true);

        try {
            const response = await searchCommunityUsers(
                communityId,
                query.trim()
            );

            const result =
                response?.data?.data ?? response?.data ?? response;

            const list = Array.isArray(result?.users)
                ? result.users
                : Array.isArray(result?.members)
                ? result.members
                : Array.isArray(result)
                ? result
                : [];

            setSearchResults(list);
        } catch (err) {
            console.warn("Member search failed:", err);
        } finally {
            setSearchingMembers(false);
        }
    }

    function handleLeaveCommunity() {
        setConfirmDialog({
            title: "Leave community?",
            message: "Are you sure you want to leave this community?",
            confirmLabel: "Leave community",
            onConfirm: async () => {
                try {
                    await leaveCommunity(communityId);
                    setConfirmDialog(null);
                    navigate("/communities", { replace: true });
                } catch (err) {
                    setError("Could not leave community.");
                }
            },
        });
    }

    async function handleUpdateCommunity(event) {
        event.preventDefault();

        const name = communityName.trim();
        const description = communityDescription.trim();

        if (!name) {
            setError("Community name cannot be empty.");
            return;
        }

        setSavingCommunity(true);
        setError("");

        try {
            await updateCommunity(communityId, { name, description });
            setEditingCommunity(false);
            setNotice("Community updated successfully.");
            await loadCommunityData();
        } catch (err) {
            setError(
                "Could not update community."
            );
        } finally {
            setSavingCommunity(false);
        }
    }

    function handleDeleteCommunity() {
        setConfirmDialog({
            title: "Delete community?",
            message: "Delete this community permanently? All channels, posts and data will be removed.",
            confirmLabel: "Delete community",
            onConfirm: async () => {
                try {
                    await deleteCommunity(communityId);
                    setConfirmDialog(null);
                    navigate("/communities", { replace: true });
                } catch (err) {
                    setError("Could not delete community.");
                }
            },
        });
    }

    async function handleBookmarkPost(post) {
        try {
            const isDocument = Boolean(post.fileUrl);

            await saveItem({
                itemType: isDocument ? "DOCUMENT" : "RESOURCE",
                itemId: post.id || post._id,
            });

            setNotice("Post saved to bookmarks.");
        } catch (err) {
            setError(
                "Could not save post."
            );
        }
    }

    function EmptyState({
        icon: Icon,
        title,
        description,
        actionLabel,
        onAction,
    }) {
        return (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/40 bg-[#365F86]/50 px-5 py-12 text-center shadow-lg backdrop-blur-xl sm:px-6 sm:py-14">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-[#2A4F74]/90 text-white">
                    <Icon size={25} />
                </div>

                <h3 className="mt-4 text-base font-bold text-white">
                    {title}
                </h3>

                <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-white/80">
                    {description}
                </p>

                {actionLabel && (
                    <button
                        type="button"
                        onClick={onAction}
                        className={`${primaryButton} mt-5`}
                    >
                        <FiPlus size={17} />
                        {actionLabel}
                    </button>
                )}
            </div>
        );
    }

    return (
        <div
            className="relative isolate min-h-screen w-full min-w-0 overflow-x-hidden text-white"
            style={{
                backgroundColor: "#062C5F",
                backgroundImage: `linear-gradient(
                    to bottom,
                    #213F70 0%,
                    #315A8A 35%,
                    #506D9A 65%,
                    #7698C5 100%
                )`,
                backgroundRepeat: "no-repeat",
                backgroundSize: "100% 100%",
            }}
        >
            <header className="sticky top-0 z-40 border-b border-white/15 bg-[#062C5F] text-white shadow-sm">
                <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <button
                        type="button"
                        onClick={() => navigate("/communities")}
                        aria-label="Back to communities"
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 bg-[#214B73] px-3 text-sm font-semibold text-white transition hover:bg-[#365F86]"
                    >
                        <FiArrowLeft size={18} />
                        <span className="hidden sm:inline"></span>
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate("/dashboard")}
                        className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap font-sans text-lg font-extrabold tracking-[0.16em] text-white transition hover:text-blue-100 sm:text-2xl sm:tracking-[0.2em]"
                    >
                        QUORUM
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("About")}
                        aria-label="Community settings"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-[#214B73] text-white transition hover:bg-[#365F86]"
                    >
                        <FiSettings size={19} />
                    </button>
                </div>
            </header>

            <main className="relative z-10 mx-auto w-full min-w-0 max-w-7xl flex-1 px-3 pb-8 pt-4 sm:px-5 sm:pt-6 lg:px-8">
                <section className="min-w-0 overflow-hidden rounded-3xl border border-white/15 bg-[#2A4F74]/95 p-4 shadow-[0_12px_40px_rgba(15,35,75,0.12)] sm:p-6 lg:p-8">
                    <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                        <div className="flex min-w-0 items-start gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-[#365F86]/70 text-white shadow-inner sm:h-16 sm:w-16">
                                <FiUsers size={30} />
                            </div>

                            <div className="min-w-0">
                                <h1 className="break-words text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl">
                                    {community?.name || "Community"}
                                </h1>

                                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/85 sm:text-base">
                                    {community?.description ||
                                        "Your shared workspace to connect and collaborate."}
                                </p>

                                <div className="mt-4 flex flex-wrap items-center gap-2">
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-[#2A4F74]/90 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
                                        <FiUsers size={13} />
                                        {community?.memberCount ?? members.length}{" "}
                                        members
                                    </span>

                                    <span className="rounded-full border border-white/15 bg-[#2A4F74]/90 px-3 py-1 text-xs font-semibold text-white">
                                        {currentUserRole || "MEMBER"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => setActiveTab("Invitations")}
                                className={primaryButton}
                            >
                                <FiUserPlus size={17} />
                                Invite members
                            </button>
                        </div>
                    </div>
                </section>

                {error && (
                    <div
                        role="alert"
                        className="mt-4 flex items-start justify-between gap-3 text-sm text-red-300"
                    >
                        <p>{error}</p>
                        <button
                            type="button"
                            onClick={() => setError("")}
                            aria-label="Dismiss error"
                            className="rounded-lg px-2 text-red-300 hover:text-red-200"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {notice && (
                    <div
                        role="status"
                        className="fixed right-4 top-20 z-50 max-w-sm rounded-xl border border-emerald-300/20 bg-[#2A4F74] px-4 py-3 text-sm text-emerald-200 shadow-xl sm:right-6"
                    >
                        {notice}
                    </div>
                )}

                <nav className="mt-6 flex gap-1 overflow-x-auto rounded-2xl border border-white/15 bg-[#365F86]/50 p-1.5 shadow-lg backdrop-blur-xl">
                    {tabs.map(({ label, icon: Icon }) => (
                        <button
                            key={label}
                            type="button"
                            onClick={() => {
                                setActiveTab(label);
                                setError("");
                            }}
                            className={`flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition sm:px-5 ${
                                activeTab === label
                                    ? "bg-[#0068FF] text-white shadow-md"
                                    : "text-white/85 hover:bg-[#2A4F74]/90 hover:text-white"
                            }`}
                        >
                            <Icon size={17} />
                            {label}
                        </button>
                    ))}
                </nav>

                <section className="mt-6 min-w-0">
                    {loading ? (
                        <div className="flex flex-col items-center rounded-2xl border border-white/15 bg-[#365F86]/50 py-20 text-white backdrop-blur-xl">
                            <FiRefreshCw
                                className="animate-spin"
                                size={27}
                            />
                            <p className="mt-3 text-sm text-white/85">
                                Loading community space…
                            </p>
                        </div>
                    ) : activeTab === "Posts" ? (
                        <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]">
                            <div className="min-w-0">
                                <CommunityChannels
                                    communityId={communityId}
                                    canManageChannels={isOwner || isAdmin}
                                    selectedChannelId={selectedChannelId}
                                    onSelectChannel={(id) =>
                                        setSelectedChannelId(id)
                                    }
                                />
                            </div>

                            <div className="min-w-0 space-y-5">
                                <div className={`${glassCard} p-3 sm:p-4`}>
                                    <CommunityPostComposer
                                        selectedChannelId={selectedChannelId}
                                        channelName={
                                            selectedChannelId
                                                ? selectedChannelId === "general"
                                                    ? "General"
                                                    : "Selected Channel"
                                                : "Community Feed"
                                        }
                                        onSubmit={async (postData) => {
                                            await createCommunityPost(
                                                communityId,
                                                postData
                                            );
                                            setNotice(
                                                "Post published successfully."
                                            );
                                            await loadPosts();
                                        }}
                                    />
                                </div>

                                <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/15 bg-[#2A4F74]/90 px-4 py-3 shadow-sm backdrop-blur-xl">
                                    <FiSearch className="shrink-0 text-white/80" />
                                    <input
                                        value={feedSearch}
                                        onChange={(event) =>
                                            setFeedSearch(event.target.value)
                                        }
                                        placeholder="Search posts in this channel or community…"
                                        className="w-full min-w-0 bg-transparent text-sm text-white outline-none placeholder:text-white/65"
                                    />

                                    {feedSearch && (
                                        <button
                                            type="button"
                                            onClick={() => setFeedSearch("")}
                                            className="shrink-0 text-xs font-semibold text-white hover:text-blue-100"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>

                                {postsLoading ? (
                                    <div className={`${glassCard} flex justify-center py-12`}>
                                        <FiRefreshCw
                                            className="animate-spin text-white"
                                            size={23}
                                        />
                                    </div>
                                ) : posts.length === 0 ? (
                                    <EmptyState
                                        icon={FiMessageSquare}
                                        title="No discussions yet"
                                        description={
                                            feedSearch
                                                ? "No posts match your search query."
                                                : "Be the first to start a conversation or share a document in this space."
                                        }
                                    />
                                ) : (
                                    <div className="space-y-4">
                                        {posts.map((post) => {
                                            const postId = post.id || post._id;

                                            const postAuthorId =
                                                post.author?.id ??
                                                post.author?._id ??
                                                post.user?.id ??
                                                post.user?._id ??
                                                post.authorId ??
                                                post.userId;

                                            const isPostAuthor =
                                                postAuthorId != null &&
                                                currentUserId != null &&
                                                String(postAuthorId) ===
                                                    String(currentUserId);

                                            const canDelete =
                                                isPostAuthor || isOwner || isAdmin;

                                            const isEditingThisPost =
                                                editingPostId === postId;

                                            return (
                                                <article
                                                    key={postId}
                                                    className="overflow-hidden rounded-2xl border border-white/15 bg-[#2A4F74]/90 p-4 shadow-lg backdrop-blur-xl transition hover:border-white/40 hover:bg-[#365F86]/70 sm:p-5"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex min-w-0 items-center gap-3">
                                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-[#365F86]/70 font-bold text-white">
                                                                {(
                                                                    post.author?.name ||
                                                                    "M"
                                                                )
                                                                    .slice(0, 1)
                                                                    .toUpperCase()}
                                                            </div>

                                                            <div className="min-w-0">
                                                                <p className="break-words font-semibold text-white">
                                                                    {post.author
                                                                        ?.name ||
                                                                        "Community Member"}
                                                                </p>

                                                                <p className="mt-0.5 text-xs text-white/70">
                                                                    {post.createdAt
                                                                        ? new Date(
                                                                              post.createdAt
                                                                          ).toLocaleString()
                                                                        : "Recent"}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {post.channel && (
                                                            <span className="max-w-[45%] shrink-0 truncate rounded-lg border border-white/15 bg-[#2A4F74]/90 px-2.5 py-1 text-xs font-medium text-white">
                                                                #
                                                                {post.channel
                                                                    .name ||
                                                                    "general"}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="mt-4 min-w-0">
                                                        {isEditingThisPost ? (
                                                            <form
                                                                onSubmit={(event) =>
                                                                    handleUpdatePost(
                                                                        event,
                                                                        postId,
                                                                        post
                                                                    )
                                                                }
                                                                className="space-y-3"
                                                            >
                                                                <textarea
                                                                    value={
                                                                        editingPostContent
                                                                    }
                                                                    onChange={(event) =>
                                                                        setEditingPostContent(
                                                                            event.target
                                                                                .value
                                                                        )
                                                                    }
                                                                    maxLength={20000}
                                                                    rows={4}
                                                                    className={glassInput}
                                                                />

                                                                {post.fileUrl &&
                                                                    !editingRemoveAttachment && (
                                                                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/15 bg-[#365F86]/50 p-3 text-xs">
                                                                            <span className="break-all text-white/90">
                                                                                Attachment:{" "}
                                                                                {post.fileName ||
                                                                                    "File"}
                                                                            </span>

                                                                            <button
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    setEditingRemoveAttachment(
                                                                                        true
                                                                                    )
                                                                                }
                                                                                className="font-semibold text-red-100 hover:text-white"
                                                                            >
                                                                                Remove attachment
                                                                            </button>
                                                                        </div>
                                                                    )}

                                                                {editingRemoveAttachment && (
                                                                    <p className="text-xs text-white/85">
                                                                        Attachment will be detached on save.
                                                                    </p>
                                                                )}

                                                                <div className="flex flex-wrap gap-2">
                                                                    <button
                                                                        type="submit"
                                                                        className={primaryButton}
                                                                    >
                                                                        Save changes
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setEditingPostId(
                                                                                null
                                                                            );
                                                                            setEditingRemoveAttachment(
                                                                                false
                                                                            );
                                                                        }}
                                                                        className={secondaryButton}
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </form>
                                                        ) : (
                                                            <p className="whitespace-pre-wrap break-words text-sm leading-7 text-white/95">
                                                                {post.content}
                                                            </p>
                                                        )}

                                                        {!isEditingThisPost && (
                                                            <div className="mt-3">
                                                                <PostAttachment
                                                                    fileUrl={
                                                                        post.fileUrl
                                                                    }
                                                                    fileType={
                                                                        post.fileType
                                                                    }
                                                                    fileName={
                                                                        post.fileName
                                                                    }
                                                                    fileSize={
                                                                        post.fileSize
                                                                    }
                                                                />
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/15 pt-3 text-xs">
                                                        <div className="flex flex-wrap items-center gap-4">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleToggleComments(
                                                                        postId
                                                                    )
                                                                }
                                                                className="inline-flex items-center gap-1.5 font-semibold text-white/90 transition hover:text-white"
                                                            >
                                                                <FiMessageSquare
                                                                    size={14}
                                                                />
                                                                {openCommentsPostId ===
                                                                postId
                                                                    ? "Hide comments"
                                                                    : "Comments"}
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleBookmarkPost(
                                                                        post
                                                                    )
                                                                }
                                                                className="inline-flex items-center gap-1.5 font-semibold text-white/90 transition hover:text-white"
                                                            >
                                                                <FiBookmark
                                                                    size={14}
                                                                />
                                                                Save
                                                            </button>
                                                        </div>

                                                        <div className="flex flex-wrap items-center gap-3">
                                                            {isPostAuthor &&
                                                                !isEditingThisPost && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setEditingPostId(
                                                                                postId
                                                                            );
                                                                            setEditingPostContent(
                                                                                post.content ||
                                                                                    ""
                                                                            );
                                                                            setEditingRemoveAttachment(
                                                                                false
                                                                            );
                                                                        }}
                                                                        className="inline-flex items-center gap-1 text-white/85 hover:text-white"
                                                                    >
                                                                        <FiEdit2
                                                                            size={13}
                                                                        />
                                                                        Edit
                                                                    </button>
                                                                )}

                                                            {canDelete && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleDeletePost(
                                                                            postId
                                                                        )
                                                                    }
                                                                    className="inline-flex items-center gap-1 text-red-100 hover:text-white"
                                                                >
                                                                    <FiTrash2
                                                                        size={13}
                                                                    />
                                                                    Delete
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {openCommentsPostId ===
                                                        postId && (
                                                        <div className="mt-4 space-y-3 rounded-2xl border border-white/15 bg-[#365F86]/50 p-3 backdrop-blur-lg sm:p-4">
                                                            <form
                                                                onSubmit={(event) =>
                                                                    handleCreateComment(
                                                                        event,
                                                                        postId
                                                                    )
                                                                }
                                                                className="flex min-w-0 flex-col gap-2 sm:flex-row"
                                                            >
                                                                <input
                                                                    value={
                                                                        commentInputs[
                                                                            postId
                                                                        ] || ""
                                                                    }
                                                                    onChange={(event) =>
                                                                        setCommentInputs(
                                                                            (previous) => ({
                                                                                ...previous,
                                                                                [postId]:
                                                                                    event.target
                                                                                        .value,
                                                                            })
                                                                        )
                                                                    }
                                                                    placeholder="Write a reply…"
                                                                    maxLength={2000}
                                                                    required
                                                                    className={glassInput}
                                                                />

                                                                <button
                                                                    type="submit"
                                                                    className={primaryButton}
                                                                >
                                                                    Reply
                                                                </button>
                                                            </form>

                                                            <div className="space-y-2 pt-1">
                                                                {(
                                                                    commentsByPost[
                                                                        postId
                                                                    ] || []
                                                                ).map((comment) => {
                                                                    const commentId =
                                                                        comment.id ||
                                                                        comment._id;

                                                                    const commentAuthorId =
                                                                        comment.author
                                                                            ?.id ??
                                                                        comment.author
                                                                            ?._id ??
                                                                        comment.user
                                                                            ?.id ??
                                                                        comment.user
                                                                            ?._id;

                                                                    const isCommentAuthor =
                                                                        commentAuthorId !=
                                                                            null &&
                                                                        currentUserId !=
                                                                            null &&
                                                                        String(
                                                                            commentAuthorId
                                                                        ) ===
                                                                            String(
                                                                                currentUserId
                                                                            );

                                                                    const canDeleteComment =
                                                                        isCommentAuthor ||
                                                                        isOwner ||
                                                                        isAdmin;

                                                                    return (
                                                                        <div
                                                                            key={
                                                                                commentId
                                                                            }
                                                                            className="rounded-xl border border-white/15 bg-[#365F86]/50 p-3 text-sm"
                                                                        >
                                                                            <div className="flex items-center justify-between gap-3">
                                                                                <span className="break-words font-semibold text-white">
                                                                                    {comment
                                                                                        .author
                                                                                        ?.name ||
                                                                                        comment
                                                                                            .user
                                                                                            ?.name ||
                                                                                        "Member"}
                                                                                </span>

                                                                                {canDeleteComment && (
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() =>
                                                                                            handleDeleteComment(
                                                                                                commentId,
                                                                                                postId
                                                                                            )
                                                                                        }
                                                                                        className="shrink-0 text-xs font-semibold text-red-100 hover:text-white"
                                                                                    >
                                                                                        Delete
                                                                                    </button>
                                                                                )}
                                                                            </div>

                                                                            {editingCommentId ===
                                                                            commentId ? (
                                                                                <form
                                                                                    onSubmit={(
                                                                                        event
                                                                                    ) => {
                                                                                        event.preventDefault();
                                                                                        handleUpdateComment(
                                                                                            commentId,
                                                                                            postId
                                                                                        );
                                                                                    }}
                                                                                    className="mt-2 space-y-2"
                                                                                >
                                                                                    <textarea
                                                                                        value={
                                                                                            editingCommentContent
                                                                                        }
                                                                                        onChange={(
                                                                                            event
                                                                                        ) =>
                                                                                            setEditingCommentContent(
                                                                                                event
                                                                                                    .target
                                                                                                    .value
                                                                                            )
                                                                                        }
                                                                                        maxLength={
                                                                                            2000
                                                                                        }
                                                                                        required
                                                                                        rows={
                                                                                            2
                                                                                        }
                                                                                        className={
                                                                                            glassInput
                                                                                        }
                                                                                    />

                                                                                    <div className="flex flex-wrap gap-2">
                                                                                        <button
                                                                                            type="submit"
                                                                                            className="rounded-lg bg-[#0068FF] px-3 py-2 text-xs font-bold text-white"
                                                                                        >
                                                                                            Save
                                                                                        </button>

                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => {
                                                                                                setEditingCommentId(
                                                                                                    null
                                                                                                );
                                                                                                setEditingCommentContent(
                                                                                                    ""
                                                                                                );
                                                                                            }}
                                                                                            className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-white"
                                                                                        >
                                                                                            Cancel
                                                                                        </button>
                                                                                    </div>
                                                                                </form>
                                                                            ) : (
                                                                                <div>
                                                                                    <p className="mt-1 whitespace-pre-wrap break-words leading-6 text-white/90">
                                                                                        {
                                                                                            comment.content
                                                                                        }
                                                                                    </p>

                                                                                    {isCommentAuthor && (
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => {
                                                                                                setEditingCommentId(
                                                                                                    commentId
                                                                                                );
                                                                                                setEditingCommentContent(
                                                                                                    comment.content ||
                                                                                                        ""
                                                                                                );
                                                                                            }}
                                                                                            className="mt-2 text-xs font-semibold text-white/80 hover:text-white"
                                                                                        >
                                                                                            Edit comment
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </article>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : activeTab === "Members" ? (
                        <div className="space-y-5">
                            <div className={`${glassCard} flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6`}>
                                <div>
                                    <h2 className="text-xl font-extrabold text-white">
                                        Community members
                                    </h2>
                                    <p className="mt-1 text-sm text-white/80">
                                        View member roles and collaborate.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setActiveTab("Invitations")}
                                    className={primaryButton}
                                >
                                    <FiUserPlus size={17} />
                                    Invite members
                                </button>
                            </div>

                            <div className="flex max-w-xl items-center gap-3 rounded-2xl border border-white/15 bg-[#2A4F74]/90 px-4 py-3 shadow-sm backdrop-blur-xl">
                                <FiSearch className="shrink-0 text-white/80" />
                                <input
                                    value={search}
                                    onChange={(event) =>
                                        handleSearchMembers(event.target.value)
                                    }
                                    placeholder="Search members by name or email…"
                                    className="w-full min-w-0 bg-transparent text-sm text-white outline-none placeholder:text-white/65"
                                />

                                {search && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearch("");
                                            setSearchResults([]);
                                        }}
                                        className="text-xs font-semibold text-white"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>

                            {searchingMembers ? (
                                <div className={`${glassCard} flex justify-center py-10`}>
                                    <FiRefreshCw
                                        className="animate-spin text-white"
                                        size={23}
                                    />
                                </div>
                            ) : (search.trim() ? searchResults : members)
                                  .length === 0 ? (
                                <EmptyState
                                    icon={FiUsers}
                                    title="No members found"
                                    description="No community members match your search."
                                />
                            ) : (
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {(search.trim() ? searchResults : members).map(
                                        (member) => {
                                            const userId =
                                                member.user?.id ??
                                                member.user?._id ??
                                                member.id;

                                            const memberName =
                                                member.user?.name ??
                                                member.name ??
                                                "Community member";

                                            const role = String(
                                                member.role ?? "MEMBER"
                                            ).toUpperCase();

                                            const memberKey = userId ?? member.id;

                                            const canChangeRole =
                                                isOwner &&
                                                userId != null &&
                                                String(userId) !==
                                                    String(currentUserId) &&
                                                role !== "OWNER";

                                            const canRemove =
                                                canManageMembers &&
                                                userId != null &&
                                                String(userId) !==
                                                    String(currentUserId) &&
                                                (role === "MEMBER" ||
                                                    (isOwner && role === "ADMIN"));

                                            const canTransferOwnership =
                                                isOwner &&
                                                userId != null &&
                                                String(userId) !==
                                                    String(currentUserId);

                                            return (
                                                <div
                                                    key={memberKey}
                                                    className={`${glassCard} relative min-w-0 p-4 transition hover:bg-[#365F86]/70`}
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex min-w-0 items-center gap-3">
                                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-[#365F86]/70 font-bold text-white">
                                                                {memberName
                                                                    .slice(0, 1)
                                                                    .toUpperCase()}
                                                            </div>

                                                            <div className="min-w-0">
                                                                <p className="break-words font-semibold text-white">
                                                                    {memberName}
                                                                </p>
                                                                <span className="mt-1 inline-block rounded-full border border-white/15 bg-[#2A4F74]/90 px-2.5 py-1 text-xs font-semibold text-white">
                                                                    {role}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {(canChangeRole ||
                                                            canTransferOwnership ||
                                                            canRemove) && (
                                                            <div className="relative shrink-0">
                                                                <button
                                                                    type="button"
                                                                    aria-label={`Actions for ${memberName}`}
                                                                    onClick={() =>
                                                                        setOpenMemberActionsId(
                                                                            (previous) =>
                                                                                String(
                                                                                    previous
                                                                                ) ===
                                                                                String(
                                                                                    memberKey
                                                                                )
                                                                                    ? null
                                                                                    : memberKey
                                                                        )
                                                                    }
                                                                    className="rounded-lg p-2 text-white/90 transition hover:bg-[#2A4F74]/90 hover:text-white"
                                                                >
                                                                    <FiMoreVertical
                                                                        size={18}
                                                                    />
                                                                </button>

                                                                {String(
                                                                    openMemberActionsId
                                                                ) ===
                                                                    String(
                                                                        memberKey
                                                                    ) && (
                                                                    <div className="absolute right-0 top-10 z-30 w-52 rounded-xl border border-white/15 bg-[#214B73] p-1.5 shadow-2xl backdrop-blur-xl">
                                                                        {canChangeRole && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={async () => {
                                                                                    setOpenMemberActionsId(
                                                                                        null
                                                                                    );

                                                                                    const nextRole =
                                                                                        role ===
                                                                                        "ADMIN"
                                                                                            ? "MEMBER"
                                                                                            : "ADMIN";

                                                                                    try {
                                                                                        await updateCommunityMemberRole(
                                                                                            communityId,
                                                                                            userId,
                                                                                            nextRole
                                                                                        );

                                                                                        setNotice(
                                                                                            `Updated ${memberName} to ${nextRole}`
                                                                                        );

                                                                                        await loadCommunityData();
                                                                                    } catch (
                                                                                        err
                                                                                    ) {
                                                                                        setError(
                                                                                            err
                                                                                                .response
                                                                                                ?.data
                                                                                                ?.message ||
                                                                                                "Could not update member role."
                                                                                        );
                                                                                    }
                                                                                }}
                                                                                className="w-full rounded-lg px-3 py-2.5 text-left text-xs font-medium text-white hover:bg-[#2A4F74]/90"
                                                                            >
                                                                                {role ===
                                                                                "ADMIN"
                                                                                    ? "Demote to member"
                                                                                    : "Promote to admin"}
                                                                            </button>
                                                                        )}

                                                                        {canTransferOwnership && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setOpenMemberActionsId(null);
                                                                                    setConfirmDialog({
                                                                                        title: "Transfer ownership?",
                                                                                        message: `Transfer community ownership to ${memberName}?`,
                                                                                        confirmLabel: "Transfer ownership",
                                                                                        onConfirm: async () => {
                                                                                            try {
                                                                                                await transferCommunityOwnership(communityId, userId);
                                                                                                setNotice("Ownership transferred.");
                                                                                                setConfirmDialog(null);
                                                                                                await loadCommunityData();
                                                                                            } catch (err) {
                                                                                                setError("Could not transfer ownership.");
                                                                                            }
                                                                                        },
                                                                                    });
                                                                                }}
                                                                                className="w-full rounded-lg px-3 py-2.5 text-left text-xs font-medium text-white hover:bg-[#2A4F74]/90"
                                                                            >
                                                                                Transfer ownership
                                                                            </button>
                                                                        )}

                                                                        {canRemove && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setOpenMemberActionsId(null);
                                                                                    setConfirmDialog({
                                                                                        title: "Remove member?",
                                                                                        message: `Are you sure you want to remove ${memberName} from this community?`,
                                                                                        confirmLabel: "Remove member",
                                                                                        onConfirm: async () => {
                                                                                            try {
                                                                                                await removeCommunityMember(communityId, userId);
                                                                                                setNotice("Member removed.");
                                                                                                setConfirmDialog(null);
                                                                                                await loadCommunityData();
                                                                                            } catch (err) {
                                                                                                setError("Could not remove member.");
                                                                                            }
                                                                                        },
                                                                                    });
                                                                                }}
                                                                                className="w-full rounded-lg px-3 py-2.5 text-left text-xs font-medium text-red-100 hover:bg-red-400/20"
                                                                            >
                                                                                Remove member
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        }
                                    )}
                                </div>
                            )}
                        </div>
                    ) : activeTab === "Invitations" ? (
                        <div className="mx-auto w-full max-w-4xl">
                            <div className={`${glassCard} p-3 sm:p-5`}>
                                <CommunityInvitations
                                    communityId={communityId}
                                    canManageInvites={isOwner || isAdmin}
                                    pendingInvites={pendingInvites}
                                    onRefresh={loadCommunityData}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className={`${glassCard} w-full min-w-0 space-y-6 p-5 sm:p-8`}>
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-[#2A4F74]/90 text-white">
                                    <FiInfo size={23} />
                                </div>

                                <div>
                                    <h2 className="text-xl font-extrabold text-white">
                                        About this community
                                    </h2>
                                    <p className="mt-1 text-sm text-white/75">
                                        Community settings and overview.
                                    </p>
                                </div>
                            </div>

                            <div className="border-t border-white/15 pt-5">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-white/90">
                                    Description
                                </h3>
                                <p className="mt-2 break-words text-sm leading-7 text-white/90">
                                    {community?.description ||
                                        "No description provided."}
                                </p>
                            </div>

                            <div className="border-t border-white/15 pt-5">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-white/90">
                                    Community ID
                                </h3>
                                <p className="mt-2 break-all font-mono text-xs text-white/80">
                                    {communityId}
                                </p>
                            </div>

                            <div className="border-t border-white/15 pt-5">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-white/90">
                                    Actions
                                </h3>

                                <div className="mt-3 flex flex-wrap gap-3">
                                    {isOwner && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setCommunityName(
                                                        community?.name || ""
                                                    );
                                                    setCommunityDescription(
                                                        community?.description ||
                                                            ""
                                                    );
                                                    setEditingCommunity(true);
                                                }}
                                                className={secondaryButton}
                                            >
                                                <FiEdit2 size={15} />
                                                Edit community details
                                            </button>

                                            <button
                                                type="button"
                                                onClick={handleDeleteCommunity}
                                                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-200/40 bg-red-500/20 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500/30"
                                            >
                                                <FiTrash2 size={15} />
                                                Delete community
                                            </button>
                                        </>
                                    )}

                                    {!isOwner && (
                                        <button
                                            type="button"
                                            onClick={handleLeaveCommunity}
                                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-200/40 bg-red-500/20 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500/30"
                                        >
                                            Leave community
                                        </button>
                                    )}
                                </div>

                                {isOwner && editingCommunity && (
                                    <form
                                        onSubmit={handleUpdateCommunity}
                                        className="mt-5 space-y-4 rounded-2xl border border-white/15 bg-[#365F86]/50 p-4 backdrop-blur-xl sm:p-5"
                                    >
                                        <div>
                                            <label className="mb-2 block text-sm font-semibold text-white/90">
                                                Community name
                                            </label>
                                            <input
                                                value={communityName}
                                                onChange={(event) =>
                                                    setCommunityName(
                                                        event.target.value
                                                    )
                                                }
                                                maxLength={100}
                                                required
                                                className={glassInput}
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-semibold text-white/90">
                                                Description
                                            </label>
                                            <textarea
                                                value={communityDescription}
                                                onChange={(event) =>
                                                    setCommunityDescription(
                                                        event.target.value
                                                    )
                                                }
                                                maxLength={2000}
                                                rows={4}
                                                className={glassInput}
                                            />
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="submit"
                                                disabled={savingCommunity}
                                                className={primaryButton}
                                            >
                                                {savingCommunity
                                                    ? "Saving…"
                                                    : "Save changes"}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setEditingCommunity(false)
                                                }
                                                className={secondaryButton}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    )}
                </section>
            </main>

            {confirmDialog && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget && !confirmingAction) {
                            setConfirmDialog(null);
                        }
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="community-confirm-title"
                        className="w-full max-w-md rounded-2xl border border-white/15 bg-gradient-to-br from-[#2A4F74] via-[#365F86] to-[#214B73] p-5 text-white shadow-2xl sm:p-6"
                    >
                        <div className="flex items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-200/30 bg-red-400/15 text-red-100">
                                <FiTrash2 size={21} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h2 id="community-confirm-title" className="text-lg font-extrabold">
                                    {confirmDialog.title}
                                </h2>
                                <p className="mt-2 text-sm leading-6 text-white/80">
                                    {confirmDialog.message}
                                </p>
                            </div>
                        </div>
                        <div className="mt-6 flex flex-wrap justify-end gap-2">
                            <button
                                type="button"
                                disabled={confirmingAction}
                                onClick={() => setConfirmDialog(null)}
                                className={secondaryButton}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={confirmingAction}
                                onClick={async () => {
                                    if (!confirmDialog?.onConfirm) return;
                                    setConfirmingAction(true);
                                    try {
                                        await confirmDialog.onConfirm();
                                    } finally {
                                        setConfirmingAction(false);
                                    }
                                }}
                                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-200/30 bg-red-500/80 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {confirmingAction ? (
                                    <FiRefreshCw className="animate-spin" size={16} />
                                ) : null}
                                {confirmingAction ? "Please wait…" : confirmDialog.confirmLabel}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CommunityDetails;
