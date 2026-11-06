
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    getProjects,
    createProject
} from "../../services/projectService";
import { getOrganizations } from "../../services/organizationService";

export default function ProjectsPage() {
    const navigate = useNavigate();

    const [projects, setProjects] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        organizationId: "",
        name: "",
        description: "",
        budget: "",
        dueDate: ""
    });

    const loadData = async () => {
        try {
            setLoading(true);
            setError("");

            const [projectResponse, organizationResponse] =
                await Promise.all([
                    getProjects(),
                    getOrganizations()
                ]);

            const projectData =
                projectResponse?.data?.data ??
                projectResponse?.data ??
                [];

            const organizationData =
                organizationResponse?.data?.data ??
                organizationResponse?.data ??
                [];

            setProjects(Array.isArray(projectData) ? projectData : []);
            setOrganizations(
                Array.isArray(organizationData) ? organizationData : []
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load projects."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleChange = (e) => {
        setForm((prev) => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();

        if (!form.organizationId) {
            setError("Please select an organization.");
            return;
        }

        try {
            setCreating(true);
            setError("");

            const payload = {
                name: form.name.trim(),
                description: form.description.trim(),
                budget: form.budget ? Number(form.budget) : undefined,
                dueDate: form.dueDate
                    ? new Date(form.dueDate).toISOString()
                    : undefined
            };

            await createProject(form.organizationId, payload);

            setForm({
                organizationId: "",
                name: "",
                description: "",
                budget: "",
                dueDate: ""
            });

            setShowForm(false);
            await loadData();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to create project."
            );
        } finally {
            setCreating(false);
        }
    };

    if (loading) {
        return <div className="projects-loading">Loading projects...</div>;
    }

    return (
        <div className="projects-page">
            <div className="projects-header">
                <div>
                    <h1>Projects</h1>
                    <p>Manage your company and freelancer collaborations.</p>
                </div>

                <button
                    type="button"
                    onClick={() => setShowForm((prev) => !prev)}
                >
                    {showForm ? "Cancel" : "Create Project"}
                </button>
            </div>

            {error && <div className="projects-error">{error}</div>}

            {showForm && (
                <form
                    className="project-create-form"
                    onSubmit={handleCreateProject}
                >
                    <h2>Create New Project</h2>

                    <label>Organization</label>
                    <select
                        name="organizationId"
                        value={form.organizationId}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select Organization</option>
                        {organizations.map((organization) => (
                            <option
                                key={organization.id}
                                value={organization.id}
                            >
                                {organization.name}
                            </option>
                        ))}
                    </select>

                    <label>Project Name</label>
                    <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Enter project name"
                        required
                    />

                    <label>Description</label>
                    <textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        placeholder="Describe your project"
                    />

                    <label>Budget</label>
                    <input
                        type="number"
                        name="budget"
                        value={form.budget}
                        onChange={handleChange}
                        min="0"
                        placeholder="Enter project budget"
                    />

                    <label>Due Date</label>
                    <input
                        type="date"
                        name="dueDate"
                        value={form.dueDate}
                        onChange={handleChange}
                    />

                    <button type="submit" disabled={creating}>
                        {creating ? "Creating..." : "Create Project"}
                    </button>
                </form>
            )}

            <div className="projects-grid">
                {projects.length === 0 ? (
                    <div className="projects-empty">
                        <h2>No projects yet</h2>
                        <p>Create a project to start collaborating.</p>
                    </div>
                ) : (
                    projects.map((project) => (
                        <div
                            className="project-card"
                            key={project.id}
                            onClick={() =>
                                navigate(`/projects/${project.id}`)
                            }
                        >
                            <div className="project-card-header">
                                <h3>{project.name}</h3>
                                <span>{project.status}</span>
                            </div>

                            <p>{project.description || "No description available."}</p>

                            <div className="project-card-details">
                                <span>
                                    {project.organization?.name || "Organization"}
                                </span>
                                <span>
                                    {project._count?.tasks ?? 0} Tasks
                                </span>
                                <span>
                                    {project._count?.members ?? 0} Members
                                </span>
                            </div>

                            {project.dueDate && (
                                <p>
                                    Due:{" "}
                                    {new Date(project.dueDate).toLocaleDateString()}
                                </p>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
