
import { useState } from "react";
import { addTeamMember } from "../../services/teamService";

function AddTeamMember({
  organizationId,
  teams = [],
  members = [],
  onClose,
  onSuccess,
}) {
  const [teamId, setTeamId] = useState("");
  const [userId, setUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState("MEMBER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getUserId = (member) =>
    member.userId || member.user?.id || member.user?._id;

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

      await addTeamMember(organizationId, teamId, userId, selectedRole);

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

  const selectStyle =
    "w-full rounded-lg border border-[#426486] bg-[#173B60] p-3 text-sm text-white outline-none transition focus:border-[#168BFF] focus:ring-2 focus:ring-[#168BFF]/20";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020817]/75 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-[#355D83] bg-[#102B4B] shadow-[0_20px_60px_rgba(0,0,0,0.45)]">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Add Team Member
            </h2>
            <p className="mt-1 text-xs text-[#A9C3DD]">
              Add an organization member to your team.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-2xl text-[#A9C3DD] transition hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div>
            <label
              htmlFor="team"
              className="mb-2 block text-sm font-medium text-[#D4E3F2]"
            >
              Select Team
            </label>

            <select
              id="team"
              value={teamId}
              onChange={(event) => setTeamId(event.target.value)}
              className={selectStyle}
              required
            >
              <option value="" className="bg-[#102B4B] text-[#A9C3DD]">
                Choose a team
              </option>

              {teams.map((team) => {
                const id = team._id || team.id;

                return (
                  <option
                    key={id}
                    value={id}
                    className="bg-[#102B4B] text-white"
                  >
                    {team.name || team.teamName || "Unnamed team"}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label
              htmlFor="member"
              className="mb-2 block text-sm font-medium text-[#D4E3F2]"
            >
              Select Organization Member
            </label>

            <select
              id="member"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              className={selectStyle}
              required
            >
              <option value="" className="bg-[#102B4B] text-[#A9C3DD]">
                Choose a member
              </option>

              {members.map((member) => {
                const id = getUserId(member);

                if (!id) return null;

                return (
                  <option
                    key={id}
                    value={id}
                    className="bg-[#102B4B] text-white"
                  >
                    {getUserName(member)}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label
              htmlFor="teamRole"
              className="mb-2 block text-sm font-medium text-[#D4E3F2]"
            >
              Select Team Role
            </label>

            <select
              id="teamRole"
              value={selectedRole}
              onChange={(event) => setSelectedRole(event.target.value)}
              className={selectStyle}
            >
              <option value="MEMBER" className="bg-[#102B4B] text-white">
                Team Member
              </option>
              <option value="TEAM_HEAD" className="bg-[#102B4B] text-white">
                Team Head
              </option>
            </select>
          </div>

          {error && (
            <p
              className="rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-300"
              role="alert"
            >
              {error}
            </p>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-white/10 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-[#426486] px-4 py-2.5 text-sm font-semibold text-[#D4E3F2] transition hover:bg-white/10 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || !teamId || !userId}
              className="rounded-lg bg-[#087BFF] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0069DF] disabled:cursor-not-allowed disabled:opacity-50"
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
