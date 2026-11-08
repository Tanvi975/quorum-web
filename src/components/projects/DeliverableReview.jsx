import { useState } from "react";
import { FiCheckCircle, FiAlertCircle, FiExternalLink, FiMessageSquare } from "react-icons/fi";
import { reviewTaskDeliverable } from "../../services/projectService";

export default function DeliverableReview({ projectId, task, onReviewed, onClose }) {
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  if (!task || task.status !== "IN_REVIEW") return null;

  const review = async (approved) => {
    if (!approved && !feedback.trim()) {
      setError("Add feedback before requesting changes.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      await reviewTaskDeliverable(projectId, task.id || task._id, { approved, feedback: feedback.trim() });
      await onReviewed?.();
      onClose?.();
    } catch {
      setError("Could not update the review. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-amber-300/20 bg-[#17385F] p-4 text-white shadow-xl sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-200">Manager review</p>
          <h3 className="mt-1 text-lg font-bold">{task.title}</h3>
        </div>
        <span className="rounded-full border border-amber-200/20 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-100">Awaiting approval</span>
      </div>
      {task.deliverableUrl && <a href={task.deliverableUrl} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-2 break-all text-sm font-semibold text-blue-200 underline underline-offset-4"><FiExternalLink className="shrink-0" />View submitted deliverable</a>}
      {task.deliverableNote && <p className="mt-3 whitespace-pre-wrap break-words rounded-xl bg-white/[0.06] p-3 text-sm leading-6 text-blue-50/80">{task.deliverableNote}</p>}
      <label htmlFor={`review-feedback-${task.id || task._id}`} className="mb-2 mt-4 flex items-center gap-2 text-sm font-medium"><FiMessageSquare />Manager feedback</label>
      <textarea id={`review-feedback-${task.id || task._id}`} rows={3} maxLength={2000} value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Explain what is approved or what needs to change..." className="w-full rounded-xl border border-white/15 bg-white/[0.07] px-3 py-3 text-sm outline-none placeholder:text-blue-100/40 focus:border-blue-300" />
      {error && <p role="alert" className="mt-3 flex items-center gap-2 rounded-lg bg-rose-400/10 p-3 text-sm text-rose-100"><FiAlertCircle />{error}</p>}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
        {onClose && <button type="button" onClick={onClose} disabled={loading} className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold hover:bg-white/10 disabled:opacity-50">Close</button>}
        <button type="button" onClick={() => review(false)} disabled={loading} className="rounded-xl border border-rose-300/30 bg-rose-400/10 px-4 py-2.5 text-sm font-semibold text-rose-100 hover:bg-rose-400/20 disabled:opacity-50">{loading ? "Saving..." : "Request changes"}</button>
        <button type="button" onClick={() => review(true)} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"><FiCheckCircle />{loading ? "Saving..." : "Approve deliverable"}</button>
      </div>
    </section>
  );
}
