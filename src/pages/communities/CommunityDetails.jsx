
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    FiArrowLeft,
    FiUsers,
    FiMessageSquare,
    FiFolder,
    FiInfo,
    FiSettings,
    FiPlus,
    FiSearch,
    FiUserPlus,
    FiUploadCloud,
    FiRefreshCw,
} from "react-icons/fi";

const tabs = [
    { label: "Posts", icon: FiMessageSquare },
    { label: "Members", icon: FiUsers },
    { label: "Files", icon: FiFolder },
    { label: "About", icon: FiInfo },
];

function CommunityDetails() {
    const navigate = useNavigate();
    const { communityId } = useParams();

    const [activeTab, setActiveTab] = useState("Posts");
    const [search, setSearch] = useState("");

    // API integration ke baad in states ko backend data se populate karenge.
    const [community, setCommunity] = useState(null);
    const [posts, setPosts] = useState([]);
    const [members, setMembers] = useState([]);
    const [files, setFiles] = useState([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const isEmpty = {
        Posts: posts.length === 0,
        Members: members.length === 0,
        Files: files.length === 0,
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

    function showIntegrationNotice() {
        setError(
            "This action will be available after the backend API is integrated."
        );
    }

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
                        onClick={showIntegrationNotice}
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
                                onClick={showIntegrationNotice}
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold transition hover:bg-blue-400"
                            >
                                <FiUserPlus size={17} />
                                Invite
                            </button>

                            <button
                                type="button"
                                onClick={showIntegrationNotice}
                                className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold text-white/85 transition hover:bg-white/5"
                            >
                                <FiSettings size={16} />
                                Manage
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

                                    <button
                                        type="button"
                                        onClick={showIntegrationNotice}
                                        className="mt-4 flex w-full items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-sm text-blue-100/60 transition hover:border-blue-300/40 hover:bg-white/[0.07]"
                                    >
                                        <FiPlus size={18} />
                                        Start a new post...
                                    </button>
                                </div>

                                {isEmpty.Posts ? (
                                    <EmptyState
                                        icon={FiMessageSquare}
                                        title="No posts yet"
                                        description="Start a conversation with your community. Posts will appear here once the API is connected."
                                        actionLabel="Create a post"
                                        onAction={showIntegrationNotice}
                                    />
                                ) : (
                                    posts.map((post) => (
                                        <article
                                            key={post.id}
                                            className="rounded-xl border border-white/10 bg-white/[0.05] p-5"
                                        >
                                            <h3 className="font-semibold">
                                                {post.title}
                                            </h3>
                                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-blue-100/75">
                                                {post.content}
                                            </p>
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
                                    onClick={showIntegrationNotice}
                                    className="inline-flex items-center justify-center gap-2 self-start rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold hover:bg-blue-400"
                                >
                                    <FiUserPlus size={17} />
                                    Invite members
                                </button>
                            </div>

                            <div className="mt-5 flex max-w-lg items-center gap-3 rounded-lg border border-white/10 bg-white/[0.05] px-4 py-3">
                                <FiSearch className="shrink-0 text-blue-100/50" />
                                <input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Search members"
                                    aria-label="Search members"
                                    className="w-full bg-transparent text-sm outline-none placeholder:text-blue-100/40"
                                />
                            </div>

                            {members.length === 0 ? (
                                <div className="mt-5">
                                    <EmptyState
                                        icon={FiUsers}
                                        title="Members will appear here"
                                        description="Once the members API is connected, you can view and search community members here."
                                        actionLabel="Invite members"
                                        onAction={showIntegrationNotice}
                                    />
                                </div>
                            ) : (
                                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {members
                                        .filter((member) =>
                                            member.name.toLowerCase().includes(search.toLowerCase())
                                        )
                                        .map((member) => (
                                            <div
                                                key={member.id}
                                                className="rounded-xl border border-white/10 bg-white/[0.05] p-4"
                                            >
                                                {member.name}
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                    ) : activeTab === "Files" ? (
                        <div>
                            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                                <div>
                                    <h2 className="text-xl font-bold">
                                        Files and resources
                                    </h2>
                                    <p className="mt-1 text-sm text-blue-100/60">
                                        Shared documents and useful community resources.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={showIntegrationNotice}
                                    className="inline-flex items-center justify-center gap-2 self-start rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold hover:bg-blue-400"
                                >
                                    <FiUploadCloud size={17} />
                                    Add resource
                                </button>
                            </div>

                            <div className="mt-5">
                                {isEmpty.Files ? (
                                    <EmptyState
                                        icon={FiFolder}
                                        title="No files shared yet"
                                        description="Documents and resources shared by community members will appear here."
                                        actionLabel="Add resource"
                                        onAction={showIntegrationNotice}
                                    />
                                ) : (
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        {files.map((file) => (
                                            <article
                                                key={file.id}
                                                className="rounded-xl border border-white/10 bg-white/[0.05] p-5"
                                            >
                                                {file.name}
                                            </article>
                                        ))}
                                    </div>
                                )}
                            </div>
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

                            <button
                                type="button"
                                onClick={showIntegrationNotice}
                                className="mt-6 inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold hover:bg-white/5"
                            >
                                <FiSettings size={16} />
                                Edit details
                            </button>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}

export default CommunityDetails;
