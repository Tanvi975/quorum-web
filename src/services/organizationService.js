import api from "./api";

export async function createOrganization(organizationData) {
    const response = await api.post("/api/organizations", organizationData);
    return response.data;
}

export async function getOrganizations() {
    const response = await api.get("/api/organizations");
    return response.data;
}

export async function previewOrganizationInvite(token) {
    const response = await api.get(
        `/api/organizations/join/${encodeURIComponent(token)}`
    );
    return response.data;
}

export const getOrganizationTeams = async(organizationId) => {
    const response = await api.get(
        `/api/organizations/${organizationId}/teams`
    );

    return response.data.data;
};

export const createOrganizationInvite = async(
    organizationId,
    payload
) => {
    const response = await api.post(
        `/api/organizations/${organizationId}/invites`,
        payload
    );

    return response.data.data;
};

export const acceptOrganizationInvite = async(token) => {
    const response = await api.post(
        `/api/organizations/join/${token}`
    );

    return response.data.data;
};
export async function joinOrganization(token) {
    const response = await api.post(
        `/api/organizations/join/${encodeURIComponent(token)}`
    );

    return response.data;
}