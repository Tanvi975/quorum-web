import api from "./api";

const unwrap = (response) => response ?.data ?.data ?? response ?.data ?? response;

export async function createWhiteboard(payload) {
    const response = await api.post("/api/whiteboards", payload);
    return unwrap(response);
}

export async function listWhiteboards({ organizationId, page = 1, limit = 20, search = "" } = {}) {
    const response = await api.get("/api/whiteboards", {
        params: { organizationId, page, limit, search },
    });
    return unwrap(response);
}

export async function getWhiteboard(boardId) {
    const response = await api.get(`/api/whiteboards/${encodeURIComponent(boardId)}`);
    return unwrap(response);
}

export async function updateWhiteboard(boardId, payload) {
    const response = await api.patch(`/api/whiteboards/${encodeURIComponent(boardId)}`, payload);
    return unwrap(response);
}

export async function deleteWhiteboard(boardId) {
    const response = await api.delete(`/api/whiteboards/${encodeURIComponent(boardId)}`);
    return unwrap(response);
}

export async function listMeetingWhiteboards(meetingCode) {
    const response = await api.get(`/api/meetings/${encodeURIComponent(meetingCode)}/whiteboards`);
    return unwrap(response);
}

export async function createMeetingWhiteboard(meetingCode, payload) {
    const response = await api.post(
        `/api/meetings/${encodeURIComponent(meetingCode)}/whiteboards`,
        payload
    );
    return unwrap(response);
}

export async function openMeetingWhiteboard(meetingCode, whiteboardId) {
    const response = await api.post(
        `/api/meetings/${encodeURIComponent(meetingCode)}/whiteboards/${encodeURIComponent(whiteboardId)}/open`
    );
    return unwrap(response);
}