
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiPlus,
  FiFolder,
  FiCalendar,
  FiUsers,
  FiCheckCircle,
  FiSearch,
  FiX,
  FiAlertCircle,
  FiArrowUpRight,
} from "react-icons/fi";
import { getProjects, createProject } from "../../services/projectService";

export default function OrganizationProjects({ organizationId }) {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    budget: "",
    dueDate: "",
  });

  const loadProjects = useCallback(async () => {
    if (!organizationId) return;

    setLoading(true);
    setError("");

    try {
      const response = await getProjects();
      const data = response?.data?.data ?? response?.data ?? [];

      const allProjects = Array.isArray(data) ? data : [];

      const organizationProjects = allProjects.filter((project) => {
        const projectOrganizationId =
          project.organizationId ||
          project.organization?.id ||
          project.organization?._id;

        return String(projectOrganizationId) === String(organizationId);
      });

      setProjects(organizationProjects);
    } catch (err) {
      setError("Unable to load projects. Please try again.");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Close modal with Escape key
  useEffect(() => {
    if (!showForm) return;

    const handleEscape = (event) => {
      if (event.key === "Escape" && !creating) {
        setShowForm(false);
        setError("");
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [showForm, creating]);

  const closeForm = () => {
    if (creating) return;

    setShowForm(false);
    setError("");
  };

  const handleCreateProject = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Project name is required.");
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
          : undefined,
      };

      await createProject(organizationId, payload);

      setForm({
        name: "",
        description: "",
        budget: "",
        dueDate: "",
      });

      setShowForm(false);
      await loadProjects();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Could not create the project. Please try again."
      );
    } finally {
      setCreating(false);
    }
  };

  const filteredProjects = projects.filter((project) =>
    `${project.name || ""} ${project.description || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const formatDate = (date) => {
    if (!date) return "Not set";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusStyle = (status) => {
    const value = status?.toUpperCase();

    if (value === "COMPLETED")
      return "bg-emerald-400/15 text-emerald-200 border-emerald-300/20";

    if (value === "ON_HOLD")
      return "bg-amber-400/15 text-amber-200 border-amber-300/20";

    if (value === "CANCELLED")
      return "bg-rose-400/15 text-rose-200 border-rose-300/20";

    return "bg-blue-400/15 text-blue-100 border-blue-300/20";
  };

  return (
    <div className="w-full min-w-0 rounded-2xl border border-white/15 bg-white/[0.05] p-4 text-white sm:p-6">

      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold">Organization Projects</h2>
          <p className="mt-1 text-sm text-blue-100/65">
            Create and manage projects for this organization.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setError("");
            setShowForm(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0875F9] px-5 py-3 text-sm font-semibold text-white hover:bg-[#2588FF]"
        >
          <FiPlus />
          Create Project
        </button>
      </div>

      {/* General Error */}
      {error && !showForm && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-rose-300/25 bg-rose-400/10 p-4 text-sm text-rose-100">
          <FiAlertCircle className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Create Project Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#020817]/75 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeForm();
          }}
        >
          <div className="relative my-auto w-full max-w-[560px] overflow-hidden rounded-2xl border border-[#60A5FA]/50 bg-[#142D49] shadow-2xl shadow-black/50">

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6">
              <div>
                <h3 className="text-lg font-bold text-white">
                  Create New Project
                </h3>
                <p className="mt-1 text-sm text-blue-100/70">
                  Create a project for your organization.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={creating}
                aria-label="Close modal"
                className="rounded-lg p-2 text-blue-100/70 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
              >
                <FiX size={21} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateProject}>
              <div className="max-h-[65vh] space-y-5 overflow-y-auto p-5 sm:p-6">

                {error && (
                  <div className="flex items-start gap-3 rounded-xl border border-rose-300/25 bg-rose-400/10 p-3 text-sm text-rose-100">
                    <FiAlertCircle className="mt-0.5 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                {/* Project Name */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-white">
                    Project Name *
                  </label>
                  <input
                    required
                    maxLength={120}
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    placeholder="e.g. Website Redesign"
                    className="w-full rounded-xl border border-white/20 bg-[#0F2945] px-4 py-3 text-sm text-white outline-none placeholder:text-blue-100/50 focus:border-[#60A5FA]"
                  />
                </div>

                {/* Budget */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-white">
                    Budget
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.budget}
                    onChange={(e) =>
                      setForm({ ...form, budget: e.target.value })
                    }
                    placeholder="Enter budget"
                    className="w-full rounded-xl border border-white/20 bg-[#0F2945] px-4 py-3 text-sm text-white outline-none placeholder:text-blue-100/50 focus:border-[#60A5FA]"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-white">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    maxLength={1000}
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder="What is this project about?"
                    className="w-full resize-y rounded-xl border border-white/20 bg-[#0F2945] px-4 py-3 text-sm text-white outline-none placeholder:text-blue-100/50 focus:border-[#60A5FA]"
                  />
                </div>

                {/* Due Date */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-white">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) =>
                      setForm({ ...form, dueDate: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/20 bg-[#0F2945] px-4 py-3 text-sm text-white outline-none focus:border-[#60A5FA]"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 border-t border-white/10 px-5 py-4 sm:px-6">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={creating}
                  className="rounded-xl border border-white/25 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating || !form.name.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0875F9] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2588FF] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Statistics */}
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-white/15 bg-white/[0.07] p-4">
          <div className="flex items-center justify-between text-sm text-blue-100/70">
            Total Projects <FiFolder />
          </div>
          <p className="mt-2 text-3xl font-bold">{projects.length}</p>
        </div>

        <div className="rounded-xl border border-white/15 bg-white/[0.07] p-4">
          <div className="flex items-center justify-between text-sm text-blue-100/70">
            Active Projects <FiCheckCircle />
          </div>
          <p className="mt-2 text-3xl font-bold">
            {projects.filter((p) => p.status?.toUpperCase() === "ACTIVE").length}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-100/60" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects..."
          className="w-full rounded-xl border border-white/15 bg-white/[0.08] py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-blue-100/50"
        />
      </div>

      {/* Projects List */}
      {loading ? (
        <div className="py-12 text-center text-sm text-blue-100/70">
          Loading projects...
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-12 text-center">
          <FiFolder className="mx-auto mb-3 text-3xl text-blue-200" />
          <h3 className="text-lg font-semibold">
            {search ? "No matching projects" : "No projects yet"}
          </h3>
          <p className="mt-2 text-sm text-blue-100/65">
            {search
              ? "Try another search."
              : "Create your first project for this organization."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((project) => {
            const projectId = project.id || project._id;

            return (
              <button
                key={projectId}
                type="button"
                onClick={() => navigate(`/projects/${projectId}`)}
                className="group min-w-0 rounded-xl border border-white/15 bg-white/[0.07] p-5 text-left transition hover:-translate-y-1 hover:bg-white/[0.12]"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <FiFolder className="text-2xl text-blue-200" />
                  <span
                    className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${getStatusStyle(
                      project.status
                    )}`}
                  >
                    {(project.status || "ACTIVE").replaceAll("_", " ")}
                  </span>
                </div>

                <h3 className="truncate text-lg font-bold">
                  {project.name}
                </h3>

                <p className="mt-2 line-clamp-2 min-h-10 text-sm text-blue-100/65">
                  {project.description || "No description available."}
                </p>

                <div className="mt-4 flex flex-wrap justify-between gap-3 border-t border-white/10 pt-4 text-xs text-blue-100/70">
                  <span className="flex items-center gap-1.5">
                    <FiCheckCircle />
                    {project._count?.tasks ?? 0} Tasks
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FiUsers />
                    {project._count?.members ?? 0} Members
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-blue-100/70">
                  <span className="flex items-center gap-2">
                    <FiCalendar />
                    {formatDate(project.dueDate)}
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-blue-200">
                    Open <FiArrowUpRight />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
