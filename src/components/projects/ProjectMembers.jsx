
import { useEffect, useState } from "react";
import {
    FiUsers,
    FiUserPlus,
    FiMail,
    FiTrash2,
    FiBriefcase,
    FiDollarSign,
    FiX,
    FiSend,
    FiAlertCircle,
    FiCheckCircle
} from "react-icons/fi";
import {
    inviteProjectMember,
    removeProjectMember,
    updateProjectMember
} from "../../services/projectService";

export default function ProjectMembers({
    projectId,
    initialMembers = [],
    isManager = false
}) {
    const [members, setMembers] = useState(initialMembers);
    const [showInviteForm, setShowInviteForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [form, setForm] = useState({
        email: "",
        role: "FREELANCER",
        hourlyRate: "",
        companyName: ""
    });

    useEffect(() => {
        setMembers(initialMembers);
    }, [initialMembers]);

    const handleChange = (e) => {
        setForm((prev) => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleInvite = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            setError("");
            setSuccess("");

            const payload = {
                email: form.email.trim(),
                role: form.role,
                hourlyRate: form.hourlyRate
                    ? Number(form.hourlyRate)
                    : undefined,
                companyName: form.companyName.trim() || undefined
            };

            await inviteProjectMember(projectId, payload);

            setSuccess("Invitation sent successfully.");

            setForm({
                email: "",
                role: "FREELANCER",
                hourlyRate: "",
                companyName: ""
            });

            setShowInviteForm(false);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to send invitation."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId, role) => {
        try {
            setError("");
            setSuccess("");

            await updateProjectMember(projectId, userId, { role });

            setMembers((prev) =>
                prev.map((member) =>
                    member.user?.id === userId
                        ? { ...member, role }
                        : member
                )
            );

            setSuccess("Member role updated successfully.");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to update member role."
            );
        }
    };

    const handleRemove = async (userId) => {
        if (!window.confirm("Are you sure you want to remove this member?")) {
            return;
        }

        try {
            setError("");
            setSuccess("");

            await removeProjectMember(projectId, userId);

            setMembers((prev) =>
                prev.filter((member) => member.user?.id !== userId)
            );

            setSuccess("Member removed successfully.");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to remove member."
            );
        }
    };

    const roleLabel = (role) => {
        const labels = {
            PROJECT_MANAGER: "Project Manager",
            INTERNAL_MEMBER: "Internal Member",
            FREELANCER: "Freelancer",
            CLIENT: "Client"
        };

        return labels[role] || role || "Member";
    };

    return (
        <div className="w-full min-w-0">

            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-200/15 bg-blue-300/15 text-xl text-blue-100">
                            <FiUsers />
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-white sm:text-2xl">
                                Project Members
                            </h2>
                            <p className="mt-1 text-sm text-blue-100/60">
                                {members.length} collaborators in this project
                            </p>
                        </div>
                    </div>
                </div>

                {isManager && (
                    <button
                        type="button"
                        onClick={() => {
                            setError("");
                            setSuccess("");
                            setShowInviteForm((prev) => !prev);
                        }}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0875F9] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/20 transition hover:bg-[#2588FF]"
                    >
                        {showInviteForm ? <FiX /> : <FiUserPlus />}
                        {showInviteForm ? "Close Form" : "Invite Collaborator"}
                    </button>
                )}
            </div>

            {error && (
                <div className="mb-5 flex items-start gap-3 rounded-xl border border-rose-300/20 bg-rose-400/10 p-4 text-sm text-rose-100">
                    <FiAlertCircle className="mt-0.5 shrink-0 text-lg" />
                    <p className="break-words">{error}</p>
                </div>
            )}

            {success && (
                <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
                    <FiCheckCircle className="mt-0.5 shrink-0 text-lg" />
                    <p>{success}</p>
                </div>
            )}

            {showInviteForm && isManager && (
                <form
                    onSubmit={handleInvite}
                    className="mb-7 rounded-2xl border border-white/15 bg-white/[0.07] p-5 sm:p-6"
                >
                    <div className="mb-5">
                        <h3 className="text-lg font-bold text-white">
                            Invite a Collaborator
                        </h3>
                        <p className="mt-1 text-sm text-blue-100/60">
                            Add a freelancer, client or internal team member.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-blue-50">
                                Email Address *
                            </label>
                            <div className="relative">
                                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-100/50" />
                                <input
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="name@example.com"
                                    required
                                    className="w-full rounded-xl border border-white/15 bg-white/[0.08] py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-blue-100/40 focus:border-blue-300"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-blue-50">
                                Collaborator Role *
                            </label>
                            <select
                                name="role"
                                value={form.role}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-white/15 bg-[#173F70] px-4 py-3 text-sm text-white outline-none focus:border-blue-300"
                            >
                                <option value="FREELANCER">Freelancer</option>
                                <option value="CLIENT">Client</option>
                                <option value="INTERNAL_MEMBER">Internal Member</option>
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-blue-50">
                                Hourly Rate
                            </label>
                            <div className="relative">
                                <FiDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-100/50" />
                                <input
                                    type="number"
                                    name="hourlyRate"
                                    value={form.hourlyRate}
                                    onChange={handleChange}
                                    min="0"
                                    placeholder="Enter hourly rate"
                                    className="w-full rounded-xl border border-white/15 bg-white/[0.08] py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-blue-100/40 focus:border-blue-300"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-blue-50">
                                Company Name
                            </label>
                            <div className="relative">
                                <FiBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-100/50" />
                                <input
                                    type="text"
                                    name="companyName"
                                    value={form.companyName}
                                    onChange={handleChange}
                                    placeholder="Company or studio name"
                                    className="w-full rounded-xl border border-white/15 bg-white/[0.08] py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-blue-100/40 focus:border-blue-300"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-wrap justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setShowInviteForm(false)}
                            className="rounded-xl border border-white/20 px-5 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/10"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#0875F9] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2588FF] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <FiSend />
                            {loading ? "Sending..." : "Send Invitation"}
                        </button>
                    </div>
                </form>
            )}

            {members.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-12 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-2xl text-blue-100">
                        <FiUsers />
                    </div>
                    <h3 className="font-semibold text-white">
                        No project members yet
                    </h3>
                    <p className="mt-2 text-sm text-blue-100/55">
                        Invite collaborators to start working together.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {members.map((member) => {
                        const memberUser = member.user || {};
                        const memberRole = member.role || "INTERNAL_MEMBER";

                        return (
                            <div
                                key={member.id || memberUser.id}
                                className="min-w-0 rounded-2xl border border-white/12 bg-white/[0.06] p-4 transition hover:border-white/25 hover:bg-white/[0.09] sm:p-5"
                            >
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-blue-300/15 text-lg font-bold text-blue-100">
                                            {memberUser.avatar ? (
                                                <img
                                                    src={memberUser.avatar}
                                                    alt=""
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                (memberUser.name || "U")
                                                    .charAt(0)
                                                    .toUpperCase()
                                            )}
                                        </div>

                                        <div className="min-w-0">
                                            <h3 className="truncate font-semibold text-white">
                                                {memberUser.name || "Unknown User"}
                                            </h3>
                                            <p className="mt-1 break-all text-xs text-blue-100/55">
                                                {memberUser.email || "No email available"}
                                            </p>
                                        </div>
                                    </div>

                                    <span className="w-fit shrink-0 rounded-full border border-blue-200/20 bg-blue-300/10 px-3 py-1 text-xs font-medium text-blue-100">
                                        {roleLabel(memberRole)}
                                    </span>
                                </div>

                                {(member.companyName || member.hourlyRate != null) && (
                                    <div className="mt-4 flex flex-wrap gap-3 border-t border-white/10 pt-4">
                                        {member.companyName && (
                                            <span className="inline-flex items-center gap-2 text-xs text-blue-100/70">
                                                <FiBriefcase />
                                                {member.companyName}
                                            </span>
                                        )}

                                        {member.hourlyRate != null && (
                                            <span className="inline-flex items-center gap-2 text-xs text-blue-100/70">
                                                <FiDollarSign />
                                                {member.hourlyRate} / hr
                                            </span>
                                        )}
                                    </div>
                                )}

                                {isManager && (
                                    <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="min-w-0 flex-1">
                                            <label className="mb-1.5 block text-xs text-blue-100/55">
                                                Change Role
                                            </label>
                                            <select
                                                value={memberRole}
                                                onChange={(e) =>
                                                    handleRoleChange(
                                                        memberUser.id,
                                                        e.target.value
                                                    )
                                                }
                                                disabled={memberRole === "PROJECT_MANAGER"}
                                                className="w-full rounded-lg border border-white/15 bg-[#173F70] px-3 py-2 text-xs text-white outline-none focus:border-blue-300 disabled:opacity-60"
                                            >
                                                <option value="PROJECT_MANAGER">Project Manager</option>
                                                <option value="INTERNAL_MEMBER">Internal Member</option>
                                                <option value="FREELANCER">Freelancer</option>
                                                <option value="CLIENT">Client</option>
                                            </select>
                                        </div>

                                        {memberRole !== "PROJECT_MANAGER" && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemove(memberUser.id)}
                                                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-rose-300/20 px-3 py-2 text-xs font-medium text-rose-200 transition hover:bg-rose-400/10 sm:mt-5"
                                            >
                                                <FiTrash2 />
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
