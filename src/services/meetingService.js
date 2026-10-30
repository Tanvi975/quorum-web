import api from "./api";

const unwrap = (response) =>
    response ?.data ?.data ?? response ?.data ?? response;

export async function createMeeting({ organizationId } = {}) {
    const payload = organizationId ? { organizationId } : {};

    const response = await api.post("/api/meetings", payload);

    return unwrap(response);
}

export async function createScopedMeeting(payload) {
    const response = await api.post(
        "/api/meetings/scoped",
        payload
    );

    return unwrap(response);
}

export async function validateMeeting(code) {
    const response = await api.get(
        `/api/meetings/${encodeURIComponent(code)}`
    );

    return unwrap(response);
}

export async function getUpcomingMeetings() {
    const response = await api.get("/api/meetings/upcoming");
    const data = unwrap(response);

    return Array.isArray(data) ? data : [];
}

export async function getOrganizationMeetings(organizationId) {
    const response = await api.get(
        `/api/meetings/organization/${encodeURIComponent(organizationId)}`
    );

    const data = unwrap(response);

    return Array.isArray(data) ? data : [];
}


export async function getTeamMeetings(teamId) {
    const response = await api.get(
        `/api/meetings/team/${encodeURIComponent(teamId)}`
    );

    const data = unwrap(response);

    return Array.isArray(data) ? data : [];
}

export async function cancelMeeting(code) {
    const response = await api.patch(
        `/api/meetings/${encodeURIComponent(code)}/cancel`
    );

    return unwrap(response);
}
export async function endMeeting(code) {
    const response = await api.post(
        `/api/meetings/${encodeURIComponent(code)}/end`, {}
    );

    return unwrap(response);
}