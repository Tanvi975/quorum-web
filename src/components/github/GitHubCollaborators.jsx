import { FiExternalLink, FiUser } from "react-icons/fi";

export default function GitHubCollaborators({ collaborators = [], loading = false }) {
  if (loading) return <div className="py-10 text-center text-sm text-blue-100/70">Loading collaborators...</div>;
  if (!collaborators.length) return <div className="rounded-2xl border border-dashed border-white/20 p-10 text-center text-sm text-blue-100/65">No collaborators found.</div>;

  return (
    <div className="grid grid-cols-1 gap-3 text-white sm:grid-cols-2">
      {collaborators.map((person) => (
        <article key={person.id || person.login} className="flex items-center justify-between gap-3 rounded-xl border border-white/15 bg-[#0B2F58]/35 p-4">
          <div className="flex min-w-0 items-center gap-3">
            {person.avatar_url ? <img src={person.avatar_url} alt="" className="h-10 w-10 rounded-full border border-white/20" /> : <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10"><FiUser /></span>}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{person.login || person.name || "GitHub user"}</p>
              <p className="mt-1 text-[11px] text-blue-100/60">{person.permissions?.admin ? "Admin" : person.permissions?.push ? "Write access" : person.permissions?.pull ? "Read access" : person.role_name || "Collaborator"}</p>
            </div>
          </div>
          {person.html_url && <a href={person.html_url} target="_blank" rel="noreferrer" aria-label="Open GitHub profile" className="rounded-lg border border-white/20 p-2 hover:bg-white/10"><FiExternalLink /></a>}
        </article>
      ))}
    </div>
  );
}
