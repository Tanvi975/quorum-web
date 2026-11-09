import api from "./api";

function unwrapResponse(response) {
    const body = response ?.data;
    if (body && body.data !== undefined) return body.data;
    return body ?? response;
}

function requireDocumentId(documentId) {
    if (
        documentId === undefined ||
        documentId === null ||
        !String(documentId).trim()
    ) {
        throw new Error("Document ID is required.");
    }
}

export async function getDocuments({ organizationId } = {}) {
    const params = organizationId ? { organizationId } : {};
    const response = await api.get("/api/documents", { params });
    const data = unwrapResponse(response);

    if (Array.isArray(data)) return data;
    if (Array.isArray(data ?.documents)) return data.documents;
    if (Array.isArray(data ?.items)) return data.items;

    return [];
}

export async function getDocumentById(documentId) {
    requireDocumentId(documentId);

    const response = await api.get(
        `/api/documents/${encodeURIComponent(documentId)}`
    );

    const data = unwrapResponse(response);
    const document = data ?.document ?? data;

    if (!document ||
        typeof document !== "object" ||
        Array.isArray(document)
    ) {
        throw new Error("The server returned an invalid document.");
    }

    return document;
}
