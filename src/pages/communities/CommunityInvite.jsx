import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    getInvitePreview,
    acceptCommunityInvite,
    declineCommunityInvite,
} from "../../services/communityService";
import { FiUsers, FiCheck, FiX, FiArrowLeft } from "react-icons/fi";

function CommunityInvite() {
    const { token } = useParams();
    const navigate = useNavigate();

    const [inviteInfo, setInviteInfo] = useState(null);
    const [loadingPreview, setLoadingPreview] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        async function fetchPreview() {
            if (!token) return;
            setLoadingPreview(true);
            setError("");

            try {
                const response = await getInvitePreview(token);
                const data = response?.data?.data ?? response?.data ?? response;
                setInviteInfo(data);
            } catch (err) {
                console.warn("Could not load preview, link may be expired or direct token:", err);
                const msg = err.response?.data?.message || "";
                if (msg.toLowerCase().includes("already a member")) {
                    setMessage("You are already a member of this community.");
                } else if (msg.toLowerCase().includes("expired") || msg.toLowerCase().includes("revoked")) {
                    setError("This invitation link has expired or has been revoked.");
                }
            } finally {
                setLoadingPreview(false);
            }
        }

        fetchPreview();
    }, [token]);

    async function handleAccept() {
        if (actionLoading) return;
        setActionLoading(true);
        setError("");
        setMessage("");

        try {
            const response = await acceptCommunityInvite(token);
            const result = response?.data?.data ?? response?.data ?? response;

            const joinedCommunityId =
                result?.community?.id ??
                result?.communityId ??
                result?.community?.communityId ??
                inviteInfo?.communityId ??
                inviteInfo?.community?.id;

            if (joinedCommunityId) {
                navigate(`/communities/${joinedCommunityId}`, { replace: true });
            } else {
                navigate("/communities", { replace: true });
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || "";
            if (errorMsg.toLowerCase().includes("already a member")) {
                navigate("/communities", { replace: true });
                return;
            }
            setError(errorMsg || "Could not accept this community invitation.");
        } finally {
            setActionLoading(false);
        }
    }

    async function handleDecline() {
        if (actionLoading) return;
        setActionLoading(true);
        setError("");

        try {
            await declineCommunityInvite(token);
            setMessage("Invitation declined.");
            setTimeout(() => navigate("/communities", { replace: true }), 1500);
        } catch (err) {

            navigate("/communities", { replace: true });
        } finally {
            setActionLoading(false);
        }
    }

    const communityName =
        inviteInfo?.community?.name ??
        inviteInfo?.name ??
        "Community";
    const communityDesc =
        inviteInfo?.community?.description ??
        inviteInfo?.description ??
        "You have been invited to join this collaborative workspace on Quorum.";

    return (
        <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#061B38] via-[#062C5F] to-[#04152D] p-6 text-white">
            <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05] shadow-2xl backdrop-blur-xl">
                <div className="border-b border-white/10 bg-white/[0.02] p-6 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-200">
                        <FiUsers size={32} />
                    </div>
                    <h1 className="mt-4 text-2xl font-bold tracking-tight">
                        {loadingPreview ? "Loading invitation…" : communityName}
                    </h1>
                    <p className="mt-2 text-sm leading-relaxed text-blue-100/70">
                        {communityDesc}
                    </p>
                </div>

                <div className="p-6">
                    {error && (
                        <div role="alert" className="mb-4 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">
                            {error}
                        </div>
                    )}

                    {message && (
                        <div role="status" className="mb-4 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                            {message}
                        </div>
                    )}

                    <div className="space-y-3">
                        <button
                            type="button"
                            onClick={handleAccept}
                            disabled={actionLoading}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-5 py-3.5 text-sm font-bold shadow-lg shadow-blue-950/40 transition hover:brightness-110 disabled:opacity-50"
                        >
                            <FiCheck size={18} />
                            {actionLoading ? "Joining…" : "Accept & Join Community"}
                        </button>

                        <button
                            type="button"
                            onClick={handleDecline}
                            disabled={actionLoading}
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
                        >
                            <FiX size={18} />
                            Decline invitation
                        </button>
                    </div>

                    <div className="mt-6 text-center">
                        <button
                            type="button"
                            onClick={() => navigate("/communities")}
                            className="inline-flex items-center gap-1.5 text-xs text-blue-100/60 transition hover:text-white"
                        >
                            <FiArrowLeft size={14} /> Back to Communities
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default CommunityInvite;
