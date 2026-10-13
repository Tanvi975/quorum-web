import api from "./api";

export async function getCommunities() {
    const response = await api.get("/communities");
    return response.data;
}

export async function createCommunity(communityData) {
    const response = await api.post("/communities", communityData);
    return response.data;
}