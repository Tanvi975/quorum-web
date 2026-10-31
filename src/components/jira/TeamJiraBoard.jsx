import { useState, useEffect, useCallback, useMemo } from "react";
import {
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiAlertCircle,
  FiColumns,
  FiList,
} from "react-icons/fi";
import { SiJira } from "react-icons/si";
import {
  getTeamJiraTickets,
  getTeamJiraAssignees,
  updateJiraTicketStatus,
  getJiraAuthorizeUrl,
  getJiraConnectionStatus,
} from "../../services/jiraService";
import CreateJiraTicketModal from "./CreateJiraTicketModal";

const COLUMNS = [
  { key: "todo", label: "To Do", match: (s) => ["to do", "new", "open"].includes(s.toLowerCase()) },
  { key: "inProgress", label: "In Progress", match: (s) => ["in progress", "indeterminate"].includes(s.toLowerCase()) },
  { key: "review", label: "Review", match: (s) => ["review", "in review", "testing"].includes(s.toLowerCase()) },
  { key: "done", label: "Done", match: (s) => ["done", "completed", "closed"].includes(s.toLowerCase()) },
];

const STATUS_TRANSITIONS = ["To Do", "In Progress", "Review", "Done"];

export function TeamJiraBoard({ orgId, team, currentUser }) {
  const [tickets, setTickets] = useState([]);
  const [assignees, setAssignees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingKey, setUpdatingKey] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userJiraStatus, setUserJiraStatus] = useState(null);
  const [viewMode, setViewMode] = useState("kanban"); // "kanban" | "list"

  const teamId = team?._id || team?.id;
  const teamName = team?.name || team?.teamName || "Team";

  const fetchTickets = useCallback(
    async (isBackground = false) => {
      if (!orgId || !teamId) return;
      try {
        if (!isBackground) setLoading(true);
        else setRefreshing(true);
        setError("");

        const data = await getTeamJiraTickets(orgId, teamId);
        setTickets(data);
      } catch (err) {
        console.error("Failed to load Jira tickets:", err);
        const errMsg =
          err?.response?.data?.message ||
          err?.message ||
          "Unable to load Jira tickets for this team.";
        setError(errMsg);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [orgId, teamId]
  );

  const fetchAssignees = useCallback(async () => {
    if (!orgId || !teamId) return;
    try {
      const data = await getTeamJiraAssignees(orgId, teamId);
      setAssignees(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn("Could not load team Jira assignees:", err);
    }
  }, [orgId, teamId]);


  const assigneeMap = useMemo(() => {
    const map = new Map();
    assignees.forEach((a) => {
      if (a.accountId) map.set(a.accountId, a);
    });
    return map;
  }, [assignees]);

  useEffect(() => {
    getJiraConnectionStatus()
      .then((res) => setUserJiraStatus(res))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchTickets();
    fetchAssignees();
  }, [fetchTickets, fetchAssignees]);

  async function handleStatusChange(ticketKey, nextStatus) {
    try {
      setUpdatingKey(ticketKey);
      await updateJiraTicketStatus(orgId, teamId, ticketKey, nextStatus);

      setTickets((prev) =>
        prev.map((t) =>
          t.jiraKey === ticketKey
            ? { ...t, jiraStatus: nextStatus, lastSyncedAt: new Date().toISOString() }
            : t
        )
      );
    } catch (err) {
      console.error(`Failed to update status of ${ticketKey}:`, err);
      alert(
        err?.response?.data?.message ||
          `Failed to transition ticket ${ticketKey} to ${nextStatus}.`
      );
    } finally {
      setUpdatingKey(null);
    }
  }
  async function handleConnectJira() {
    try {
      const url = await getJiraAuthorizeUrl();
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      alert("Failed to initiate Jira OAuth connection: " + (err?.response?.data?.message || err.message));
    }
  }
  const filteredTickets = tickets.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      (t.jiraKey || "").toLowerCase().includes(q) ||
      (t.jiraSummary || "").toLowerCase().includes(q) ||
      (t.priority || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col h-full rounded-2xl border border-white/15 bg-[#1F5A91]/75 p-5 sm:p-7 shadow-[0_8px_25px_rgba(0,0,0,0.08)] backdrop-blur-md text-white overflow-hidden">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/15 shrink-0">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/30 bg-[#EAF4FF]/25 text-blue-50">
            <SiJira size={24} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-wide">Jira Board</h2>
              <span className="rounded-full border border-white/20 bg-white/15 px-3 py-0.5 text-xs font-semibold text-blue-50">
                {teamName}
              </span>
            </div>
            <p className="text-xs text-blue-100/75 mt-0.5">
              Live Kanban sync with Atlassian Cloud
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">

          <div className="flex items-center rounded-xl border border-white/20 bg-[#0B2F58]/30 p-1">
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className={`p-1.5 rounded-lg text-xs transition ${
                viewMode === "kanban" ? "bg-[#0068FF] text-white" : "text-white/70 hover:text-white"
              }`}
              title="Kanban Board View"
            >
              <FiColumns size={16} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg text-xs transition ${
                viewMode === "list" ? "bg-[#0068FF] text-white" : "text-white/70 hover:text-white"
              }`}
              title="List View"
            >
              <FiList size={16} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => fetchTickets(true)}
            disabled={refreshing || loading}
            title="Refresh tickets from Jira"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-white/20 disabled:opacity-50"
          >
            <FiRefreshCw size={15} className={refreshing ? "animate-spin text-blue-200" : ""} />
            <span>{refreshing ? "Syncing..." : "Sync"}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0068FF] px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#0879F9]"
          >
            <FiPlus size={16} />
            <span>+ Create Jira Issue</span>
          </button>
        </div>
      </div>

      {userJiraStatus && !userJiraStatus.isConnected && (
        <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-white/20 bg-[#0B2F58]/35 p-3.5 backdrop-blur-sm text-xs text-blue-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <FiAlertCircle size={18} className="shrink-0 text-blue-200" />
            <span>
              Your personal Atlassian Jira account is not linked. Connect it to attribute ticket creations and actions to you.
            </span>
          </div>
          <button
            type="button"
            onClick={handleConnectJira}
            className="shrink-0 rounded-xl bg-[#0068FF] px-3.5 py-1.5 font-semibold text-white shadow-md hover:bg-[#0879F9] transition"
          >
            Connect Jira
          </button>
        </div>
      )}

      <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/20 bg-[#0B2F58]/30 px-4 py-2.5 shadow-sm backdrop-blur-sm shrink-0 sm:max-w-md">
        <FiSearch className="shrink-0 text-blue-100/70" size={16} />
        <input
          type="search"
          placeholder="Search board by key or title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent text-xs sm:text-sm text-white outline-none placeholder:text-blue-100/60"
        />
      </div>

      <div className="mt-5 flex-1 min-h-0 overflow-y-auto">
        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-blue-100/70">
            <FiRefreshCw className="h-7 w-7 animate-spin text-blue-200" />
            <p className="text-sm">Fetching tickets from Jira...</p>
          </div>
        ) : error ? (
          <div className="flex h-56 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/30 bg-[#D9EAFE]/15 p-6 text-center text-white">
            <FiAlertCircle className="h-8 w-8 text-blue-200" />
            <p className="text-sm font-semibold">{error}</p>
            <p className="text-xs text-blue-100/75 max-w-md">
              Ensure that your Organization Admin has configured the Jira Project Key in Org Settings.
            </p>
            <button
              type="button"
              onClick={() => fetchTickets(false)}
              className="mt-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20 transition"
            >
              Retry
            </button>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/30 bg-[#D9EAFE]/15 px-5 py-14 text-center backdrop-blur-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-blue-50">
              <SiJira size={24} />
            </div>
            <h3 className="mt-4 text-base font-semibold text-white">No Jira tickets found</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-blue-50/75">
              {searchQuery
                ? "No tickets match your search criteria."
                : "No issues have been created for this team project yet. Click '+ Create Jira Issue' to add the first one!"}
            </p>
            {!searchQuery && (
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#0068FF] px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-[#0879F9] transition"
              >
                <FiPlus size={15} />
                <span>Create First Issue</span>
              </button>
            )}
          </div>
        ) : viewMode === "kanban" ? (

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 h-full pb-4">
            {COLUMNS.map((col) => {
              const columnTickets = filteredTickets.filter((t) => {
                const s = t.jiraStatus || t.statusCategory || "To Do";
                return col.match(s);
              });

              return (
                <div
                  key={col.key}
                  className="flex flex-col rounded-2xl border border-white/20 bg-[#0B2F58]/35 p-3.5 backdrop-blur-sm min-h-[350px]"
                >
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/15 px-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        {col.label}
                      </span>
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15 text-[11px] font-semibold text-blue-100">
                        {columnTickets.length}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                    {columnTickets.length === 0 ? (
                      <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-white/15 text-xs text-blue-100/50">
                        No issues
                      </div>
                    ) : (
                      columnTickets.map((ticket) => {
                        const status = ticket.jiraStatus || "To Do";
                        const isUpdating = updatingKey === ticket.jiraKey;
                        const assignee = ticket.assigneeAccountId
                          ? assigneeMap.get(ticket.assigneeAccountId)
                          : null;

                        return (
                          <article
                            key={ticket.id || ticket.jiraKey}
                            className="rounded-xl border border-white/20 bg-[#2A4F74]/90 p-3.5 shadow-sm hover:border-white/40 transition flex flex-col justify-between gap-3"
                          >
                            <div>
                              <div className="flex items-center justify-between text-xs mb-1.5">
                                <span className="font-mono font-bold text-white">
                                  {ticket.jiraKey}
                                </span>
                                <span className="rounded-md border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] text-blue-100">
                                  {ticket.priority || "Medium"}
                                </span>
                              </div>
                              <h4 className="text-xs font-semibold text-white leading-snug line-clamp-3">
                                {ticket.jiraSummary}
                              </h4>

         
                              {ticket.assigneeAccountId && (
                                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-blue-100/90">
                                  {assignee?.avatarUrl ? (
                                    <img
                                      src={assignee.avatarUrl}
                                      alt={assignee.displayName}
                                      className="h-4 w-4 rounded-full border border-white/30"
                                    />
                                  ) : (
                                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#0068FF] text-[9px] font-bold text-white">
                                      {(assignee?.displayName || "A").charAt(0).toUpperCase()}
                                    </span>
                                  )}
                                  <span className="truncate max-w-[130px]">
                                    {assignee?.displayName || "Assigned"}
                                  </span>
                                </div>
                              )}
                            </div>

                    
                            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
                              <span className="text-blue-100/60">Move:</span>
                              <div className="flex items-center gap-1">
                                {STATUS_TRANSITIONS.filter((s) => s.toLowerCase() !== status.toLowerCase()).map(
                                  (target) => (
                                    <button
                                      key={target}
                                      type="button"
                                      disabled={isUpdating}
                                      onClick={() => handleStatusChange(ticket.jiraKey, target)}
                                      className="rounded border border-white/20 bg-white/10 px-1.5 py-0.5 text-[10px] text-white hover:bg-[#0068FF] hover:border-[#0068FF] transition disabled:opacity-50"
                                    >
                                      {isUpdating ? "..." : target}
                                    </button>
                                  )
                                )}
                              </div>
                            </div>
                          </article>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
            {filteredTickets.map((ticket) => {
              const status = ticket.jiraStatus || "To Do";
              const isUpdating = updatingKey === ticket.jiraKey;
              const assignee = ticket.assigneeAccountId
                ? assigneeMap.get(ticket.assigneeAccountId)
                : null;

              return (
                <article
                  key={ticket.id || ticket.jiraKey}
                  className="flex min-h-[160px] min-w-0 flex-col justify-between rounded-2xl border border-white/25 bg-[#2A4F74]/90 p-5 shadow-[0_5px_18px_rgba(5,35,75,0.18)] backdrop-blur-[3px] transition duration-200 hover:border-white/40 hover:bg-[#365F86]"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/30 bg-[#EAF4FF]/25 text-blue-50">
                          <SiJira size={16} />
                        </span>
                        <span className="font-mono text-xs font-bold text-white tracking-wider">
                          {ticket.jiraKey}
                        </span>
                      </div>
                      <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-blue-50">
                        {status}
                      </span>
                    </div>

                    <h3 className="mt-3 text-base font-semibold text-white leading-snug line-clamp-2">
                      {ticket.jiraSummary}
                    </h3>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/15 space-y-2">
                    <div className="flex items-center justify-between text-xs text-blue-100/75">
                      <span>Priority: <strong className="text-white">{ticket.priority || "Medium"}</strong></span>
                      {ticket.assigneeAccountId && (
                        <div className="flex items-center gap-1.5 text-xs text-blue-100">
                          {assignee?.avatarUrl ? (
                            <img
                              src={assignee.avatarUrl}
                              alt={assignee.displayName}
                              className="h-4 w-4 rounded-full border border-white/30"
                            />
                          ) : (
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#0068FF] text-[9px] font-bold text-white">
                              {(assignee?.displayName || "A").charAt(0).toUpperCase()}
                            </span>
                          )}
                          <span className="truncate max-w-[110px]">
                            {assignee?.displayName || "Assigned"}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <span className="text-[11px] text-blue-100/65 font-medium">Move to:</span>
                      <div className="flex items-center gap-1.5">
                        {STATUS_TRANSITIONS.filter((s) => s.toLowerCase() !== status.toLowerCase()).map(
                          (targetStatus) => (
                            <button
                              key={targetStatus}
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleStatusChange(ticket.jiraKey, targetStatus)}
                              className="rounded-lg border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-[#0068FF] hover:border-[#0068FF] disabled:opacity-50"
                            >
                              {isUpdating ? "..." : targetStatus}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <CreateJiraTicketModal
        orgId={orgId}
        teamId={teamId}
        teamName={teamName}
        currentUser={currentUser}
        initialAssignees={assignees}
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onTicketCreated={(newTicket) => {
          setTickets((prev) => [newTicket, ...prev]);
        }}
      />
    </div>
  );
}

export default TeamJiraBoard;
