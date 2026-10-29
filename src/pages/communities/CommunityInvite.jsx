
import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
    getInvitePreview,
    acceptCommunityInvite,
    declineCommunityInvite,
} from "../../services/communityService";
import { FiUsers, FiCheck, FiX, FiArrowLeft } from "react-icons/fi";

function CommunityInvite() {
    const { token: pathToken } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const token = searchParams.get("token") || pathToken;

    const [inviteInfo, setInviteInfo] = useState(null);
    const [loadingPreview, setLoadingPreview] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        async function fetchPreview() {
            if (!token) {
                setLoadingPreview(false);
                setError("Invalid invitation link. Please check the link.");
                return;
            }

            setLoadingPreview(true);
            setError("");

            try {
                const response = await getInvitePreview(token);
                const data = response?.data?.data ?? response?.data ?? response;
                setInviteInfo(data);
            } catch (err) {
                console.warn("Could not load invitation preview:", err);
                const msg = err.response?.data?.message || "";

                if (msg.toLowerCase().includes("already a member")) {
                    setMessage("You are already a member of this community.");
                } else if (
                    msg.toLowerCase().includes("expired") ||
                    msg.toLowerCase().includes("revoked")
                ) {
                    setError("This invitation link has expired.");
                } else {
                    setError("Could not load invitation. Please try again.");
                }
            } finally {
                setLoadingPreview(false);
            }
        }

        fetchPreview();
    }, [token]);

    async function handleAccept() {
        if (actionLoading || !token) return;

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

            setError("Could not accept invitation. Please try again.");
        } finally {
            setActionLoading(false);
        }
    }

    async function handleDecline() {
        if (actionLoading || !token) return;

        setActionLoading(true);
        setError("");
        setMessage("");

        try {
            await declineCommunityInvite(token);
            setMessage("Invitation declined.");
            setTimeout(() => navigate("/communities", { replace: true }), 1500);
        } catch {
            setError("Could not decline invitation. Please try again.");
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
        <main className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-[#061B38] via-[#102A46] to-[#04152D] px-4 py-8 text-white sm:px-6">
            <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/20 bg-[#2A4F74]/95 shadow-2xl shadow-black/30">
                <div className="border-b border-white/15 bg-[#365F86]/70 p-5 text-center sm:p-6">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-[#214B73] text-white">
                        <FiUsers size={30} aria-hidden="true" />
                    </div>

                    <h1 className="mt-4 break-words text-xl font-bold tracking-tight text-white sm:text-2xl">
                        {loadingPreview ? "Loading invitation..." : communityName}
                    </h1>

                    <p className="mt-2 break-words text-sm leading-relaxed text-blue-100/80">
                        {communityDesc}
                    </p>
                </div>

                <div className="p-5 sm:p-6">
                    {error && (
                        <p role="alert" className="mb-4 text-sm text-red-300">
                            {error}
                        </p>
                    )}

                    {message && (
                        <p role="status" className="mb-4 text-sm text-emerald-200">
                            {message}
                        </p>
                    )}

                    <div className="space-y-3">
                        <button
                            type="button"
                            onClick={handleAccept}
                            disabled={actionLoading || loadingPreview || !token || Boolean(error)}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0068FF] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-950/30 transition hover:bg-[#1678FF] focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 focus:ring-offset-[#2A4F74] disabled:cursor-not-allowed disabled:opacity-50 sm:px-5"
                        >
                            <FiCheck size={18} aria-hidden="true" />
                            {actionLoading ? "Please wait..." : "Accept & Join Community"}
                        </button>

                        <button
                            type="button"
                            onClick={handleDecline}
                            disabled={actionLoading || loadingPreview || !token}
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-[#365F86]/70 px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#426F98] focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-50 sm:px-5"
                        >
                            <FiX size={18} aria-hidden="true" />
                            Decline invitation
                        </button>
                    </div>

                    <div className="mt-6 text-center">
                        <button
                            type="button"
                            onClick={() => navigate("/communities")}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs text-blue-100/80 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                        >
                            <FiArrowLeft size={14} aria-hidden="true" />
                            Back to Communities
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default CommunityInvite;
