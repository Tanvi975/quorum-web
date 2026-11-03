import { FiExternalLink, FiGitPullRequest } from "react-icons/fi";

export default function GitHubPullRequests({ pulls = [], loading = false }) {
  if (loading) return <div className="py-10 text-center text-sm text-blue-100/70">Loading pull requests...</div>;
  if (!pulls.length) return <div className="rounded-2xl border border-dashed border-white/20 p-10 text-center text-sm text-blue-100/65">No open pull requests found.</div>;

  return (
    <div className="space-y-3 text-white">
      {pulls.map((pull) => (
        <article key={pull.id || pull.number} className="rounded-xl border border-white/15 bg-[#0B2F58]/35 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="break-words text-sm font-semibold">{pull.title}</p>
              <p className="mt-1 text-xs text-blue-100/65">#{pull.number} · {pull.user?.login || "Contributor"} · {pull.state || "open"}</p>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-blue-100/70"><FiGitPullRequest /> {pull.head?.ref || "source"} → {pull.base?.ref || "target"}</p>
            </div>
            {pull.html_url && <a href={pull.html_url} target="_blank" rel="noreferrer" aria-label="Open pull request on GitHub" className="rounded-lg border border-white/20 p-2 hover:bg-white/10"><FiExternalLink /></a>}
          </div>
          {pull.body && <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-xs text-blue-100/70">{pull.body}</p>}
        </article>
      ))}
    </div>
  );
}
