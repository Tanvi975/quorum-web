import { FiGitBranch, FiGitCommit, FiGitPullRequest, FiAlertCircle, FiUsers } from "react-icons/fi";

const tiles = [
  { key: "issues", label: "Open Issues", icon: FiAlertCircle },
  { key: "pulls", label: "Open Pull Requests", icon: FiGitPullRequest },
  { key: "commits", label: "Recent Commits", icon: FiGitCommit },
  { key: "branches", label: "Branches", icon: FiGitBranch },
  { key: "collaborators", label: "Collaborators", icon: FiUsers },
];

export default function GitHubOverview({ counts = {}, repository }) {
  return (
    <section className="space-y-4 text-white">
      {repository && (
        <div className="rounded-2xl border border-white/15 bg-[#0B2F58]/35 p-4">
          <p className="text-[11px] uppercase tracking-wider text-blue-200">Connected repository</p>
          <p className="mt-1 break-all text-base font-bold">{repository.full_name || repository.repoFullName || repository.name}</p>
          {repository.description && <p className="mt-1 text-xs text-blue-100/70">{repository.description}</p>}
        </div>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {tiles.map(({ key, label, icon: Icon }) => (
          <div key={key} className="rounded-2xl border border-white/15 bg-[#0B2F58]/35 p-4">
            <div className="flex items-center justify-between gap-2 text-blue-100/75">
              <span className="text-xs">{label}</span>
              <Icon size={17} />
            </div>
            <p className="mt-3 text-2xl font-bold">{counts[key] ?? "—"}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
