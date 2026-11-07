import { useCallback, useEffect, useState } from "react";
import { FiRefreshCw, FiAlertCircle } from "react-icons/fi";
import { SiGithub } from "react-icons/si";
import OnboardingLayout from "../../components/OnboardingLayout";
import GitHubConnection from "../../components/github/GitHubConnection";
import RepositorySelector from "../../components/github/RepositorySelector";
import {
  getGitHubStatus,
  getGitHubRepos,
} from "../../services/githubService";

export default function MyGitHubPage() {
  const [status, setStatus] = useState(null);
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadGitHub = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const connection = await getGitHubStatus();
      setStatus(connection);

      if (connection?.connected) {
        const repos = await getGitHubRepos();
        setRepositories(repos);
      } else {
        setRepositories([]);
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Unable to load GitHub information."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGitHub();
  }, [loadGitHub]);

  return (
    <OnboardingLayout fullWidth>
      <main className="min-h-screen w-full bg-[linear-gradient(135deg,#253F5B,#305485,#506D91)] p-4 text-white sm:p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <SiGithub size={32} />
              <div>
                <h1 className="text-2xl font-bold">My GitHub</h1>
                <p className="mt-1 text-sm text-blue-100/70">
                  Manage your GitHub account and repositories.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={loadGitHub}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm hover:bg-white/20 disabled:opacity-50"
            >
              <FiRefreshCw className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          <GitHubConnection
            status={status}
            onDisconnected={() => {
              setStatus({ connected: false });
              setRepositories([]);
            }}
          />

          {error && (
            <div className="flex gap-2 rounded-xl border border-red-300/30 bg-red-500/15 p-4 text-sm text-red-100">
              <FiAlertCircle />
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-16">
              <FiRefreshCw className="animate-spin" size={26} />
            </div>
          ) : status?.connected ? (
            <section className="space-y-4">
              <h2 className="text-lg font-bold">Your repositories</h2>

              {repositories.length === 0 ? (
                <p className="rounded-xl border border-dashed border-white/20 p-8 text-center text-sm text-blue-100/70">
                  No repositories found.
                </p>
              ) : (
<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
  {repositories.map((repo) => (
    <a
      key={repo.id || repo.full_name}
      href={repo.html_url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between gap-3 rounded-xl border border-white/15 bg-[#0B2F58]/35 p-4 transition hover:border-sky-300/50 hover:bg-[#0B2F58]/70"
    >
      <span className="break-all font-semibold text-white">
        {repo.full_name}
      </span>

      <span className="shrink-0 text-sky-300">
        ↗
      </span>
    </a>
  ))}
</div>
              )}
            </section>
          ) : null}
        </div>
      </main>
    </OnboardingLayout>
  );
}