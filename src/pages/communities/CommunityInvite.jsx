
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";

function CommunityInvite() {
    const { token } = useParams();
    const navigate = useNavigate();

    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleJoin() {
        if (loading) return;

        setLoading(true);
        setMessage("");

        try {
            const response = await api.post(
                `/api/communities/invites/${token}/join`
            );

            const result = response.data?.data ?? response.data;

            const joinedCommunityId =
                result?.community?.id ??
                result?.communityId ??
                result?.community?.communityId;

            if (!joinedCommunityId) {
                console.log("Join API response:", response.data);
                setMessage(
                    "Joined successfully, but community ID was not returned."
                );
                return;
            }

            navigate(`/communities/${joinedCommunityId}`, {
                replace: true,
            });
        } catch (error) {
            const errorMessage =
                error.response?.data?.message || "";
        
            if (
                errorMessage.toLowerCase().includes("already a member")
            ) {
                navigate("/communities");
                return;
            }
        
            console.error("Failed to join community:", error);
        
            setMessage(
                errorMessage || "Could not join this community."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-[#062C5F] p-6 text-white">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6">
                <h1 className="text-2xl font-bold">
                    Community Invitation
                </h1>

                <p className="mt-3 text-sm text-blue-100/70">
                    Join this community using your invitation link.
                </p>

                <button
                    type="button"
                    onClick={handleJoin}
                    disabled={loading}
                    className="mt-6 rounded-lg bg-blue-500 px-4 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading ? "Joining..." : "Join community"}
                </button>

                {message && (
                    <p role="status" className="mt-4 text-sm">
                        {message}
                    </p>
                )}
            </div>
        </main>
    );
}

export default CommunityInvite;
