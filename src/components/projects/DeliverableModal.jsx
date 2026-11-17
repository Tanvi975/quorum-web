
import { useRef, useState } from "react";
import {
  FiX,
  FiSend,
  FiAlertCircle,
  FiLink,
  FiUpload,
  FiFile,
  FiTrash2,
} from "react-icons/fi";

import { submitTaskDeliverable } from "../../services/projectService";
import { uploadAttachment } from "../../services/communityService";

const MAX_FILE_SIZE = 25 * 1024 * 1024;

export default function DeliverableModal({
  projectId,
  task,
  onClose,
  onSubmitted,
}) {
  const fileInputRef = useRef(null);

  const [deliverableUrl, setDeliverableUrl] = useState("");
  const [deliverableNote, setDeliverableNote] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  if (!task) return null;

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");

    if (file.size > MAX_FILE_SIZE) {
      setError("File size cannot exceed 25 MB.");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
    setDeliverableUrl("");
  };

  const removeFile = () => {
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (task.status === "IN_REVIEW") {
      setError("This task is awaiting approval.");
      return;
    }

    if (!deliverableUrl.trim() && !selectedFile) {
      setError("Please provide a deliverable URL or upload a file.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      let finalDeliverableUrl = deliverableUrl.trim();

      // Upload selected file using existing Quorum upload service
      if (selectedFile) {
        setUploading(true);

        const uploadedFile = await uploadAttachment(selectedFile);

        if (!uploadedFile?.fileUrl) {
          throw new Error("File upload did not return a valid URL.");
        }

        finalDeliverableUrl = uploadedFile.fileUrl;

        setUploading(false);
      }

      // Existing task deliverable API
      await submitTaskDeliverable(
        projectId,
        task.id || task._id,
        {
          deliverableUrl: finalDeliverableUrl,
          deliverableNote: deliverableNote.trim(),
        }
      );

      await onSubmitted?.();
      onClose?.();

    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Could not submit the deliverable. Please try again."
      );
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="deliverable-title"
    >
      <div className="my-auto w-full max-w-xl rounded-2xl border border-white/15 bg-[#17385F] p-5 text-white shadow-2xl sm:p-7">

        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-200">
              Task submission
            </p>

            <h2
              id="deliverable-title"
              className="mt-1 text-xl font-bold sm:text-2xl"
            >
              Submit deliverable
            </h2>

            <p className="mt-1 break-words text-sm text-blue-100/65">
              {task.title}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
            className="rounded-lg p-2 text-blue-100 hover:bg-white/10 disabled:opacity-50"
          >
            <FiX />
          </button>
        </div>

        {task.status === "IN_REVIEW" ? (
          <div className="rounded-xl border border-amber-300/25 bg-amber-400/10 p-4 text-sm text-amber-100">
            Awaiting manager approval. You can submit another version after
            the manager requests changes.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Deliverable URL */}
            <div>
              <label
                htmlFor="deliverable-url"
                className="mb-2 block text-sm font-medium"
              >
                Deliverable URL
              </label>

              <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.07] px-3 focus-within:border-blue-300">
                <FiLink className="shrink-0 text-blue-200" />

                <input
                  id="deliverable-url"
                  type="url"
                  value={deliverableUrl}
                  disabled={!!selectedFile || loading}
                  onChange={(e) => setDeliverableUrl(e.target.value)}
                  placeholder="https://..."
                  className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-blue-100/40 disabled:opacity-40"
                />
              </div>

              <p className="mt-1 text-xs text-blue-100/55">
                Add a shareable link to your completed work.
              </p>
            </div>

            {/* OR separator */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-white/15" />
              <span className="text-xs font-medium text-blue-100/50">
                OR UPLOAD A FILE
              </span>
              <div className="h-px flex-1 bg-white/15" />
            </div>

            {/* File upload */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf,.zip,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                disabled={!!deliverableUrl.trim() || loading}
                className="hidden"
              />

              {!selectedFile ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!!deliverableUrl.trim() || loading}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-blue-200/40 bg-white/[0.04] px-4 py-7 text-center transition hover:border-blue-300 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <FiUpload className="text-2xl text-blue-200" />

                  <span className="text-sm font-semibold text-white">
                    Choose a file to upload
                  </span>

                  <span className="text-xs text-blue-100/55">
                    PDF, DOC, DOCX, ZIP, images and more (Max 25 MB)
                  </span>
                </button>
              ) : (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-blue-200/20 bg-white/[0.07] p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <FiFile className="shrink-0 text-xl text-blue-200" />

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {selectedFile.name}
                      </p>

                      <p className="text-xs text-blue-100/55">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={removeFile}
                    disabled={loading}
                    aria-label="Remove file"
                    className="rounded-lg p-2 text-rose-200 hover:bg-rose-400/10 disabled:opacity-50"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              )}
            </div>

            {/* Submission notes */}
            <div>
              <label
                htmlFor="deliverable-note"
                className="mb-2 block text-sm font-medium"
              >
                Submission notes
              </label>

              <textarea
                id="deliverable-note"
                rows={4}
                maxLength={2000}
                value={deliverableNote}
                onChange={(e) => setDeliverableNote(e.target.value)}
                placeholder="Summarize what you completed..."
                className="w-full resize-y rounded-xl border border-white/15 bg-white/[0.07] px-4 py-3 text-sm outline-none placeholder:text-blue-100/40 focus:border-blue-300"
              />

              <p className="mt-1 text-right text-xs text-blue-100/45">
                {deliverableNote.length}/2000
              </p>
            </div>

            {/* Error */}
            {error && (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-rose-300/20 bg-rose-400/10 p-3 text-sm text-rose-100"
              >
                <FiAlertCircle className="mt-0.5 shrink-0" />
                {error}
              </p>
            )}

            {/* Footer buttons */}
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white/80 hover:bg-white/10 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  loading ||
                  (!deliverableUrl.trim() && !selectedFile)
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0875F9] px-5 py-3 text-sm font-semibold text-white hover:bg-[#2588FF] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <FiUpload className="animate-bounce" />
                    Uploading file...
                  </>
                ) : loading ? (
                  "Submitting..."
                ) : (
                  <>
                    <FiSend />
                    Submit for review
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
