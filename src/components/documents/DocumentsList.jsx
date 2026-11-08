
import { useCallback, useEffect, useState } from "react";
import { FiFileText, FiRefreshCw, FiSearch } from "react-icons/fi";
import { getDocuments } from "../../services/documentService";

const formatDate = (value) => {
    if (!value) return "Date unavailable";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Date unavailable";
    }

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
    }).format(date);
};

const scopeLabels = {
    PERSONAL: "Personal",
    TEAM: "Team",
    ORGANIZATION: "Organization",
    PROJECT: "Project",
    MEETING: "Meeting",
};

export default function DocumentsList({
    organizationId,
    onSelectDocument,
}) {
    const [documents, setDocuments] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadDocuments = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const result = await getDocuments({ organizationId });
            setDocuments(Array.isArray(result) ? result : []);
        } catch (err) {
            console.error("Document loading failed:", err);
            setError(
                err.response?.status === 403
                    ? "You don't have permission to view these documents."
                    : "Unable to load documents. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }, [organizationId]);

    useEffect(() => {
        loadDocuments();
    }, [loadDocuments]);

    const filteredDocuments = documents.filter((document) =>
        String(document.title || "")
            .toLowerCase()
            .includes(search.trim().toLowerCase())
    );

    return (
        <section className="w-full min-w-0 space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Documents
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        View and access your collaborative documents.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={loadDocuments}
                    disabled={loading}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                    <FiRefreshCw
                        className={loading ? "animate-spin" : ""}
                    />
                    Refresh
                </button>
            </div>

            <div className="relative w-full sm:max-w-md">
                <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

                <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search documents..."
                    aria-label="Search documents"
                    className="min-h-11 w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
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
                            className="h-36 animate-pulse rounded-xl border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800"
                        />
                    ))}
                </div>
            ) : error ? (
                <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950/30"
                >
                    <p className="text-sm text-red-700 dark:text-red-300">
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={loadDocuments}
                        className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                    >
                        Try again
                    </button>
                </div>
            ) : filteredDocuments.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 px-5 py-12 text-center dark:border-gray-700">
                    <FiFileText className="mx-auto text-3xl text-gray-400" />

                    <h3 className="mt-3 text-base font-semibold text-gray-800 dark:text-white">
                        {search
                            ? "No matching documents"
                            : "No documents yet"}
                    </h3>

                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {search
                            ? "Try another search term."
                            : "Documents shared with you will appear here."}
                    </p>
                </div>
            ) : (
                <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredDocuments.map((document) => {
                        const documentId = document.id || document._id;

                        return (
                            <button
                                key={documentId}
                                type="button"
                                disabled={!documentId || !onSelectDocument}
                                onClick={() =>
                                    onSelectDocument?.(document)
                                }
                                className="group min-w-0 rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md disabled:cursor-default dark:border-gray-700 dark:bg-gray-900 dark:hover:border-blue-700"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
                                            <FiFileText size={19} />
                                        </span>

                                        <div className="min-w-0">
                                            <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                                                {document.title || "Untitled document"}
                                            </h3>

                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                {formatDate(document.updatedAt)}
                                            </p>
                                        </div>
                                    </div>

                                    <span className="shrink-0 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                        {scopeLabels[document.scopeType] ||
                                            document.scopeType ||
                                            "Document"}
                                    </span>
                                </div>

                                <div className="mt-5 flex items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
                                    <span className="truncate">
                                        {document.createdBy?.name
                                            ? `Created by ${document.createdBy.name}`
                                            : "Collaborative document"}
                                    </span>

                                    {typeof document.collaboratorsCount === "number" && (
                                        <span className="shrink-0">
                                            {document.collaboratorsCount} collaborators
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
