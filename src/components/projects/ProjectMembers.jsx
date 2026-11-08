import { useEffect, useState } from "react";
import { FiUsers, FiPlus, FiX, FiTrash2, FiEdit2, FiSave, FiAlertCircle, FiBriefcase, FiDollarSign } from "react-icons/fi";
import { inviteProjectMember, updateProjectMember, removeProjectMember } from "../../services/projectService";

const roles = ["INTERNAL_MEMBER", "FREELANCER", "CLIENT", "PROJECT_MANAGER"];
const roleNames = { PROJECT_MANAGER: "Project Manager", INTERNAL_MEMBER: "Internal Member", FREELANCER: "Freelancer", CLIENT: "Client" };
const uid = user => user?.id || user?._id || user?.userId || "";
const safeError = "The action could not be completed. Please try again.";

export default function ProjectMembers({ projectId, initialMembers = [], isManager = false }) {
  const [members, setMembers] = useState(initialMembers);
  const [showInvite, setShowInvite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState("");
  const [editForm, setEditForm] = useState({ role: "", companyName: "", hourlyRate: "" });
  const [form, setForm] = useState({ email: "", role: "FREELANCER", hourlyRate: "", companyName: "" });

  useEffect(() => setMembers(initialMembers || []), [initialMembers]);

  const invite = async e => {
    e.preventDefault();
    if (!form.email.trim()) { setError("Enter an email address."); return; }
    try {
      setLoading(true); setError(""); setSuccess("");
      await inviteProjectMember(projectId, {
        email: form.email.trim(),
        role: form.role,
        hourlyRate: form.hourlyRate === "" ? undefined : Number(form.hourlyRate),
        companyName: form.companyName.trim() || undefined
      });
      setForm({ email: "", role: "FREELANCER", hourlyRate: "", companyName: "" });
      setShowInvite(false);
      setSuccess("Invitation sent.");
    } catch { setError("Could not send the invitation. Please check the details and try again."); }
    finally { setLoading(false); }
  };

  const beginEdit = member => {
    const user = member.user || {};
    const id = uid(user);
    setEditingId(id);
    setEditForm({
      role: member.role || "INTERNAL_MEMBER",
      companyName: member.companyName || "",
      hourlyRate: member.hourlyRate == null ? "" : String(member.hourlyRate)
    });
  };

  const saveEdit = async userId => {
    if (editForm.hourlyRate !== "" && (!Number.isFinite(Number(editForm.hourlyRate)) || Number(editForm.hourlyRate) < 0)) {
      setError("Enter a valid hourly rate."); return;
    }
    try {
      setBusyId(userId); setError(""); setSuccess("");
      await updateProjectMember(projectId, userId, {
        role: editForm.role,
        companyName: editForm.companyName.trim() || null,
        hourlyRate: editForm.hourlyRate === "" ? null : Number(editForm.hourlyRate)
      });
      setMembers(prev => prev.map(m => uid(m.user) === userId ? { ...m, ...editForm, hourlyRate: editForm.hourlyRate === "" ? null : Number(editForm.hourlyRate) } : m));
      setEditingId("");
      setSuccess("Member details updated.");
    } catch { setError("Could not update member details. Please try again."); }
    finally { setBusyId(""); }
  };

  const remove = async userId => {
    if (!window.confirm("Remove this collaborator from the project?")) return;
    try {
      setBusyId(userId); setError(""); setSuccess("");
      await removeProjectMember(projectId, userId);
      setMembers(prev => prev.filter(m => uid(m.user) !== userId));
      setSuccess("Collaborator removed.");
    } catch { setError("Could not remove this collaborator. Please try again."); }
    finally { setBusyId(""); }
  };

  return (
    <section className="w-full min-w-0 text-white">
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div><div className="flex items-center gap-2"><FiUsers className="text-blue-200" /><h2 className="text-xl font-bold sm:text-2xl">Project Members</h2></div><p className="mt-1 text-sm text-blue-100/60">Manage collaborators, roles and partner details.</p></div>
        {isManager && <button type="button" onClick={() => { setShowInvite(v => !v); setError(""); }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0875F9] px-4 py-2.5 text-sm font-semibold hover:bg-[#2588FF]">{showInvite ? <FiX /> : <FiPlus />}{showInvite ? "Close" : "Invite collaborator"}</button>}
      </div>
      {error && <p role="alert" className="mb-4 flex items-start gap-2 rounded-xl border border-rose-300/20 bg-rose-400/10 p-3 text-sm text-rose-100"><FiAlertCircle className="mt-0.5 shrink-0" />{error}</p>}
      {success && <p role="status" className="mb-4 rounded-xl border border-emerald-300/20 bg-emerald-400/10 p-3 text-sm text-emerald-100">{success}</p>}

      {showInvite && isManager && <form onSubmit={invite} className="mb-6 rounded-2xl border border-white/15 bg-white/[0.06] p-4 sm:p-5">
        <h3 className="mb-4 font-semibold">Invite a collaborator</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="text-sm">Email address *<input type="email" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="name@company.com" className="mt-2 w-full rounded-xl border border-white/15 bg-[#173F70] px-3 py-3 text-sm outline-none focus:border-blue-300" /></label>
          <label className="text-sm">Role<select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} className="mt-2 w-full rounded-xl border border-white/15 bg-[#173F70] px-3 py-3 text-sm">{roles.map(r => <option key={r} value={r}>{roleNames[r]}</option>)}</select></label>
          <label className="text-sm">Partner company<input value={form.companyName} onChange={e => setForm(p => ({ ...p, companyName: e.target.value }))} placeholder="Company name" className="mt-2 w-full rounded-xl border border-white/15 bg-[#173F70] px-3 py-3 text-sm outline-none focus:border-blue-300" /></label>
          <label className="text-sm">Hourly rate<input type="number" min="0" step="0.01" value={form.hourlyRate} onChange={e => setForm(p => ({ ...p, hourlyRate: e.target.value }))} placeholder="e.g. 60" className="mt-2 w-full rounded-xl border border-white/15 bg-[#173F70] px-3 py-3 text-sm outline-none focus:border-blue-300" /></label>
        </div>
        <div className="mt-4 flex justify-end"><button type="submit" disabled={loading} className="rounded-xl bg-[#0875F9] px-5 py-2.5 text-sm font-semibold disabled:opacity-50">{loading ? "Sending..." : "Send invitation"}</button></div>
      </form>}

      {members.length === 0 ? <div className="rounded-xl border border-dashed border-white/15 p-10 text-center text-sm text-blue-100/60">No project members found.</div> : <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {members.map((member, index) => {
          const person = member.user || {};
          const id = uid(person);
          const role = member.role || "INTERNAL_MEMBER";
          const isEditing = editingId === id;
          return <article key={member.id || id || index} className="min-w-0 rounded-2xl border border-white/12 bg-white/[0.06] p-4 sm:p-5">
            <div className="flex min-w-0 items-start gap-3">
              <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-blue-300/15 text-center text-lg font-bold leading-[44px] text-blue-100">{person.avatar ? <img src={person.avatar} alt="" className="h-full w-full object-cover" /> : (person.name || "U").charAt(0).toUpperCase()}</div>
              <div className="min-w-0 flex-1"><h3 className="truncate font-semibold">{person.name || "Unknown user"}</h3><p className="break-all text-xs text-blue-100/55">{person.email || "No email available"}</p><span className="mt-2 inline-flex rounded-full border border-blue-200/20 bg-blue-300/10 px-2.5 py-1 text-[11px] text-blue-100">{roleNames[role] || role}</span></div>
            </div>
            {!isEditing && (member.companyName || member.hourlyRate != null) && <div className="mt-4 flex flex-wrap gap-3 border-t border-white/10 pt-3 text-xs text-blue-100/70">{member.companyName && <span className="inline-flex items-center gap-1.5"><FiBriefcase />{member.companyName}</span>}{member.hourlyRate != null && <span className="inline-flex items-center gap-1.5"><FiDollarSign />{member.hourlyRate} / hr</span>}</div>}
            {isEditing && <div className="mt-4 grid grid-cols-1 gap-3 border-t border-white/10 pt-4 sm:grid-cols-2">
              <label className="text-xs text-blue-100/70">Role<select value={editForm.role} onChange={e => setEditForm(p => ({ ...p, role: e.target.value }))} className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#173F70] px-3 py-2 text-sm text-white">{roles.map(r => <option key={r} value={r}>{roleNames[r]}</option>)}</select></label>
              <label className="text-xs text-blue-100/70">Company<input value={editForm.companyName} onChange={e => setEditForm(p => ({ ...p, companyName: e.target.value }))} className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#173F70] px-3 py-2 text-sm text-white" /></label>
              <label className="text-xs text-blue-100/70 sm:col-span-2">Hourly rate<input type="number" min="0" step="0.01" value={editForm.hourlyRate} onChange={e => setEditForm(p => ({ ...p, hourlyRate: e.target.value }))} className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#173F70] px-3 py-2 text-sm text-white" /></label>
            </div>}
            {isManager && <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-white/10 pt-3">
              {isEditing ? <><button type="button" onClick={() => setEditingId("")} className="rounded-lg border border-white/15 px-3 py-2 text-xs">Cancel</button><button type="button" onClick={() => saveEdit(id)} disabled={busyId === id} className="inline-flex items-center gap-1.5 rounded-lg bg-[#0875F9] px-3 py-2 text-xs font-semibold disabled:opacity-50"><FiSave />Save</button></> : <><button type="button" onClick={() => beginEdit(member)} disabled={!id || role === "PROJECT_MANAGER"} className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs hover:bg-white/10 disabled:opacity-40"><FiEdit2 />Edit details</button>{role !== "PROJECT_MANAGER" && <button type="button" onClick={() => remove(id)} disabled={!id || busyId === id} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300/20 px-3 py-2 text-xs text-rose-200 hover:bg-rose-400/10 disabled:opacity-40"><FiTrash2 />{busyId === id ? "Removing..." : "Remove"}</button>}</>}
            </div>}
          </article>;
        })}
      </div>}
    </section>
  );
}
