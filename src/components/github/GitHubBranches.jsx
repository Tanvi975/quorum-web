import { FiGitBranch, FiStar } from "react-icons/fi";

export default function GitHubBranches({ branches = [], loading = false }) {
  if (loading) return <div className="py-10 text-center text-sm text-blue-100/70">Loading branches...</div>;
  if (!branches.length) return <div className="rounded-2xl border border-dashed border-white/20 p-10 text-center text-sm text-blue-100/65">No branches found.</div>;

  return (
    <div className="grid grid-cols-1 gap-3 text-white sm:grid-cols-2">
      {branches.map((branch) => (
        <article key={branch.name} className="flex items-center justify-between gap-3 rounded-xl border border-white/15 bg-[#0B2F58]/35 p-4">
          <div className="flex min-w-0 items-center gap-3">
            <FiGitBranch className="shrink-0 text-blue-200" />
            <div className="min-w-0">
              <p className="break-all text-sm font-semibold">{branch.name}</p>
              <p className="mt-1 text-[11px] text-blue-100/60">{branch.commit?.sha ? branch.commit.sha.slice(0, 7) : "Branch"}</p>
            </div>
          </div>
          {branch.protected && <span className="flex shrink-0 items-center gap-1 text-[10px] text-amber-200"><FiStar /> Protected</span>}
        </article>
      ))}
    </div>
  );
}
