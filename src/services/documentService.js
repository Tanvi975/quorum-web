import api from "./api";

const unwrapResponse = (response) => {
    if (
        response &&
        response.data &&
        response.data.data !== undefined
    ) {
        return response.data.data;
    }

    if (response && response.data !== undefined) {
        return response.data;
    }

    return response;
};

const validateId = (id) => {
    if (id === undefined || id === null || !String(id).trim()) {
        throw new Error("Document ID is required.");
    }
};

export async function getDocuments(options = {}) {
    const organizationId = options.organizationId;

    const params = {};

    if (organizationId) {
        params.organizationId = organizationId;
    }

    const response = await api.get("/api/documents", { params });
    const data = unwrapResponse(response);

    if (Array.isArray(data)) {
        return data;
    }

    if (data && Array.isArray(data.documents)) {
        return data.documents;
    }

    return [];
}

export async function getDocumentById(documentId) {
    validateId(documentId);

    const response = await api.get(
        "/api/documents/" + encodeURIComponent(documentId)
    );

    const data = unwrapResponse(response);

    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new Error("Invalid document response.");
    }

    return data;
}