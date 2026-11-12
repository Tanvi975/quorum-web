
import { useEffect, useMemo, useState } from "react";
import {
    FiFileText,
    FiRefreshCw,
    FiSearch,
    FiPlus,
    FiX,
    FiCalendar,
} from "react-icons/fi";
import {
    getDocuments,
    createDocument,
} from "../../services/documentService";

function formatDate(value) {
    if (!value) return "Date unavailable";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Date unavailable";
    }

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
    }).format(date);
}

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

function CreateDocumentModal({
    organizationId,
    onClose,
    onCreated,
}) {
    const [title, setTitle] = useState("");
    const [defaultPermission, setDefaultPermission] =
        useState("VIEW");
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

            const createdDocument =
                result?.document ||
                result;

            onCreated(createdDocument);
        } catch (requestError) {
            console.error(
                "Document creation failed:",
                requestError
            );

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

export default function DocumentsList({
    organizationId,
    onSelectDocument,
}) {
    const [documents, setDocuments] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
        let active = true;

        if (!organizationId) {
            setDocuments([]);
            setError("Organization information is unavailable.");
            setLoading(false);
            return undefined;
        }

        setLoading(true);
        setError("");

        getDocuments({ organizationId })
            .then((result) => {
                if (active) {
                    setDocuments(
                        Array.isArray(result) ? result : []
                    );
                    setError("");
                }
            })
            .catch((requestError) => {
                console.error(
                    "Document loading failed:",
                    requestError
                );

                if (active) {
                    setError(getErrorMessage(requestError));
                }
            })
            .finally(() => {
                if (active) {
                    setLoading(false);
                }
            });

        return () => {
            active = false;
        };
    }, [organizationId, refreshKey]);

    const refreshDocuments = () => {
        setLoading(true);
        setError("");
        setSuccessMessage("");
        setRefreshKey((current) => current + 1);
    };

    const handleDocumentCreated = (document) => {
        setShowCreateModal(false);
        setSuccessMessage("Document created successfully.");

        if (document?.id || document?._id) {
            setDocuments((previous) => [
                document,
                ...previous.filter(
                    (item) =>
                        (item.id || item._id) !==
                        (document.id || document._id)
                ),
            ]);
        } else {
            setRefreshKey((current) => current + 1);
        }
    };

    const filteredDocuments = useMemo(() => {
        const query = search.trim().toLowerCase();

        return documents.filter((document) =>
            String(document.title || "Untitled document")
                .toLowerCase()
                .includes(query)
        );
    }, [documents, search]);

    return (
        <section className="w-full min-w-0 space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h2 className="text-xl font-semibold text-white">
                        Organization documents
                    </h2>

                    <p className="mt-1 text-sm text-[#A9BED6]">
                        Create, access and collaborate on your
                        organization documents.
                    </p>
                </div>

                <div className="flex flex-col gap-2 xs:flex-row sm:shrink-0">
                    <button
                        type="button"
                        onClick={refreshDocuments}
                        disabled={loading}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#52789E] bg-[#102D4B] px-4 py-2 text-sm font-medium text-[#D8E7F8] transition hover:bg-[#24476B] disabled:opacity-50"
                    >
                        <FiRefreshCw
                            className={loading ? "animate-spin" : ""}
                        />
                        Refresh
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowCreateModal(true)}
                        disabled={!organizationId}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#2878E8] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#3D8BFA] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <FiPlus />
                        New document
                    </button>
                </div>
            </div>

            {successMessage && (
                <div
                    role="status"
                    className="flex items-center justify-between gap-3 rounded-lg border border-emerald-400/30 bg-emerald-950/30 p-3 text-sm text-emerald-200"
                >
                    <span>{successMessage}</span>

                    <button
                        type="button"
                        onClick={() => setSuccessMessage("")}
                        aria-label="Dismiss success message"
                    >
                        <FiX />
                    </button>
                </div>
            )}

            <div className="relative w-full sm:max-w-md">
                <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9EB5CF]" />

                <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search documents..."
                    aria-label="Search documents"
                    className="min-h-11 w-full rounded-lg border border-[#52789E] bg-[#102D4B] py-2 pl-10 pr-3 text-sm text-white outline-none placeholder:text-[#9EB5CF] transition focus:border-[#55A0FF] focus:ring-2 focus:ring-[#3988F5]/25"
                />
            </div>

            {loading ? (
                <div
                    className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
                    aria-label="Loading documents"
                    aria-busy="true"
                >
                    {[1, 2, 3].map((item) => (
                        <div
                            key={item}
                            className="h-36 animate-pulse rounded-xl border border-[#355D83] bg-[#173B60]/80"
                        />
                    ))}
                </div>
            ) : error ? (
                <div
                    role="alert"
                    className="rounded-xl border border-red-400/30 bg-red-950/40 p-5"
                >
                    <p className="text-sm text-red-200">{error}</p>

                    <button
                        type="button"
                        onClick={refreshDocuments}
                        className="mt-3 rounded-lg bg-[#2878E8] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#3D8BFA]"
                    >
                        Try again
                    </button>
                </div>
            ) : filteredDocuments.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#52789E] bg-[#142B45]/70 px-5 py-12 text-center">
                    <FiFileText className="mx-auto text-3xl text-[#8FB4D8]" />

                    <h3 className="mt-3 text-base font-semibold text-white">
                        {search.trim()
                            ? "No matching documents"
                            : "No organization documents yet"}
                    </h3>

                    <p className="mt-1 text-sm text-[#A9BED6]">
                        {search.trim()
                            ? "Try another search term."
                            : "Create your first organization document to get started."}
                    </p>

                    {!search.trim() && (
                        <button
                            type="button"
                            onClick={() => setShowCreateModal(true)}
                            className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#2878E8] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#3D8BFA]"
                        >
                            <FiPlus />
                            Create document
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredDocuments.map((document) => {
                        const documentId = document.id || document._id;

                        const collaboratorCount =
                            typeof document.collaboratorsCount === "number"
                                ? document.collaboratorsCount
                                : Array.isArray(document.collaborators)
                                    ? document.collaborators.length
                                    : 0;

                        return (
                            <button
                                key={documentId || document.title}
                                type="button"
                                disabled={!documentId || !onSelectDocument}
                                onClick={() => onSelectDocument?.(document)}
                                className="group min-w-0 rounded-xl border border-[#355D83] bg-[#173B60]/95 p-4 text-left shadow-[0_10px_35px_rgba(0,0,0,0.16)] transition hover:-translate-y-0.5 hover:border-[#65A7FF] hover:bg-[#1B456E] hover:shadow-lg disabled:cursor-default"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#52789E] bg-[#102D4B] text-[#8CC4FF]">
                                            <FiFileText size={19} />
                                        </span>

                                        <div className="min-w-0">
                                            <h3 className="truncate text-sm font-semibold text-white">
                                                {document.title ||
                                                    "Untitled document"}
                                            </h3>

                                            <p className="mt-1 text-xs text-[#A9BED6]">
                                                Updated{" "}
                                                {formatDate(document.updatedAt)}
                                            </p>
                                        </div>
                                    </div>

                                    <span className="shrink-0 rounded-full border border-[#52789E] bg-[#102D4B] px-2 py-1 text-[11px] text-[#C6EAFF]">
                                        ORGANIZATION
                                    </span>
                                </div>

                                <div className="mt-5 flex items-center justify-between gap-2 border-t border-[#355D83]/70 pt-3 text-xs text-[#A9BED6]">
                                    <span className="flex min-w-0 items-center gap-1 truncate">
                                        <FiCalendar className="shrink-0" />
                                        {document.createdBy?.name
                                            ? `By ${document.createdBy.name}`
                                            : "Organization document"}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {showCreateModal && (
                <CreateDocumentModal
                    organizationId={organizationId}
                    onClose={() => setShowCreateModal(false)}
                    onCreated={handleDocumentCreated}
                />
            )}
        </section>
    );
}
