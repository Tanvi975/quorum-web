import api from "./api";

function unwrapResponse(response) {
    const body = response?.data;

    if (body?.data !== undefined) {
        return body.data;
    }

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

// GET /api/documents?organizationId=<uuid>
export async function getDocuments({ organizationId } = {}) {
    if (!organizationId) {
        throw new Error("Organization ID is required.");
    }

    const response = await api.get("/api/documents", {
        params: { organizationId },
    });

    const data = unwrapResponse(response);

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.documents)) return data.documents;
    if (Array.isArray(data?.items)) return data.items;

    return [];
}

// GET /api/documents/:id
export async function getDocumentById(documentId) {
    requireDocumentId(documentId);

    const response = await api.get(
        `/api/documents/${encodeURIComponent(documentId)}`
    );

    const data = unwrapResponse(response);
    const document = data?.document ?? data;

    if (!document ||
        typeof document !== "object" ||
        Array.isArray(document)
    ) {
        throw new Error("The server returned an invalid document.");
    }

    return document;
}

// POST /api/documents
export async function createDocument({
    title,
    organizationId,
    defaultPermission = "VIEW",
    initialCollaborators = [],
}) {
    if (!organizationId) {
        throw new Error("Organization ID is required.");
    }

    if (!title?.trim()) {
        throw new Error("Document title is required.");
    }

    const payload = {
        title: title.trim(),
        scopeType: "ORGANIZATION",
        organizationId,
        defaultPermission,
        initialCollaborators,
    };

    const response = await api.post("/api/documents", payload);

    return unwrapResponse(response);
}

// POST /api/documents/:id/ai
export async function runDocumentAI(documentId, {
    action,
    selectedText,
}) {
    requireDocumentId(documentId);

    if (!action) {
        throw new Error("AI action is required.");
    }

    if (!selectedText?.trim()) {
        throw new Error("Select some document text first.");
    }

    const response = await api.post(
        `/api/documents/${encodeURIComponent(documentId)}/ai`, {
            action,
            selectedText: selectedText.trim(),
        }
    );

    return unwrapResponse(response);
}
