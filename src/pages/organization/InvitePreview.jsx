
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  previewOrganizationInvite,
  joinOrganization,
} from "../../services/organizationService";
import { useAuth } from "../../context/AuthContext";

function InvitePreview() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [organization, setOrganization] = useState(null);
  const [inviteDetails, setInviteDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchInvite() {
      try {
        setLoading(true);
        setError("");

        const response = await previewOrganizationInvite(token);
        const data = response?.data ?? response;

        if (cancelled) return;

        setOrganization(data.organization);
        setInviteDetails(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "This invitation is invalid or has expired."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (token) {
      fetchInvite();
    } else {
      setError("Invitation token is missing.");
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleJoin() {
    if (!user) {
      navigate("/login", {
        state: { from: `/join/${token}` },
      });
      return;
    }

    try {
      setJoining(true);
      setError("");
      setMessage("");

      await joinOrganization(token);

      setMessage("Successfully joined the organization.");
      navigate("/organizations", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to join this organization. Please try again."
      );
    } finally {
      setJoining(false);
    }
  }

  if (loading) {
    return <main className="invite-page">Loading invitation...</main>;
  }

  if (error && !organization) {
    return (
      <main className="invite-page">
        <h1>Invitation unavailable</h1>
        <p role="alert">{error}</p>
        <button onClick={() => navigate("/login")}>
          Go to Login
        </button>
      </main>
    );
  }

  return (
    <main className="invite-page">
      <section className="invite-card">
        {organization?.logo && (
          <img
            src={organization.logo}
            alt={`${organization.name} logo`}
            className="invite-logo"
          />
        )}

<h1>You're invited to join</h1>
<h2>{organization?.name}</h2>

{inviteDetails?.teamName && (
  <p>
    Team: {inviteDetails.teamName}
  </p>
)}

{inviteDetails?.teamRole && (
  <p>
    Team Role:{" "}
    {inviteDetails.teamRole === "LEAD"
      ? "Team Lead"
      : "Team Member"}
  </p>
)}

<p>
  {organization?.membersCount ?? 0} members
</p>

        {inviteDetails?.inviterName && (
          <p>
            Invited by {inviteDetails.inviterName}
          </p>
        )}

        {inviteDetails?.role && (
          <p>
            Your role: {inviteDetails.role}
          </p>
        )}

        {error && <p role="alert">{error}</p>}
        {message && <p role="status">{message}</p>}

        <button onClick={handleJoin} disabled={joining}>
          {joining
            ? "Joining..."
            : user
              ? "Accept Invitation"
              : "Log in to Join"}
        </button>
      </section>
    </main>
  );
}

export default InvitePreview;
