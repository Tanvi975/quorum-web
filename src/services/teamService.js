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

export async function updateTeam(organizationId, teamId, teamData) {
    const response = await api.patch(
        `/api/organizations/${organizationId}/teams/${teamId}`,
        teamData
    );

    return response.data ?.data ?? response.data;
}

export async function getTeamProfilePicture(organizationId, teamId) {
    const response = await api.get(
        `/api/organizations/${organizationId}/teams/${teamId}/profile-picture`
    );

    return response.data ?.data ?? response.data;
}

export async function uploadTeamProfilePicture(organizationId, teamId, file) {
    if (!file) throw new Error("Please select a team picture.");

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "image/svg+xml",
        "image/heic",
        "image/avif",
    ];

    if (!allowedTypes.includes(file.type)) {
        throw new Error("Please select a supported image (JPG, PNG, WEBP, GIF, SVG, HEIC or AVIF).");
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post(
        `/api/organizations/${organizationId}/teams/${teamId}/profile-picture`,
        formData
    );

    return response.data ?.data ?? response.data;
}

export async function deleteTeamProfilePicture(organizationId, teamId) {
    const response = await api.delete(
        `/api/organizations/${organizationId}/teams/${teamId}/profile-picture`
    );

    return response.data ?.data ?? response.data;
}
