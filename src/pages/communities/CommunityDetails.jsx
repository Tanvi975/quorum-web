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
    revokeCommunityInvite,
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
    FiCornerDownRight,
    FiBookmark,
} from "react-icons/fi";
import { saveItem } from "../../services/savedItemsService";
const tabs = [
    { label: "Posts", icon: FiMessageSquare },
    { label: "Members", icon: FiUsers },
    { label: "Invitations", icon: FiUserPlus },
    { label: "About", icon: FiInfo },
];

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
    const [channels, setChannels] = useState([]);

    const [loading, setLoading] = useState(false);
    const [postsLoading, setPostsLoading] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const [selectedChannelId, setSelectedChannelId] = useState(null);
    const [feedSearch, setFeedSearch] = useState("");

    // Post Editing state
    const [editingPostId, setEditingPostId] = useState(null);
    const [editingPostContent, setEditingPostContent] = useState("");
    const [editingRemoveAttachment, setEditingRemoveAttachment] = useState(false);

    // Comments state
    const [openCommentsPostId, setOpenCommentsPostId] = useState(null);
    const [commentsByPost, setCommentsByPost] = useState({});
    const [commentInputs, setCommentInputs] = useState({});
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editingCommentContent, setEditingCommentContent] = useState("");

    // Member & Community management state
    const [editingCommunity, setEditingCommunity] = useState(false);
    const [communityName, setCommunityName] = useState("");
    const [communityDescription, setCommunityDescription] = useState("");
    const [savingCommunity, setSavingCommunity] = useState(false);
    const [showCommunityActions, setShowCommunityActions] = useState(false);
    const [openMemberActionsId, setOpenMemberActionsId] = useState(null);
    const [pendingInvites, setPendingInvites] = useState([]);

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

    const loadPosts = useCallback(async () => {
        if (!communityId) return;
        setPostsLoading(true);

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
            const result = response?.data?.data ?? response?.data ?? response;
            const items = Array.isArray(result?.posts)
                ? result.posts
                : Array.isArray(result)
                ? result
                : [];

            setPosts(items);
        } catch (err) {
            console.error("Failed to load posts:", err);
  
        } finally {
            setPostsLoading(false);
        }
    }, [communityId, selectedChannelId, feedSearch]);

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

            const membersResponse = await getCommunityMembers(communityId, { limit: 100 });
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
                err.response?.data?.message ||
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
    }, [loadPosts]);


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
            setError(err.response?.data?.message || "Could not update post.");
        }
    }

    async function handleDeletePost(postId) {
        if (!window.confirm("Delete this post permanently?")) return;

        try {
            await deleteCommunityPost(postId);
            setNotice("Post deleted.");
            await loadPosts();
        } catch (err) {
            setError(err.response?.data?.message || "Could not delete post.");
        }
    }
    async function fetchPostComments(postId) {
        try {
            const response = await getPostComments(postId, { limit: 50 });
            const result = response?.data?.data ?? response?.data ?? response;
            const items = Array.isArray(result?.comments)
                ? result.comments
                : Array.isArray(result)
                ? result
                : [];

            setCommentsByPost((prev) => ({ ...prev, [postId]: items }));
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
            setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
            setNotice("Comment added.");
            await fetchPostComments(postId);
        } catch (err) {
            setError(err.response?.data?.message || "Could not add comment.");
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
            setError(err.response?.data?.message || "Could not update comment.");
        }
    }

    async function handleDeleteComment(commentId, postId) {
        if (!window.confirm("Delete this comment?")) return;

        try {
            await deletePostComment(commentId);
            setNotice("Comment deleted.");
            if (postId) await fetchPostComments(postId);
        } catch (err) {
            setError(err.response?.data?.message || "Could not delete comment.");
        }
    }
    async function handleSearchMembers(query) {
        setSearch(query);

        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        setSearchingMembers(true);

        try {
            const response = await searchCommunityUsers(communityId, query.trim());
            const result = response?.data?.data ?? response?.data ?? response;
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

    async function handleLeaveCommunity() {
        if (!window.confirm("Are you sure you want to leave this community?")) return;

        try {
            await leaveCommunity(communityId);
            navigate("/communities", { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || "Could not leave community.");
        }
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
            setError(err.response?.data?.message || "Could not update community.");
        } finally {
            setSavingCommunity(false);
        }
    }

    async function handleDeleteCommunity() {
        if (!window.confirm("Delete this community permanently? All channels, posts and data will be removed.")) return;

        try {
            await deleteCommunity(communityId);
            navigate("/communities", { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || "Could not delete community.");
        }
    }
    async function handleBookmarkPost(post) {
        try {
            const isDoc = Boolean(post.fileUrl);
            await saveItem({
                itemType: isDoc ? "DOCUMENT" : "RESOURCE",
                itemId: post.id || post._id,
            });
            setNotice("Post saved to bookmarks.");
        } catch (err) {
            setError(err.response?.data?.message || "Could not save post.");
        }
    }
    const EmptyState = ({ icon: Icon, title, description, actionLabel, onAction }) => (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.025] px-6 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-200">
                <Icon size={26} />
            </div>
            <h3 className="mt-4 text-base font-bold text-white">{title}</h3>
            <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-blue-100/60">{description}</p>
            {actionLabel && (
                <button
                    type="button"
                    onClick={onAction}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-400"
                >
                    <FiPlus size={17} /> {actionLabel}
                </button>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#061833] via-[#062C5F] to-[#04142B] text-white">
            {/* Header */}
            <header className="sticky top-0 z-30 border-b border-white/10 bg-[#062C5F]/95 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
                    <button
                        type="button"
                        onClick={() => navigate("/communities")}
                        className="flex items-center gap-2 text-sm font-medium text-white/75 transition hover:text-white"
                    >
                        <FiArrowLeft size={18} />
                        <span>Communities</span>
                    </button>

                    <span className="text-lg font-black tracking-widest text-blue-200">
                        QUORUM
                    </span>

                    <button
                        type="button"
                        onClick={() => setActiveTab("About")}
                        aria-label="Community settings"
                        className="rounded-xl p-2.5 text-white/75 transition hover:bg-white/10 hover:text-white"
                    >
                        <FiSettings size={19} />
                    </button>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8">
                {/* Community Banner */}
                <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-white/[0.07] to-white/[0.02] p-6 shadow-xl backdrop-blur-xl sm:p-8">
                    <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                        <div className="flex min-w-0 items-start gap-4">
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/30 to-indigo-500/20 text-blue-200 shadow-inner">
                                <FiUsers size={32} />
                            </div>

                            <div className="min-w-0">
                                <h1 className="break-words text-2xl font-black sm:text-3xl">
                                    {community?.name || "Community"}
                                </h1>
                                <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-blue-100/70">
                                    {community?.description || "Your shared workspace to connect and collaborate."}
                                </p>
                                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-blue-100/60">
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5">
                                        <FiUsers size={13} /> {community?.memberCount ?? members.length} members
                                    </span>
                                    <span>·</span>
                                    <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-2.5 py-0.5 font-medium text-blue-200">
                                        {currentUserRole || "MEMBER"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex shrink-0 gap-2">
                            <button
                                type="button"
                                onClick={() => setActiveTab("Invitations")}
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-2.5 text-sm font-bold shadow-lg shadow-blue-950/30 transition hover:brightness-110"
                            >
                                <FiUserPlus size={17} /> Invite members
                            </button>
                        </div>
                    </div>
                </section>

                {error && (
                    <div role="alert" className="mt-4 flex items-start justify-between gap-3 rounded-2xl border border-red-400/20 bg-red-500/15 p-4 text-sm text-red-200 shadow-lg">
                        <p>{error}</p>
                        <button type="button" onClick={() => setError("")} className="text-white/60 hover:text-white">✕</button>
                    </div>
                )}

                {notice && (
                    <div role="status" className="fixed right-5 top-20 z-50 max-w-sm rounded-2xl border border-emerald-300/20 bg-emerald-900/90 p-4 text-sm text-emerald-100 shadow-2xl backdrop-blur-md">
                        {notice}
                    </div>
                )}
                <nav className="mt-6 flex gap-2 overflow-x-auto border-b border-white/10 pb-px">
                    {tabs.map(({ label, icon: Icon }) => (
                        <button
                            key={label}
                            type="button"
                            onClick={() => {
                                setActiveTab(label);
                                setError("");
                            }}
                            className={`flex shrink-0 items-center gap-2.5 border-b-2 px-5 py-3 text-sm font-semibold transition ${
                                activeTab === label
                                    ? "border-blue-400 text-blue-200"
                                    : "border-transparent text-blue-100/60 hover:text-white"
                            }`}
                        >
                            <Icon size={17} />
                            {label}
                        </button>
                    ))}
                </nav>

                <section className="mt-6">
                    {loading ? (
                        <div className="flex flex-col items-center py-20 text-blue-100/70">
                            <FiRefreshCw className="animate-spin" size={26} />
                            <p className="mt-3 text-sm">Loading community space…</p>
                        </div>
                    ) : activeTab === "Posts" ? (
                        <div className="grid items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
                            <CommunityChannels
                                communityId={communityId}
                                canManageChannels={isOwner || isAdmin}
                                selectedChannelId={selectedChannelId}
                                onSelectChannel={(id) => {
                                    setSelectedChannelId(id);
                                }}
                            />
                            <div className="min-w-0 space-y-6">
   
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
                                        await createCommunityPost(communityId, postData);
                                        setNotice("Post published successfully.");
                                        await loadPosts();
                                    }}
                                />

                                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3">
                                    <FiSearch className="shrink-0 text-blue-200/50" />
                                    <input
                                        value={feedSearch}
                                        onChange={(e) => setFeedSearch(e.target.value)}
                                        placeholder="Search posts in this channel or community…"
                                        className="w-full bg-transparent text-sm outline-none placeholder:text-blue-100/35"
                                    />
                                    {feedSearch && (
                                        <button
                                            type="button"
                                            onClick={() => setFeedSearch("")}
                                            className="text-xs text-blue-200 hover:text-white"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>

                                {postsLoading ? (
                                    <div className="flex justify-center py-12">
                                        <FiRefreshCw className="animate-spin text-blue-300" size={22} />
                                    </div>
                                ) : posts.length === 0 ? (
                                    <EmptyState
                                        icon={FiMessageSquare}
                                        title="No discussions yet"
                                        description={feedSearch ? "No posts match your search query." : "Be the first to start a conversation or share a document in this space."}
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
                                                String(postAuthorId) === String(currentUserId);
                                            const canDelete = isPostAuthor || isOwner || isAdmin;

                                            const isEditingThisPost = editingPostId === postId;

                                            return (
                                                <article
                                                    key={postId}
                                                    className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-lg transition hover:border-white/20"
                                                >
                                                    {/* Post Header */}
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/20 font-bold text-blue-200">
                                                                {(post.author?.name || "M").slice(0, 1).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-white">
                                                                    {post.author?.name || "Community Member"}
                                                                </p>
                                                                <p className="text-xs text-blue-100/50">
                                                                    {post.createdAt
                                                                        ? new Date(post.createdAt).toLocaleString()
                                                                        : "Recent"}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {post.channel && (
                                                            <span className="rounded-lg border border-blue-400/20 bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-200">
                                                                #{post.channel.name || "general"}
                                                            </span>
                                                        )}
                                                    </div>

                        
                                                    <div className="mt-3">
                                                        {isEditingThisPost ? (
                                                            <form
                                                                onSubmit={(e) => handleUpdatePost(e, postId, post)}
                                                                className="space-y-3"
                                                            >
                                                                <textarea
                                                                    value={editingPostContent}
                                                                    onChange={(e) => setEditingPostContent(e.target.value)}
                                                                    maxLength={10000}
                                                                    rows={3}
                                                                    required
                                                                    className="w-full rounded-xl border border-white/15 bg-[#06172E] p-3 text-sm text-white outline-none focus:border-blue-300"
                                                                />

                                                                {post.fileUrl && !editingRemoveAttachment && (
                                                                    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 text-xs">
                                                                        <span className="text-blue-100">
                                                                            Attachment: {post.fileName || "File"}
                                                                        </span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setEditingRemoveAttachment(true)}
                                                                            className="font-semibold text-red-300 hover:text-red-200"
                                                                        >
                                                                            Remove attachment
                                                                        </button>
                                                                    </div>
                                                                )}

                                                                {editingRemoveAttachment && (
                                                                    <p className="text-xs text-amber-200">
                                                                        Attachment will be detached on save.
                                                                    </p>
                                                                )}

                                                                <div className="flex gap-2">
                                                                    <button
                                                                        type="submit"
                                                                        className="rounded-xl bg-blue-500 px-4 py-2 text-xs font-bold text-white shadow hover:bg-blue-400"
                                                                    >
                                                                        Save changes
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setEditingPostId(null);
                                                                            setEditingRemoveAttachment(false);
                                                                        }}
                                                                        className="rounded-xl border border-white/15 px-4 py-2 text-xs font-semibold"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </form>
                                                        ) : (
                                                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-blue-100/85">
                                                                {post.content}
                                                            </p>
                                                        )}
                                                        {!isEditingThisPost && (
                                                            <PostAttachment
                                                                fileUrl={post.fileUrl}
                                                                fileType={post.fileType}
                                                                fileName={post.fileName}
                                                                fileSize={post.fileSize}
                                                            />
                                                        )}
                                                    </div>

                                                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3 text-xs">
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleToggleComments(postId)}
                                                                className="flex items-center gap-1.5 font-semibold text-blue-200 hover:text-white"
                                                            >
                                                                <FiMessageSquare size={14} />
                                                                {openCommentsPostId === postId ? "Hide comments" : "Comments"}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleBookmarkPost(post)}
                                                                className="flex items-center gap-1.5 font-semibold text-blue-200 hover:text-white"
                                                            >
                                                                <FiBookmark size={14} />
                                                                Save
                                                            </button>
                                                        </div>

                                                        <div className="flex items-center gap-3">
                                                            {isPostAuthor && !isEditingThisPost && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setEditingPostId(postId);
                                                                        setEditingPostContent(post.content || "");
                                                                        setEditingRemoveAttachment(false);
                                                                    }}
                                                                    className="flex items-center gap-1 text-blue-200/80 hover:text-white"
                                                                >
                                                                    <FiEdit2 size={13} /> Edit
                                                                </button>
                                                            )}

                                                            {canDelete && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeletePost(postId)}
                                                                    className="flex items-center gap-1 text-red-300/80 hover:text-red-200"
                                                                >
                                                                    <FiTrash2 size={13} /> Delete
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {openCommentsPostId === postId && (
                                                        <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-[#06172E]/80 p-4">
                                                            <form
                                                                onSubmit={(e) => handleCreateComment(e, postId)}
                                                                className="flex gap-2"
                                                            >
                                                                <input
                                                                    value={commentInputs[postId] || ""}
                                                                    onChange={(e) =>
                                                                        setCommentInputs((prev) => ({
                                                                            ...prev,
                                                                            [postId]: e.target.value,
                                                                        }))
                                                                    }
                                                                    placeholder="Write a reply…"
                                                                    maxLength={2000}
                                                                    required
                                                                    className="flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-blue-300"
                                                                />
                                                                <button
                                                                    type="submit"
                                                                    className="rounded-xl bg-blue-500 px-4 py-2 text-xs font-bold shadow hover:bg-blue-400"
                                                                >
                                                                    Reply
                                                                </button>
                                                            </form>

                                                            <div className="space-y-2 pt-2">
                                                                {(commentsByPost[postId] || []).map((comment) => {
                                                                    const commentId = comment.id || comment._id;
                                                                    const commentAuthorId =
                                                                        comment.author?.id ??
                                                                        comment.author?._id ??
                                                                        comment.user?.id ??
                                                                        comment.user?._id;
                                                                    const isCommentAuthor =
                                                                        commentAuthorId != null &&
                                                                        currentUserId != null &&
                                                                        String(commentAuthorId) === String(currentUserId);
                                                                    const canDeleteComment =
                                                                        isCommentAuthor || isOwner || isAdmin;

                                                                    return (
                                                                        <div
                                                                            key={commentId}
                                                                            className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-sm"
                                                                        >
                                                                            <div className="flex items-center justify-between text-xs text-blue-100/60">
                                                                                <span className="font-semibold text-blue-100">
                                                                                    {comment.author?.name || comment.user?.name || "Member"}
                                                                                </span>
                                                                                {canDeleteComment && (
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => handleDeleteComment(commentId, postId)}
                                                                                        className="text-red-300 hover:text-red-200"
                                                                                    >
                                                                                        Delete
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                            <p className="mt-1 text-sm text-blue-100/85">
                                                                                {comment.content}
                                                                            </p>
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
                        <div className="space-y-6">
                            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                                <div>
                                    <h2 className="text-xl font-bold">Community members</h2>
                                    <p className="mt-1 text-sm text-blue-100/60">
                                        View member roles and collaborate.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setActiveTab("Invitations")}
                                    className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold hover:bg-blue-400"
                                >
                                    <FiUserPlus size={17} /> Invite members
                                </button>
                            </div>

                            <div className="flex max-w-lg items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                                <FiSearch className="shrink-0 text-blue-100/50" />
                                <input
                                    value={search}
                                    onChange={(event) => handleSearchMembers(event.target.value)}
                                    placeholder="Search members by name or email…"
                                    className="w-full bg-transparent text-sm outline-none placeholder:text-blue-100/40"
                                />
                            </div>

                            {(search.trim() ? searchResults : members).length === 0 ? (
                                <EmptyState
                                    icon={FiUsers}
                                    title="No members found"
                                    description={searchingMembers ? "Searching users…" : "No community members match your search."}
                                />
                            ) : (
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {(search.trim() ? searchResults : members).map((member) => {
                                        const userId = member.user?.id ?? member.user?._id ?? member.id;
                                        const memberName = member.user?.name ?? member.name ?? "Community member";
                                        const role = String(member.role ?? "MEMBER").toUpperCase();
                                        const memberKey = userId ?? member.id;

                                        const canChangeRole =
                                            isOwner &&
                                            userId != null &&
                                            String(userId) !== String(currentUserId) &&
                                            role !== "OWNER";
                                        const canRemove =
                                            canManageMembers &&
                                            userId != null &&
                                            String(userId) !== String(currentUserId) &&
                                            (role === "MEMBER" || (isOwner && role === "ADMIN"));
                                        const canTransferOwnership =
                                            isOwner &&
                                            userId != null &&
                                            String(userId) !== String(currentUserId);

                                        return (
                                            <div
                                                key={memberKey}
                                                className="relative rounded-2xl border border-white/10 bg-white/[0.035] p-4 shadow"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/20 font-bold text-blue-100">
                                                            {memberName.slice(0, 1).toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="truncate font-semibold text-white">{memberName}</p>
                                                            <span className="mt-1 inline-block rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-blue-100/80">
                                                                {role}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {(canChangeRole || canTransferOwnership || canRemove) && (
                                                        <div className="relative">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setOpenMemberActionsId((prev) =>
                                                                        String(prev) === String(memberKey) ? null : memberKey
                                                                    )
                                                                }
                                                                className="rounded-lg p-1.5 text-blue-100/70 hover:bg-white/10 hover:text-white"
                                                            >
                                                                <FiMoreVertical size={18} />
                                                            </button>

                                                            {String(openMemberActionsId) === String(memberKey) && (
                                                                <div className="absolute right-0 top-9 z-20 w-48 rounded-xl border border-white/10 bg-[#09254A] p-1.5 shadow-xl">
                                                                    {canChangeRole && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={async () => {
                                                                                setOpenMemberActionsId(null);
                                                                                const nextRole = role === "ADMIN" ? "MEMBER" : "ADMIN";
                                                                                await updateCommunityMemberRole(communityId, userId, nextRole);
                                                                                setNotice(`Updated ${memberName} to ${nextRole}`);
                                                                                await loadCommunityData();
                                                                            }}
                                                                            className="w-full rounded-lg px-3 py-2 text-left text-xs text-blue-100 hover:bg-white/10"
                                                                        >
                                                                            {role === "ADMIN" ? "Demote to member" : "Promote to admin"}
                                                                        </button>
                                                                    )}

                                                                    {canTransferOwnership && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={async () => {
                                                                                setOpenMemberActionsId(null);
                                                                                if (!window.confirm(`Transfer ownership to ${memberName}?`)) return;
                                                                                await transferCommunityOwnership(communityId, userId);
                                                                                setNotice("Ownership transferred.");
                                                                                await loadCommunityData();
                                                                            }}
                                                                            className="w-full rounded-lg px-3 py-2 text-left text-xs text-amber-300 hover:bg-white/10"
                                                                        >
                                                                            Transfer ownership
                                                                        </button>
                                                                    )}

                                                                    {canRemove && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={async () => {
                                                                                setOpenMemberActionsId(null);
                                                                                if (!window.confirm(`Remove ${memberName}?`)) return;
                                                                                await removeCommunityMember(communityId, userId);
                                                                                setNotice("Member removed.");
                                                                                await loadCommunityData();
                                                                            }}
                                                                            className="w-full rounded-lg px-3 py-2 text-left text-xs text-red-300 hover:bg-red-500/10"
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
                                    })}
                                </div>
                            )}
                        </div>
                    ) : activeTab === "Invitations" ? (
                        <div className="max-w-3xl space-y-6">
                            <CommunityInvitations
                                communityId={communityId}
                                canManageInvites={isOwner || isAdmin}
                                pendingInvites={pendingInvites}
                                onRefresh={loadCommunityData}
                            />
                        </div>
                    ) : (
    
                        <div className="max-w-2xl space-y-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
                            <div className="flex items-center gap-3">
                                <div className="rounded-2xl bg-blue-500/20 p-3 text-blue-200">
                                    <FiInfo size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">About this community</h2>
                                    <p className="mt-1 text-sm text-blue-100/60">Community settings and overview.</p>
                                </div>
                            </div>

                            <div className="border-t border-white/10 pt-5">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-200">Description</h3>
                                <p className="mt-2 text-sm leading-relaxed text-blue-100/80">
                                    {community?.description || "No description provided."}
                                </p>
                            </div>

                            <div className="border-t border-white/10 pt-5">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-200">Community ID</h3>
                                <p className="mt-2 font-mono text-xs text-blue-100/70">{communityId}</p>
                            </div>

                            <div className="border-t border-white/10 pt-5">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-200">Actions</h3>
                                <div className="mt-3 flex flex-wrap gap-3">
                                    {isOwner && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setCommunityName(community?.name || "");
                                                    setCommunityDescription(community?.description || "");
                                                    setEditingCommunity(true);
                                                }}
                                                className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/5"
                                            >
                                                Edit community details
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleDeleteCommunity}
                                                className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/20"
                                            >
                                                Delete community
                                            </button>
                                        </>
                                    )}

                                    {!isOwner && (
                                        <button
                                            type="button"
                                            onClick={handleLeaveCommunity}
                                            className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-white/5"
                                        >
                                            Leave community
                                        </button>
                                    )}
                                </div>

                                {isOwner && editingCommunity && (
                                    <form onSubmit={handleUpdateCommunity} className="mt-4 space-y-4 rounded-2xl border border-white/10 bg-[#06172E] p-5">
                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-blue-100/70">Community name</label>
                                            <input
                                                value={communityName}
                                                onChange={(e) => setCommunityName(e.target.value)}
                                                maxLength={100}
                                                required
                                                className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-300"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-blue-100/70">Description</label>
                                            <textarea
                                                value={communityDescription}
                                                onChange={(e) => setCommunityDescription(e.target.value)}
                                                maxLength={2000}
                                                rows={3}
                                                className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-300"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                type="submit"
                                                disabled={savingCommunity}
                                                className="rounded-xl bg-blue-500 px-4 py-2 text-xs font-bold disabled:opacity-50"
                                            >
                                                {savingCommunity ? "Saving…" : "Save changes"}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setEditingCommunity(false)}
                                                className="rounded-xl border border-white/15 px-4 py-2 text-xs font-semibold"
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
        </div>
    );
}

export default CommunityDetails;
