import { useState } from "react";
import { FiX } from "react-icons/fi";

export default function CreateGitHubIssue({ open, onClose, onCreate, loading = false }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [labels, setLabels] = useState("");

  if (!open) return null;

  async function submit(event) {
    event.preventDefault();
    if (!title.trim()) return;
    await onCreate?.({
      title: title.trim(),
      body: body.trim(),
      labels: labels.split(",").map((value) => value.trim()).filter(Boolean),
    });
    setTitle("");
    setBody("");
    setLabels("");
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.(); }}>
      <form onSubmit={submit} className="w-full max-w-lg space-y-4 rounded-2xl border border-white/15 bg-[#173B60] p-5 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Create GitHub Issue</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-blue-100 hover:bg-white/10"><FiX /></button>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-blue-100">Title</label>
          <input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Issue title" className="w-full rounded-xl border border-white/20 bg-[#0B2F58]/60 px-3 py-3 text-sm text-white outline-none placeholder:text-blue-100/50" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-blue-100">Description</label>
          <textarea rows={4} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Describe the issue..." className="w-full rounded-xl border border-white/20 bg-[#0B2F58]/60 px-3 py-3 text-sm text-white outline-none placeholder:text-blue-100/50" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-blue-100">Labels (comma separated)</label>
          <input value={labels} onChange={(event) => setLabels(event.target.value)} placeholder="bug, frontend" className="w-full rounded-xl border border-white/20 bg-[#0B2F58]/60 px-3 py-3 text-sm text-white outline-none placeholder:text-blue-100/50" />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-white/20 px-4 py-2.5 text-xs font-semibold hover:bg-white/10">Cancel</button>
          <button type="submit" disabled={loading || !title.trim()} className="rounded-xl bg-[#0068FF] px-4 py-2.5 text-xs font-semibold hover:bg-[#0879F9] disabled:opacity-50">{loading ? "Creating..." : "Create issue"}</button>
        </div>
      </form>
    </div>
  );
}
