import { useEffect, useState } from "react";
import {
    FiFileText,
    FiRefreshCw,
    FiSearch,
    FiUsers,
} from "react-icons/fi";
import { getDocuments } from "../../services/documentService";

const scopeLabels = {
    PERSONAL: "Personal",
    TEAM: "Team",
    ORGANIZATION: "Organization",
    PROJECT: "Project",
    MEETING: "Meeting",
};

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
    if (error?.response?.status === 403) {
        return "You don't have permission to view these documents.";
    }

    return (
        error?.response?.data?.message ||
        "Unable to load documents. Please try again."
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

    useEffect(() => {
        let active = true;

        getDocuments({ organizationId })
            .then((result) => {
                if (active) {
                    setDocuments(Array.isArray(result) ? result : []);
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
        setRefreshKey((current) => current + 1);
    };

    const query = search.trim().toLowerCase();

    const filteredDocuments = documents.filter((document) =>
        String(
            document.title || "Untitled document"
        ).toLowerCase().includes(query)
    );

    return (
        <section className="w-full min-w-0 space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h2 className="text-xl font-semibold text-white">
                        Your documents
                    </h2>

                    <p className="mt-1 text-sm text-[#A9BED6]">
                        Open a document to read or collaborate with your team.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={refreshDocuments}
                    disabled={loading}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#52789E] bg-[#102D4B] px-4 py-2 text-sm font-medium text-[#D8E7F8] transition hover:bg-[#24476B] disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <FiRefreshCw
                        className={loading ? "animate-spin" : ""}
                    />
                    Refresh
                </button>
            </div>

            <div className="relative w-full sm:max-w-md">
                <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9EB5CF]" />

                <input
                    type="search"
                    value={search}
                    onChange={(event) =>
                        setSearch(event.target.value)
                    }
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
                        {query
                            ? "No matching documents"
                            : "No documents yet"}
                    </h3>

                    <p className="mt-1 text-sm text-[#A9BED6]">
                        {query
                            ? "Try another search term."
                            : "Documents shared with you will appear here."}
                    </p>
                </div>
            ) : (
                <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredDocuments.map((document) => {
                        const documentId =
                            document.id || document._id;

                        const scope = String(
                            document.scopeType || ""
                        ).toUpperCase();

                        const collaboratorCount =
                            typeof document.collaboratorsCount === "number"
                                ? document.collaboratorsCount
                                : Array.isArray(document.collaborators)
                                    ? document.collaborators.length
                                    : null;

                        return (
                            <button
                                key={documentId || document.title}
                                type="button"
                                disabled={
                                    !documentId || !onSelectDocument
                                }
                                onClick={() =>
                                    onSelectDocument?.(document)
                                }
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
                                                {formatDate(
                                                    document.updatedAt
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    <span className="shrink-0 rounded-full border border-[#52789E] bg-[#102D4B] px-2 py-1 text-[11px] text-[#C6EAFF]">
                                        {scopeLabels[scope] ||
                                            document.scopeType ||
                                            "Document"}
                                    </span>
                                </div>

                                <div className="mt-5 flex items-center justify-between gap-2 border-t border-[#355D83]/70 pt-3 text-xs text-[#A9BED6]">
                                    <span className="truncate">
                                        {document.createdBy?.name
                                            ? `Created by ${document.createdBy.name}`
                                            : "Collaborative document"}
                                    </span>

                                    {collaboratorCount !== null && (
                                        <span className="inline-flex shrink-0 items-center gap-1">
                                            <FiUsers />
                                            {collaboratorCount}
                                        </span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </section>
    );
}