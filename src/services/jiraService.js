import api from "./api";

export async function getJiraAuthorizeUrl() {
    const response = await api.get("/api/integrations/jira/oauth/authorize-url");
    return response.data ?.data ?.authorizeUrl;
}

export async function getJiraConnectionStatus() {
    const response = await api.get("/api/integrations/jira/oauth/status");
    return response.data ?.data;
}

export async function disconnectJira() {
    const response = await api.post("/api/integrations/jira/disconnect");
    return response.data ?.data;
}

export async function setupOrganizationJira(orgId, projectKey) {
    if (!orgId || typeof orgId !== "string" || !orgId.trim()) {
        throw new Error("Organization ID is required to configure Jira. Please select an organization.");
    }

    const cleanOrgId = orgId.trim();
    const cleanKey = projectKey.trim().toUpperCase();

    try {
        const response = await api.post(`/api/organizations/${cleanOrgId}/jira/setup`, {
            projectKey: cleanKey,
        });
        return response.data ?.data;
    } catch (err) {
        if (err.response ?.status === 404) {
            const fallback = await api.post(`/api/organizations/${cleanOrgId}/integrations/jira/setup`, {
                projectKey: cleanKey,
            });
            return fallback.data ?.data;
        }
        throw err;
    }
}

export async function getOrganizationJiraStatus(orgId) {
    if (!orgId || typeof orgId !== "string" || !orgId.trim()) {
        return { isConnected: false };
    }

    const cleanOrgId = orgId.trim();

    try {
        const response = await api.get(`/api/organizations/${cleanOrgId}/jira`);
        return response.data ?.data;
    } catch (err) {
        if (err.response ?.status === 404) {
            const fallback = await api.get(`/api/organizations/${cleanOrgId}/integrations/jira`);
            return fallback.data ?.data;
        }
        throw err;
    }
}

export async function disconnectOrganizationJira(orgId) {
    if (!orgId || typeof orgId !== "string" || !orgId.trim()) {
        throw new Error("Organization ID is required.");
    }

    const cleanOrgId = orgId.trim();
    const response = await api.delete(`/api/organizations/${cleanOrgId}/jira`);
    return response.data ?.data;
}

export async function getTeamJiraTickets(orgId, teamId) {
    if (!orgId || !teamId) return [];
    const response = await api.get(`/api/organizations/${orgId}/teams/${teamId}/jira/tickets`);
    const data = response.data ?.data;
    return Array.isArray(data) ? data : [];
}

export async function getTeamJiraAssignees(orgId, teamId) {
    if (!orgId || !teamId) return [];
    try {
        const response = await api.get(`/api/organizations/${orgId}/teams/${teamId}/jira/assignees`);
        const data = response.data ?.data;
        return Array.isArray(data) ? data : [];
    } catch (err) {
        if (err.response ?.status === 404) {
            try {
                const fallback = await api.get(`/api/v1/organizations/${orgId}/teams/${teamId}/jira/assignees`);
                const fallbackData = fallback.data ?.data;
                return Array.isArray(fallbackData) ? fallbackData : [];
            } catch (fallbackErr) {
                console.warn("Jira assignees fallback failed:", fallbackErr);
                return [];
            }
        }
        throw err;
    }
}

export async function createTeamJiraTicket(orgId, teamId, ticketData) {
    const response = await api.post(
        `/api/organizations/${orgId}/teams/${teamId}/jira/tickets`,
        ticketData
    );
    return response.data ?.data;
}

export async function getJiraTicketDetails(orgId, teamId, key) {
    const response = await api.get(
        `/api/organizations/${orgId}/teams/${teamId}/jira/tickets/${key}`
    );
    return response.data ?.data;
}

export async function updateJiraTicketStatus(orgId, teamId, ticketKey, status) {
    const response = await api.patch(
        `/api/organizations/${orgId}/teams/${teamId}/jira/tickets/${ticketKey}/status`, { status }
    );
    return response.data ?.data;
}

export async function getMyJiraTickets() {
    const response = await api.get("/api/integrations/jira/tickets/my");
    const data = response.data ?.data;
    return Array.isArray(data) ? data : [];
}
