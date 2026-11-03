import { useState } from "react";
import { FiAlertCircle, FiCheckCircle, FiRefreshCw, FiTrash2 } from "react-icons/fi";
import { SiGithub } from "react-icons/si";
import { disconnectGitHub, getGitHubAuthorizeUrl } from "../../services/githubService";

export default function GitHubConnection({ status, orgId, teamId, onConnected, onDisconnected }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleConnect() {
    try {
      setLoading(true);
      setError("");
      if (orgId && teamId) {
        sessionStorage.setItem("pending_github_return", JSON.stringify({ orgId, teamId }));
      }
      const url = await getGitHubAuthorizeUrl();
      if (!url) throw new Error("GitHub authorization URL was not returned.");
      window.location.assign(url);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Unable to start GitHub connection.");
      setLoading(false);
    }
  }

  async function handleDisconnect() {
    if (!window.confirm("Are you sure you want to disconnect GitHub?")) return;
    try {
      setLoading(true);
      setError("");
      await disconnectGitHub();
      onDisconnected?.();
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to disconnect GitHub. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/15 bg-[#1F5A91]/75 p-5 text-white backdrop-blur-md sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/25 bg-white/10">
            <SiGithub size={25} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold">GitHub account</h3>
              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${status?.connected ? "border-emerald-300/40 bg-emerald-500/15 text-emerald-200" : "border-white/20 bg-white/10 text-blue-100"}`}>
                {status?.connected ? "Connected" : "Not connected"}
              </span>
            </div>
            <p className="mt-1 text-xs text-blue-100/70">
              {status?.connected ? `Connected as ${status.githubUsername || status.githubEmail || "GitHub user"}` : "Connect GitHub to link repositories with this team."}
            </p>
          </div>
        </div>

        {status?.connected ? (
          <button type="button" onClick={handleDisconnect} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-red-300/30 bg-red-500/15 px-4 py-2.5 text-xs font-semibold text-red-100 hover:bg-red-500/25 disabled:opacity-50">
            {loading ? <FiRefreshCw className="animate-spin" /> : <FiTrash2 />}
            Disconnect
          </button>
        ) : (
          <button type="button" onClick={handleConnect} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-[#0068FF] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#0879F9] disabled:opacity-50">
            {loading ? <FiRefreshCw className="animate-spin" /> : <SiGithub />}
            Connect GitHub
          </button>
        )}
      </div>

      {status?.connected && (
        <p className="mt-4 flex items-center gap-2 text-xs text-emerald-200">
          <FiCheckCircle /> GitHub account connected successfully.
        </p>
      )}
      {error && <p className="mt-4 flex items-center gap-2 text-xs text-red-100"><FiAlertCircle />{error}</p>}
    </section>
  );
}
