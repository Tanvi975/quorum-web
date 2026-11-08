import { useState } from "react";
import { FiX, FiSend, FiAlertCircle, FiLink } from "react-icons/fi";
import { submitTaskDeliverable } from "../../services/projectService";

export default function DeliverableModal({ projectId, task, onClose, onSubmitted }) {
  const [deliverableUrl, setDeliverableUrl] = useState("");
  const [deliverableNote, setDeliverableNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!task) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (task.status === "IN_REVIEW") {
      setError("This task is awaiting approval.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      await submitTaskDeliverable(projectId, task.id || task._id, {
        deliverableUrl: deliverableUrl.trim(),
        deliverableNote: deliverableNote.trim()
      });
      await onSubmitted?.();
      onClose?.();
    } catch {
      setError("Could not submit the deliverable. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-labelledby="deliverable-title">
      <div className="my-auto w-full max-w-xl rounded-2xl border border-white/15 bg-[#17385F] p-5 text-white shadow-2xl sm:p-7">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-200">Task submission</p>
            <h2 id="deliverable-title" className="mt-1 text-xl font-bold sm:text-2xl">Submit deliverable</h2>
            <p className="mt-1 break-words text-sm text-blue-100/65">{task.title}</p>
          </div>
          <button type="button" onClick={onClose} disabled={loading} aria-label="Close" className="rounded-lg p-2 text-blue-100 hover:bg-white/10 disabled:opacity-50"><FiX /></button>
        </div>

        {task.status === "IN_REVIEW" ? (
          <div className="rounded-xl border border-amber-300/25 bg-amber-400/10 p-4 text-sm text-amber-100">
            Awaiting manager approval. You can submit another version after the manager requests changes.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="deliverable-url" className="mb-2 block text-sm font-medium">Deliverable URL *</label>
              <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.07] px-3 focus-within:border-blue-300">
                <FiLink className="shrink-0 text-blue-200" />
                <input id="deliverable-url" type="url" required value={deliverableUrl} onChange={e => setDeliverableUrl(e.target.value)} placeholder="https://..." className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-blue-100/40" />
              </div>
              <p className="mt-1 text-xs text-blue-100/55">Add a shareable link to your uploaded work.</p>
            </div>
            <div>
              <label htmlFor="deliverable-note" className="mb-2 block text-sm font-medium">Submission notes</label>
              <textarea id="deliverable-note" rows={4} maxLength={2000} value={deliverableNote} onChange={e => setDeliverableNote(e.target.value)} placeholder="Summarize what you completed..." className="w-full resize-y rounded-xl border border-white/15 bg-white/[0.07] px-4 py-3 text-sm outline-none placeholder:text-blue-100/40 focus:border-blue-300" />
              <p className="mt-1 text-right text-xs text-blue-100/45">{deliverableNote.length}/2000</p>
            </div>
            {error && <p role="alert" className="flex items-start gap-2 rounded-lg border border-rose-300/20 bg-rose-400/10 p-3 text-sm text-rose-100"><FiAlertCircle className="mt-0.5 shrink-0" />{error}</p>}
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={onClose} disabled={loading} className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white/80 hover:bg-white/10 disabled:opacity-50">Cancel</button>
              <button type="submit" disabled={loading || !deliverableUrl.trim()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0875F9] px-5 py-3 text-sm font-semibold text-white hover:bg-[#2588FF] disabled:cursor-not-allowed disabled:opacity-50"><FiSend />{loading ? "Submitting..." : "Submit for review"}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
