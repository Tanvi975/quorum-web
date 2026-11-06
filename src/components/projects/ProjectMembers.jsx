
import { useEffect, useState } from "react";
import {
    inviteProjectMember,
    removeProjectMember,
    updateProjectMember
} from "../../services/projectService";

export default function ProjectMembers({ projectId, initialMembers = [], isManager = false }) {
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
            await updateProjectMember(projectId, userId, { role });

            setMembers((prev) =>
                prev.map((member) =>
                    member.user?.id === userId
                        ? { ...member, role }
                        : member
                )
            );
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
            await removeProjectMember(projectId, userId);

            setMembers((prev) =>
                prev.filter((member) => member.user?.id !== userId)
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to remove member."
            );
        }
    };

    return (
        <div className="project-members">
            <div className="project-members-header">
                <div>
                    <h2>Project Members</h2>
                    <p>{members.length} members</p>
                </div>

                {isManager && (
                    <button
                        type="button"
                        onClick={() => setShowInviteForm((prev) => !prev)}
                    >
                        {showInviteForm ? "Cancel" : "Invite Collaborator"}
                    </button>
                )}
            </div>

            {error && <div className="project-members-error">{error}</div>}
            {success && <div className="project-members-success">{success}</div>}

            {showInviteForm && isManager && (
                <form onSubmit={handleInvite} className="project-invite-form">
                    <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="Collaborator email"
                        required
                    />

                    <select
                        name="role"
                        value={form.role}
                        onChange={handleChange}
                    >
                        <option value="FREELANCER">Freelancer</option>
                        <option value="CLIENT">Client</option>
                        <option value="INTERNAL_MEMBER">Internal Member</option>
                    </select>

                    <input
                        type="number"
                        name="hourlyRate"
                        value={form.hourlyRate}
                        onChange={handleChange}
                        placeholder="Hourly rate"
                        min="0"
                    />

                    <input
                        type="text"
                        name="companyName"
                        value={form.companyName}
                        onChange={handleChange}
                        placeholder="Company name"
                    />

                    <button type="submit" disabled={loading}>
                        {loading ? "Sending..." : "Send Invitation"}
                    </button>
                </form>
            )}

            <div className="project-members-list">
                {members.length === 0 ? (
                    <p>No project members found.</p>
                ) : (
                    members.map((member) => {
                        const user = member.user || {};

                        return (
                            <div
                                className="project-member-card"
                                key={member.id || user.id}
                            >
                                <div className="project-member-info">
                                    <h3>{user.name || "Unknown User"}</h3>
                                    <p>{user.email || ""}</p>
                                    {member.companyName && (
                                        <span>{member.companyName}</span>
                                    )}
                                </div>

                                <div className="project-member-meta">
                                    {isManager ? (
                                        <select
                                            value={member.role}
                                            onChange={(e) =>
                                                handleRoleChange(
                                                    user.id,
                                                    e.target.value
                                                )
                                            }
                                        >
                                            <option value="PROJECT_MANAGER">
                                                Project Manager
                                            </option>
                                            <option value="INTERNAL_MEMBER">
                                                Internal Member
                                            </option>
                                            <option value="FREELANCER">
                                                Freelancer
                                            </option>
                                            <option value="CLIENT">
                                                Client
                                            </option>
                                        </select>
                                    ) : (
                                        <span>{member.role}</span>
                                    )}

                                    {member.hourlyRate != null && (
                                        <span>{member.hourlyRate} / hr</span>
                                    )}

                                    {isManager && member.role !== "PROJECT_MANAGER" && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemove(user.id)}
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
