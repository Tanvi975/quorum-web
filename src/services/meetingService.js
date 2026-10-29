import api from "./api";

export async function createMeeting({ organizationId } = {}) {
    const payload = organizationId ? { organizationId } : {};

    const response = await api.post("/api/meetings", payload);
    return response.data.data;
}

export async function validateMeeting(code) {
    const response = await api.get(
        `/api/meetings/${encodeURIComponent(code)}`
    );
    return response.data.data;
}

export async function endMeeting(code) {
    const response = await api.post(
        `/api/meetings/${encodeURIComponent(code)}/end`, {}
    );
    return response.data;
}