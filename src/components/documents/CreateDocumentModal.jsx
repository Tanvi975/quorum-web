
import { useState } from "react";
import { FiRefreshCw, FiX, FiUsers } from "react-icons/fi";
import { createDocument } from "../../services/documentService";

function getErrorMessage(error) {
    const status = error?.response?.status;

    if (status === 400) {
        return error?.response?.data?.message ||
            "Please check the document details.";
    }

    if (status === 401) {
        return "Your session has expired. Please log in again.";
    }

    if (status === 403) {
        return "You don't have permission to create or view documents.";
    }

    if (status === 404) {
        return "The organization or document endpoint could not be found.";
    }

    if (status >= 500) {
        return "Server error. Please try again later.";
    }

    return (
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong. Please try again."
    );
}

export default function CreateDocumentModal({
    organizationId,
    onClose,
    onCreated,
}) {
    const [title, setTitle] = useState("");
    const [defaultPermission, setDefaultPermission] = useState("VIEW");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!title.trim()) {
            setError("Please enter a document title.");
            return;
        }

        if (!organizationId) {
            setError("Organization information is unavailable.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const result = await createDocument({
                title: title.trim(),
                organizationId,
                defaultPermission,
            });

            const createdDocument = result?.document || result;

            onCreated?.(createdDocument);
        } catch (requestError) {
            console.error("Document creation failed:", requestError);
            setError(getErrorMessage(requestError));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/70 p-3 backdrop-blur-sm sm:p-5"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !loading) {
                    onClose();
                }
            }}
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-document-title"
                className="my-auto w-full max-w-lg overflow-hidden rounded-2xl border border-[#52789E] bg-[#142B45] shadow-2xl"
            >
                <header className="flex items-center justify-between border-b border-[#355D83] p-5">
                    <div>
                        <h2
                            id="create-document-title"
                            className="text-lg font-semibold text-white"
                        >
                            Create new document
                        </h2>

                        <p className="mt-1 text-xs text-[#A9BED6]">
                            Create a document for your organization.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        aria-label="Close modal"
                        className="rounded-lg p-2 text-[#A9BED6] transition hover:bg-[#24476B] hover:text-white disabled:opacity-50"
                    >
                        <FiX size={19} />
                    </button>
                </header>

                <form onSubmit={handleSubmit} className="space-y-5 p-5">
                    <div>
                        <label
                            htmlFor="document-title"
                            className="mb-2 block text-sm font-medium text-[#EAF2FF]"
                        >
                            Document title
                        </label>

                        <input
                            id="document-title"
                            type="text"
                            value={title}
                            onChange={(event) => {
                                setTitle(event.target.value);
                                setError("");
                            }}
                            maxLength={120}
                            autoFocus
                            placeholder="e.g. Sprint 42 Architecture"
                            className="min-h-11 w-full rounded-lg border border-[#52789E] bg-[#102D4B] px-3 text-sm text-white outline-none placeholder:text-[#829DBA] focus:border-[#55A0FF] focus:ring-2 focus:ring-[#3988F5]/25"
                        />

                        <p className="mt-1 text-right text-xs text-[#829DBA]">
                            {title.length}/120
                        </p>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-[#EAF2FF]">
                            Document scope
                        </label>

                        <div className="flex items-center gap-3 rounded-lg border border-[#52789E] bg-[#102D4B] p-3">
                            <FiUsers className="shrink-0 text-[#8CC4FF]" />

                            <div>
                                <p className="text-sm font-medium text-white">
                                    Organization
                                </p>

                                <p className="text-xs text-[#A9BED6]">
                                    Available within your organization,
                                    subject to permissions.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="default-permission"
                            className="mb-2 block text-sm font-medium text-[#EAF2FF]"
                        >
                            Default permission
                        </label>

                        <select
                            id="default-permission"
                            value={defaultPermission}
                            onChange={(event) =>
                                setDefaultPermission(event.target.value)
                            }
                            className="min-h-11 w-full rounded-lg border border-[#52789E] bg-[#102D4B] px-3 text-sm text-white outline-none focus:border-[#55A0FF] focus:ring-2 focus:ring-[#3988F5]/25"
                        >
                            <option value="VIEW">
                                View — others can only read
                            </option>

                            <option value="EDIT">
                                Edit — others can edit
                            </option>
                        </select>

                        <p className="mt-2 text-xs leading-5 text-[#A9BED6]">
                            This is the default permission for users
                            in the selected organization scope.
                        </p>
                    </div>

                    <div className="rounded-lg border border-[#355D83] bg-[#102D4B]/70 p-3">
                        <p className="text-xs leading-5 text-[#C2D5E8]">
                            <strong className="text-white">
                                Organization document:
                            </strong>{" "}
                            The document will be created with
                            ORGANIZATION scope and associated with
                            your current organization.
                        </p>
                    </div>

                    {error && (
                        <div
                            role="alert"
                            className="rounded-lg border border-red-400/30 bg-red-950/40 p-3 text-sm text-red-200"
                        >
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col-reverse gap-2 border-t border-[#355D83] pt-4 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="min-h-10 rounded-lg border border-[#52789E] px-4 text-sm font-medium text-[#D8E7F8] transition hover:bg-[#24476B] disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={loading || !title.trim()}
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#2878E8] px-5 text-sm font-semibold text-white transition hover:bg-[#3D8BFA] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading && (
                                <FiRefreshCw className="animate-spin" />
                            )}

                            {loading ? "Creating..." : "Create document"}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}
