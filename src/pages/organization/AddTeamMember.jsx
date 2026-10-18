
import { useState } from "react";
import api from "../../services/api";

function AddTeamMember({
  organizationId,
  teams = [],
  members = [],
  onClose,
  onSuccess,
}) {
  const [teamId, setTeamId] = useState("");
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
    getUserId(member);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!teamId || !userId) {
      setError("Please select a team and a member.");
      return;
    }

    try {
      setLoading(true);

      await api.post(
        `/api/organizations/${organizationId}/teams/${teamId}/members`,
        { userId }
      );

      await onSuccess?.();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to add member to team. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Add Team Member
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="text-2xl text-gray-500 hover:text-gray-800"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="team"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Select Team
            </label>

            <select
              id="team"
              value={teamId}
              onChange={(event) => setTeamId(event.target.value)}
              className="w-full rounded-lg border border-gray-300 p-3"
              required
            >
              <option value="">Choose a team</option>

              {teams.map((team) => {
                const id = team._id || team.id;

                return (
                  <option key={id} value={id}>
                    {team.name || team.teamName || "Unnamed team"}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label
              htmlFor="member"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Select Organization Member
            </label>

            <select
              id="member"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              className="w-full rounded-lg border border-gray-300 p-3"
              required
            >
              <option value="">Choose a member</option>

              {members.map((member) => {
                const id = getUserId(member);

                if (!id) return null;

                return (
                  <option key={id} value={id}>
                    {getUserName(member)}
                  </option>
                );
              })}
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || !teamId || !userId}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Adding..." : "Add Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddTeamMember;
