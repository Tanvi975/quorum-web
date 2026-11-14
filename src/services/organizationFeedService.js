import api from "./api";

const getFeedPath = (organizationId) => {
    if (!organizationId) {
        throw new Error("Organization ID is required.");
    }

    return `/api/organizations/${encodeURIComponent(organizationId)}/feed`;
};

export async function getOrganizationFeed(organizationId, params = {}) {
    const response = await api.get(getFeedPath(organizationId), {
        params,
    });

    return response.data;
}

export async function createOrganizationPost(organizationId, payload) {
    const response = await api.post(
        getFeedPath(organizationId),
        payload
    );

    return response.data;
}

export async function getOrganizationPost(organizationId, postId) {
    const response = await api.get(
        `${getFeedPath(organizationId)}/${postId}`
    );

    return response.data;
}

export async function updateOrganizationPost(organizationId, postId, payload) {
    const response = await api.patch(
        `${getFeedPath(organizationId)}/${postId}`,
        payload
    );

    return response.data;
}

export async function deleteOrganizationPost(organizationId, postId) {
    const response = await api.delete(
        `${getFeedPath(organizationId)}/${postId}`
    );

    return response.data;
}

export async function togglePostPin(organizationId, postId) {
    const response = await api.post(
        `${getFeedPath(organizationId)}/${postId}/pin`
    );

    return response.data;
}

export async function togglePostReaction(organizationId, postId, emoji) {
    const response = await api.post(
        `${getFeedPath(organizationId)}/${postId}/react`, { emoji }
    );

    return response.data;
}

export async function getPostComments(organizationId, postId, params = {}) {
    const response = await api.get(
        `${getFeedPath(organizationId)}/${postId}/comments`, { params }
    );

    return response.data;
}

export async function createPostComment(
    organizationId,
    postId,
    content,
    parentId = null
) {
    const response = await api.post(
        `${getFeedPath(organizationId)}/${postId}/comments`, { content, ...(parentId ? { parentId } : {}) }
    );

    return response.data;
}

export async function updatePostComment(
    organizationId,
    postId,
    commentId,
    content
) {
    const response = await api.patch(
        `${getFeedPath(organizationId)}/${postId}/comments/${commentId}`, { content }
    );

    return response.data;
}

export async function deletePostComment(
    organizationId,
    postId,
    commentId
) {
    const response = await api.delete(
        `${getFeedPath(organizationId)}/${postId}/comments/${commentId}`
    );

    return response.data;
}