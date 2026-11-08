import { useCallback, useEffect, useMemo, useState } from "react";
import { FiPlus, FiX, FiCheckCircle, FiClock, FiAlertCircle, FiCalendar, FiUser, FiRefreshCw, FiClipboard, FiArrowRight, FiEdit2, FiSend } from "react-icons/fi";
import { getProjectTasks, createProjectTask, updateProjectTask, updateProjectTaskStatus, getProjectById } from "../../services/projectService";
import DeliverableModal from "./DeliverableModal";
import DeliverableReview from "./DeliverableReview";
import useProjectSocket from "../../hooks/useProjectSocket";

const STATUSES = ["TODO", "IN_PROGRESS", "IN_REVIEW", "COMPLETED", "CANCELLED"];
const STATUS_CONFIG = {
  TODO: { label: "To Do", icon: FiClipboard, color: "text-slate-200", dot: "bg-slate-300" },
  IN_PROGRESS: { label: "In Progress", icon: FiClock, color: "text-blue-200", dot: "bg-blue-300" },
  IN_REVIEW: { label: "In Review", icon: FiAlertCircle, color: "text-amber-200", dot: "bg-amber-300" },
  COMPLETED: { label: "Completed", icon: FiCheckCircle, color: "text-emerald-200", dot: "bg-emerald-300" },
  CANCELLED: { label: "Cancelled", icon: FiX, color: "text-rose-200", dot: "bg-rose-300" }
};
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const PRIORITY_STYLES = {
  LOW: "border-slate-200/15 bg-slate-300/10 text-slate-200",
  MEDIUM: "border-blue-200/15 bg-blue-300/10 text-blue-100",
  HIGH: "border-orange-200/20 bg-orange-400/10 text-orange-200",
  URGENT: "border-rose-200/20 bg-rose-400/10 text-rose-200"
};
const getId = value => value?.id || value?._id || value?.userId || "";
const unwrap = response => response?.data?.data ?? response?.data ?? response;

export default function TaskBoard({ projectId, isManager: managerProp = false, currentUserId }) {
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [conversationId, setConversationId] = useState("");
  const [manager, setManager] = useState(managerProp);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [submissionTask, setSubmissionTask] = useState(null);
  const [reviewTask, setReviewTask] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ title: "", description: "", priority: "MEDIUM", assigneeId: "", dueDate: "" });

  const loadTasks = useCallback(async (showLoader = true) => {
    if (!projectId) return;
    try {
      if (showLoader) setLoading(true);
      setError("");
      const [taskResponse, projectResponse] = await Promise.all([
        getProjectTasks(projectId),
        getProjectById(projectId)
      ]);
      const taskData = unwrap(taskResponse);
      const project = unwrap(projectResponse);
      setTasks(Array.isArray(taskData) ? taskData : taskData?.tasks || []);
      const projectMembers = Array.isArray(project?.members) ? project.members : [];
      setMembers(projectMembers);
      setConversationId(project?.conversation?.id || project?.conversationId || "");
      const self = projectMembers.find(m => String(getId(m.user)) === String(currentUserId));
      const role = String(self?.role || "").toUpperCase();
      setManager(managerProp || role === "PROJECT_MANAGER" || ["ORG_ADMIN", "ORGANIZATION_ADMIN"].includes(role));
    } catch {
      setError("Unable to load project tasks. Please try again.");
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [projectId, currentUserId, managerProp]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const handleSocketTask = useCallback(() => { loadTasks(false); }, [loadTasks]);
  const handleSocketMember = useCallback(() => { loadTasks(false); }, [loadTasks]);
  useProjectSocket({ conversationId, onTaskUpdated: handleSocketTask, onMemberUpdated: handleSocketMember });

  const assignee = useMemo(() => members.map(m => m.user || m).filter(u => getId(u)), [members]);
  const updateForm = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const resetForm = () => setForm({ title: "", description: "", priority: "MEDIUM", assigneeId: "", dueDate: "" });

  const openEdit = task => {
    setEditingTask(task);
    setForm({
      title: task.title || "",
      description: task.description || "",
      priority: task.priority || "MEDIUM",
      assigneeId: task.assigneeId || getId(task.assignee) || "",
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : ""
    });
    setShowForm(true);
    setError("");
  };

  const saveTask = async event => {
    event.preventDefault();
    if (!form.title.trim()) { setError("Enter a task title."); return; }
    try {
      setSaving(true); setError("");
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        assigneeId: form.assigneeId || undefined,
        dueDate: form.dueDate ? new Date(`${form.dueDate}T00:00:00`).toISOString() : undefined
      };
      if (editingTask) await updateProjectTask(projectId, getId(editingTask), payload);
      else await createProjectTask(projectId, payload);
      setShowForm(false); setEditingTask(null); resetForm();
      await loadTasks(false);
    } catch {
      setError(editingTask ? "Could not update the task." : "Could not create the task.");
    } finally { setSaving(false); }
  };

  const changeStatus = async (task, status) => {
    try {
      setError("");
      await updateProjectTaskStatus(projectId, getId(task), status);
      await loadTasks(false);
    } catch {
      setError("Could not update the task status. Check your permissions and try again.");
    }
  };

  const isAssignedToMe = task => String(task.assigneeId || getId(task.assignee)) === String(currentUserId || "");
  const dateLabel = value => value ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "No deadline";
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === "COMPLETED").length;
  const progress = total ? Math.round(completed / total * 100) : 0;

  return (
    <div className="min-h-full w-full min-w-0 overflow-x-hidden bg-gradient-to-br from-[#213F70] via-[#315A8A] to-[#496C98] px-4 py-6 text-white sm:px-6 lg:px-9 lg:py-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div><p className="mb-2 text-sm text-blue-100/65">Project Workspace / Tasks</p><h1 className="text-3xl font-bold sm:text-4xl">Project Tasks</h1><p className="mt-2 text-sm text-blue-100/70">Assign work, submit deliverables and review progress.</p></div>
          {manager && <button type="button" onClick={() => { setEditingTask(null); resetForm(); setError(""); setShowForm(v => !v); }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0875F9] px-5 py-3 text-sm font-semibold hover:bg-[#2588FF]">{showForm ? <FiX /> : <FiPlus />}{showForm ? "Close" : "Create task"}</button>}
        </header>

        {error && <div role="alert" className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-rose-300/20 bg-rose-400/10 p-4 text-sm text-rose-100"><FiAlertCircle /><span className="min-w-0 flex-1">{error}</span><button type="button" onClick={() => loadTasks()} className="rounded-lg border border-white/20 px-3 py-1.5 text-xs">Retry</button></div>}

        {showForm && manager && <form onSubmit={saveTask} className="mb-7 rounded-2xl border border-white/20 bg-white/[0.10] p-5 shadow-xl sm:p-7">
          <div className="mb-5 flex items-center justify-between gap-3"><div><h2 className="text-xl font-bold">{editingTask ? "Edit task" : "Create task"}</h2><p className="mt-1 text-sm text-blue-100/65">Set task details and assign a collaborator.</p></div><button type="button" onClick={() => { setShowForm(false); setEditingTask(null); }} aria-label="Close form" className="rounded-lg p-2 hover:bg-white/10"><FiX /></button></div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="md:col-span-2"><span className="mb-2 block text-sm font-medium">Title *</span><input name="title" required maxLength={160} value={form.title} onChange={updateForm} className="w-full rounded-xl border border-white/15 bg-white/[0.08] px-4 py-3 text-sm outline-none focus:border-blue-300" /></label>
            <label className="md:col-span-2"><span className="mb-2 block text-sm font-medium">Description</span><textarea name="description" rows={3} maxLength={4000} value={form.description} onChange={updateForm} className="w-full rounded-xl border border-white/15 bg-white/[0.08] px-4 py-3 text-sm outline-none focus:border-blue-300" /></label>
            <label><span className="mb-2 block text-sm font-medium">Priority</span><select name="priority" value={form.priority} onChange={updateForm} className="w-full rounded-xl border border-white/15 bg-[#173F70] px-4 py-3 text-sm"><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option></select></label>
            <label><span className="mb-2 block text-sm font-medium">Assignee</span><select name="assigneeId" value={form.assigneeId} onChange={updateForm} className="w-full rounded-xl border border-white/15 bg-[#173F70] px-4 py-3 text-sm"><option value="">Unassigned</option>{assignee.map(u => <option key={getId(u)} value={getId(u)}>{u.name || u.email || "Member"}</option>)}</select></label>
            <label><span className="mb-2 block text-sm font-medium">Due date</span><input type="date" name="dueDate" value={form.dueDate} onChange={updateForm} className="w-full rounded-xl border border-white/15 bg-white/[0.08] px-4 py-3 text-sm" /></label>
          </div>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => { setShowForm(false); setEditingTask(null); }} className="rounded-xl border border-white/20 px-5 py-3 text-sm">Cancel</button><button type="submit" disabled={saving} className="rounded-xl bg-[#0875F9] px-5 py-3 text-sm font-semibold disabled:opacity-50">{saving ? "Saving..." : editingTask ? "Save changes" : "Create task"}</button></div>
        </form>}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/15 bg-white/[0.09] p-5"><p className="text-sm text-blue-100/70">Total tasks</p><p className="mt-2 text-3xl font-bold">{total}</p></div>
          <div className="rounded-2xl border border-white/15 bg-white/[0.09] p-5"><p className="text-sm text-blue-100/70">Completed</p><p className="mt-2 text-3xl font-bold">{completed}</p></div>
          <div className="rounded-2xl border border-white/15 bg-white/[0.09] p-5"><div className="flex justify-between text-sm text-blue-100/70"><span>Completion</span><span>{progress}%</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-blue-300" style={{ width: `${progress}%` }} /></div></div>
        </div>

        {loading ? <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">{STATUSES.map(s => <div key={s} className="h-64 animate-pulse rounded-2xl bg-white/10" />)}</div> : (
          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:thin]">
            {STATUSES.map(status => {
              const cfg = STATUS_CONFIG[status], Icon = cfg.icon;
              const columnTasks = tasks.filter(t => (t.status || "TODO") === status);
              return <section key={status} className="w-[min(86vw,340px)] shrink-0 snap-start rounded-2xl border border-white/15 bg-white/[0.07] p-3 sm:w-[320px]">
                <div className="mb-3 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.06] p-3"><div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`} /><h2 className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</h2></div><span className="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-semibold">{columnTasks.length}</span></div>
                <div className="space-y-3">
                  {columnTasks.map(task => {
                    const assigned = isAssignedToMe(task);
                    return <article key={getId(task)} className="rounded-xl border border-white/15 bg-white/[0.09] p-4">
                      <div className="mb-3 flex items-center justify-between gap-2"><span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.MEDIUM}`}>{task.priority || "MEDIUM"}</span><Icon className={cfg.color} /></div>
                      <h3 className="break-words text-sm font-bold">{task.title || "Untitled task"}</h3>
                      <p className="mt-2 line-clamp-3 break-words text-xs leading-5 text-blue-100/65">{task.description || "No description provided."}</p>
                      <div className="mt-4 space-y-2 border-t border-white/10 pt-3 text-xs text-blue-100/70"><div className="flex items-center gap-2"><FiUser /><span className="truncate">{task.assignee?.name || assignee.find(u => getId(u) === String(task.assigneeId))?.name || "Unassigned"}</span></div><div className="flex items-center gap-2"><FiCalendar /><span>{dateLabel(task.dueDate)}</span></div></div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {manager && status !== "IN_REVIEW" && status !== "COMPLETED" && status !== "CANCELLED" && <button type="button" onClick={() => openEdit(task)} className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-white/15 px-2 py-2 text-xs hover:bg-white/10"><FiEdit2 />Edit</button>}
                        {status === "TODO" && (manager || assigned) && <button type="button" onClick={() => changeStatus(task, "IN_PROGRESS")} className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-blue-500/20 px-2 py-2 text-xs font-semibold text-blue-100 hover:bg-blue-500/30">Start task <FiArrowRight /></button>}
                        {status === "IN_PROGRESS" && assigned && <button type="button" onClick={() => setSubmissionTask(task)} className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-blue-500/20 px-2 py-2 text-xs font-semibold text-blue-100 hover:bg-blue-500/30"><FiSend />Submit work</button>}
                        {status === "IN_REVIEW" && manager && <button type="button" onClick={() => setReviewTask(task)} className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-amber-400/15 px-2 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-400/25">Review deliverable</button>}
                        {status === "IN_REVIEW" && assigned && <span className="w-full rounded-lg bg-amber-400/10 px-2 py-2 text-center text-xs text-amber-100">Awaiting manager approval</span>}
                      </div>
                    </article>;
                  })}
                  {!columnTasks.length && <div className="rounded-xl border border-dashed border-white/15 px-3 py-8 text-center"><Icon className={`mx-auto mb-2 text-xl ${cfg.color}`} /><p className="text-xs text-blue-100/50">No tasks here yet</p></div>}
                </div>
              </section>;
            })}
          </div>
        )}
        <p className="mt-5 text-center text-xs text-blue-100/45">Quorum Project Task Management</p>
      </div>
      {submissionTask && <DeliverableModal projectId={projectId} task={submissionTask} onClose={() => setSubmissionTask(null)} onSubmitted={() => loadTasks(false)} />}
      {reviewTask && <div className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-sm"><div className="my-auto w-full max-w-2xl"><DeliverableReview projectId={projectId} task={reviewTask} onReviewed={() => loadTasks(false)} onClose={() => setReviewTask(null)} /></div></div>}
    </div>
  );
}
