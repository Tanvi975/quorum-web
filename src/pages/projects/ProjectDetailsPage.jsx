
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    FiArrowLeft,
    FiBriefcase,
    FiCalendar,
    FiCheckCircle,
    FiFolder,
    FiMessageCircle,
    FiUsers,
    FiFileText,
    FiDollarSign,
    FiAlertCircle,
    FiRefreshCw,
    FiArrowUpRight
} from "react-icons/fi";
import { getProjectById } from "../../services/projectService";
import ProjectMembers from "../../components/projects/ProjectMembers";
import { useAuth } from "../../context/AuthContext";

export default function ProjectDetailsPage() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

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

    useEffect(() => {
        loadProject();
    }, [projectId]);

    const formatDate = (date) => {
        if (!date) return "Not specified";

        return new Date(date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    };

    const formatBudget = (budget) => {
        if (budget == null) return "Not specified";

        return new Intl.NumberFormat("en-IN", {
            maximumFractionDigits: 0
        }).format(budget);
    };

    if (loading) {
        return (
            <div className="min-h-full bg-gradient-to-br from-[#213F70] via-[#315A8A] to-[#496C98] p-5 sm:p-8">
                <div className="mx-auto max-w-[1450px] animate-pulse space-y-6">
                    <div className="h-36 rounded-2xl border border-white/10 bg-white/10" />
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {[1, 2, 3, 4].map((item) => (
                            <div key={item} className="h-32 rounded-2xl bg-white/10" />
                        ))}
                    </div>
                    <div className="h-64 rounded-2xl bg-white/10" />
                </div>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="min-h-full bg-gradient-to-br from-[#213F70] via-[#315A8A] to-[#496C98] p-5 sm:p-8">
                <div className="mx-auto flex min-h-[65vh] max-w-xl flex-col items-center justify-center rounded-2xl border border-white/15 bg-white/[0.09] p-8 text-center shadow-xl backdrop-blur-md">
                    <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-200/20 bg-rose-400/10">
                        <FiAlertCircle className="text-3xl text-rose-200" />
                    </div>

                    <h2 className="text-xl font-bold text-white">
                        Unable to load project
                    </h2>

                    <p className="mt-2 text-sm text-blue-100/70">
                        {error || "Project not found."}
                    </p>

                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                        <button
                            onClick={loadProject}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#0875F9] px-5 py-3 text-sm font-semibold text-white hover:bg-[#2588FF]"
                        >
                            <FiRefreshCw />
                            Retry
                        </button>

                        <button
                            onClick={() => navigate("/projects")}
                            className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
                        >
                            Back to Projects
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const members = project.members || [];
    const taskCount = project._count?.tasks ?? 0;
    const memberCount = project._count?.members ?? members.length;

    const currentUserId = String(
        user?.id || user?.userId || user?.sub || ""
    );

    const currentMember = members.find(
        (member) => String(member.user?.id || "") === currentUserId
    );

    const memberRole = currentMember?.role?.toUpperCase();

    const userRole = (
        user?.role ||
        user?.organizationRole ||
        ""
    ).toUpperCase();

    const isManager =
        memberRole === "PROJECT_MANAGER" ||
        userRole === "ORG_ADMIN" ||
        userRole === "ORGANIZATION_ADMIN";

    const status = (project.status || "ACTIVE").replaceAll("_", " ");

    const statusStyle =
        project.status?.toUpperCase() === "COMPLETED"
            ? "bg-emerald-400/15 text-emerald-200 border-emerald-300/25"
            : project.status?.toUpperCase() === "ON_HOLD"
            ? "bg-amber-400/15 text-amber-200 border-amber-300/25"
            : "bg-blue-400/15 text-blue-100 border-blue-300/25";

    const workspaceItems = [
        {
            title: "Tasks",
            description: "Assign work, track progress and review deliverables.",
            icon: FiCheckCircle,
            count: `${taskCount} tasks`,
            path: `/projects/${projectId}/tasks`
        },
        {
            title: "Resources",
            description: "Access project documents, files and shared assets.",
            icon: FiFileText,
            count: "Shared files",
            path: `/projects/${projectId}/resources`
        },
        {
            title: "Workspace Chat",
            description: "Communicate with collaborators in this project.",
            icon: FiMessageCircle,
            count: "Project conversation",
            path: `/projects/${projectId}/chat`
        }
    ];

    return (
        <div className="min-h-full w-full min-w-0 overflow-x-hidden bg-gradient-to-br from-[#213F70] via-[#315A8A] to-[#496C98] px-4 py-6 text-white sm:px-6 lg:px-9 lg:py-8">
            <div className="mx-auto max-w-[1450px]">

                <button
                    onClick={() => navigate("/projects")}
                    className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-blue-100/75 transition hover:text-white"
                >
                    <FiArrowLeft />
                    Back to Projects
                </button>

                <section className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/[0.09] p-5 shadow-xl shadow-[#102C50]/15 backdrop-blur-md sm:p-7 lg:p-8">
                    <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-blue-300/10 blur-3xl" />

                    <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
                        <div className="min-w-0">
                            <div className="mb-4 flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-blue-100/80">
                                    <FiFolder />
                                    Project Workspace
                                </span>

                                <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${statusStyle}`}>
                                    {status}
                                </span>
                            </div>

                            <h1 className="break-words text-3xl font-bold tracking-tight sm:text-4xl">
                                {project.name}
                            </h1>

                            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100/70 sm:text-base">
                                {project.description || "No project description has been added yet."}
                            </p>

                            <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-blue-100/70">
                                <span className="inline-flex items-center gap-2">
                                    <FiBriefcase />
                                    {project.organization?.name || "Organization"}
                                </span>

                                <span className="inline-flex items-center gap-2">
                                    <FiCalendar />
                                    Due {formatDate(project.dueDate)}
                                </span>
                            </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-3 rounded-xl border border-white/15 bg-white/[0.08] p-4">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-300/15 text-xl text-blue-100">
                                <FiFolder />
                            </div>
                            <div>
                                <p className="text-xs text-blue-100/60">
                                    Project ID
                                </p>
                                <p className="max-w-[180px] truncate text-sm font-semibold">
                                    {project.id}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                        {
                            label: "Project Budget",
                            value: formatBudget(project.budget),
                            icon: FiDollarSign,
                            note: "Allocated budget",
                            iconStyle: "bg-emerald-300/15 text-emerald-200"
                        },
                        {
                            label: "Total Tasks",
                            value: taskCount,
                            icon: FiCheckCircle,
                            note: "Project work items",
                            iconStyle: "bg-blue-300/15 text-blue-100"
                        },
                        {
                            label: "Team Members",
                            value: memberCount,
                            icon: FiUsers,
                            note: "Project collaborators",
                            iconStyle: "bg-purple-300/15 text-purple-200"
                        },
                        {
                            label: "Due Date",
                            value: formatDate(project.dueDate),
                            icon: FiCalendar,
                            note: "Project deadline",
                            iconStyle: "bg-amber-300/15 text-amber-200"
                        }
                    ].map((item) => {
                        const Icon = item.icon;

                        return (
                            <div
                                key={item.label}
                                className="rounded-2xl border border-white/15 bg-white/[0.09] p-5 shadow-lg shadow-[#102C50]/10 backdrop-blur-sm transition hover:bg-white/[0.12]"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-sm text-blue-100/70">
                                        {item.label}
                                    </span>

                                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.iconStyle}`}>
                                        <Icon className="text-lg" />
                                    </div>
                                </div>

                                <p className="mt-4 break-words text-2xl font-bold">
                                    {item.value}
                                </p>

                                <p className="mt-1 text-xs text-blue-100/55">
                                    {item.note}
                                </p>
                            </div>
                        );
                    })}
                </section>

                <section className="mt-8">
                    <div className="mb-5">
                        <h2 className="text-xl font-bold sm:text-2xl">
                            Project Workspace
                        </h2>
                        <p className="mt-1 text-sm text-blue-100/65">
                            Everything your team needs to collaborate.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        {workspaceItems.map((item) => {
                            const Icon = item.icon;

                            return (
                                <button
                                    key={item.title}
                                    type="button"
                                    onClick={() => navigate(item.path)}
                                    className="group rounded-2xl border border-white/15 bg-white/[0.09] p-5 text-left shadow-lg shadow-[#102C50]/10 backdrop-blur-sm transition hover:-translate-y-1 hover:border-blue-200/35 hover:bg-white/[0.13]"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-blue-200/15 bg-blue-300/15 text-xl text-blue-100">
                                            <Icon />
                                        </div>

                                        <FiArrowUpRight className="text-xl text-blue-100/50 transition group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-white" />
                                    </div>

                                    <h3 className="mt-5 text-lg font-bold">
                                        {item.title}
                                    </h3>

                                    <p className="mt-2 min-h-12 text-sm leading-5 text-blue-100/65">
                                        {item.description}
                                    </p>

                                    <div className="mt-5 border-t border-white/10 pt-4 text-xs font-medium text-blue-200">
                                        {item.count}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>

                <section className="mt-8 rounded-2xl border border-white/15 bg-white/[0.08] p-5 shadow-lg shadow-[#102C50]/10 backdrop-blur-sm sm:p-7">
                    <ProjectMembers
                        projectId={projectId}
                        initialMembers={members}
                        isManager={isManager}
                    />
                </section>

                <div className="mt-8 text-center text-xs text-blue-100/45">
                    Quorum Collaboration Workspace
                </div>
            </div>
        </div>
    );
}
