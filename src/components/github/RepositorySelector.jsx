import { useMemo, useState } from "react";
import { FiCheck, FiGitBranch, FiLock, FiSearch } from "react-icons/fi";

export default function RepositorySelector({ repositories = [], linkedRepo, onLink, onUnlink, loading = false }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("");

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return repositories;
    return repositories.filter((repo) =>
      [repo.full_name, repo.name, repo.description, repo.language]
        .some((field) => String(field || "").toLowerCase().includes(value))
    );
  }, [repositories, query]);

  if (linkedRepo) {
    const name = linkedRepo.full_name || linkedRepo.repoFullName || linkedRepo.name || "Linked repository";
    return (
      <section className="rounded-2xl border border-white/15 bg-[#0B2F58]/35 p-4 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-blue-200">Team repository</p>
            <p className="mt-1 break-all text-sm font-bold">{name}</p>
            {linkedRepo.default_branch && <p className="mt-1 flex items-center gap-1 text-xs text-blue-100/70"><FiGitBranch /> {linkedRepo.default_branch}</p>}
          </div>
          <button type="button" onClick={onUnlink} disabled={loading} className="rounded-xl border border-red-300/30 bg-red-500/15 px-3 py-2 text-xs font-semibold text-red-100 hover:bg-red-500/25 disabled:opacity-50">
            Unlink repository
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-white/15 bg-[#0B2F58]/35 p-4 text-white">
      <h3 className="font-semibold">Link a repository</h3>
      <p className="mt-1 text-xs text-blue-100/70">Select a repository that your GitHub account can access.</p>

      <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/20 bg-[#0B2F58]/60 px-3">
        <FiSearch className="shrink-0 text-blue-200" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search repositories..." className="min-h-11 w-full bg-transparent text-sm text-white outline-none placeholder:text-blue-100/50" />
      </div>

      <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/20 p-5 text-center text-xs text-blue-100/65">No repositories found.</p>
        ) : filtered.map((repo) => (
          <button key={repo.id || repo.full_name} type="button" onClick={() => setSelected(repo.full_name)} className={`w-full rounded-xl border p-3 text-left transition ${selected === repo.full_name ? "border-sky-300 bg-[#0068FF]/20" : "border-white/15 bg-white/[0.04] hover:bg-white/10"}`}>
            <div className="flex items-center justify-between gap-3">
              <span className="break-all text-sm font-semibold">{repo.full_name || repo.name}</span>
              <span className="flex shrink-0 items-center gap-1 text-[10px] text-blue-100/70">{repo.private ? <FiLock /> : null}{repo.private ? "Private" : "Public"}</span>
            </div>
            {repo.description && <p className="mt-1 line-clamp-2 text-xs text-blue-100/65">{repo.description}</p>}
            <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-blue-200/75">
              {repo.language && <span>{repo.language}</span>}
              {repo.default_branch && <span className="flex items-center gap-1"><FiGitBranch />{repo.default_branch}</span>}
            </div>
          </button>
        ))}
      </div>

      <button type="button" disabled={!selected || loading} onClick={() => onLink?.(selected)} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#0068FF] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#0879F9] disabled:cursor-not-allowed disabled:opacity-50">
        <FiCheck /> {loading ? "Linking..." : "Link selected repository"}
      </button>
    </section>
  );
}
