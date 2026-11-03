import { useCallback, useEffect, useState } from "react";
import { FiAlertCircle, FiRefreshCw } from "react-icons/fi";
import { SiGithub } from "react-icons/si";
import GitHubConnection from "./GitHubConnection";
import RepositorySelector from "./RepositorySelector";
import GitHubOverview from "./GitHubOverview";
import GitHubIssues from "./GitHubIssues";
import GitHubPullRequests from "./GitHubPullRequests";
import GitHubCommits from "./GitHubCommits";
import GitHubBranches from "./GitHubBranches";
import GitHubCollaborators from "./GitHubCollaborators";
import {
  getGitHubStatus, getGitHubRepos, getTeamGitHubRepo, linkTeamGitHubRepo,
  unlinkTeamGitHubRepo, getTeamGitHubIssues, createTeamGitHubIssue,
  updateTeamGitHubIssue, getTeamGitHubPulls, getTeamGitHubCommits,
  getTeamGitHubBranches, getTeamGitHubCollaborators,
} from "../../services/githubService";

const tabs = ["Overview", "Issues", "Pull Requests", "Commits", "Branches", "Collaborators"];

export default function TeamGitHubBoard({ orgId, team }) {
  const teamId = team?._id || team?.id;
  const [status, setStatus] = useState(null);
  const [repos, setRepos] = useState([]);
  const [repo, setRepo] = useState(null);
  const [activeTab, setActiveTab] = useState("Overview");
  const [data, setData] = useState({ issues: [], pulls: [], commits: [], branches: [], collaborators: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [repoBusy, setRepoBusy] = useState(false);
  const [error, setError] = useState("");

  const loadInitial = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    setError("");
    try {
      const [connection, linked] = await Promise.all([getGitHubStatus(), getTeamGitHubRepo(teamId)]);
      setStatus(connection);
      const linkedData = linked?.repo || linked?.repository || linked;
      setRepo(linkedData?.repoFullName ? linkedData : linkedData || null);
      if (connection?.connected) {
        setRepos(await getGitHubRepos());
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load GitHub integration. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  const refreshTab = useCallback(async () => {
    if (!teamId || !repo) return;
    setRefreshing(true);
    setError("");
    try {
      if (activeTab === "Overview") {
        const [issues, pulls, commits, branches, collaborators] = await Promise.all([
          getTeamGitHubIssues(teamId), getTeamGitHubPulls(teamId),
          getTeamGitHubCommits(teamId), getTeamGitHubBranches(teamId),
          getTeamGitHubCollaborators(teamId),
        ]);
        setData({ issues, pulls, commits, branches, collaborators });
      } else if (activeTab === "Issues") {
        const issues = await getTeamGitHubIssues(teamId, "open");
        setData((old) => ({ ...old, issues }));
      } else if (activeTab === "Pull Requests") {
        const pulls = await getTeamGitHubPulls(teamId);
        setData((old) => ({ ...old, pulls }));
      } else if (activeTab === "Commits") {
        const commits = await getTeamGitHubCommits(teamId);
        setData((old) => ({ ...old, commits }));
      } else if (activeTab === "Branches") {
        const branches = await getTeamGitHubBranches(teamId);
        setData((old) => ({ ...old, branches }));
      } else if (activeTab === "Collaborators") {
        const collaborators = await getTeamGitHubCollaborators(teamId);
        setData((old) => ({ ...old, collaborators }));
      }
    } catch (err) {
      setError(err?.response?.data?.message || `Unable to load GitHub ${activeTab.toLowerCase()}.`);
    } finally {
      setRefreshing(false);
    }
  }, [teamId, repo, activeTab]);

  useEffect(() => { loadInitial(); }, [loadInitial]);
  useEffect(() => { if (repo && status?.connected) refreshTab(); }, [repo, status, refreshTab]);

  async function handleLink(repoFullName) {
    setRepoBusy(true);
    setError("");
    try {
      const result = await linkTeamGitHubRepo(teamId, repoFullName);
      setRepo(result?.repo || result?.repository || result);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to link repository.");
    } finally {
      setRepoBusy(false);
    }
  }

  async function handleUnlink() {
    const fullName = repo?.full_name || repo?.repoFullName || repo?.name;
    if (!fullName || !window.confirm("Unlink this repository from the team?")) return;
    setRepoBusy(true);
    try {
      await unlinkTeamGitHubRepo(teamId, fullName);
      setRepo(null);
      setData({ issues: [], pulls: [], commits: [], branches: [], collaborators: [] });
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to unlink repository.");
    } finally {
      setRepoBusy(false);
    }
  }

  async function handleCreateIssue(payload) {
    await createTeamGitHubIssue(teamId, payload);
    await refreshTab();
  }

  async function handleCloseIssue(issue) {
    await updateTeamGitHubIssue(teamId, issue.number, "closed");
    await refreshTab();
  }

  if (loading) return <div className="flex h-64 items-center justify-center text-blue-100"><FiRefreshCw className="animate-spin" size={24} /></div>;

  return (
    <div className="flex min-h-[520px] flex-col gap-4 rounded-2xl border border-white/15 bg-[#1F5A91]/75 p-4 text-white shadow-lg backdrop-blur-md sm:p-6">
      <div className="flex items-center gap-3 border-b border-white/15 pb-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/10"><SiGithub size={24} /></span>
        <div><h2 className="text-lg font-bold">GitHub</h2><p className="text-xs text-blue-100/70">{team?.name || team?.teamName || "Team"} repository workspace</p></div>
      </div>

      {error && <div className="flex items-start gap-2 rounded-xl border border-red-300/30 bg-red-500/15 p-3 text-xs text-red-100"><FiAlertCircle className="mt-0.5 shrink-0" />{error}</div>}

      <GitHubConnection status={status} orgId={orgId} teamId={teamId} onDisconnected={() => { setStatus({ connected: false }); setRepo(null); setRepos([]); }} />

      {status?.connected && (
        <>
          {!repo ? (
            <RepositorySelector repositories={repos} loading={repoBusy} onLink={handleLink} />
          ) : (
            <>
              <RepositorySelector linkedRepo={repo} loading={repoBusy} onUnlink={handleUnlink} />
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-3">
                <div className="flex flex-wrap gap-2">
                  {tabs.map((tab) => <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${activeTab === tab ? "bg-[#0068FF] text-white" : "bg-white/10 text-blue-100 hover:bg-white/20"}`}>{tab}</button>)}
                </div>
                <button type="button" onClick={refreshTab} disabled={refreshing} className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs hover:bg-white/20 disabled:opacity-50"><FiRefreshCw className={refreshing ? "animate-spin" : ""} /> Refresh</button>
              </div>

              {activeTab === "Overview" && <GitHubOverview repository={repo} counts={{ issues: data.issues.length, pulls: data.pulls.length, commits: data.commits.length, branches: data.branches.length, collaborators: data.collaborators.length }} />}
              {activeTab === "Issues" && <GitHubIssues issues={data.issues} loading={refreshing} onRefresh={refreshTab} onCreate={handleCreateIssue} onCloseIssue={handleCloseIssue} />}
              {activeTab === "Pull Requests" && <GitHubPullRequests pulls={data.pulls} loading={refreshing} />}
              {activeTab === "Commits" && <GitHubCommits commits={data.commits} loading={refreshing} />}
              {activeTab === "Branches" && <GitHubBranches branches={data.branches} loading={refreshing} />}
              {activeTab === "Collaborators" && <GitHubCollaborators collaborators={data.collaborators} loading={refreshing} />}
            </>
          )}
        </>
      )}
    </div>
  );
}
