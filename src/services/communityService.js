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
export async function getCommunityMembers(
    communityId, { cursor, limit = 20 } = {}
) {
    const response = await api.get(
        `/api/communities/${communityId}/members`, { params: { cursor, limit } }
    );
    return response.data;
}
export async function getCommunityPosts(
    communityId, { cursor, limit = 20 } = {}
) {
    const response = await api.get(
        `/api/communities/${communityId}/posts`, { params: { cursor, limit } }
    );
    return response.data;
}
export async function createCommunityPost(communityId, postData) {
    const payload =
        typeof postData === "string" ? { content: postData } :
        postData;

    const response = await api.post(
        `/api/communities/${communityId}/posts`,
        payload
    );

    return response.data;
}
export async function getPostComments(
    postId, { cursor, limit = 20 } = {}
) {
    const response = await api.get(
        `/api/community-posts/${postId}/comments`, { params: { cursor, limit } }
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

export async function revokeCommunityInvite(communityId, inviteId) {
    const response = await api.delete(
        `/api/communities/${communityId}/invites/${inviteId}`
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

export async function joinCommunityInvite(token) {
    const response = await api.post(
        `/api/communities/invites/${token}/join`
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

export async function getCommunityChannels(communityId) {
    const response = await api.get(
        `/api/communities/${communityId}/channels`
    );
    return response.data;
}

export async function getCommunityChannelDetails(communityId, channelId) {
    const response = await api.get(
        `/api/communities/${communityId}/channels/${channelId}`
    );
    return response.data;
}

export async function createCommunityChannel(communityId, channelData) {
    const response = await api.post(
        `/api/communities/${communityId}/channels`,
        channelData
    );
    return response.data;
}

export async function updateCommunityChannel(
    communityId,
    channelId,
    channelData
) {
    const response = await api.patch(
        `/api/communities/${communityId}/channels/${channelId}`,
        channelData
    );
    return response.data;
}

export async function deleteCommunityChannel(communityId, channelId) {
    const response = await api.delete(
        `/api/communities/${communityId}/channels/${channelId}`
    );
    return response.data;
}

export async function getCommunityChannelPosts(
    communityId,
    channelId, { cursor, limit = 20, search } = {}
) {
    const response = await api.get(
        `/api/communities/${communityId}/channels/${channelId}/posts`, {
            params: { cursor, limit, search },
        }
    );
    return response.data;
}

export async function createCommunityChannelPost(
    communityId,
    channelId,
    postData
) {
    const response = await api.post(
        `/api/communities/${communityId}/channels/${channelId}/posts`,
        postData
    );
    return response.data;
}
export async function searchCommunityFeed(
    communityId, { cursor, limit = 20, channelId, search } = {}
) {
    const response = await api.get(
        `/api/communities/${communityId}/posts`, {
            params: { cursor, limit, channelId, search },
        }
    );
    return response.data;
}

export async function createCommunityInviteLink(
    communityId,
    inviteData = {}
) {
    const response = await api.post(
        `/api/communities/${communityId}/invites`, {
            expiresInDays: inviteData.expiresInDays ?? 7,
        }
    );

    return response.data;
}
export async function respondToCommunityInvite(inviteId, responseValue) {
    const response = await api.post(
        `/api/communities/invites/${inviteId}/respond`, { response: responseValue }
    );
    return response.data;
}

export async function acceptCommunityInvite(token) {
    const response = await api.post(
        `/api/communities/invites/${token}/accept`
    );
    return response.data;
}

export async function declineCommunityInvite(token) {
    const response = await api.post(
        `/api/communities/invites/${token}/decline`
    );
    return response.data;
}

export async function getInvitableCommunityUsers(communityId, query = "") {
    const response = await api.get(
        `/api/communities/${communityId}/invitable-users`, {
            params: { q: query, limit: 20 },
        }
    );
    return response.data;
}
export async function createUploadSignature(uploadData) {
    const response = await api.post(
        "/api/uploads/sign",
        uploadData
    );
    return response.data;
}

export async function uploadFileToS3(uploadData) {
    const response = await api.post(
        "/api/uploads/s3",
        uploadData
    );
    return response.data;
}
