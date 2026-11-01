import api from "./api";


export async function addTeamMember(organizationId, teamId, userId, role = "MEMBER") {
    const response = await api.post(
        `/api/organizations/${organizationId}/teams/${teamId}/members`, {
            userId,
            role: role === "TEAM_HEAD" ? "LEAD" : "MEMBER",
        }
    );

    return response.data ?.data ?? response.data;
}


export async function removeTeamMember(organizationId, teamId, userId) {
    const response = await api.delete(
        `/api/organizations/${organizationId}/teams/${teamId}/members/${userId}`
    );

    return response.data ?.data ?? response.data;
}


export async function deleteTeam(organizationId, teamId) {
    const response = await api.delete(
        `/api/organizations/${organizationId}/teams/${teamId}`
    );

    return response.data ?.data ?? response.data;
}
