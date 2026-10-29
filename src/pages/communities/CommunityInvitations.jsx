
import { useCallback, useEffect, useState } from "react";
import {
    createCommunityInvite,
    createCommunityInviteLink,
    searchCommunityUsers,
    getInvitableCommunityUsers,
    respondToCommunityInvite,
} from "../../services/communityService";

function unwrap(response) {
    return response?.data?.data ?? response?.data ?? response;
}

export default function CommunityInvitations({
    communityId,
    canManageInvites = false,
    pendingInvites = [],
    onRefresh,
}) {
    const [query, setQuery] = useState("");
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [sendingId, setSendingId] = useState("");
    const [creatingLink, setCreatingLink] = useState(false);
    const [inviteLink, setInviteLink] = useState("");
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const searchUsers = useCallback(async () => {
        const trimmedQuery = query.trim();

        if (!trimmedQuery) {
            setUsers([]);
            setError("");
            setLoadingUsers(false);
            return;
        }

        setLoadingUsers(true);
        setError("");

        try {
            let result;

            try {
                result = await getInvitableCommunityUsers(
                    communityId,
                    trimmedQuery
                );
            } catch (err) {
                if (err.response?.status !== 404) {
                    throw err;
                }

                result = await searchCommunityUsers(
                    communityId,
                    trimmedQuery
                );
            }

            const list = Array.isArray(result)
                ? result
                : Array.isArray(result?.users)
                    ? result.users
                    : Array.isArray(result?.data)
                        ? result.data
                        : [];

            setUsers(list);
        } catch (err) {
            setUsers([]);
            setError("Could not search members. Try again.");
        } finally {
            setLoadingUsers(false);
        }
    }, [query, communityId]);

    useEffect(() => {
        const trimmedQuery = query.trim();

        if (!trimmedQuery) {
            setUsers([]);
            setError("");
            setLoadingUsers(false);
            return;
        }

        const id = setTimeout(() => {
            searchUsers();
        }, 350);

        return () => clearTimeout(id);
    }, [query, searchUsers]);

    async function handleCreateLink() {
        setCreatingLink(true);
        setError("");
        setNotice("");

        try {
            const result = unwrap(
                await createCommunityInviteLink(communityId)
            );

            const url =
                result?.url ??
                result?.inviteUrl ??
                result?.link ??
                result?.data?.url;

            if (!url) {
                setError(
                    "The server created a link but returned no recognizable URL."
                );
                return;
            }

            setInviteLink(url);
            setNotice("Invite link created. You can copy and share it.");
        } catch (err) {
            setError("Could not create invite link. Try again.");
        } finally {
            setCreatingLink(false);
        }
    }

    async function handleDirectInvite(user) {
        const userId = user.id ?? user._id;

        if (!userId) {
            setError("This user has no recognizable ID.");
            return;
        }

        setSendingId(userId);
        setError("");
        setNotice("");

        try {
            await createCommunityInvite(communityId, {
                invitedUserId: userId,
            });

            setNotice(
                `Invitation sent to ${user.name ?? user.email ?? "user"}.`
            );

            await onRefresh?.();
        } catch (err) {
            setError("Could not send invitation. Try again.");
        } finally {
            setSendingId("");
        }
    }

    async function handleResponse(inviteId, responseValue) {
        if (!inviteId) {
            setError("This invitation has no recognizable ID.");
            return;
        }

        setSendingId(inviteId);
        setError("");
        setNotice("");

        try {
            await respondToCommunityInvite(inviteId, responseValue);

            setNotice(
                responseValue === "accept"
                    ? "Invitation accepted successfully."
                    : "Invitation declined successfully."
            );

            await onRefresh?.();
        } catch (err) {
            setError("Could not update invitation. Try again.");
        } finally {
            setSendingId("");
        }
    }

    async function copyLink() {
        try {
            await navigator.clipboard.writeText(inviteLink);
            setNotice("Invite link copied.");
        } catch {
            setError(
                "Could not copy automatically. Select the link and copy it."
            );
        }
    }

    const inputClass =
        "w-full min-w-0 rounded-xl border border-white/20 bg-[#214B73] px-4 py-3 text-sm text-white outline-none transition placeholder:text-blue-100/65 focus:border-blue-300 focus:ring-2 focus:ring-blue-300/20";

    const cardClass =
        "rounded-2xl border border-white/20 bg-[#2A4F74]/95 p-4 shadow-[0_12px_35px_rgba(1,16,39,0.22)] backdrop-blur-xl sm:p-5";

    const primaryButtonClass =
        "inline-flex items-center justify-center gap-2 rounded-xl bg-[#0068FF] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1678FF] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50";

    return (
        <section >
            <div className="pointer-events-none absolute -right-20 -top-24 -z-10 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-16 -z-10 h-56 w-56 rounded-full bg-sky-400/10 blur-3xl" />

            <header className=" px-5 py-5 sm:px-6">
                <div className="flex items-start gap-3">
                   
                    <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-bold uppercase tracking-[0.24em] text-white">
                            Community workspace
                        </p>
                        <h2 className="mt-1 text-xl font-bold tracking-tight text-white sm:text-2xl">
                            Invitations
                        </h2>
                        <p className="mt-1 text-sm leading-5 text-white">
                            Bring your team together in one place.
                        </p>
                    </div>
                </div>
            </header>

            <div className="relative space-y-5 p-4 sm:p-6">
                {error && (
                    <p role="alert" className="break-words text-sm text-red-300">
                        {error}
                    </p>
                )}

                {notice && (
                    <p role="status" className="break-words text-sm text-emerald-200">
                        {notice}
                    </p>
                )}

                {canManageInvites && (
                    <>
                        <div className={cardClass}>
                            <div className="flex items-start gap-3">
                               
                                <div className="min-w-0">
                                    <h3 className="text-base font-semibold text-white">
                                        Share an invite link
                                    </h3>
                                    <p className="mt-1 text-sm leading-5 text-blue-100/75">
                                        Generate a reusable link and share it
                                        with people you want to invite.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                disabled={creatingLink}
                                onClick={handleCreateLink}
                                className={`${primaryButtonClass} mt-4 w-full`}
                            >
                                {creatingLink ? (
                                    <>
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                                        Creating link...
                                    </>
                                ) : (
                                    <>
                                        <span className="text-lg leading-none">+</span>
                                        Generate invite link
                                    </>
                                )}
                            </button>

                            {inviteLink && (
                                <div className="mt-4 rounded-xl border border-white/20 bg-[#365F86]/80 p-3">
                                    <label
                                        htmlFor="community-invite-link"
                                        className="mb-2 block text-xs font-medium text-blue-100/80"
                                    >
                                        Your invitation link
                                    </label>

                                    <input
                                        id="community-invite-link"
                                        readOnly
                                        value={inviteLink}
                                        onFocus={(event) =>
                                            event.target.select()
                                        }
                                        className={inputClass}
                                    />

                                    <button
                                        type="button"
                                        onClick={copyLink}
                                        className="mt-2 w-full rounded-xl border border-white/20 bg-[#214B73] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#426F98]"
                                    >
                                        Copy invite link
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className={cardClass}>
                            <div className="mb-4">
                                <h3 className="text-base font-semibold text-white">
                                    Invite a member
                                </h3>
                                <p className="mt-1 text-sm leading-5 text-blue-100/75">
                                    Search by name or email to find people.
                                </p>
                            </div>

                            <div className="relative">
                                <input
                                    value={query}
                                    onChange={(event) =>
                                        setQuery(event.target.value)
                                    }
                                    placeholder="Search people by name or email..."
                                    aria-label="Search community members"
                                    className={`${inputClass} pl-10`}
                                />
                            </div>

                            {loadingUsers && (
                                <div className="mt-4 flex items-center gap-2 text-sm text-blue-100/75">
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-blue-200" />
                                    Searching members...
                                </div>
                            )}

                            {!loadingUsers &&
                                query.trim() &&
                                users.length === 0 &&
                                !error && (
                                    <div className="mt-4 rounded-xl border border-dashed border-white/20 bg-[#365F86]/80 px-4 py-6 text-center">
                                        <p className="text-sm font-medium text-white">
                                            No matching members found
                                        </p>
                                        <p className="mt-1 text-xs text-blue-100/70">
                                            Try another name or email address.
                                        </p>
                                    </div>
                                )}

                            <div className="mt-4 space-y-2.5">
                                {users.map((user) => {
                                    const id = user.id ?? user._id;
                                    const displayName =
                                        user.name ?? user.email ?? "Community user";

                                    return (
                                        <div
                                            key={id}
                                            className="flex min-w-0 items-center gap-3 rounded-xl border border-white/20 bg-[#365F86]/80 p-3 transition hover:border-blue-300/50 hover:bg-[#426F98]"
                                        >
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-[#214B73] text-sm font-bold text-blue-100">
                                                {displayName
                                                    .slice(0, 1)
                                                    .toUpperCase()}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold text-white">
                                                    {user.name ??
                                                        "Community user"}
                                                </p>
                                                <p className="mt-1 truncate text-xs text-blue-100/70">
                                                    {user.email ?? ""}
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                disabled={Boolean(sendingId)}
                                                onClick={() =>
                                                    handleDirectInvite(user)
                                                }
                                                className="shrink-0 rounded-lg border border-blue-200/25 bg-[#214B73] px-3 py-2 text-xs font-semibold text-blue-100 transition hover:bg-[#426F98] disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {sendingId === id
                                                    ? "Sending..."
                                                    : "Invite"}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}

                {pendingInvites.length > 0 && (
                    <div className={cardClass}>
                        <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <h3 className="text-base font-semibold text-white">
                                    Pending invitations
                                </h3>
                                <p className="mt-1 text-sm text-blue-100/75">
                                    Review invitation requests.
                                </p>
                            </div>

                            <span className="flex h-8 min-w-8 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-[#214B73] px-2 text-xs font-bold text-blue-100">
                                {pendingInvites.length}
                            </span>
                        </div>

                        <div className="mt-4 space-y-3">
                            {pendingInvites.map((invite) => {
                                const id = invite.id ?? invite._id;
                                const status = invite.status ?? "Pending";

                                return (
                                    <div
                                        key={id}
                                        className="rounded-xl border border-white/20 bg-[#365F86]/80 p-3.5"
                                    >
                                        <div className="flex min-w-0 items-start gap-3">
                                            
                                            <div className="min-w-0 flex-1">
                                                <p className="break-words text-sm font-semibold text-white">
                                                    {invite.email ??
                                                        invite.invitee?.name ??
                                                        "Invitation"}
                                                </p>
                                                <p className="mt-1 text-xs text-blue-100/70">
                                                    Status: {status}
                                                </p>
                                            </div>

                                            <span className="shrink-0 rounded-full border border-amber-300/25 bg-amber-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
                                                {status}
                                            </span>
                                        </div>

                                        <div className="mt-3 grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                disabled={Boolean(sendingId)}
                                                onClick={() =>
                                                    handleResponse(id, "accept")
                                                }
                                                className="rounded-lg border border-emerald-300/25 bg-emerald-400/10 px-3 py-2.5 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-400/20 disabled:opacity-50"
                                            >
                                                {sendingId === id
                                                    ? "Updating..."
                                                    : "Accept"}
                                            </button>

                                            <button
                                                type="button"
                                                disabled={Boolean(sendingId)}
                                                onClick={() =>
                                                    handleResponse(id, "decline")
                                                }
                                                className="rounded-lg border border-red-300/25 bg-red-400/10 px-3 py-2.5 text-xs font-semibold text-red-200 transition hover:bg-red-400/20 disabled:opacity-50"
                                            >
                                                Decline
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {!canManageInvites && pendingInvites.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-white/30 bg-[#365F86] px-5 py-10 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/40 bg-[#365F86] text-blue-700">
                          
                        </div>
                        <h3 className="mt-4 text-sm font-semibold text-white">
                            No pending invitations
                        </h3>
                        <p className="mt-1 text-sm text-blue-100/75">
                            New invitations will appear here.
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}
