
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FiPlus,
    FiFolder,
    FiCalendar,
    FiUsers,
    FiCheckCircle,
    FiSearch,
    FiX,
    FiBriefcase,
    FiAlertCircle,
    FiArrowUpRight
} from "react-icons/fi";
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
    const [search, setSearch] = useState("");

    const [form, setForm] = useState({
        organizationId: "",
        name: "",
        description: "",
        budget: "",
        dueDate: ""
    });

    const loadData = async () => {
        setLoading(true);
        setError("");

        const results = await Promise.allSettled([
            getProjects(),
            getOrganizations()
        ]);

        const [projectResult, organizationResult] = results;

        if (projectResult.status === "fulfilled") {
            const response = projectResult.value;
            const data =
                response?.data?.data ??
                response?.data ??
                [];

            setProjects(Array.isArray(data) ? data : []);
        } else {
            setProjects([]);
            setError(
                projectResult.reason?.response?.data?.message ||
                "Unable to load projects. Please try again."
            );
        }

        if (organizationResult.status === "fulfilled") {
            const response = organizationResult.value;
            const data =
                response?.data?.data ??
                response?.data ??
                [];

            setOrganizations(Array.isArray(data) ? data : []);
        } else {
            setOrganizations([]);
        }

        setLoading(false);
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
                budget: form.budget
                    ? Number(form.budget)
                    : undefined,
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

    const filteredProjects = projects.filter((project) =>
        `${project.name || ""} ${project.description || ""} ${project.organization?.name || ""}`
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    const getStatusStyle = (status) => {
        const value = status?.toUpperCase();

        if (value === "COMPLETED") {
            return "bg-emerald-400/15 text-emerald-200 border-emerald-300/20";
        }

        if (value === "ON_HOLD") {
            return "bg-amber-400/15 text-amber-200 border-amber-300/20";
        }

        if (value === "CANCELLED") {
            return "bg-rose-400/15 text-rose-200 border-rose-300/20";
        }

        return "bg-blue-400/15 text-blue-100 border-blue-300/20";
    };

    const formatDate = (date) => {
        if (!date) return "Not set";

        return new Date(date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    };

    return (
        <div
            className="min-h-full w-full min-w-0 overflow-x-hidden px-4 py-6 text-white sm:px-6 lg:px-9 lg:py-8"
            style={{
                backgroundColor: "#315A8A",
                backgroundImage:
                    "linear-gradient(145deg, #213F70 0%, #315A8A 55%, #496C98 100%)"
            }}
        >
            <div className="mx-auto w-full max-w-[1500px]">

                <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                    <div>
                        <div className="mb-2 flex items-center gap-2 text-sm text-blue-100/70">
                            <FiBriefcase />
                            <span>Workspace / Projects</span>
                        </div>

                        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                            Projects
                        </h1>

                        <p className="mt-2 max-w-xl text-sm text-blue-100/75 sm:text-base">
                            Manage your company, clients and freelancer collaborations in one place.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            setError("");
                            setShowForm((prev) => !prev);
                        }}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-300/30 bg-[#0875F9] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/20 transition hover:bg-[#2588FF] active:scale-[0.98]"
                    >
                        {showForm ? <FiX /> : <FiPlus />}
                        {showForm ? "Close Form" : "Create Project"}
                    </button>
                </div>

                <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/15 bg-white/[0.09] p-5 shadow-lg shadow-[#102C50]/10 backdrop-blur-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-blue-100/75">
                                Total Projects
                            </span>
                            <FiFolder className="text-xl text-blue-200" />
                        </div>
                        <p className="mt-3 text-3xl font-bold">
                            {projects.length}
                        </p>
                        <p className="mt-1 text-xs text-blue-100/60">
                            Projects in your workspace
                        </p>
                    </div>

                    <div className="rounded-2xl border border-white/15 bg-white/[0.09] p-5 shadow-lg shadow-[#102C50]/10 backdrop-blur-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-blue-100/75">
                                Active Projects
                            </span>
                            <FiCheckCircle className="text-xl text-emerald-200" />
                        </div>
                        <p className="mt-3 text-3xl font-bold">
                            {projects.filter(
                                (p) => p.status?.toUpperCase() === "ACTIVE"
                            ).length}
                        </p>
                        <p className="mt-1 text-xs text-blue-100/60">
                            Currently in progress
                        </p>
                    </div>

                    <div className="rounded-2xl border border-white/15 bg-white/[0.09] p-5 shadow-lg shadow-[#102C50]/10 backdrop-blur-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-blue-100/75">
                                Organizations
                            </span>
                            <FiUsers className="text-xl text-purple-200" />
                        </div>
                        <p className="mt-3 text-3xl font-bold">
                            {organizations.length}
                        </p>
                        <p className="mt-1 text-xs text-blue-100/60">
                            Available organizations
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-300/25 bg-rose-400/10 p-4 text-sm text-rose-100">
                        <FiAlertCircle className="mt-0.5 shrink-0 text-lg" />
                        <div className="min-w-0 flex-1">
                            <p className="font-semibold">
                                Something went wrong
                            </p>
                            <p className="mt-1 break-words text-rose-100/80">
                                {error}
                            </p>
                        </div>
                        <button
                            onClick={loadData}
                            className="shrink-0 rounded-lg border border-rose-200/20 px-3 py-1.5 text-xs font-semibold hover:bg-white/10"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {showForm && (
                    <form
                        onSubmit={handleCreateProject}
                        className="mb-8 rounded-2xl border border-white/20 bg-white/[0.10] p-5 shadow-xl shadow-[#102C50]/15 backdrop-blur-md sm:p-7"
                    >
                        <div className="mb-6">
                            <h2 className="text-xl font-bold">
                                Create New Project
                            </h2>
                            <p className="mt-1 text-sm text-blue-100/65">
                                Set up a new collaboration workspace.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-blue-50">
                                    Organization *
                                </label>
                                <select
                                    name="organizationId"
                                    value={form.organizationId}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-xl border border-white/20 bg-[#173F70] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-300"
                                >
                                    <option value="">
                                        Select Organization
                                    </option>
                                    {organizations.map((organization) => (
                                        <option
                                            key={organization.id}
                                            value={organization.id}
                                        >
                                            {organization.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-blue-50">
                                    Project Name *
                                </label>
                                <input
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="e.g. Website Redesign"
                                    required
                                    className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-blue-100/45 focus:border-blue-300"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-medium text-blue-50">
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    value={form.description}
                                    onChange={handleChange}
                                    placeholder="What is this project about?"
                                    rows={3}
                                    className="w-full resize-y rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-blue-100/45 focus:border-blue-300"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-blue-50">
                                    Budget
                                </label>
                                <input
                                    type="number"
                                    name="budget"
                                    value={form.budget}
                                    onChange={handleChange}
                                    min="0"
                                    placeholder="Enter budget"
                                    className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-blue-100/45 focus:border-blue-300"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-blue-50">
                                    Due Date
                                </label>
                                <input
                                    type="date"
                                    name="dueDate"
                                    value={form.dueDate}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none focus:border-blue-300"
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex flex-wrap justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="rounded-xl border border-white/20 px-5 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/10"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={creating}
                                className="rounded-xl bg-[#0875F9] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2588FF] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {creating ? "Creating..." : "Create Project"}
                            </button>
                        </div>
                    </form>
                )}

                <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h2 className="text-xl font-bold">
                            All Projects
                        </h2>
                        <p className="mt-1 text-sm text-blue-100/65">
                            Browse and manage your collaborations.
                        </p>
                    </div>

                    <div className="relative w-full sm:max-w-xs">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-100/60" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search projects..."
                            className="w-full rounded-xl border border-white/15 bg-white/[0.09] py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-blue-100/50 focus:border-blue-300"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {[1, 2, 3].map((item) => (
                            <div
                                key={item}
                                className="h-52 animate-pulse rounded-2xl border border-white/10 bg-white/[0.08]"
                            />
                        ))}
                    </div>
                ) : filteredProjects.length === 0 ? (
                    <div className="rounded-2xl border border-white/15 bg-white/[0.08] px-5 py-14 text-center shadow-lg shadow-[#102C50]/10 backdrop-blur-sm">
                        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
                            <FiFolder className="text-3xl text-blue-100" />
                        </div>

                        <h3 className="text-xl font-bold">
                            {search ? "No matching projects" : "No projects yet"}
                        </h3>

                        <p className="mx-auto mt-2 max-w-md text-sm text-blue-100/65">
                            {search
                                ? "Try searching with a different project name."
                                : "Your project workspaces will appear here. Create your first project to get started."}
                        </p>

                        {!search && (
                            <button
                                type="button"
                                onClick={() => setShowForm(true)}
                                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0875F9] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2588FF]"
                            >
                                <FiPlus />
                                Create your first project
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {filteredProjects.map((project) => (
                            <button
                                type="button"
                                key={project.id}
                                onClick={() =>
                                    navigate(`/projects/${project.id}`)
                                }
                                className="group min-w-0 rounded-2xl border border-white/15 bg-white/[0.09] p-5 text-left shadow-lg shadow-[#102C50]/10 backdrop-blur-sm transition duration-200 hover:-translate-y-1 hover:border-blue-200/40 hover:bg-white/[0.13] hover:shadow-xl"
                            >
                                <div className="mb-5 flex items-start justify-between gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-200/20 bg-blue-300/15 text-xl text-blue-100">
                                        <FiFolder />
                                    </div>

                                    <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${getStatusStyle(project.status)}`}>
                                        {(project.status || "ACTIVE").replaceAll("_", " ")}
                                    </span>
                                </div>

                                <h3 className="line-clamp-1 text-lg font-bold text-white transition group-hover:text-blue-100">
                                    {project.name}
                                </h3>

                                <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-blue-100/65">
                                    {project.description || "No description available."}
                                </p>

                                <div className="mt-5 flex items-center gap-2 border-t border-white/10 pt-4 text-xs text-blue-100/75">
                                    <FiBriefcase className="shrink-0" />
                                    <span className="truncate">
                                        {project.organization?.name || "Organization"}
                                    </span>
                                </div>

                                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                                    <span className="inline-flex items-center gap-1.5 text-xs text-blue-100/70">
                                        <FiCheckCircle />
                                        {project._count?.tasks ?? 0} Tasks
                                    </span>

                                    <span className="inline-flex items-center gap-1.5 text-xs text-blue-100/70">
                                        <FiUsers />
                                        {project._count?.members ?? 0} Members
                                    </span>
                                </div>

                                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                                    <span className="inline-flex items-center gap-2 text-xs text-blue-100/65">
                                        <FiCalendar />
                                        {formatDate(project.dueDate)}
                                    </span>

                                    <span className="flex items-center gap-1 text-xs font-semibold text-blue-200 transition group-hover:text-white">
                                        Open <FiArrowUpRight />
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                <div className="mt-8 text-center text-xs text-blue-100/45">
                    Quorum Collaboration Workspace
                </div>
            </div>
        </div>
    );
}
