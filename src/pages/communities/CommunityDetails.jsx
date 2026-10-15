import { useNavigate, useParams } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";


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
    leaveCommunity,
    updateCommunity,
    deleteCommunity,
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

     const [notice, setNotice] = useState("");
    const [inviteLink, setInviteLink] = useState("");
    const [editingPostId, setEditingPostId] = useState(null);
    const [editingPostContent, setEditingPostContent] = useState("");
    const [openCommentsPostId, setOpenCommentsPostId] = useState(null);
    const [commentsByPost, setCommentsByPost] = useState({});
    const [commentInputs, setCommentInputs] = useState({});
  


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
            const [detailsResponse, membersResponse, postsResponse] =
                await Promise.all([
                    getCommunityDetails(communityId),
                    getCommunityMembers(communityId),
                    getCommunityPosts(communityId),
                ]);
    
            const details = detailsResponse?.data ?? detailsResponse;
            const memberData = membersResponse?.data ?? membersResponse;
            const postData = postsResponse?.data ?? postsResponse;
    
            setCommunity(details?.community ?? details);
    
            setMembers(
                Array.isArray(memberData?.members)
                    ? memberData.members
                    : Array.isArray(memberData)
                        ? memberData
                        : []
            );
    
            setPosts(
                Array.isArray(postData?.posts)
                    ? postData.posts
                    : Array.isArray(postData)
                        ? postData
                        : []
            );
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
    
    async function handleToggleComments(postId) {
        if (openCommentsPostId === postId) {
            setOpenCommentsPostId(null);
            return;
        }
    
        setOpenCommentsPostId(postId);
    
        try {
            const response = await getPostComments(postId);
            const result = response?.data ?? response;
            const data = result?.data ?? result;
            const comments = Array.isArray(data?.comments)
                ? data.comments
                : Array.isArray(data) ? data : [];
    
            setCommentsByPost((previous) => ({
                ...previous,
                [postId]: comments,
            }));
        } catch (err) {
            setError(err.response?.data?.message || "Could not load comments.");
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
    
            const response = await getPostComments(postId);
            const result = response?.data ?? response;
            const data = result?.data ?? result;
            const comments = Array.isArray(data?.comments)
                ? data.comments
                : Array.isArray(data) ? data : [];
    
            setCommentsByPost((previous) => ({
                ...previous,
                [postId]: comments,
            }));
        } catch (err) {
            setError(err.response?.data?.message || "Could not add comment.");
        }
    }
    
    async function handleDeleteComment(commentId, postId) {
        if (!window.confirm("Delete this comment?")) return;
    
        try {
            await deletePostComment(commentId);
            setNotice("Comment deleted.");
    
            const response = await getPostComments(postId);
            const result = response?.data ?? response;
            const data = result?.data ?? result;
            const comments = Array.isArray(data?.comments)
                ? data.comments
                : Array.isArray(data) ? data : [];
    
            setCommentsByPost((previous) => ({
                ...previous,
                [postId]: comments,
            }));
        } catch (err) {
            setError(err.response?.data?.message || "Could not delete comment.");
        }
    }
    

    
async function handleInvite() {
    setError("");
    setNotice("");
    setInviteLink("");

    try {
        const response = await createCommunityInvite(communityId);
        const result = response?.data ?? response;

        const invite = result?.data ?? result;
        const token = invite?.token;

        if (!token) {
            throw new Error("Backend did not return an invite token.");
        }

        const url = `${window.location.origin}/communities/invite/${token}`;

        setInviteLink(url);
        setNotice("Invitation created. Copy and share this link.");
    } catch (err) {
        console.error("Failed to create invite:", err);
        setError(
            err.response?.data?.message ||
            err.message ||
            "Could not generate an invitation link."
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
        className="mt-4 rounded-lg border border-green-300/20 bg-green-400/10 p-4 text-sm text-green-100"
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
    </div>
)}

                {/* navigation tabs */}
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

    <button
        type="button"
        onClick={() => handleDeletePost(post.id || post._id)}
        className="text-sm text-red-300 hover:text-red-200"
    >
        Delete post
    </button>

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

        {(commentsByPost[post.id || post._id] || []).map((comment) => (
            <div key={comment.id || comment._id} className="mt-3 rounded-lg bg-white/5 p-3">
                <p className="text-xs text-blue-100/60">
                    {comment.author?.name || comment.user?.name || "Member"}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm">
                    {comment.content}
                </p>
                <button
                    type="button"
                    onClick={() => handleDeleteComment(comment.id || comment._id, post.id || post._id)}
                    className="mt-2 text-xs text-red-300"
                >
                    Delete comment
                </button>
            </div>
        ))}
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

                {/* Sidebar */}
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
                                            className="text-xs text-blue-200 hover:text-white"
                                        >
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
                                                {member.name}
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
                                    className="w-full bg-transparent text-sm outline-none placeholder:text-blue-100/40"
                                />
                            </div>

                            {members.length === 0 ? (
                                <div className="mt-5">
                                   <EmptyState
                              icon={FiUsers}
                              title="No members found"
                              description="No community members are available to display."
                               />
                                </div>
                            ) : (
                                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {members
    .filter((member) =>
        (member.name ?? member.user?.name ?? "")
            .toLowerCase()
            .includes(search.toLowerCase())
    )
    .map((member) => (
        <div
            key={member.id ?? member.user?.id}
            className="rounded-xl border border-white/10 bg-white/[0.05] p-4"
        >
            {member.name ?? member.user?.name ?? "Community member"}
        </div>
    ))}
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
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}

export default CommunityDetails;
