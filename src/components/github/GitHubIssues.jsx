import { useState } from "react";
import { FiExternalLink, FiPlus, FiRefreshCw } from "react-icons/fi";
import CreateGitHubIssue from "./CreateGitHubIssue";

export default function GitHubIssues({ issues = [], onRefresh, onCreate, onCloseIssue, loading = false }) {
  const [showCreate, setShowCreate] = useState(false);
  const [state, setState] = useState("open");

  const visible = issues.filter((issue) => state === "all" || (issue.state || "open") === state);

  async function create(payload) {
    await onCreate?.(payload);
    setShowCreate(false);
  }

  return (
    <section className="space-y-4 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {["open", "closed", "all"].map((value) => (
            <button key={value} type="button" onClick={() => setState(value)} className={`rounded-lg px-3 py-2 text-xs font-semibold capitalize ${state === value ? "bg-[#0068FF] text-white" : "bg-white/10 text-blue-100 hover:bg-white/20"}`}>{value}</button>
          ))}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onRefresh} disabled={loading} className="rounded-xl border border-white/20 bg-white/10 p-2.5 hover:bg-white/20"><FiRefreshCw className={loading ? "animate-spin" : ""} /></button>
          <button type="button" onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 rounded-xl bg-[#0068FF] px-4 py-2.5 text-xs font-semibold hover:bg-[#0879F9]"><FiPlus /> Create Issue</button>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/20 p-10 text-center text-sm text-blue-100/65">No {state === "all" ? "" : state} issues found.</div>
      ) : visible.map((issue) => (
        <article key={issue.id || issue.number} className="rounded-xl border border-white/15 bg-[#0B2F58]/35 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="break-words text-sm font-semibold">{issue.title}</p>
              <p className="mt-1 text-xs text-blue-100/65">#{issue.number} · {issue.user?.login || issue.author?.login || "Contributor"} · {issue.state || "open"}</p>
              {issue.labels?.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{issue.labels.map((label) => <span key={label.id || label.name || label} className="rounded-full border border-sky-200/20 bg-sky-300/10 px-2 py-1 text-[10px] text-sky-100">{label.name || label}</span>)}</div>}
            </div>
            <div className="flex gap-2">
              {(issue.state || "open") === "open" && <button type="button" onClick={() => onCloseIssue?.(issue)} className="rounded-lg border border-white/20 px-3 py-2 text-xs hover:bg-white/10">Close</button>}
              {issue.html_url && <a href={issue.html_url} target="_blank" rel="noreferrer" aria-label="Open issue on GitHub" className="rounded-lg border border-white/20 p-2 hover:bg-white/10"><FiExternalLink /></a>}
            </div>
          </div>
          {issue.body && <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-xs text-blue-100/70">{issue.body}</p>}
        </article>
      ))}

      <CreateGitHubIssue open={showCreate} onClose={() => setShowCreate(false)} onCreate={create} />
    </section>
  );
}
