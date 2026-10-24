
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
            console.error("Community user search failed:", {
                status: err.response?.status,
                response: err.response?.data,
                message: err.message,
            });
    
            setUsers([]);
            setError(
                err.response?.data?.message ||
                "Could not search users. Please try again."
            );
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
                setError("The server created a link but returned no recognizable URL.");
                return;
            }

            setInviteLink(url);
            setNotice("Invite link created. You can copy and share it.");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Could not create invite link."
            );
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
            setNotice(`Invitation sent to ${user.name ?? user.email ?? "user"}.`);
            await onRefresh?.();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Could not send invitation."
            );
        } finally {
            setSendingId("");
        }
    }

    async function handleResponse(inviteId, responseValue) {
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
            setError(
                err.response?.data?.message ||
                "Could not update invitation status."
            );
        } finally {
            setSendingId("");
        }
    }

    async function copyLink() {
        try {
            await navigator.clipboard.writeText(inviteLink);
            setNotice("Invite link copied.");
        } catch {
            setError("Could not copy automatically. Select the link and copy it.");
        }
    }

    return (
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0C2D58] to-[#071B35] text-white shadow-xl">
            <div className="border-b border-white/10 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">
                    Grow your community
                </p>
                <h2 className="mt-1 text-lg font-bold">Invitations</h2>
                <p className="mt-1 text-sm text-blue-100/60">
                    Invite teammates or share a reusable link.
                </p>
            </div>

            <div className="space-y-5 p-5">
                {error && (
                    <p role="alert" className="rounded-xl border border-red-300/20 bg-red-500/10 p-3 text-sm text-red-200">
                        {error}
                    </p>
                )}
                {notice && (
                    <p role="status" className="rounded-xl border border-emerald-300/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                        {notice}
                    </p>
                )}

                {canManageInvites && (
                    <>
                        <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
                            <h3 className="font-semibold">Share an invite link</h3>
                            <p className="mt-1 text-sm text-blue-100/60">
                                Anyone with access to the link can follow the invite flow.
                            </p>

                            <button
                                type="button"
                                disabled={creatingLink}
                                onClick={handleCreateLink}
                                className="mt-4 w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-3 text-sm font-bold disabled:opacity-50"
                            >
                                {creatingLink ? "Creating link…" : "＋ Generate invite link"}
                            </button>

                            {inviteLink && (
                                <div className="mt-3 space-y-2">
                                    <input
                                        readOnly
                                        value={inviteLink}
                                        aria-label="Generated invitation link"
                                        onFocus={(event) => event.target.select()}
                                        className="w-full rounded-lg border border-white/10 bg-[#06172E] px-3 py-3 text-sm text-blue-100 outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={copyLink}
                                        className="w-full rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/5"
                                    >
                                        Copy link
                                    </button>
                                </div>
                            )}
                        </div>

                        <div>
                            <h3 className="font-semibold">Invite a member</h3>
                            <p className="mt-1 text-sm text-blue-100/60">
                                Search by name or email. Start typing to find people.
                            </p>

                            <input
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Search people…"
                                className="mt-3 w-full rounded-xl border border-white/10 bg-[#06172E] px-4 py-3 text-sm outline-none placeholder:text-white/35 focus:border-blue-300"
                            />

                            {loadingUsers && (
                                <p className="mt-3 text-sm text-blue-100/60">
                                    Searching…
                                </p>
                            )}

                            {!loadingUsers && query.trim() && users.length === 0 && !error && (
                                <p className="mt-3 text-sm text-blue-100/55">
                                    No matching users found.
                                </p>
                            )}

                            <div className="mt-3 space-y-2">
                                {users.map((user) => {
                                    const id = user.id ?? user._id;
                                    return (
                                        <div key={id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-400/15 font-bold text-blue-100">
                                                {(user.name ?? user.email ?? "?").slice(0, 1).toUpperCase()}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold">
                                                    {user.name ?? "Community user"}
                                                </p>
                                                <p className="truncate text-xs text-blue-100/55">
                                                    {user.email ?? ""}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                disabled={Boolean(sendingId)}
                                                onClick={() => handleDirectInvite(user)}
                                                className="rounded-lg bg-blue-500/15 px-3 py-2 text-xs font-semibold text-blue-100 hover:bg-blue-500/25 disabled:opacity-50"
                                            >
                                                {sendingId === id ? "Sending…" : "Invite"}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}

                {pendingInvites.length > 0 && (
                    <div className="border-t border-white/10 pt-4">
                        <h3 className="font-semibold">Pending invitations</h3>
                        <div className="mt-3 space-y-2">
                            {pendingInvites.map((invite) => {
                                const id = invite.id ?? invite._id;
                                return (
                                    <div key={id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-3">
                                        <div>
                                            <p className="text-sm font-semibold">
                                                {invite.email ?? invite.invitee?.name ?? "Invitation"}
                                            </p>
                                            <p className="mt-1 text-xs text-blue-100/55">
                                                {invite.status ?? "Pending"}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                disabled={Boolean(sendingId)}
                                                onClick={() => handleResponse(inviteId, "accept")}
                                                className="rounded-lg bg-emerald-500/15 px-3 py-2 text-xs text-emerald-100 disabled:opacity-50"
                                            >
                                                Accept
                                            </button>
                                            <button
                                                type="button"
                                                disabled={Boolean(sendingId)}
                                                onClick={() => handleResponse(inviteId, "decline")}
                                                className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-100 disabled:opacity-50"
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
            </div>
        </section>
    );
}
