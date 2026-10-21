import { useNavigate, useParams } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

import {
    getCommunityDetails,
    getCommunityMembers,
    getCommunityPosts,
    createCommunityPost,
    createCommunityInvite,
    updateCommunityPost,
    deleteCommunityPost,
    getPostComments,
    createPostComment,
    deletePostComment,
    searchCommunityUsers,
    removeCommunityMember,
    revokeCommunityInvite,
    leaveCommunity,
    updateCommunity,
    deleteCommunity,
    updatePostComment,
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
} from "react-icons/fi";


const tabs = [
    { label: "Posts", icon: FiMessageSquare },
    { label: "Members", icon: FiUsers },
    { label: "About", icon: FiInfo },
];


function CommunityDetails() {
    const navigate = useNavigate();
    const { communityId } = useParams();

    const [activeTab, setActiveTab] = useState("Posts");
    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState([]);
const [searchingMembers, setSearchingMembers] = useState(false);

    const [community, setCommunity] = useState(null);
    const [posts, setPosts] = useState([]);
    const [members, setMembers] = useState([]);

    const [postContent, setPostContent] = useState("");
    const [creatingPost, setCreatingPost] = useState(false);
    const { user } = useAuth();

    const currentUserId = user?.id ?? user?._id;
    
    const currentMember = members.find(
        
        (member) =>
            String(member.user?.id ?? member.user?._id ?? member.id) ===
            String(currentUserId)
    )
    const currentUserRole = currentMember?.role?.toUpperCase();
    const isOwner = currentUserRole === "OWNER";
    const isAdmin = currentUserRole === "ADMIN";
    const canManageMembers = isOwner || isAdmin;
     const [notice, setNotice] = useState("");
    const [inviteLink, setInviteLink] = useState("");
    const [inviteId, setInviteId] = useState("");
    const [editingPostId, setEditingPostId] = useState(null);
    const [editingPostContent, setEditingPostContent] = useState("");
    const [editingCommunity, setEditingCommunity] = useState(false);
    const [showCommunityActions, setShowCommunityActions] = useState(false);
    const [openMemberActionsId, setOpenMemberActionsId] = useState(null);
    const [communityName, setCommunityName] = useState("");
    const [communityDescription, setCommunityDescription] = useState("");
    const [savingCommunity, setSavingCommunity] = useState(false);
    const [openCommentsPostId, setOpenCommentsPostId] = useState(null);
    const [commentsByPost, setCommentsByPost] = useState({});
    const [commentInputs, setCommentInputs] = useState({});
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editingCommentContent, setEditingCommentContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");


    const loadCommunityData = useCallback(async () => {
        if (!communityId) {
            setError("Community ID is missing.");
            setLoading(false);
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
    
            const fetchAllPages = async (fetchPage, listKey) => {
                let allItems = [];
                let cursor;
                const seenCursors = new Set();
    
                for (let page = 0; page < 100; page++) {
                    const response = await fetchPage(cursor);
    
                    let result = response?.data ?? response;
                    result = result?.data ?? result;
    
                    const items = Array.isArray(result?.[listKey])
                        ? result[listKey]
                        : Array.isArray(result)
                            ? result
                            : [];
    
                    allItems = [...allItems, ...items];
    
                    const nextCursor = result?.nextCursor;
                    const hasNextPage = result?.hasNextPage;
    
                    if (
                        !hasNextPage ||
                        nextCursor == null ||
                        seenCursors.has(String(nextCursor))
                    ) {
                        break;
                    }
    
                    seenCursors.add(String(nextCursor));
                    cursor = nextCursor;
                }
    
                return allItems;
            };
    
            const [allMembers, allPosts] = await Promise.all([
                fetchAllPages(
                    (cursor) =>
                        getCommunityMembers(communityId, {
                            cursor,
                            limit: 20,
                        }),
                    "members"
                ),
                fetchAllPages(
                    (cursor) =>
                        getCommunityPosts(communityId, {
                            cursor,
                            limit: 20,
                        }),
                    "posts"
                ),
            ]);
    
            setMembers(allMembers);
            setPosts(allPosts);
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
    
    async function handleCreatePost(event) {

        event.preventDefault();
    
        const content = postContent.trim();
        if (!content || creatingPost) return;
    
        setCreatingPost(true);
        setError("");
        setNotice("");
    
        try {
            await createCommunityPost(communityId, content);
            setPostContent("");
            setNotice("Post published.");
            await loadCommunityData();
        } catch (err) {
            console.error("Failed to publish post:", err);
            setError(
                err.response?.data?.message ||
                "Could not publish the post."
            );
        } finally {
            setCreatingPost(false);
        }
    }


    async function handleUpdatePost(event, postId) {
        event.preventDefault();
        const content = editingPostContent.trim();
        if (!content) return;
    
        try {
            await updateCommunityPost(postId, content);
            setEditingPostId(null);
            setNotice("Post updated.");
            await loadCommunityData();
        } catch (err) {
            setError(err.response?.data?.message || "Could not update post.");
        }
    }
    
    async function handleDeletePost(postId) {
        if (!window.confirm("Delete this post?")) return;
    
        try {
            await deleteCommunityPost(postId);
            setNotice("Post deleted.");
            await loadCommunityData();
        } catch (err) {
            setError(err.response?.data?.message || "Could not delete post.");
        }
    }

    const handleDeleteComment = async (commentId, postId) => {
        try {
            await deletePostComment(commentId);
            setNotice("Comment deleted successfully.");
            if (postId) {
                const allComments = await fetchAllPostComments(postId);

                setCommentsByPost((prev) => ({
                    ...prev,
                    [postId]: allComments,
                }));
            }
            setError("");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Could not delete comment."
            );
        }
    };

async function handleToggleComments(postId) {
    async function fetchAllPostComments(postId) {
        let allComments = [];
        let cursor;
        const seenCursors = new Set();
    
        for (let page = 0; page < 100; page++) {
            const response = await getPostComments(postId, {
                cursor,
                limit: 20,
            });
    
            let result = response?.data ?? response;
            result = result?.data ?? result;
    
            const comments = Array.isArray(result?.comments)
                ? result.comments
                : Array.isArray(result)
                    ? result
                    : [];
    
            allComments = [...allComments, ...comments];
    
            const nextCursor = result?.nextCursor;
    
            if (
                !result?.hasNextPage ||
                nextCursor == null ||
                seenCursors.has(String(nextCursor))
            ) {
                break;
            }
    
            seenCursors.add(String(nextCursor));
            cursor = nextCursor;
        }
    
        return allComments;
    }
    
    if (openCommentsPostId === postId) {
        setOpenCommentsPostId(null);
        return;
    }

    setOpenCommentsPostId(postId);

    try {
        const allComments = await fetchAllPostComments(postId);
    
        setCommentsByPost((previous) => ({
            ...previous,
            [postId]: allComments,
        }));
    } catch (err) {
        setError(
            err.response?.data?.message ||
            "Could not load comments."
        );
    }    
}

    async function handleCreateComment(event, postId) {
        event.preventDefault();
        const content = (commentInputs[postId] || "").trim();
        if (!content) return;
    
        try {
            await createPostComment(postId, content);
            setCommentInputs((previous) => ({ ...previous, [postId]: "" }));
            setNotice("Comment added.");

            const allComments = await fetchAllPostComments(postId);

            setCommentsByPost((previous) => ({
                ...previous,
                [postId]: allComments,
            }));
            
        } catch (err) {
            setError(err.response?.data?.message || "Could not add comment.");
        }
    }
        const handleUpdateComment = async (commentId) => {
            const content = editingCommentContent.trim();
        
            if (!content) {
                setNotice("Comment cannot be empty.");
                return;
            }
        
            try {
                await updatePostComment(commentId, content);
        
                setCommentsByPost((previous) => {
                    const updated = { ...previous };
        
                    Object.keys(updated).forEach((postId) => {
                        updated[postId] = updated[postId].map((comment) =>
                            (comment.id === commentId ||
                                comment._id === commentId)
                                ? { ...comment, content }
                                : comment
                        );
                    });
        
                    return updated;
                });
        
                setEditingCommentId(null);
                setEditingCommentContent("");
                setNotice("Comment updated successfully.");
            } catch (error) {
                setNotice(
                    error.response?.data?.message ||
                    "Could not update the comment."
                );
            }
        };
    


        async function handleInvite() {
            setError("");
            setNotice("");
            setInviteLink("");
            setInviteId("");
        
            try {
                const response = await createCommunityInvite(communityId);
                const result = response?.data ?? response;
                const inviteData = result?.data ?? result;
        
                const inviteUrl = inviteData?.inviteUrl;
                const newInviteId =
                    inviteData?.id ??
                    inviteData?._id ??
                    inviteData?.inviteId;
        
                if (!inviteUrl) {
                    throw new Error(
                        "Backend response mein inviteUrl nahi mila."
                    );
                }
        
                setInviteLink(inviteUrl);
        
                if (newInviteId != null) {
                    setInviteId(String(newInviteId));
                }
        
                setNotice(
                    newInviteId != null
                        ? "Invitation created. Copy and share this link."
                        : "Invitation created. Revoke option needs the invite ID from the API response."
                );
            } catch (err) {
                console.error("Failed to create invite:", err);
                setError(
                    err.response?.data?.message ||
                    err.message ||
                    "Could not generate an invitation link."
                );
            }
        }

        async function handleRevokeInvite() {
            if (!inviteId) {
                setError("Invite ID nahi mili. Pehle naya invite generate karo.");
                return;
            }
        
            const confirmed = window.confirm(
                "Are you sure you want to revoke this invitation link?"
            );
        
            if (!confirmed) return;
        
            setError("");
            setNotice("");
        
            try {
                await revokeCommunityInvite(communityId, inviteId);
        
                setInviteId("");
                setInviteLink("");
                setNotice("Invitation revoked successfully.");
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    "Could not revoke this invitation."
                );
            }
        }
                
async function handleLeaveCommunity() {
    if (
        !window.confirm(
            "Are you sure you want to leave this community?"
        )
    ) {
        return;
    }
    setError("");
    setNotice("");

    try {
        await leaveCommunity(communityId);
        navigate("/communities", { replace: true });
    } catch (err) {
        setError(
            err.response?.data?.message ||
            "Could not leave community."
        );
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
        setNotice("");
    
        try {
            await updateCommunity(communityId, {
                name,
                description,
            });
    
            setEditingCommunity(false);
            setNotice("Community updated successfully.");
            await loadCommunityData();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Could not update community."
            );
        } finally {
            setSavingCommunity(false);
        }
    }
    
    async function handleDeleteCommunity() {
        if (
            !window.confirm(
                "Delete this community permanently? This action cannot be undone."
            )
        ) {
            return;
        }
        setError("");
        setNotice("");
        try {
            await deleteCommunity(communityId);
            navigate("/communities", { replace: true });
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Could not delete community."
            );
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
        const response = await searchCommunityUsers(
            communityId,
            query.trim()
        );

        const result = response?.data ?? response;
        const data = result?.data ?? result;

        setSearchResults(
            Array.isArray(data?.users)
                ? data.users
                : Array.isArray(data?.members)
                    ? data.members
                    : Array.isArray(data)
                        ? data
                        : []
        );
    } catch (err) {
        setError(
            err.response?.data?.message ||
            "Could not search community members."
        );
    } finally {
        setSearchingMembers(false);
    }
}

    const isEmpty = {
        Posts: posts.length === 0,
        Members: members.length === 0,
    };

    const activeTabData = tabs.find(
        (tab) => tab.label === activeTab
    );

    const EmptyState = ({
        icon: Icon,
        title,
        description,
        actionLabel,
        onAction,
    }) => (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/[0.03] px-5 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 text-blue-200">
                <Icon size={25} />
            </div>

            <h3 className="mt-4 text-base font-semibold text-white">
                {title}
            </h3>

            <p className="mt-2 max-w-sm text-sm leading-6 text-blue-100/60">
                {description}
            </p>

            {actionLabel && (
                <button
                    type="button"
                    onClick={onAction}
                    className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400"
                >
                    <FiPlus size={17} />
                    {actionLabel}
                </button>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-[#062C5F] text-white">
            {/* Header */}
            <header className="sticky top-0 z-30 border-b border-white/10 bg-[#062C5F]">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
                    <button
                        type="button"
                        onClick={() => navigate("/communities")}
                        className="flex items-center gap-2 text-sm text-white/75 transition hover:text-white"
                    >
                        <FiArrowLeft size={18} />
                        <span>Communities</span>
                    </button>

                    <span className="text-lg font-bold tracking-widest">
                        QUORUM
                    </span>

                    <button
                        type="button"
                      onClick={() => setActiveTab("About")}
                        aria-label="Community settings"
                        className="rounded-lg p-2 text-white/75 transition hover:bg-white/10 hover:text-white"
                    >
                        <FiSettings size={19} />
                    </button>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-5 py-7 sm:px-8 sm:py-9">

            {/* Community header  */}
                <section className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 sm:p-7">
                    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                        <div className="flex min-w-0 items-start gap-4">
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-blue-500/20 text-blue-200">
                                <FiUsers size={30} />
                            </div>

                            <div className="min-w-0">
                                <h1 className="break-words text-2xl font-bold sm:text-3xl">
                                    {community?.name || "Community"}
                                </h1>

                                <p className="mt-2 text-sm text-blue-100/70">
                                    {community?.description ||
                                        "Your space to connect and collaborate."}
                                </p>

                                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-blue-100/60">
                                    <FiUsers size={15} />
                                    {community?.memberCount ?? "—"} members
                                    <span>·</span>
                                    <span>Community workspace</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={handleInvite}
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold transition hover:bg-blue-400"
                            >
                                <FiUserPlus size={17} />
                                Invite
                            </button>
                        </div>
                    </div>
                </section>

                {/* Error */}
                {error && (
                    <div
                        role="status"
                        className="mt-4 flex items-start justify-between gap-3 rounded-lg border border-blue-300/20 bg-blue-400/10 p-4 text-sm text-blue-100"
                    >
                        <p>{error}</p>

                        <button
                            type="button"
                            onClick={() => setError("")}
                            aria-label="Dismiss message"
                            className="text-white/70 hover:text-white"
                        >
                            ×
                        </button>
                    </div>
                )}

{notice && (
    <div
        role="status"
        className="fixed right-5 top-20 z-[100] max-w-sm rounded-lg border border-green-300/20 bg-[#064E3B] p-4 text-sm text-green-100 shadow-xl shadow-black/20"
    >
        {notice}
    </div>
)}


{inviteLink && (
    <div className="mt-3 rounded-lg border border-white/10 p-4">
        <p className="break-all text-sm">{inviteLink}</p>
        <button
            type="button"
            onClick={() => navigator.clipboard.writeText(inviteLink)}
            className="mt-2 rounded-lg bg-blue-500 px-3 py-2 text-sm"
        >
            Copy invite link
        </button>
        {inviteId && (
    <button
        type="button"
        onClick={handleRevokeInvite}
        className="mt-3 rounded-lg border border-red-400/30 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10"
    >
        Revoke invite
    </button>
)}
    </div>
)}    
            <nav className="mt-7 flex gap-1 overflow-x-auto border-b border-white/10">
                    {tabs.map(({ label, icon: Icon }) => (
                        <button
                            key={label}
                            type="button"
                            onClick={() => {
                                setActiveTab(label);
                                setError("");
                            }}
                            className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
                                activeTab === label
                                    ? "border-blue-300 text-white"
                                    : "border-transparent text-blue-100/60 hover:text-white"
                            }`}
                        >
                            <Icon size={17} />
                            {label}
                        </button>
                    ))}
                </nav>

                {/* tab content */}
                <section className="mt-6">
                    {loading ? (
                        <div className="flex flex-col items-center py-16 text-blue-100/70">
                            <FiRefreshCw className="animate-spin" size={24} />
                            <p className="mt-3 text-sm">
                                Loading community...
                            </p>
                        </div>
                    ) : activeTab === "Posts" ? (
                        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
                            <div className="min-w-0 space-y-5">
                               
                                <div className="rounded-xl border border-white/10 bg-white/[0.05] p-4 sm:p-5">
                                    <h2 className="font-semibold">
                                        Community discussion
                                    </h2>

                                    <p className="mt-2 text-sm text-blue-100/60">
                                        Share announcements, questions and updates with members.
                                    </p>

                                  
<form onSubmit={handleCreatePost}>
    <textarea
        value={postContent}
        onChange={(event) => setPostContent(event.target.value)}
        placeholder="Share an update with your community..."
        maxLength={5000}
        rows={3}
        required
        className="mt-4 w-full rounded-lg border border-white/10 bg-[#061B38] px-4 py-3 text-sm text-white outline-none placeholder:text-blue-100/40 focus:border-blue-400"
    />

    <button
        type="submit"
        disabled={creatingPost || !postContent.trim()}
        className="mt-3 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
    >
        {creatingPost ? "Publishing..." : "Publish post"}
    </button>
</form>

</div>

{isEmpty.Posts ? (
<EmptyState
icon={FiMessageSquare}
title="No posts yet"
description="Start a conversation with your community. Posts will appear here once the API is connected."
/>
) : (
posts.map((post) => (
<article
key={post.id || post._id}
className="rounded-xl border border-white/10 bg-white/[0.05] p-5"
>
     <p className="text-xs text-blue-100/60">
         {post.author?.name || "Community member"}
            </p>

                                            
<div className="mt-2">
    {editingPostId === (post.id || post._id) ? (
        <form
            onSubmit={(event) => handleUpdatePost(event, post.id || post._id)}
        >
            <textarea
                value={editingPostContent}
                onChange={(event) => setEditingPostContent(event.target.value)}
                maxLength={5000}
                required
                className="w-full rounded-lg border border-white/10 bg-[#061B38] p-3 text-sm text-white"
            />
            <button type="submit" className="mt-2 rounded-lg bg-blue-500 px-3 py-2 text-sm">
                Save
            </button>
            <button
                type="button"
                onClick={() => setEditingPostId(null)}
                className="ml-2 rounded-lg border border-white/20 px-3 py-2 text-sm"
            >
                Cancel
            </button>
        </form>
    ) : (
        <p className="whitespace-pre-wrap text-sm leading-6 text-blue-100/75">
            {post.content}
        </p>
    )}
</div>

<div className="mt-4 flex flex-wrap gap-3">
{(() => {
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

    return (
        <>
            {isPostAuthor && (
                <button
                    type="button"
                    onClick={() => {
                        setEditingPostId(post.id || post._id);
                        setEditingPostContent(post.content || "");
                    }}
                    className="text-sm text-blue-200 hover:text-white"
                >
                    Edit post
                </button>
            )}

            {(isPostAuthor || isOwner || isAdmin) && (
                <button
                    type="button"
                    onClick={() =>
                        handleDeletePost(post.id || post._id)
                    }
                    className="text-sm text-red-300 hover:text-red-200"
                >
                    Delete post
                </button>
            )}
        </>
    );
})()}
<button
    type="button"
    onClick={() => handleToggleComments(post.id || post._id)}
    className="text-sm text-blue-200 hover:text-white"
>
    {openCommentsPostId === (post.id || post._id)
        ? "Hide comments"
        : "Comments"}
</button>
</div>

{openCommentsPostId === (post.id || post._id) && (
    <div className="mt-4 border-t border-white/10 pt-4">
        <form onSubmit={(event) => handleCreateComment(event, post.id || post._id)}>
            <input
                value={commentInputs[post.id || post._id] || ""}
                onChange={(event) =>
                    setCommentInputs((previous) => ({
                        ...previous,
                        [post.id || post._id]: event.target.value,
                    }))
                }
                placeholder="Write a comment..."
                maxLength={2000}
                required
                className="w-full rounded-lg border border-white/10 bg-[#061B38] px-3 py-2 text-sm text-white"
            />
            <button type="submit" className="mt-2 rounded-lg bg-blue-500 px-3 py-2 text-sm">
                Add comment
            </button>
        </form>   
{(commentsByPost[post.id || post._id] || []).map((comment) => {
    const commentId = comment.id || comment._id;
    const isEditing = editingCommentId === commentId;
    const commentAuthorId =
    comment.author?.id ??
    comment.author?._id ??
    comment.user?.id ??
    comment.user?._id ??
    comment.authorId ??
    comment.userId;

const isCommentAuthor =
    commentAuthorId != null &&
    currentUserId != null &&
    String(commentAuthorId) === String(currentUserId);
    return (
        <div
            key={commentId}
            className="mt-3 rounded-lg bg-white/5 p-3"
        >
            <p className="text-xs text-blue-100/60">
                {comment.author?.name ||
                    comment.user?.name ||
                    "Member"}
            </p>

            {isEditing ? (
                <div className="mt-2">
                    <textarea
                        value={editingCommentContent}
                        onChange={(e) =>
                            setEditingCommentContent(e.target.value)
                        }
                        rows={3}
                        maxLength={5000}
                        className="w-full rounded-lg border border-white/10 bg-slate-900 p-3 text-sm text-white outline-none focus:border-blue-400"
                        placeholder="Edit your comment..."
                    />

                    <div className="mt-2 flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={() =>
                                handleUpdateComment(commentId)
                            }
                            className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-500"
                        >
                            Save
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setEditingCommentId(null);
                                setEditingCommentContent("");
                            }}
                            className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/70 hover:bg-white/5"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <p className="mt-1 whitespace-pre-wrap text-sm">
                        {comment.content}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-3">
    {isCommentAuthor && (
        <button
            type="button"
            onClick={() => {
                setEditingCommentId(commentId);
                setEditingCommentContent(comment.content || "");
            }}
            className="text-xs text-blue-300 hover:text-blue-200"
        >
            Edit
        </button>
    )}
{(
    isCommentAuthor ||
    (currentMember?.role?.toUpperCase() === "OWNER") ||
    (currentMember?.role?.toUpperCase() === "ADMIN")
) && (
        <button
            type="button"
            onClick={() =>
                handleDeleteComment(
                    commentId,
                    post.id || post._id
                )
            }
            className="text-xs text-red-300 hover:text-red-200"
        >
            Delete comment
        </button>
    )}
</div>
                </>
            )}
        </div>
    );
})}
    </div>
)}


          {post.createdAt && (
          <p className="mt-3 text-xs text-blue-100/50">
            {new Date(post.createdAt).toLocaleString()}
                 </p>
             )}
          </article>
                                        
             ))
          )}
                                
          </div>

          
     <aside className="space-y-5">
       <div className="rounded-xl border border-white/10 bg-white/[0.05] p-5">
       <h2 className="font-semibold">
       About community
      </h2>
  <p className="mt-3 text-sm leading-6 text-blue-100/65">
   {community?.description ||
       "Community information will appear here once loaded."}
        </p>
  <div className="mt-5 flex items-center gap-3 border-t border-white/10 pt-4 text-sm text-blue-100/65">
     <FiUsers size={18} />
        {community?.memberCount ?? "—"} members
           </div>
         </div>
     <div className="rounded-xl border border-white/10 bg-white/[0.05] p-5">
       <div className="flex items-center justify-between gap-2">
       <h2 className="font-semibold">
                   Members
                   </h2>
           <button
             type="button"
             onClick={() => setActiveTab("Members")}
             className="text-xs text-blue-200 hover:text-white" >
              View all
            </button>
        </div>
         {isEmpty.Members ? (
           <p className="mt-4 text-sm leading-6 text-blue-100/55">
         Member information will appear here after integration.
          </p>
         ) : (
            members.slice(0, 4).map((member) => (
           <p key={member.id} className="mt-3 text-sm">
           {member.user?.name ?? member.name ?? "Community member"}
             </p>
         ))
      )}
           </div>
      </aside>
        </div>
      ) : activeTab === "Members" ? (
         <div>
           <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
          <h2 className="text-xl font-bold">
          Community members
          </h2>
          <p className="mt-1 text-sm text-blue-100/60">
           View and manage community members.
          </p>
          </div>
<button
type="button"
onClick={handleInvite}
className="inline-flex items-center justify-center gap-2 self-start rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold hover:bg-blue-400">
<FiUserPlus size={17} />
Invite members
</button>
</div>
     <div className="mt-5 flex max-w-lg items-center gap-3 rounded-lg border border-white/10 bg-white/[0.05] px-4 py-3">
    <FiSearch className="shrink-0 text-blue-100/50" />
       <input
          value={search}
         onChange={(event) => handleSearchMembers(event.target.value)} 
          placeholder="Search members"
          aria-label="Search members"
         className="w-full bg-transparent text-sm outline-none placeholder:text-blue-100/40"/>
          </div>
           {(search.trim() ? searchResults : members).length === 0 ? (
           <div className="mt-5">
             <EmptyState
          icon={FiUsers}
            title="No members found"
             description={searchingMembers ? "Searching users...": search.trim()
             ? "No matching users found."
              : "No community members are available to display."}  />
              </div>
          ) : (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(search.trim() ? searchResults : members).map((member) => {
                    const userId = member.user?.id ?? member.user?._id;
                    const memberName =
                        member.user?.name ??
                        member.name ??
                        "Community member";
            
                    const role = String(member.role ?? "MEMBER").toUpperCase();
            
                    const isActualMember = members.some((item) => {
                        const itemUserId = item.user?.id ?? item.user?._id;
                        return (
                            userId != null &&
                            itemUserId != null &&
                            String(userId) === String(itemUserId)
                        );
                    });
            
                    const canChangeRole =
                        isOwner &&
                        isActualMember &&
                        userId != null &&
                        String(userId) !== String(currentUserId) &&
                        role !== "OWNER";
            
                    const canRemove =
                        canManageMembers &&
                        isActualMember &&
                        userId != null &&
                        String(userId) !== String(currentUserId) &&
                        (role === "MEMBER" || (isOwner && role === "ADMIN"));
            
                    const canTransferOwnership =
                        isOwner &&
                        isActualMember &&
                        userId != null &&
                        String(userId) !== String(currentUserId);
            
  
                        const memberKey = userId ?? member.id ?? member._id;

                  return (
                   <div
                    key={memberKey}
                     className="relative rounded-xl border border-white/10 bg-white/[0.05] p-4"
                     >
                    <div className="flex items-start justify-between gap-3">
                   <div className="min-w-0">
                     <p className="break-words font-medium text-white">
                       {memberName}
                    </p>
                 <span className="mt-2 inline-block rounded-full border border-white/10 px-2.5 py-1 text-xs text-blue-100/80">
                    {role}
                </span>
                   </div>
                {(canChangeRole ||
                 canTransferOwnership ||
                    canRemove) && (
                      <div className="relative shrink-0">
                        <button
                       type="button"
                         onClick={() =>
                         setOpenMemberActionsId((previous) =>
                          String(previous) === String(memberKey)
                           ? null
                           : memberKey
                             )
                         }
                            aria-label={`Actions for ${memberName}`}
                             aria-expanded={
                               String(openMemberActionsId) ===
                              String(memberKey)
                                }
                                 className="flex h-9 w-9 items-center justify-center rounded-lg text-blue-100/70 transition hover:bg-white/10 hover:text-white"
                                  >
                                 <FiMoreVertical size={20} />
                                   </button>
                             {String(openMemberActionsId) ===
                               String(memberKey) && (
                                <div className="absolute right-0 top-10 z-20 w-48 rounded-xl border border-white/10 bg-[#09254A] p-1.5 shadow-xl shadow-black/30">
                                {canChangeRole && (
                                   <button
                                  type="button"
                                   onClick={async () => {
                                   setOpenMemberActionsId(null);
                                      const nextRole =
                                      role === "ADMIN"
                                      ? "MEMBER"
                                      : "ADMIN";

                              if (
                                  !window.confirm(
                                      `Change ${memberName}'s role to ${nextRole}?`
                                  )
                              ) return;

                              try {
                                  await updateCommunityMemberRole(
                                      communityId,
                                      userId,
                                      nextRole
                                  );
                                  setNotice("Member role updated.");
                                  await loadCommunityData();
                              } catch (err) {
                                  setError(
                                      err.response?.data?.message ||
                                      "Could not update member role."
                                  );
                              }
                          }}
                      >
                          {role === "ADMIN"
                              ? "Change to member"
                              : "Make admin"}
                      </button>
                  )}

                  {canTransferOwnership && (
                      <button
                          type="button"
                          className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-amber-300 transition hover:bg-white/10 hover:text-amber-200"
                          onClick={async () => {
                              setOpenMemberActionsId(null);

                              if (
                                  !window.confirm(
                                      `Transfer community ownership to ${memberName}? You will become an admin.`
                                  )
                              ) return;

                              try {
                                  await transferCommunityOwnership(
                                      communityId,
                                      userId
                                  );
                                  setNotice(
                                      "Community ownership transferred."
                                  );
                                  await loadCommunityData();
                              } catch (err) {
                                  setError(
                                      err.response?.data?.message ||
                                      "Could not transfer ownership."
                                  );
                              }
                          }}
                      >
                          Transfer ownership
                      </button>
                  )}

                  {canRemove && (
                      <button
                          type="button"
                          className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-red-300 transition hover:bg-red-500/10 hover:text-red-200"
                          onClick={async () => {
                              setOpenMemberActionsId(null);

                              if (
                                  !window.confirm(
                                      `Remove ${memberName} from this community?`
                                  )
                              ) return;

                              try {
                                  await removeCommunityMember(
                                      communityId,
                                      userId
                                  );
                                  setNotice("Member removed.");
                                  await loadCommunityData();
                              } catch (err) {
                                  setError(
                                      err.response?.data?.message ||
                                      "Could not remove member."
                                  );
                              }
                          }}
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
        ) : (
   <div className="rounded-xl border border-white/10 bg-white/[0.05] p-5 sm:p-7">
     <div className="flex items-center gap-3">
      <div className="rounded-xl bg-blue-500/15 p-3 text-blue-200">
    <FiInfo size={24} />
      </div>
      <div>
      <h2 className="text-xl font-bold">
         About this community
         </h2>
      <p className="mt-1 text-sm text-blue-100/60">
      Community details and settings.
     </p>
      </div>
      </div>
      <div className="mt-6 border-t border-white/10 pt-5">
       <h3 className="text-sm font-semibold text-blue-100/60">
        DESCRIPTION
     </h3>
 <p className="mt-2 text-sm leading-7 text-blue-100/80">
      {community?.description ||
      "The community description will appear here when details are fetched from the backend."}
    </p>
  </div>

   <div className="mt-6 border-t border-white/10 pt-5">
    <h3 className="text-sm font-semibold text-blue-100/60">
        COMMUNITY ID
       </h3>
         <p className="mt-2 break-all font-mono text-sm text-blue-100/75">
              {communityId}
           </p>
             </div> 
<div className="mt-6 border-t border-white/10 pt-5">
    <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-blue-100/60">
            COMMUNITY ACTIONS
        </h3>

        <div className="relative">
            <button
                type="button"
                onClick={() =>
                    setShowCommunityActions((previous) => !previous)
                }
                aria-label="Community actions"
                aria-expanded={showCommunityActions}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-blue-100/80 transition hover:bg-white/10 hover:text-white"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                >
                    <circle cx="12" cy="5" r="1.8" />
                    <circle cx="12" cy="12" r="1.8" />
                    <circle cx="12" cy="19" r="1.8" />
                </svg>
            </button>

            {showCommunityActions && (
                <>
                    <button
                        type="button"
                        aria-label="Close community actions menu"
                        className="fixed inset-0 z-10 cursor-default"
                        onClick={() => setShowCommunityActions(false)}
                    />

                    <div className="absolute right-0 top-11 z-20 w-56 overflow-hidden rounded-xl border border-white/10 bg-slate-900 p-1.5 shadow-xl shadow-black/30">
                        {isOwner && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCommunityName(community?.name ?? "");
                                        setCommunityDescription(
                                            community?.description ?? ""
                                        );
                                        setEditingCommunity(true);
                                        setError("");
                                        setNotice("");
                                        setShowCommunityActions(false);
                                    }}
                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-blue-100/90 transition hover:bg-white/[0.07] hover:text-white"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="17"
                                        height="17"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M12 20h9" />
                                        <path d="m16.5 3.5 4 4L8 20l-5 1 1-5Z" />
                                    </svg>
                                    Edit Community
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCommunityActions(false);
                                        handleDeleteCommunity();
                                    }}
                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-red-300 transition hover:bg-red-500/10"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="17"
                                        height="17"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M3 6h18" />
                                        <path d="M8 6V4h8v2" />
                                        <path d="m19 6-1 14H6L5 6" />
                                        <path d="M10 11v5M14 11v5" />
                                    </svg>
                                    Delete Community
                                </button>

                                <div className="my-1 border-t border-white/10" />
                            </>
                        )}

                        <button
                            type="button"
                            onClick={() => {
                                setShowCommunityActions(false);
                                handleLeaveCommunity();
                            }}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-blue-100/90 transition hover:bg-white/[0.07] hover:text-white"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="17"
                                height="17"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <path d="m16 17 5-5-5-5" />
                                <path d="M21 12H9" />
                            </svg>
                            Leave Community
                        </button>
                    </div>
                </>
            )}
        </div>
    </div>

    {isOwner && editingCommunity && (
        <form
            onSubmit={handleUpdateCommunity}
            className="mt-4 space-y-4 rounded-xl border border-white/10 p-4"
        >
            <div>
                <label className="mb-1 block text-sm text-blue-100/70">
                    Community name
                </label>
                <input
                    type="text"
                    value={communityName}
                    onChange={(event) =>
                        setCommunityName(event.target.value)
                    }
                    maxLength={100}
                    required
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-400"
                />
            </div>

            <div>
                <label className="mb-1 block text-sm text-blue-100/70">
                    Description
                </label>
                <textarea
                    value={communityDescription}
                    onChange={(event) =>
                        setCommunityDescription(event.target.value)
                    }
                    rows={4}
                    maxLength={2000}
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-400"
                />
            </div>

            <div className="flex flex-wrap gap-3">
                <button
                    type="submit"
                    disabled={savingCommunity}
                    className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {savingCommunity ? "Saving..." : "Save changes"}
                </button>

                <button
                    type="button"
                    onClick={() => setEditingCommunity(false)}
                    disabled={savingCommunity}
                    className="rounded-lg border border-white/10 px-4 py-2.5 text-sm text-white/80 transition hover:bg-white/5 disabled:opacity-50"
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
