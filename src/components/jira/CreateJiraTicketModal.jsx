import { useState, useEffect } from "react";
import {
  FiX,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiBold,
  FiItalic,
  FiUnderline,
  FiList,
  FiLink,
  FiImage,
  FiUser,
} from "react-icons/fi";
import { SiJira } from "react-icons/si";
import { createTeamJiraTicket, getTeamJiraAssignees } from "../../services/jiraService";

const ISSUE_TYPES = ["Task", "Bug", "Story", "Improvement", "Epic"];
const PRIORITIES = ["Highest", "High", "Medium", "Low", "Lowest"];

export function CreateJiraTicketModal({
  orgId,
  teamId,
  teamName,
  isOpen,
  onClose,
  onTicketCreated,
  currentUser,
  initialAssignees = [],
}) {
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [issueType, setIssueType] = useState("Task");
  const [priority, setPriority] = useState("High");
  const [assigneeAccountId, setAssigneeAccountId] = useState("");
  const [assignees, setAssignees] = useState(initialAssignees);
  const [loadingAssignees, setLoadingAssignees] = useState(false);
  const [manualAssigneeMode, setManualAssigneeMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  useEffect(() => {
    let isMounted = true;
    if (isOpen && orgId && teamId) {
      if (initialAssignees && initialAssignees.length > 0) {
        setAssignees(initialAssignees);
        return;
      }
      setLoadingAssignees(true);
      getTeamJiraAssignees(orgId, teamId)
        .then((data) => {
          if (isMounted) {
            setAssignees(Array.isArray(data) ? data : []);
          }
        })
        .catch((err) => {
          console.warn("Could not fetch team Jira assignees:", err);
          if (isMounted) setAssignees([]);
        })
        .finally(() => {
          if (isMounted) setLoadingAssignees(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, orgId, teamId, initialAssignees]);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!summary.trim()) {
      setError("Issue summary is required.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const payload = {
        summary: summary.trim(),
        description: description.trim(),
        issueType,
        priority,
        ...(assigneeAccountId.trim() ? { assigneeAccountId: assigneeAccountId.trim() } : {}),
      };

      const createdTicket = await createTeamJiraTicket(orgId, teamId, payload);
      setSuccess(true);
      setTimeout(() => {
        if (onTicketCreated) onTicketCreated(createdTicket);
        handleClose();
      }, 600);
    } catch (err) {
      console.error("Failed to create Jira issue:", err);
      const errMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to create issue in Jira. Ensure Jira is linked to this organization.";
      setError(errMsg);
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    setSummary("");
    setDescription("");
    setIssueType("Task");
    setPriority("High");
    setAssigneeAccountId("");
    setManualAssigneeMode(false);
    setError("");
    setSuccess(false);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !submitting) handleClose();
      }}
    >
      <div className="w-full max-w-xl rounded-2xl border border-white/20 bg-[#1D3B5C] p-6 text-white shadow-2xl backdrop-blur-md">
    
        <div className="mb-5 flex items-start justify-between border-b border-white/15 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/30 bg-[#EAF4FF]/25 text-blue-50">
              <SiJira size={22} />
            </span>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Create Jira Issue</h3>
              <p className="text-xs text-blue-100/60 font-medium">by Atlassian</p>
            </div>
          </div>
          <button
            type="button"
            disabled={submitting}
            onClick={handleClose}
            className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white transition"
          >
            <FiX size={18} />
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200/30 bg-red-500/20 p-3 text-xs text-red-100">
            <FiAlertCircle className="h-4 w-4 shrink-0 text-red-200" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-white/20 bg-white/15 p-3 text-xs text-white">
            <FiCheckCircle className="h-4 w-4 shrink-0 text-blue-200" />
            <span>Issue created successfully in Jira!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-blue-200">
                Project
              </label>
              <input
                type="text"
                disabled
                value={`${teamName || "Quorum"} App`}
                className="w-full rounded-xl border border-white/15 bg-[#0B2F58]/50 px-3.5 py-2.5 text-xs text-white/80 font-medium cursor-not-allowed outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-blue-200">
                Issue Type
              </label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="w-full rounded-xl border border-white/20 bg-[#0B2F58]/40 px-3.5 py-2.5 text-xs text-white backdrop-blur-sm focus:border-sky-300 focus:outline-none"
              >
                {ISSUE_TYPES.map((type) => (
                  <option key={type} value={type} className="bg-[#1D3B5C] text-white">
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-blue-200">
              Summary <span className="text-red-300">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Implement WebRTC renegotiation logic"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full rounded-xl border border-white/20 bg-[#0B2F58]/40 px-3.5 py-2.5 text-xs text-white placeholder:text-blue-100/40 backdrop-blur-sm focus:border-sky-300 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-blue-200">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-xl border border-white/20 bg-[#0B2F58]/40 px-3.5 py-2.5 text-xs font-semibold text-white backdrop-blur-sm focus:border-sky-300 focus:outline-none"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p} className="bg-[#1D3B5C] text-white">
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-blue-200">
                <label htmlFor="jira-assignee-field" className="flex items-center gap-1.5">
                  <FiUser className="text-blue-300" size={13} />
                  <span>Assignee</span>
                </label>
                {assignees.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setManualAssigneeMode(!manualAssigneeMode)}
                    className="text-[10px] text-blue-200/70 hover:text-white underline transition"
                  >
                    {manualAssigneeMode ? "Select User" : "Manual ID"}
                  </button>
                )}
              </div>

              {loadingAssignees ? (
                <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-[#0B2F58]/40 px-3.5 py-2.5 text-xs text-blue-100/70">
                  <FiRefreshCw className="h-3.5 w-3.5 animate-spin text-blue-300" />
                  <span>Loading team assignees...</span>
                </div>
              ) : manualAssigneeMode || assignees.length === 0 ? (
                <input
                  id="jira-assignee-field"
                  type="text"
                  placeholder="Enter Atlassian Account ID (optional)"
                  value={assigneeAccountId}
                  onChange={(e) => setAssigneeAccountId(e.target.value)}
                  className="w-full rounded-xl border border-white/20 bg-[#0B2F58]/40 px-3.5 py-2.5 text-xs text-white placeholder:text-blue-100/40 backdrop-blur-sm focus:border-sky-300 focus:outline-none"
                />
              ) : (
                <select
                  id="jira-assignee-field"
                  value={assigneeAccountId}
                  onChange={(e) => setAssigneeAccountId(e.target.value)}
                  className="w-full rounded-xl border border-white/20 bg-[#0B2F58]/40 px-3.5 py-2.5 text-xs text-white backdrop-blur-sm focus:border-sky-300 focus:outline-none"
                >
                  <option value="" className="bg-[#1D3B5C] text-white/80">
                    Unassigned
                  </option>
                  {assignees.map((user) => (
                    <option
                      key={user.accountId}
                      value={user.accountId}
                      className="bg-[#1D3B5C] text-white"
                    >
                      {user.displayName} {user.email ? `(${user.email})` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-blue-200">
              Description
            </label>
            <div className="rounded-xl border border-white/20 bg-[#0B2F58]/40 overflow-hidden backdrop-blur-sm">

              <div className="flex items-center gap-1 border-b border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-blue-100/70">
                <button type="button" className="p-1 hover:text-white rounded" title="Bold">
                  <FiBold size={13} />
                </button>
                <button type="button" className="p-1 hover:text-white rounded" title="Italic">
                  <FiItalic size={13} />
                </button>
                <button type="button" className="p-1 hover:text-white rounded" title="Underline">
                  <FiUnderline size={13} />
                </button>
                <span className="mx-1 h-3 w-px bg-white/20" />
                <button type="button" className="p-1 hover:text-white rounded" title="Bullet List">
                  <FiList size={13} />
                </button>
                <button type="button" className="p-1 hover:text-white rounded" title="Link">
                  <FiLink size={13} />
                </button>
                <button type="button" className="p-1 hover:text-white rounded" title="Image">
                  <FiImage size={13} />
                </button>
              </div>

              <textarea
                rows={4}
                placeholder="Add logic to handle ICE connection changes, implement offer/answer renegotiation flow..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-transparent p-3 text-xs text-white placeholder:text-blue-100/40 outline-none resize-none"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/15">
            <button
              type="button"
              disabled={submitting}
              onClick={handleClose}
              className="rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-xs font-semibold text-white hover:bg-white/20 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || success}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#0068FF] px-6 py-2.5 text-xs font-semibold text-white shadow-md transition hover:bg-[#0879F9] disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <FiRefreshCw className="h-4 w-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Issue</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateJiraTicketModal;
