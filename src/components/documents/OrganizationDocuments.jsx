
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiFileText, FiPlus } from "react-icons/fi";
import DocumentsList from "./DocumentsList";
import DocumentEditor from "./DocumentEditor";
import {
    createDocument,
    getDocumentById,
} from "../../services/documentService";

export default function OrganizationDocuments({ organizationId }) {
    const navigate = useNavigate();

    const [selectedDocument, setSelectedDocument] = useState(null);
    const [loadingDocument, setLoadingDocument] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);

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
            const loadedDocument = result?.document ?? result;

            if (!loadedDocument?.id && !loadedDocument?._id) {
                throw new Error("Document details are incomplete.");
            }

            setSelectedDocument(loadedDocument);
        } catch (requestError) {
            const status = requestError?.response?.status;

            setError(
                status === 403
                    ? "You don't have permission to open this document."
                    : status === 404
                        ? "This document could not be found."
                        : requestError?.response?.data?.message ||
                          requestError?.message ||
                          "Unable to open the document."
            );
        } finally {
            setLoadingDocument(false);
        }
    }, []);

    const handleCreateDocument = async () => {
        const title = window.prompt("Enter document title:");

        if (title === null || !title.trim()) return;

        setCreating(true);
        setError("");

        try {
            const result = await createDocument({
                title: title.trim(),
                organizationId,
            });

            const newDocument = result?.document ?? result;
            const newDocumentId = newDocument?.id || newDocument?._id;

            if (!newDocumentId) {
                throw new Error("Created document ID was not returned.");
            }

            await handleSelectDocument(newDocument);
            setRefreshKey((value) => value + 1);
        } catch (requestError) {
            setError(
                requestError?.response?.data?.message ||
                requestError?.message ||
                "Unable to create document."
            );
        } finally {
            setCreating(false);
        }
    };

    const handleBack = () => {
        setSelectedDocument(null);
        setError("");
        setRefreshKey((value) => value + 1);
    };

    const handleOpenWhiteboard = (boardId) => {
        if (!boardId) return;

        navigate(
            `/whiteboards/${encodeURIComponent(boardId)}?organizationId=${encodeURIComponent(organizationId)}`
        );
    };

    if (!organizationId) {
        return (
            <p className="rounded-xl border border-red-400/30 bg-red-950/40 p-4 text-sm text-red-200">
                Organization ID is unavailable.
            </p>
        );
    }

    return (
        <section className="w-full min-w-0 space-y-5">
            {selectedDocument ? (
                <>
                    <button
                        type="button"
                        onClick={handleBack}
                        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#52789E] bg-[#102D4B]/90 px-3 text-sm font-medium text-[#D8E7F8] hover:bg-[#24476B]"
                    >
                        <FiArrowLeft /> Back to documents
                    </button>

                    <DocumentEditor
                        document={selectedDocument}
                        onOpenWhiteboard={handleOpenWhiteboard}
                    />
                </>
            ) : (
                <>
                    <div className="flex flex-col gap-4 rounded-xl border border-[#355D83] bg-[#173B60]/95 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <div className="flex items-center gap-3">
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#52789E] bg-[#102D4B] text-[#8CC4FF]">
                                <FiFileText size={22} />
                            </span>

                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    Organization Documents
                                </h2>
                                <p className="mt-1 text-sm text-[#C2D5E8]">
                                    Create and collaborate on documents within this organization.
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleCreateDocument}
                            disabled={creating}
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#2878E8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3D8BFA] disabled:opacity-50"
                        >
                            <FiPlus />
                            {creating ? "Creating..." : "Create Document"}
                        </button>
                    </div>

                    {error && (
                        <div role="alert" className="rounded-xl border border-red-400/30 bg-red-950/40 p-4 text-sm text-red-200">
                            {error}
                        </div>
                    )}

                    {loadingDocument ? (
                        <div role="status" className="rounded-xl border border-[#355D83] bg-[#142B45]/95 p-8 text-center text-sm text-[#A9BED6]">
                            Opening document...
                        </div>
                    ) : (
                        <DocumentsList
                            key={refreshKey}
                            organizationId={organizationId}
                            onSelectDocument={handleSelectDocument}
                        />
                    )}
                </>
            )}
        </section>
    );
}
