import api from "./api";

export async function getCommunities() {
    const response = await api.get("/api/communities");
    return response.data;
}

export async function createCommunity(communityData) {
    const response = await api.post("/api/communities", communityData);
    return response.data;
}

export async function getCommunityDetails(communityId) {
    const response = await api.get(
        `/api/communities/${communityId}`
    );
    return response.data;
}

export async function getCommunityMembers(communityId) {
    const response = await api.get(
        `/api/communities/${communityId}/members`, { params: { limit: 20 } }
    );
    return response.data;
}

export async function getCommunityPosts(communityId) {
    const response = await api.get(
        `/api/communities/${communityId}/posts`, { params: { limit: 20 } }
    );
    return response.data;
}

export async function createCommunityPost(communityId, content) {
    const response = await api.post(
        `/api/communities/${communityId}/posts`, { content }
    );
    return response.data;
}

export async function getPostComments(postId) {
    const response = await api.get(
        `/api/community-posts/${postId}/comments`, { params: { limit: 20 } }
    );
    return response.data;
}

export async function createPostComment(postId, content) {
    const response = await api.post(
        `/api/community-posts/${postId}/comments`, { content }
    );
    return response.data;
}

export async function createCommunityInvite(communityId) {
    const response = await api.post(
        `/api/communities/${communityId}/invites`, { expiresInDays: 7 }
    );

    return response.data;
}

export async function updateCommunity(communityId, data) {
    const response = await api.patch(
        `/api/communities/${communityId}`,
        data
    );
    return response.data;
}
export async function searchCommunityUsers(communityId, query) {
    const response = await api.get(
        `/api/communities/${communityId}/users/search`, {
            params: {
                q: query,
                limit: 20,
            },
        }
    );

    return response.data;
}

export async function deleteCommunity(communityId) {
    const response = await api.delete(
        `/api/communities/${communityId}`
    );

    return response.data;
}

export async function deleteCommunityPost(postId) {
    const response = await api.delete(
        `/api/community-posts/${postId}`
    );

    return response.data;
}

export async function deletePostComment(commentId) {
    const response = await api.delete(
        `/api/community-comments/${commentId}`
    );

    return response.data;
}

export async function leaveCommunity(communityId) {
    const response = await api.post(
        `/api/communities/${communityId}/leave`
    );

    return response.data;
}

export async function removeCommunityMember(communityId, userId) {
    const response = await api.delete(
        `/api/communities/${communityId}/members/${userId}`
    );
    return response.data;
}

export async function updateCommunityMemberRole(
    communityId,
    userId,
    role
) {
    const response = await api.patch(
        `/api/communities/${communityId}/members/${userId}/role`, { role }
    );

    return response.data;
}

export async function transferCommunityOwnership(
    communityId,
    newOwnerId
) {
    const response = await api.post(
        `/api/communities/${communityId}/transfer-ownership`, { newOwnerId }
    );

    return response.data;
}


export async function getInvitePreview(token) {
    const response = await api.get(
        `/api/communities/invites/${token}`
    );
    return response.data;
}

export async function updateCommunityPost(postId, content) {
    const response = await api.patch(
        `/api/community-posts/${postId}`, { content }
    );
    return response.data;
}

export async function updatePostComment(commentId, content) {
    const response = await api.patch(
        `/api/community-comments/${commentId}`, { content }
    );
    return response.data;
}