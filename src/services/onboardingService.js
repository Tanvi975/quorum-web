import api from "./api";

export async function saveOnboarding(useCases) {
    const res = await api.patch("/api/users/onboarding", {
        useCases,
    });

    return res.data;
}