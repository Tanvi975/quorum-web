import api from "./api";

const PROFILE_ENDPOINT = "/api/users/profile";
const AUTH_ME_ENDPOINT = "/api/auth/me";

function extractUser(response) {
    const body = response ?.data;

    return (
        body ?.data ?.user ??
        body ?.user ??
        body ?.data ??
        body ??
        null
    );
}

export async function getProfile() {
    const response = await api.get(PROFILE_ENDPOINT);
    return extractUser(response);
}

export async function getCurrentUserProfile() {
    const response = await api.get(AUTH_ME_ENDPOINT);
    return extractUser(response);
}

export async function updateProfile(profileData) {
    const response = await api.patch(PROFILE_ENDPOINT, profileData, {
        headers: {
            "Content-Type": "application/json",
        },
    });

    return extractUser(response);
}
export async function uploadProfileAvatar(file, profileData = {}) {
    if (!file) {
        throw new Error("Please select a profile photo.");
    }

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/heic",
        "image/gif",
    ];

    if (!allowedTypes.includes(file.type)) {
        throw new Error("Only JPG, PNG, WEBP, HEIC and GIF images are allowed.");
    }

    if (file.size > 10 * 1024 * 1024) {
        throw new Error("Profile photo must be smaller than 10 MB.");
    }

    const formData = new FormData();

    formData.append("avatar", file);

    if (profileData.name !== undefined) {
        formData.append("name", profileData.name);
    }

    if (profileData.useCases !== undefined) {
        formData.append("useCases", JSON.stringify(profileData.useCases));
    }

    if (profileData.isOnboarded !== undefined) {
        formData.append("isOnboarded", String(profileData.isOnboarded));
    }

    const response = await api.patch(PROFILE_ENDPOINT, formData);

    return extractUser(response);
}

export async function replaceProfile(profileData) {
    const response = await api.put(PROFILE_ENDPOINT, profileData);
    return extractUser(response);
}

export default {
    getProfile,
    getCurrentUserProfile,
    updateProfile,
    uploadProfileAvatar,
    replaceProfile,
};