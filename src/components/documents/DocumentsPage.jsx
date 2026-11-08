
import { useCallback, useState } from "react";
import { FiArrowLeft, FiFileText } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import DocumentsList from "../../components/documents/DocumentsList";
import DocumentEditor from "../../components/documents/DocumentEditor";
import { getDocumentById } from "../../services/documentService";

export default function DocumentsPage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [selectedDocument, setSelectedDocument] = useState(null);
    const [loadingDocument, setLoadingDocument] = useState(false);
    const [error, setError] = useState("");

    const organizationId =
        user?.organizationId ||
        user?.organization?.id ||
        user?.organization?._id;

    const handleSelectDocument = useCallback(async (document) => {
        const documentId = document?.id || document?._id;

        if (!documentId) {
            setError("Document ID is unavailable.");
            return;
        }

        setLoadingDocument(true);
        setError("");
        setSelectedDocument(null);

        try {
            const result = await getDocumentById(documentId);

            if (!result?.id && !result?._id) {
                throw new Error("Invalid document details.");
            }

            setSelectedDocument(result);
        } catch (err) {
            console.error("Document details loading failed:", err);

            setError(
                err.response?.status === 403
                    ? "You don't have permission to open this document."
                    : err.response?.status === 404
                      ? "This document could not be found."
                      : "Unable to open the document. Please try again."
            );
        } finally {
            setLoadingDocument(false);
        }
    }, []);

    const handleBack = () => {
        setSelectedDocument(null);
        setError("");
    };

    const handleOpenWhiteboard = (boardId) => {
        if (!boardId) {
            setError("Whiteboard information is unavailable.");
            return;
        }

        const query = organizationId
            ? `?organizationId=${encodeURIComponent(organizationId)}`
            : "";

        navigate(
            `/whiteboards/${encodeURIComponent(boardId)}${query}`
        );
    };

    return (
        <main className="min-h-screen min-w-0 bg-gray-50 px-3 py-5 dark:bg-gray-950 sm:px-5 lg:px-8">
            <div className="mx-auto w-full max-w-[1500px] space-y-5">
                {selectedDocument ? (
                    <>
                        <button
                            type="button"
                            onClick={handleBack}
                            className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-gray-600 transition hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                            <FiArrowLeft />
                            Back to documents
                        </button>

                        <DocumentEditor
                            document={selectedDocument}
                            onOpenWhiteboard={handleOpenWhiteboard}
                        />
                    </>
                ) : (
                    <>
                        <div className="flex items-center gap-3">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                <FiFileText size={21} />
                            </span>

                            <div className="min-w-0">
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Collaborative Documents
                                </h1>

                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    Access and collaborate on your documents.
                                </p>
                            </div>
                        </div>

                        {error && (
                            <div
                                role="alert"
                                className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <span>{error}</span>

                                <button
                                    type="button"
                                    onClick={() => setError("")}
                                    className="self-start rounded-lg px-3 py-1.5 font-medium hover:bg-red-100 dark:hover:bg-red-900/40 sm:self-auto"
                                >
                                    Dismiss
                                </button>
                            </div>
                        )}

                        {loadingDocument ? (
                            <div
                                className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-900"
                                role="status"
                                aria-live="polite"
                            >
                                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />

                                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                                    Opening document...
                                </p>
                            </div>
                        ) : (
                            <DocumentsList
                                organizationId={organizationId}
                                onSelectDocument={handleSelectDocument}
                            />
                        )}
                    </>
                )}
            </div>
        </main>
    );
}
