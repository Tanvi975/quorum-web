
import { useState } from "react";
import { submitTaskDeliverable } from "../../services/projectService";

export default function DeliverableModal({
    projectId,
    task,
    onClose,
    onSubmitted
}) {
    const [deliverableUrl, setDeliverableUrl] = useState("");
    const [deliverableNote, setDeliverableNote] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (task.status === "IN_REVIEW") {
            setError("This task is already awaiting manager approval.");
            return;
        }

        try {
            setLoading(true);
            setError("");

            await submitTaskDeliverable(projectId, task.id, {
                deliverableUrl: deliverableUrl.trim(),
                deliverableNote: deliverableNote.trim()
            });

            onSubmitted?.();
            onClose();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to submit deliverable."
            );
        } finally {
            setLoading(false);
        }
    };

    if (!task) return null;

    return (
        <div className="deliverable-modal-overlay">
            <div className="deliverable-modal">
                <div className="deliverable-modal-header">
                    <h2>Submit Deliverable</h2>
                    <button type="button" onClick={onClose}>
                        ×
                    </button>
                </div>

                <h3>{task.title}</h3>

                {task.status === "IN_REVIEW" ? (
                    <div className="deliverable-awaiting">
                        Awaiting Manager Approval
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <label>Deliverable URL</label>

                        <input
                            type="url"
                            value={deliverableUrl}
                            onChange={(e) =>
                                setDeliverableUrl(e.target.value)
                            }
                            placeholder="https://..."
                            required
                        />

                        <label>Submission Notes</label>

                        <textarea
                            value={deliverableNote}
                            onChange={(e) =>
                                setDeliverableNote(e.target.value)
                            }
                            placeholder="Describe your completed work..."
                            rows={5}
                        />

                        {error && (
                            <div className="deliverable-error">
                                {error}
                            </div>
                        )}

                        <div className="deliverable-modal-actions">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                            >
                                Cancel
                            </button>

                            <button type="submit" disabled={loading}>
                                {loading ? "Submitting..." : "Submit for Review"}
                            </button>
                        </div>
                    </form>
                )}

                {error && task.status === "IN_REVIEW" && (
                    <div className="deliverable-error">{error}</div>
                )}
            </div>
        </div>
    );
}
