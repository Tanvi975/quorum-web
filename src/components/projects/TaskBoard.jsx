
import { useEffect, useState } from "react";
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

export default function TaskBoard({ projectId, isManager = false, currentUserId }) {
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

            setTasks(Array.isArray(data) ? data : data?.tasks || []);
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

    if (loading) {
        return <div>Loading tasks...</div>;
    }

    return (
        <div className="task-board">
            <div className="task-board-header">
                <div>
                    <h2>Project Tasks</h2>
                    <p>{tasks.length} total tasks</p>
                </div>

                <button
                    type="button"
                    onClick={() => setShowForm((prev) => !prev)}
                >
                    {showForm ? "Cancel" : "Create Task"}
                </button>
            </div>

            {error && <div className="task-board-error">{error}</div>}

            {showForm && (
                <form
                    className="task-create-form"
                    onSubmit={handleCreateTask}
                >
                    <input
                        name="title"
                        value={form.title}
                        onChange={handleChange}
                        placeholder="Task title"
                        required
                    />

                    <textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        placeholder="Task description"
                    />

                    <select
                        name="priority"
                        value={form.priority}
                        onChange={handleChange}
                    >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                    </select>

                    <input
                        name="assigneeId"
                        value={form.assigneeId}
                        onChange={handleChange}
                        placeholder="Assignee user ID"
                    />

                    <input
                        type="date"
                        name="dueDate"
                        value={form.dueDate}
                        onChange={handleChange}
                    />

                    <button type="submit" disabled={creating}>
                        {creating ? "Creating..." : "Create Task"}
                    </button>
                </form>
            )}

            <div className="task-board-columns">
                {STATUSES.map((status) => {
                    const statusTasks = tasks.filter(
                        (task) => task.status === status
                    );

                    return (
                        <section
                            className="task-column"
                            key={status}
                        >
                            <div className="task-column-header">
                                <h3>{status.replaceAll("_", " ")}</h3>
                                <span>{statusTasks.length}</span>
                            </div>

                            {statusTasks.map((task) => {
                                const isAssignee =
                                    task.assigneeId === currentUserId ||
                                    task.assignee?.id === currentUserId;

                                return (
                                    <article
                                        className="task-card"
                                        key={task.id}
                                    >
                                        <h4>{task.title}</h4>

                                        <p>
                                            {task.description ||
                                                "No description"}
                                        </p>

                                        <div className="task-card-meta">
                                            <span>{task.priority}</span>
                                            <span>{task.status}</span>
                                        </div>

                                        <p>
                                            Assignee:{" "}
                                            {task.assignee?.name ||
                                                task.assigneeId ||
                                                "Unassigned"}
                                        </p>

                                        {task.dueDate && (
                                            <p>
                                                Due:{" "}
                                                {new Date(
                                                    task.dueDate
                                                ).toLocaleDateString()}
                                            </p>
                                        )}

                                        {(isManager || isAssignee) &&
                                            status === "TODO" && (
                                                <button
                                                    onClick={() =>
                                                        handleStatusChange(
                                                            task.id,
                                                            "IN_PROGRESS"
                                                        )
                                                    }
                                                >
                                                    Start Task
                                                </button>
                                            )}
                                    </article>
                                );
                            })}

                            {statusTasks.length === 0 && (
                                <p className="task-column-empty">
                                    No tasks
                                </p>
                            )}
                        </section>
                    );
                })}
            </div>
        </div>
    );
}
