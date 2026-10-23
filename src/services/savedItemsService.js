import api from "./api";

export async function saveItem({ itemType, itemId, note, collectionId }) {
    const payload = {
        itemType,
        itemId,
        ...(note !== undefined ? { note } : {}),
        ...(collectionId !== undefined ? { collectionId } : {}),
    };
    const res = await api.post("/api/saved-items", payload);
    return res.data;
}

export async function getSavedItems(params = {}) {
    const query = {};
    if (params.itemType) query.itemType = params.itemType;
    if (params.collectionId) query.collectionId = params.collectionId;
    if (params.search) query.search = params.search;
    if (params.cursor) query.cursor = params.cursor;
    if (params.limit) query.limit = params.limit;

    const res = await api.get("/api/saved-items", { params: query });
    return res.data;
}

export async function updateSavedItem(id, { note, collectionId }) {
    const payload = {};
    if (note !== undefined) payload.note = note;
    if (collectionId !== undefined) payload.collectionId = collectionId;

    const res = await api.patch(`/api/saved-items/${id}`, payload);
    return res.data;
}

export async function deleteSavedItem(id) {
    const res = await api.delete(`/api/saved-items/${id}`);
    return res.data;
}

export async function createCollection({ name, description, color }) {
    const payload = {
        name: name.trim(),
        ...(description ? { description: description.trim() } : {}),
        ...(color ? { color } : {}),
    };
    const res = await api.post("/api/saved-items/collections", payload);
    return res.data;
}

export async function getCollections() {
    const res = await api.get("/api/saved-items/collections");
    return res.data;
}

export async function updateCollection(id, { name, description, color }) {
    const payload = {};
    if (name !== undefined) payload.name = name ? name.trim() : "";
    if (description !== undefined) payload.description = description;
    if (color !== undefined) payload.color = color;

    const res = await api.patch(`/api/saved-items/collections/${id}`, payload);
    return res.data;
}

export async function deleteCollection(id) {
    const res = await api.delete(`/api/saved-items/collections/${id}`);
    return res.data;
}