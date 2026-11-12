
import { useCallback, useEffect, useState } from "react";
import { FiArrowLeft, FiFileText } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import OnboardingLayout from "../OnboardingLayout";
import DocumentsList from "./DocumentsList";
import DocumentEditor from "./DocumentEditor";
import { getDocumentById } from "../../services/documentService";
import { getOrganizations } from "../../services/organizationService";

export default function DocumentsPage() {
    const navigate = useNavigate();

    const [selectedDocument, setSelectedDocument] = useState(null);
    const [loadingDocument, setLoadingDocument] = useState(false);
    const [organizations, setOrganizations] = useState([]);
    const [error, setError] = useState("");

    const organizationId = organizations[0]?.id;

    useEffect(() => {
        async function loadOrganizations() {
            try {
                const response = await getOrganizations();

                const data =
                    response?.data?.data ??
                    response?.data ??
                    [];

                setOrganizations(Array.isArray(data) ? data : []);
            } catch {
                setOrganizations([]);
            }
        }

        loadOrganizations();
    }, []);

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
                throw new Error(
                    "The document details are incomplete."
                );
            }

            setSelectedDocument(result);
        } catch (requestError) {
            const status = requestError?.response?.status;

            setError(
                status === 403
                    ? "You don't have permission to open this document."
                    : status === 404
                        ? "This document could not be found."
                        : requestError?.response?.data?.message ||
                            "Unable to open the document. Please try again."
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
        if (!boardId) return;

        const query = organizationId
            ? `?organizationId=${encodeURIComponent(organizationId)}`
            : "";

        navigate(
            `/whiteboards/${encodeURIComponent(boardId)}${query}`
        );
    };

    return (
        <OnboardingLayout fullWidth>
            <div className="relative z-10 mx-auto w-full max-w-[1500px] space-y-5 px-3 py-5 sm:px-5 sm:py-6 lg:px-8 lg:py-8">
                {selectedDocument ? (
                    <>
                        <button
                            type="button"
                            onClick={handleBack}
                            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#52789E] bg-[#102D4B]/90 px-3 text-sm font-medium text-[#D8E7F8] transition hover:bg-[#24476B]"
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
                        <section className="flex flex-col gap-4 rounded-xl border border-[#355D83] bg-[#173B60]/95 px-4 py-5 shadow-[0_10px_35px_rgba(0,0,0,0.22)] sm:flex-row sm:items-center sm:px-6">
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#52789E] bg-[#102D4B] text-[#8CC4FF]">
                                <FiFileText size={22} />
                            </span>

                            <div className="min-w-0">
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8CC4FF]">
                                    Workspace
                                </p>

                                <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
                                    Collaborative Documents
                                </h1>

                                <p className="mt-1 text-sm text-[#C2D5E8]">
                                    Your team documents, all in one place.
                                </p>
                            </div>
                        </section>

                        {error && (
                            <div
                                role="alert"
                                className="flex flex-col gap-3 rounded-xl border border-red-400/30 bg-red-950/40 p-4 text-sm text-red-200 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <span>{error}</span>

                                <button
                                    type="button"
                                    onClick={() => setError("")}
                                    className="self-start rounded-lg px-3 py-1.5 font-medium transition hover:bg-red-400/10 sm:self-auto"
                                >
                                    Dismiss
                                </button>
                            </div>
                        )}

                        {loadingDocument ? (
                            <div
                                role="status"
                                aria-live="polite"
                                className="rounded-xl border border-[#355D83] bg-[#142B45]/95 p-8 text-center"
                            >
                                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#55A0FF] border-t-transparent" />

                                <p className="mt-3 text-sm text-[#A9BED6]">
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
        </OnboardingLayout>
    );
}
