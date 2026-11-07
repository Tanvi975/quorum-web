
import { useEffect, useState } from "react";
import {
    FiPlus,
    FiX,
    FiCheckCircle,
    FiClock,
    FiAlertCircle,
    FiCalendar,
    FiUser,
    FiRefreshCw,
    FiClipboard,
    FiArrowRight
} from "react-icons/fi";
import {
    getProjectTasks,
    createProjectTask,
    updateProjectTaskStatus
} from "../../services/projectService";

const STATUSES = [
    "TODO",
    "IN_PROGRESS",
    "IN_REVIEW",
    "COMPLETED",
    "CANCELLED"
];

const STATUS_CONFIG = {
    TODO: {
        label: "To Do",
        icon: FiClipboard,
        color: "text-slate-200",
        badge: "bg-slate-300/10 border-slate-200/20",
        dot: "bg-slate-300"
    },
    IN_PROGRESS: {
        label: "In Progress",
        icon: FiClock,
        color: "text-blue-200",
        badge: "bg-blue-400/10 border-blue-300/20",
        dot: "bg-blue-300"
    },
    IN_REVIEW: {
        label: "In Review",
        icon: FiAlertCircle,
        color: "text-amber-200",
        badge: "bg-amber-400/10 border-amber-300/20",
        dot: "bg-amber-300"
    },
    COMPLETED: {
        label: "Completed",
        icon: FiCheckCircle,
        color: "text-emerald-200",
        badge: "bg-emerald-400/10 border-emerald-300/20",
        dot: "bg-emerald-300"
    },
    CANCELLED: {
        label: "Cancelled",
        icon: FiX,
        color: "text-rose-200",
        badge: "bg-rose-400/10 border-rose-300/20",
        dot: "bg-rose-300"
    }
};

const PRIORITY_STYLES = {
    LOW: "bg-slate-300/10 text-slate-200 border-slate-200/15",
    MEDIUM: "bg-blue-300/10 text-blue-100 border-blue-200/15",
    HIGH: "bg-orange-400/10 text-orange-200 border-orange-200/20",
    URGENT: "bg-rose-400/10 text-rose-200 border-rose-200/20"
};

export default function TaskBoard({
    projectId,
    isManager = false,
    currentUserId
}) {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        title: "",
        description: "",
        priority: "MEDIUM",
        assigneeId: "",
        dueDate: ""
    });

    const loadTasks = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await getProjectTasks(projectId);

            const data =
                response?.data?.data ??
                response?.data ??
                response;

            setTasks(
                Array.isArray(data) ? data : data?.tasks || []
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load project tasks."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTasks();
    }, [projectId]);

    const handleChange = (e) => {
        setForm((prev) => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();

        try {
            setCreating(true);
            setError("");

            const payload = {
                title: form.title.trim(),
                description: form.description.trim(),
                priority: form.priority,
                assigneeId: form.assigneeId || undefined,
                dueDate: form.dueDate
                    ? new Date(form.dueDate).toISOString()
                    : undefined
            };

            await createProjectTask(projectId, payload);

            setForm({
                title: "",
                description: "",
                priority: "MEDIUM",
                assigneeId: "",
                dueDate: ""
            });

            setShowForm(false);
            await loadTasks();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to create task."
            );
        } finally {
            setCreating(false);
        }
    };

    const handleStatusChange = async (taskId, status) => {
        try {
            setError("");

            await updateProjectTaskStatus(projectId, taskId, status);

            setTasks((prev) =>
                prev.map((task) =>
                    task.id === taskId
                        ? { ...task, status }
                        : task
                )
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to update task status."
            );
        }
    };

    const formatDate = (date) => {
        if (!date) return "No deadline";

        return new Date(date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    };

    const getNextStatus = (status) => {
        const transitions = {
            TODO: "IN_PROGRESS",
            IN_PROGRESS: "IN_REVIEW",
            IN_REVIEW: "COMPLETED"
        };

        return transitions[status];
    };

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(
        (task) => task.status === "COMPLETED"
    ).length;

    const progress = totalTasks
        ? Math.round((completedTasks / totalTasks) * 100)
        : 0;

    return (
        <div className="min-h-full w-full min-w-0 overflow-x-hidden bg-gradient-to-br from-[#213F70] via-[#315A8A] to-[#496C98] px-4 py-6 text-white sm:px-6 lg:px-9 lg:py-8">
            <div className="mx-auto max-w-[1500px]">

                <div className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                    <div>
                        <p className="mb-2 text-sm text-blue-100/65">
                            Project Workspace / Tasks
                        </p>

                        <h1 className="text-3xl font-bold sm:text-4xl">
                            Project Tasks
                        </h1>

                        <p className="mt-2 text-sm text-blue-100/70">
                            Organize work, manage deadlines and track progress.
                        </p>
                    </div>

                    {isManager && (
                        <button
                            type="button"
                            onClick={() => {
                                setError("");
                                setShowForm((prev) => !prev);
                            }}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0875F9] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/20 transition hover:bg-[#2588FF]"
                        >
                            {showForm ? <FiX /> : <FiPlus />}
                            {showForm ? "Close Form" : "Create Task"}
                        </button>
                    )}
                </div>

                {error && (
                    <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-300/20 bg-rose-400/10 p-4 text-sm text-rose-100">
                        <FiAlertCircle className="mt-0.5 shrink-0 text-lg" />
                        <p className="min-w-0 flex-1 break-words">{error}</p>
                        <button
                            type="button"
                            onClick={loadTasks}
                            className="shrink-0 rounded-lg border border-white/15 px-3 py-1.5 text-xs hover:bg-white/10"
                        >
                            Retry
                        </button>
                    </div>
                )}

                <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/15 bg-white/[0.09] p-5 shadow-lg backdrop-blur-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-blue-100/70">
                                Total Tasks
                            </span>
                            <FiClipboard className="text-xl text-blue-200" />
                        </div>
                        <p className="mt-3 text-3xl font-bold">{totalTasks}</p>
                        <p className="mt-1 text-xs text-blue-100/55">
                            All project tasks
                        </p>
                    </div>

                    <div className="rounded-2xl border border-white/15 bg-white/[0.09] p-5 shadow-lg backdrop-blur-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-blue-100/70">
                                Completed
                            </span>
                            <FiCheckCircle className="text-xl text-emerald-200" />
                        </div>
                        <p className="mt-3 text-3xl font-bold">{completedTasks}</p>
                        <p className="mt-1 text-xs text-blue-100/55">
                            Successfully finished
                        </p>
                    </div>

                    <div className="rounded-2xl border border-white/15 bg-white/[0.09] p-5 shadow-lg backdrop-blur-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-blue-100/70">
                                Completion
                            </span>
                            <FiRefreshCw className="text-xl text-purple-200" />
                        </div>
                        <p className="mt-3 text-3xl font-bold">{progress}%</p>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                            <div
                                className="h-full rounded-full bg-blue-300 transition-all"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                </div>

                {showForm && isManager && (
                    <form
                        onSubmit={handleCreateTask}
                        className="mb-8 rounded-2xl border border-white/20 bg-white/[0.10] p-5 shadow-xl backdrop-blur-md sm:p-7"
                    >
                        <div className="mb-6">
                            <h2 className="text-xl font-bold">
                                Create New Task
                            </h2>
                            <p className="mt-1 text-sm text-blue-100/65">
                                Add a task and assign it to a collaborator.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-medium text-blue-50">
                                    Task Title *
                                </label>
                                <input
                                    name="title"
                                    value={form.title}
                                    onChange={handleChange}
                                    placeholder="e.g. Build authentication module"
                                    required
                                    className="w-full rounded-xl border border-white/15 bg-white/[0.08] px-4 py-3 text-sm text-white outline-none placeholder:text-blue-100/40 focus:border-blue-300"
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
                                    placeholder="Describe the task..."
                                    rows={3}
                                    className="w-full resize-y rounded-xl border border-white/15 bg-white/[0.08] px-4 py-3 text-sm text-white outline-none placeholder:text-blue-100/40 focus:border-blue-300"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-blue-50">
                                    Priority
                                </label>
                                <select
                                    name="priority"
                                    value={form.priority}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border border-white/15 bg-[#173F70] px-4 py-3 text-sm text-white outline-none focus:border-blue-300"
                                >
                                    <option value="LOW">Low</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HIGH">High</option>
                                    <option value="URGENT">Urgent</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-blue-50">
                                    Assignee User ID
                                </label>
                                <input
                                    name="assigneeId"
                                    value={form.assigneeId}
                                    onChange={handleChange}
                                    placeholder="Enter member user ID"
                                    className="w-full rounded-xl border border-white/15 bg-white/[0.08] px-4 py-3 text-sm text-white outline-none placeholder:text-blue-100/40 focus:border-blue-300"
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
                                    className="w-full rounded-xl border border-white/15 bg-white/[0.08] px-4 py-3 text-sm text-white outline-none focus:border-blue-300"
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex flex-wrap justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="rounded-xl border border-white/20 px-5 py-2.5 text-sm text-white/80 hover:bg-white/10"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={creating}
                                className="rounded-xl bg-[#0875F9] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2588FF] disabled:opacity-60"
                            >
                                {creating ? "Creating..." : "Create Task"}
                            </button>
                        </div>
                    </form>
                )}

                <div className="mb-5">
                    <h2 className="text-xl font-bold">Task Board</h2>
                    <p className="mt-1 text-sm text-blue-100/65">
                        Track every task through its current stage.
                    </p>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
                        {STATUSES.map((status) => (
                            <div
                                key={status}
                                className="h-72 animate-pulse rounded-2xl border border-white/10 bg-white/[0.08]"
                            />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
                        {STATUSES.map((status) => {
                            const statusTasks = tasks.filter(
                                (task) => task.status === status
                            );

                            const config = STATUS_CONFIG[status];
                            const StatusIcon = config.icon;

                            return (
                                <section
                                    key={status}
                                    className="min-w-0 rounded-2xl border border-white/15 bg-white/[0.07] p-3 shadow-lg backdrop-blur-sm"
                                >
                                    <div className="mb-4 flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.06] p-3">
                                        <div className="flex min-w-0 items-center gap-2">
                                            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${config.dot}`} />
                                            <h3 className={`truncate text-sm font-semibold ${config.color}`}>
                                                {config.label}
                                            </h3>
                                        </div>

                                        <span className="rounded-lg border border-white/10 bg-white/10 px-2.5 py-1 text-xs font-semibold text-white">
                                            {statusTasks.length}
                                        </span>
                                    </div>

                                    <div className="space-y-3">
                                        {statusTasks.map((task) => {
                                            const isAssignee =
                                                String(task.assigneeId || task.assignee?.id || "") ===
                                                String(currentUserId || "");

                                            const nextStatus = getNextStatus(task.status);
                                            const NextIcon = nextStatus
                                                ? STATUS_CONFIG[nextStatus].icon
                                                : null;

                                            return (
                                                <article
                                                    key={task.id}
                                                    className="rounded-xl border border-white/15 bg-white/[0.09] p-4 transition hover:border-blue-200/30 hover:bg-white/[0.12]"
                                                >
                                                    <div className="mb-3 flex items-center justify-between gap-2">
                                                        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.MEDIUM}`}>
                                                            {task.priority || "MEDIUM"}
                                                        </span>

                                                        <StatusIcon className={`shrink-0 ${config.color}`} />
                                                    </div>

                                                    <h4 className="break-words text-sm font-bold text-white">
                                                        {task.title}
                                                    </h4>

                                                    <p className="mt-2 line-clamp-3 break-words text-xs leading-5 text-blue-100/65">
                                                        {task.description || "No description available."}
                                                    </p>

                                                    <div className="mt-4 space-y-2 border-t border-white/10 pt-3">
                                                        <div className="flex items-center gap-2 text-xs text-blue-100/70">
                                                            <FiUser className="shrink-0" />
                                                            <span className="truncate">
                                                                {task.assignee?.name || task.assigneeId || "Unassigned"}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center gap-2 text-xs text-blue-100/70">
                                                            <FiCalendar className="shrink-0" />
                                                            <span>{formatDate(task.dueDate)}</span>
                                                        </div>
                                                    </div>

                                                    {nextStatus && (isManager || isAssignee) && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleStatusChange(task.id, nextStatus)}
                                                            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-blue-200/20 bg-blue-400/10 px-3 py-2 text-xs font-semibold text-blue-100 transition hover:bg-blue-400/20"
                                                        >
                                                            Move to {STATUS_CONFIG[nextStatus].label}
                                                            <FiArrowRight />
                                                        </button>
                                                    )}
                                                </article>
                                            );
                                        })}

                                        {statusTasks.length === 0 && (
                                            <div className="rounded-xl border border-dashed border-white/15 px-3 py-8 text-center">
                                                <StatusIcon className={`mx-auto mb-3 text-xl ${config.color}`} />
                                                <p className="text-xs text-blue-100/50">
                                                    No tasks here yet
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            );
                        })}
                    </div>
                )}

                <div className="mt-8 text-center text-xs text-blue-100/45">
                    Quorum Project Task Management
                </div>
            </div>
        </div>
    );
}
