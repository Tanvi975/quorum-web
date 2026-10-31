import { useState, useEffect, useCallback } from "react";
import {
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiExternalLink,
  FiTrash2,
  FiShield,
  FiZap,
} from "react-icons/fi";
import { SiJira } from "react-icons/si";
import {
  getOrganizationJiraStatus,
  setupOrganizationJira,
  disconnectOrganizationJira,
  getJiraConnectionStatus,
  getJiraAuthorizeUrl,
} from "../../services/jiraService";

export function OrgJiraSettings({ orgId, isOrgAdmin = true }) {
  const [orgJira, setOrgJira] = useState(null);
  const [personalJira, setPersonalJira] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [projectKey, setProjectKey] = useState("");
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const loadData = useCallback(async (isSync = false) => {
    try {
      if (isSync) setSyncing(true);
      else setLoading(true);

      const [orgStatus, userStatus] = await Promise.allSettled([
        orgId ? getOrganizationJiraStatus(orgId) : Promise.resolve(null),
        getJiraConnectionStatus(),
      ]);

      if (orgStatus.status === "fulfilled" && orgStatus.value) {
        setOrgJira(orgStatus.value);
        if (orgStatus.value.projectKey) {
          setProjectKey(orgStatus.value.projectKey);
        }
      }

      if (userStatus.status === "fulfilled" && userStatus.value) {
        setPersonalJira(userStatus.value);
      }

      if (isSync) {
        setFeedback({
          type: "success",
          message: "Jira integration status synchronized successfully.",
        });
      }
    } catch (err) {
      console.error("Failed to load Jira integration settings:", err);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, [orgId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const isConnected = Boolean(
    (orgJira?.isConnected || orgJira?.isActive) && personalJira?.isConnected
  );

  async function handleConnectOrSave(e) {
    e.preventDefault();
    setFeedback({ type: "", message: "" });

    if (!orgId || !orgId.trim()) {
      setFeedback({
        type: "error",
        message: "No organization selected. Please select an organization above to link it with Jira.",
      });
      return;
    }


    if (!personalJira?.isConnected) {
      try {
        setSubmitting(true);
    
        if (projectKey.trim()) {
          sessionStorage.setItem("pending_jira_project_key", projectKey.trim().toUpperCase());
        }
        const url = await getJiraAuthorizeUrl();
        if (url) {
          window.location.href = url;
          return;
        }
      } catch (err) {
        setFeedback({
          type: "error",
          message:
            err?.response?.data?.message ||
            "Unable to generate Jira authorization URL. Please try again.",
        });
        setSubmitting(false);
        return;
      }
    }
    if (!projectKey.trim()) {
      setFeedback({
        type: "error",
        message: "Please enter a Project Key (e.g., DEV or SCRUM).",
      });
      return;
    }

    try {
      setSubmitting(true);
      const res = await setupOrganizationJira(orgId, projectKey.trim().toUpperCase());
      setOrgJira(res);
      setFeedback({
        type: "success",
        message: `Organization Jira integration configured successfully for project '${projectKey.trim().toUpperCase()}'.`,
      });
      sessionStorage.removeItem("pending_jira_project_key");
    } catch (err) {
      console.error("Failed to configure organization Jira:", err);
      setFeedback({
        type: "error",
        message:
          err?.response?.data?.message ||
          err?.message ||
          "Failed to verify or link Jira project. Verify that your Atlassian account has access to this project key.",
      });
    } finally {
      setSubmitting(false);
    }
  }


  async function handleDisconnect() {
    if (!window.confirm("Are you sure you want to disconnect Jira from this organization?")) {
      return;
    }

    try {
      setDisconnecting(true);
      setFeedback({ type: "", message: "" });
      await disconnectOrganizationJira(orgId);
      setOrgJira({ isConnected: false, isActive: false });
      setProjectKey("");
      setFeedback({
        type: "success",
        message: "Jira disconnected from organization.",
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message:
          err?.response?.data?.message ||
          "Failed to disconnect Jira. Please try again.",
      });
    } finally {
      setDisconnecting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-white/15 bg-[#1F5A91]/75 p-6 backdrop-blur-md">
        <FiRefreshCw className="h-6 w-6 animate-spin text-blue-200" />
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {feedback.message && (
        <div
          className={`flex items-start gap-3 rounded-2xl border p-4 backdrop-blur-md text-xs sm:text-sm ${
            feedback.type === "success"
              ? "border-white/20 bg-emerald-500/20 text-emerald-100"
              : "border-red-200/30 bg-red-500/20 text-red-100"
          }`}
        >
          {feedback.type === "success" ? (
            <FiCheckCircle className="h-4 w-4 shrink-0 text-emerald-200 mt-0.5" />
          ) : (
            <FiAlertCircle className="h-4 w-4 shrink-0 text-red-200 mt-0.5" />
          )}
          <span className="flex-1 font-medium">{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback({ type: "", message: "" })}
            className="text-white/60 hover:text-white"
          >
            ×
          </button>
        </div>
      )}

      <section className="rounded-2xl border border-white/15 bg-[#1F5A91]/75 p-5 sm:p-7 shadow-[0_8px_25px_rgba(0,0,0,0.08)] backdrop-blur-md text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/15">
          <div className="flex items-center gap-3.5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/30 bg-[#EAF4FF]/25 text-blue-50">
              <SiJira size={24} />
            </span>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-bold text-white">
                  Atlassian Jira Integration
                </h3>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    isConnected
                      ? "border border-emerald-400/40 bg-emerald-500/20 text-emerald-200"
                      : "border border-white/20 bg-white/10 text-blue-100"
                  }`}
                >
                  {isConnected ? "Connected" : "Not Connected"}
                </span>
              </div>
              <p className="mt-1 text-xs text-blue-100/75">
                Connect your Atlassian Cloud workspace to synchronize project tickets, status categories, and real-time updates.
              </p>
            </div>
          </div>
        </div>

        {!orgId && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-300/30 bg-amber-500/20 p-3.5 text-xs text-amber-100">
            <FiAlertCircle className="h-4 w-4 shrink-0 text-amber-200" />
            <span>
              No organization selected. Please select an organization from the selector above to configure Jira.
            </span>
          </div>
        )}
        {isConnected ? (
          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-xl border border-white/15 bg-[#0B2F58]/35 p-4 backdrop-blur-sm">
                <span className="text-[11px] font-medium text-blue-200 uppercase tracking-wider">
                  Instance
                </span>
                <p className="mt-1 text-sm font-semibold text-white break-all">
                  {orgJira?.siteUrl?.replace(/^https?:\/\//, "") || personalJira?.siteUrl?.replace(/^https?:\/\//, "") || "Atlassian Cloud"}
                </p>
              </div>

              <div className="rounded-xl border border-white/15 bg-[#0B2F58]/35 p-4 backdrop-blur-sm">
                <span className="text-[11px] font-medium text-blue-200 uppercase tracking-wider">
                  Connected By
                </span>
                <p className="mt-1 text-sm font-semibold text-white">
                  {personalJira?.jiraDisplayName || personalJira?.jiraEmail || "Org Admin"}
                </p>
              </div>

              <div className="rounded-xl border border-white/15 bg-[#0B2F58]/35 p-4 backdrop-blur-sm">
                <span className="text-[11px] font-medium text-blue-200 uppercase tracking-wider">
                  Active Project Key
                </span>
                <p className="mt-1 text-sm font-bold font-mono text-white">
                  {orgJira?.projectKey || projectKey || "DEV"}
                </p>
              </div>

              <div className="rounded-xl border border-white/15 bg-[#0B2F58]/35 p-4 backdrop-blur-sm">
                <span className="text-[11px] font-medium text-blue-200 uppercase tracking-wider">
                  Real-time Webhooks
                </span>
                <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-emerald-200">
                  <FiZap className="h-4 w-4 text-emerald-300" />
                  <span>Active - Synced</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/15">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => loadData(true)}
                  disabled={syncing}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#0068FF] px-4 py-2 text-xs font-semibold text-white shadow-md transition hover:bg-[#0879F9] disabled:opacity-50"
                >
                  <FiRefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
                  <span>{syncing ? "Syncing..." : "Sync Now"}</span>
                </button>

                {orgJira?.siteUrl && (
                  <a
                    href={orgJira.siteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20 transition"
                  >
                    <span>Open in Jira</span>
                    <FiExternalLink size={13} />
                  </a>
                )}
              </div>

              {isOrgAdmin && (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-300/40 bg-red-500/20 px-4 py-2 text-xs font-semibold text-red-100 hover:bg-red-500/30 transition disabled:opacity-50"
                >
                  <FiTrash2 size={14} />
                  <span>{disconnecting ? "Disconnecting..." : "Disconnect Jira"}</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleConnectOrSave} className="mt-6 space-y-5">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-blue-200">
                Project Key (e.g., DEV or SCRUM)
              </label>
              <div className="max-w-md">
                <input
                  type="text"
                  placeholder="Project Key (e.g., DEV or SCRUM)"
                  value={projectKey}
                  onChange={(e) => setProjectKey(e.target.value.toUpperCase())}
                  className="w-full rounded-xl border border-white/20 bg-[#0B2F58]/40 px-4 py-3 text-sm font-mono font-bold text-white placeholder:text-blue-100/50 backdrop-blur-sm focus:border-sky-300 focus:outline-none"
                />
              </div>
              <p className="mt-1.5 text-xs text-blue-100/60">
                Enter the exact Project Key from your Jira software board (e.g. <strong>SCRUM</strong> from SCRUM-1).
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting || !orgId}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0068FF] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#0879F9] disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <FiRefreshCw className="h-4 w-4 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <span>Connect to Jira</span>
              )}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}

export default OrgJiraSettings;
