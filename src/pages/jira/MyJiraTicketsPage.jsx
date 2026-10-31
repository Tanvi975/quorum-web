import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiSearch,
  FiRefreshCw,
  FiSettings,
  FiAlertCircle,
  FiTag,
  FiClock,
  FiArrowRight,
  FiCheck,
} from "react-icons/fi";
import { SiJira } from "react-icons/si";
import {
  getMyJiraTickets,
  updateJiraTicketStatus,
  getJiraConnectionStatus,
} from "../../services/jiraService";

const STATUS_OPTIONS = ["To Do", "In Progress", "Done"];

export default function MyJiraTicketsPage() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingKey, setUpdatingKey] = useState(null);
  const [jiraStatus, setJiraStatus] = useState(null);

  const fetchTickets = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      else setRefreshing(true);
      setError("");

      const [ticketsData, statusData] = await Promise.allSettled([
        getMyJiraTickets(),
        getJiraConnectionStatus(),
      ]);

      if (ticketsData.status === "fulfilled") {
        setTickets(ticketsData.value);
      } else {
        setError(
          ticketsData.reason?.response?.data?.message ||
            "Unable to retrieve your assigned Jira tickets."
        );
      }

      if (statusData.status === "fulfilled") {
        setJiraStatus(statusData.value);
      }
    } catch (err) {
      console.error("Failed to load my Jira tickets:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  async function handleStatusChange(ticket, nextStatus) {
    const orgId = ticket.organizationId || ticket.orgId;
    const teamId = ticket.teamId;
    const ticketKey = ticket.jiraKey;

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
      console.error(`Failed to update status for ${ticketKey}:`, err);
      alert(
        err?.response?.data?.message ||
          `Failed to transition ticket ${ticketKey} to ${nextStatus}.`
      );
    } finally {
      setUpdatingKey(null);
    }
  }

  const filteredTickets = tickets.filter((t) => {
    const matchesStatus =
      filterStatus === "ALL" ||
      (t.jiraStatus || "").toLowerCase() === filterStatus.toLowerCase();

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (t.jiraKey || "").toLowerCase().includes(q) ||
      (t.jiraSummary || "").toLowerCase().includes(q) ||
      (t.priority || "").toLowerCase().includes(q);

    return matchesStatus && matchesSearch;
  });

  const counts = {
    total: tickets.length,
    todo: tickets.filter((t) => (t.jiraStatus || "").toLowerCase() === "to do").length,
    inProgress: tickets.filter((t) => (t.jiraStatus || "").toLowerCase() === "in progress").length,
    done: tickets.filter((t) => (t.jiraStatus || "").toLowerCase() === "done").length,
  };

  return (
    <div
      className="relative isolate flex min-h-dvh flex-col overflow-hidden text-white"
      style={{
        backgroundColor: "#062C5F",
        backgroundImage: `linear-gradient(
          to bottom,
          #213F70 0%,
          #315A8A 35%,
          #506D9A 65%,
          #7698C5 100%
        )`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "100% 100%",
      }}
    >

      <header className="relative z-20 flex h-16 min-h-16 shrink-0 items-center border-b border-gray-200/20 bg-[#062C5F] px-4 shadow-sm sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          aria-label="Back to dashboard"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-[#213F70] transition hover:bg-gray-100"
        >
          <FiArrowLeft size={18} />
        </button>
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="absolute left-1/2 -translate-x-1/2 font-sans text-xl font-extrabold tracking-[0.18em] text-white transition hover:text-[#315A8A] sm:text-2xl"
        >
          QUORUM
        </button>
      </header>


      <div className="relative z-10 flex min-h-0 flex-1">
        <main className="min-w-0 flex-1 overflow-y-auto overscroll-y-contain px-4 pb-8 pt-5 sm:px-6 sm:pt-7 lg:px-8 lg:pt-8">
          <div className="mx-auto w-full max-w-[1180px]">
   
            <section className="flex flex-col justify-between gap-5 rounded-2xl border border-white/15 bg-[#1F5A91]/75 p-5 shadow-[0_8px_25px_rgba(0,0,0,0.08)] backdrop-blur-md sm:flex-row sm:items-center sm:p-7">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
                  Jira Work Management
                </p>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  My Jira Tickets
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100/75">
                  All tickets assigned to you across all teams in one unified board.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fetchTickets(true)}
                  disabled={refreshing || loading}
                  className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-white/20 disabled:opacity-50"
                >
                  <FiRefreshCw size={16} className={refreshing ? "animate-spin text-blue-200" : ""} />
                  <span>{refreshing ? "Syncing..." : "Sync Tickets"}</span>
                </button>

                <Link
                  to="/settings/integrations/jira"
                  className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0068FF] px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#0879F9]"
                >
                  <FiSettings size={16} />
                  <span>Jira Settings</span>
                </Link>
              </div>
            </section>

       
            {jiraStatus && !jiraStatus.isConnected && (
              <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-white/20 bg-[#1F5A91]/75 p-5 shadow-sm backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/30 bg-[#EAF4FF]/25 text-blue-50">
                    <FiAlertCircle size={22} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      Atlassian Account Not Linked
                    </h3>
                    <p className="mt-0.5 text-xs text-blue-100/75">
                      Connect your personal account so Quorum can match tickets assigned to your Jira identity.
                    </p>
                  </div>
                </div>

                <Link
                  to="/settings/integrations/jira"
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0068FF] px-4 py-2.5 text-xs font-semibold text-white shadow-md transition hover:bg-[#0879F9]"
                >
                  Connect Jira Account
                </Link>
              </div>
            )}


            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div
                onClick={() => setFilterStatus("ALL")}
                className={`cursor-pointer rounded-2xl p-5 border transition backdrop-blur-md ${
                  filterStatus === "ALL"
                    ? "border-[#0068FF] bg-[#2A5C8E] shadow-md ring-1 ring-[#0068FF]"
                    : "border-white/15 bg-[#1F5A91]/50 hover:bg-[#2A5C8E]/70"
                }`}
              >
                <p className="text-xs text-blue-100/75 font-semibold uppercase tracking-wider">
                  Assigned to Me
                </p>
                <p className="text-2xl font-bold text-white mt-2">{counts.total}</p>
              </div>

              <div
                onClick={() => setFilterStatus("To Do")}
                className={`cursor-pointer rounded-2xl p-5 border transition backdrop-blur-md ${
                  filterStatus.toLowerCase() === "to do"
                    ? "border-[#0068FF] bg-[#2A5C8E] shadow-md ring-1 ring-[#0068FF]"
                    : "border-white/15 bg-[#1F5A91]/50 hover:bg-[#2A5C8E]/70"
                }`}
              >
                <p className="text-xs text-blue-100/75 font-semibold uppercase tracking-wider">
                  To Do
                </p>
                <p className="text-2xl font-bold text-white mt-2">{counts.todo}</p>
              </div>

              <div
                onClick={() => setFilterStatus("In Progress")}
                className={`cursor-pointer rounded-2xl p-5 border transition backdrop-blur-md ${
                  filterStatus.toLowerCase() === "in progress"
                    ? "border-[#0068FF] bg-[#2A5C8E] shadow-md ring-1 ring-[#0068FF]"
                    : "border-white/15 bg-[#1F5A91]/50 hover:bg-[#2A5C8E]/70"
                }`}
              >
                <p className="text-xs text-blue-100/75 font-semibold uppercase tracking-wider">
                  In Progress
                </p>
                <p className="text-2xl font-bold text-white mt-2">{counts.inProgress}</p>
              </div>

              <div
                onClick={() => setFilterStatus("Done")}
                className={`cursor-pointer rounded-2xl p-5 border transition backdrop-blur-md ${
                  filterStatus.toLowerCase() === "done"
                    ? "border-[#0068FF] bg-[#2A5C8E] shadow-md ring-1 ring-[#0068FF]"
                    : "border-white/15 bg-[#1F5A91]/50 hover:bg-[#2A5C8E]/70"
                }`}
              >
                <p className="text-xs text-blue-100/75 font-semibold uppercase tracking-wider">
                  Done
                </p>
                <p className="text-2xl font-bold text-white mt-2">{counts.done}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-[#0B2F58]/30 px-4 py-3 shadow-sm backdrop-blur-sm sm:w-80">
                <FiSearch className="shrink-0 text-blue-100/70" size={18} />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by ticket key or title..."
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-blue-100/60"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto">
                {["ALL", "To Do", "In Progress", "Done"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFilterStatus(s)}
                    className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                      filterStatus.toLowerCase() === s.toLowerCase()
                        ? "bg-[#0068FF] text-white shadow-md"
                        : "border border-white/15 bg-white/10 text-blue-100/80 hover:bg-white/20"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <section className="mt-8">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Assigned Issues
                  </h2>
                  <p className="mt-1 text-xs text-blue-100/75">
                    Your assigned tickets synced from Jira
                  </p>
                </div>
                {!loading && (
                  <span className="rounded-full border border-white/20 bg-[#0B2F58]/25 px-3 py-1 text-xs text-blue-50">
                    {filteredTickets.length} found
                  </span>
                )}
              </div>

              {error && (
                <div
                  role="alert"
                  className="flex flex-col gap-3 rounded-xl border border-red-200/30 bg-red-500/15 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <p className="text-sm text-red-100">{error}</p>
                  <button
                    type="button"
                    onClick={() => fetchTickets(false)}
                    disabled={loading}
                    className="inline-flex items-center gap-2 self-start rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
                  >
                    <FiRefreshCw size={15} />
                    Retry
                  </button>
                </div>
              )}

              {loading ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="h-36 animate-pulse rounded-2xl border border-white/20 bg-[#D9EAFE]/20"
                    />
                  ))}
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/30 bg-[#D9EAFE]/15 px-5 py-14 text-center backdrop-blur-sm">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-blue-50">
                    <SiJira size={24} />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-white">
                    {searchQuery ? "No tickets match your search" : "No Jira tickets assigned to you"}
                  </h3>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-blue-50/75">
                    {searchQuery
                      ? "Try searching with a different keyword or Jira issue key."
                      : "When tickets in your organization's Jira project are assigned to your Atlassian account, they will automatically appear here."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredTickets.map((ticket) => {
                    const status = ticket.jiraStatus || "To Do";
                    const isUpdating = updatingKey === ticket.jiraKey;

                    return (
                      <article
                        key={ticket.id || ticket.jiraKey || ticket.jiraIssueId}
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
                            <span>
                              Priority: <strong className="text-white">{ticket.priority || "Medium"}</strong>
                            </span>
                            {ticket.createdAt && (
                              <span className="text-[11px] text-blue-100/60">
                                {new Date(ticket.createdAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>

              
                          <div className="flex items-center justify-between gap-2 pt-1">
                            <span className="text-[11px] text-blue-100/65 font-medium">Move to:</span>
                            <div className="flex items-center gap-1.5">
                              {STATUS_OPTIONS.filter((s) => s.toLowerCase() !== status.toLowerCase()).map(
                                (targetStatus) => (
                                  <button
                                    key={targetStatus}
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={() => handleStatusChange(ticket, targetStatus)}
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
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
