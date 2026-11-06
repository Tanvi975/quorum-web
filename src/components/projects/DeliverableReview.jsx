
import { useState } from "react";
import { reviewTaskDeliverable } from "../../services/projectService";

export default function DeliverableReview({
    projectId,
    task,
    onReviewed
}) {
    const [feedback, setFeedback] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    if (!task || task.status !== "IN_REVIEW") {
        return null;
    }

    const handleReview = async (approved) => {
        if (!approved && !feedback.trim()) {
            setError("Please provide feedback before requesting changes.");
            return;
        }

        try {
            setLoading(true);
            setError("");
            setSuccess("");

            await reviewTaskDeliverable(projectId, task.id, {
                approved,
                feedback: feedback.trim()
            });

            setSuccess(
                approved
                    ? "Deliverable approved successfully."
                    : "Changes requested successfully."
            );

            setFeedback("");
            onReviewed?.();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to review deliverable."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="deliverable-review">
            <div className="deliverable-review-header">
                <h3>Review Deliverable</h3>
                <span>Awaiting Approval</span>
            </div>

            <h4>{task.title}</h4>

            {task.deliverableUrl && (
                <a
                    href={task.deliverableUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    View Submitted Deliverable
                </a>
            )}

            {task.deliverableNote && (
                <p>{task.deliverableNote}</p>
            )}

            <label>Manager Feedback</label>

            <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Write your review or requested changes..."
                rows={4}
            />

            {error && (
                <div className="deliverable-review-error">
                    {error}
                </div>
            )}

            {success && (
                <div className="deliverable-review-success">
                    {success}
                </div>
            )}

            <div className="deliverable-review-actions">
                <button
                    type="button"
                    onClick={() => handleReview(false)}
                    disabled={loading}
                >
                    {loading ? "Processing..." : "Request Changes"}
                </button>

                <button
                    type="button"
                    onClick={() => handleReview(true)}
                    disabled={loading}
                >
                    {loading ? "Processing..." : "Approve"}
                </button>
            </div>
        </div>
    );
}
