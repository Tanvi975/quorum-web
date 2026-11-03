import { FiExternalLink, FiGitCommit } from "react-icons/fi";

export default function GitHubCommits({ commits = [], loading = false }) {
  if (loading) return <div className="py-10 text-center text-sm text-blue-100/70">Loading commits...</div>;
  if (!commits.length) return <div className="rounded-2xl border border-dashed border-white/20 p-10 text-center text-sm text-blue-100/65">No commits found.</div>;

  return (
    <div className="space-y-3 text-white">
      {commits.map((commit, index) => {
        const data = commit.commit || commit;
        const message = data.message || commit.message || "Commit";
        const author = data.author?.name || commit.author?.login || "Unknown author";
        const sha = commit.sha || "";
        return (
          <article key={sha || index} className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-white/15 bg-[#0B2F58]/35 p-4">
            <div className="min-w-0">
              <p className="break-words text-sm font-semibold">{message.split("\n")[0]}</p>
              <p className="mt-1 text-xs text-blue-100/65">{author} {sha ? `· ${sha.slice(0, 7)}` : ""}</p>
              {data.author?.date && <p className="mt-1 text-[11px] text-blue-100/50">{new Date(data.author.date).toLocaleString()}</p>}
            </div>
            <div className="flex items-center gap-2">
              <FiGitCommit className="text-blue-200" />
              {commit.html_url && <a href={commit.html_url} target="_blank" rel="noreferrer" aria-label="Open commit on GitHub" className="rounded-lg border border-white/20 p-2 hover:bg-white/10"><FiExternalLink /></a>}
            </div>
          </article>
        );
      })}
    </div>
  );
}
