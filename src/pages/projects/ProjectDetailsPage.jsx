
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getProjectById } from "../../services/projectService";

export default function ProjectDetailsPage() {
    const { projectId } = useParams();
    const navigate = useNavigate();

    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadProject = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await getProjectById(projectId);
                const projectData =
                    response?.data?.data ??
                    response?.data ??
                    response;

                setProject(projectData);
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    "Unable to load project details."
                );
            } finally {
                setLoading(false);
            }
        };

        loadProject();
    }, [projectId]);

    if (loading) {
        return <div className="project-details-loading">Loading project...</div>;
    }

    if (error || !project) {
        return (
            <div className="project-details-error">
                <p>{error || "Project not found."}</p>
                <button onClick={() => navigate("/projects")}>
                    Back to Projects
                </button>
            </div>
        );
    }

    const members = project.members || [];
    const taskCount = project._count?.tasks ?? 0;

    return (
        <div className="project-details-page">
            <header className="project-details-header">
                <button
                    type="button"
                    onClick={() => navigate("/projects")}
                >
                    ← Back to Projects
                </button>

                <div>
                    <h1>{project.name}</h1>
                    <span>{project.status}</span>
                </div>

                <p>{project.description || "No project description."}</p>
            </header>

            <section className="project-overview-grid">
                <div className="project-overview-card">
                    <h3>Organization</h3>
                    <p>{project.organization?.name || "Not available"}</p>
                </div>

                <div className="project-overview-card">
                    <h3>Budget</h3>
                    <p>
                        {project.budget != null
                            ? project.budget
                            : "Not specified"}
                    </p>
                </div>

                <div className="project-overview-card">
                    <h3>Tasks</h3>
                    <p>{taskCount}</p>
                </div>

                <div className="project-overview-card">
                    <h3>Members</h3>
                    <p>{members.length}</p>
                </div>
            </section>

            <section className="project-details-section">
                <div className="project-section-header">
                    <h2>Project Members</h2>
                </div>

                {members.length === 0 ? (
                    <p>No members found.</p>
                ) : (
                    <div className="project-members-list">
                        {members.map((member) => (
                            <div
                                className="project-member-card"
                                key={member.id || member.user?.id}
                            >
                                <div>
                                    <h3>
                                        {member.user?.name || "Unknown User"}
                                    </h3>
                                    <p>{member.user?.email || ""}</p>
                                </div>

                                <span>{member.role}</span>

                                {member.companyName && (
                                    <span>{member.companyName}</span>
                                )}

                                {member.hourlyRate != null && (
                                    <span>
                                        {member.hourlyRate} / hr
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <section className="project-details-section">
                <div className="project-section-header">
                    <h2>Project Workspace</h2>
                </div>

                <div className="project-workspace-links">
                    <button
                        onClick={() =>
                            navigate(`/projects/${projectId}/tasks`)
                        }
                    >
                        Tasks
                    </button>

                    <button
                        onClick={() =>
                            navigate(`/projects/${projectId}/resources`)
                        }
                    >
                        Resources
                    </button>

                    <button
                        onClick={() =>
                            navigate(`/projects/${projectId}/chat`)
                        }
                    >
                        Workspace Chat
                    </button>
                </div>
            </section>
        </div>
    );
}
