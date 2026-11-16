
import { useEffect, useMemo, useState } from "react";
import CreateDocumentModal from "./CreateDocumentModal";
import {
    FiFileText,
    FiRefreshCw,
    FiSearch,
    FiPlus,
    FiX,
    FiCalendar,
} from "react-icons/fi";
import { getDocuments } from "../../services/documentService";

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
