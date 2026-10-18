
import { useState } from "react";
import { FaSpinner, FaTimes, FaTrash } from "react-icons/fa";
import api from "../../services/api";

function RemoveTeamMember({
  organizationId,
  teamId,
  teamName = "this team",
  teamMembers = [],
  onClose,
  onSuccess,
}) {
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getUserId = (member) =>
    member.userId ||
    member.user?.id ||
    member.user?._id;

  const getUserName = (member) =>
    member.user?.name ||
    member.name ||
    member.user?.email ||
    member.email ||
    "Member";

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!userId) {
      setError("Please select a team member.");
      return;
    }

    if (
      !window.confirm(
        `Remove this member from ${teamName}?`
      )
    ) {
      return;
    }

    try {
      setLoading(true);

      await api.delete(
        `/api/organizations/${organizationId}/teams/${teamId}/members/${userId}`
      );

      await onSuccess?.();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to remove team member."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0b1930] p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            Remove Team Member
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-slate-300 hover:text-white"
          >
            <FaTimes />
          </button>
        </div>

        <p className="mb-4 text-sm text-slate-400">
          Select a member to remove from {teamName}.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <select
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            required
            className="w-full rounded-lg border border-white/10 bg-[#0a172b] px-3 py-3 text-sm text-white"
          >
            <option value="">Select a team member</option>

            {teamMembers.map((member) => {
              const id = getUserId(member);

              if (!id) return null;

              return (
                <option key={id} value={id}>
                  {getUserName(member)}
                </option>
              );
            })}
          </select>

          {teamMembers.length === 0 && (
            <p className="text-sm text-amber-300">
              No team-member data is available yet.
            </p>
          )}

          {error && (
            <p role="alert" className="text-sm text-red-400">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-white/10 px-4 py-2 text-slate-200"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || !userId}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white disabled:opacity-50"
            >
              {loading ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <FaTrash />
              )}
              Remove
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RemoveTeamMember;
