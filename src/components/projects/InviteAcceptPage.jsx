
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { acceptProjectInvite } from "../../services/projectService";

export default function InviteAcceptPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const token = searchParams.get("token");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleAccept = async () => {
        if (!token) {
            setError("Invitation token is missing or invalid.");
            return;
        }

        try {
            setLoading(true);
            setError("");

            await acceptProjectInvite(token);

            setSuccess(true);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to accept invitation. The invitation may have expired."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="invite-accept-page">
            <div className="invite-accept-card">
                {!success ? (
                    <>
                        <h1>Project Invitation</h1>

                        <p>
                            You have been invited to collaborate on a Quorum
                            project.
                        </p>

                        {error && (
                            <div className="invite-accept-error">
                                {error}
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={handleAccept}
                            disabled={loading || !token}
                        >
                            {loading ? "Accepting..." : "Accept Invitation"}
                        </button>
                    </>
                ) : (
                    <>
                        <h1>Invitation Accepted!</h1>

                        <p>
                            You have successfully joined the project.
                        </p>

                        <button
                            type="button"
                            onClick={() => navigate("/projects")}
                        >
                            Go to Projects
                        </button>
                    </>
                )}

                {!token && !error && (
                    <p>Invitation token is missing.</p>
                )}
            </div>
        </div>
    );
}
