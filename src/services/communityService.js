import api from "./api";

const MAX_ATTACHMENT_SIZE = 26214400;

export function getFileCategory(file) {
    if (!file) return "file";
    const mime = (file.type || "").toLowerCase();
    if (mime.startsWith("image/")) return "image";

    const name = file.name || "";
    const ext = name.split(".").pop() ?.toLowerCase();
    const docExtensions = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv", "rtf"];
    if (docExtensions.includes(ext) || mime.includes("pdf") || mime.includes("word") || mime.includes("document") || mime.includes("text/")) {
        return "document";
    }

    return "file";
}

export async function uploadAttachment(file) {
    if (!file) return null;

    if (file.size > MAX_ATTACHMENT_SIZE) {
        throw new Error("File exceeds the 25 MiB limit (maximum 26,214,400 bytes).");
    }

    const fileType = getFileType(file);
    const fileName = file.name || "attachment";
    const fileSize = file.size;

    try {
        const signResponse = await api.post("/api/uploads/sign", {
            folder: "community_attachments",
            fileType,
        });

        const signData = signResponse.data ?.data ?? signResponse.data;

        if (signData ?.uploadUrl && signData ?.signature && signData ?.apiKey) {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("api_key", signData.apiKey);
            formData.append("timestamp", signData.timestamp);
            formData.append("signature", signData.signature);
            if (signData.folder) {
                formData.append("folder", signData.folder);
            }

            const uploadRes = await fetch(signData.uploadUrl, {
                method: "POST",
                body: formData,
            });

            if (uploadRes.ok) {
                const uploadJson = await uploadRes.json();
                const fileUrl = uploadJson.secure_url || uploadJson.url;
                if (fileUrl) {
                    return { fileUrl, fileType, fileName, fileSize };
                }
            }
        }
    } catch (signErr) {
        console.warn("Signed upload attempt encountered an issue, trying direct upload fallback:", signErr);
    }

    try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("fileType", fileType);

        const s3Response = await api.post("/api/uploads/s3", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });

        const s3Data = s3Response.data ?.data ?? s3Response.data;
        const fileUrl = s3Data ?.fileUrl || s3Data ?.url || s3Data ?.location;

        if (fileUrl) {
            return { fileUrl, fileType, fileName, fileSize };
        }
    } catch (s3Err) {
        console.warn("Direct upload fallback failed:", s3Err);
    }

    throw new Error("Could not upload file to storage. Please check storage credentials.");
}

function getFileType(file) {
    return getFileCategory(file);
}
export async function getCommunities() {
    const response = await api.get("/api/communities");
    return response.data;
}

export async function createCommunity(communityData) {
    const response = await api.post("/api/communities", communityData);
    return response.data;
}

export async function getCommunityDetails(communityId) {
    const response = await api.get(`/api/communities/${communityId}`);
    return response.data;
}

export async function updateCommunity(communityId, data) {
    const response = await api.patch(`/api/communities/${communityId}`, data);
    return response.data;
}

export async function deleteCommunity(communityId) {
    const response = await api.delete(`/api/communities/${communityId}`);
    return response.data;
}

export async function leaveCommunity(communityId) {
    const response = await api.post(`/api/communities/${communityId}/leave`);
    return response.data;
}

export async function getCommunityMembers(communityId, { cursor, limit = 20 } = {}) {
    const response = await api.get(`/api/communities/${communityId}/members`, {
        params: { cursor, limit },
    });
    return response.data;
}

export async function removeCommunityMember(communityId, userId) {
    const response = await api.delete(`/api/communities/${communityId}/members/${userId}`);
    return response.data;
}

export async function updateCommunityMemberRole(communityId, userId, role) {
    const response = await api.patch(`/api/communities/${communityId}/members/${userId}/role`, {
        role,
    });
    return response.data;
}

export async function transferCommunityOwnership(communityId, newOwnerId) {
    const response = await api.post(`/api/communities/${communityId}/transfer-ownership`, {
        newOwnerId,
    });
    return response.data;
}

export async function getCommunityChannels(communityId) {
    try {
        const response = await api.get(`/api/communities/${communityId}/channels`);
        return response.data;
    } catch (err) {
        if (err.response ?.status === 404) {
            return {
                success: true,
                data: [{
                    id: "general",
                    name: "General",
                    description: "Default community channel",
                    isDefault: true,
                }, ],
            };
        }
        throw err;
    }
}

export async function getCommunityChannelDetails(communityId, channelId) {
    const response = await api.get(`/api/communities/${communityId}/channels/${channelId}`);
    return response.data;
}

export async function createCommunityChannel(communityId, channelData) {
    const response = await api.post(`/api/communities/${communityId}/channels`, channelData);
    return response.data;
}

export async function updateCommunityChannel(communityId, channelId, channelData) {
    const response = await api.patch(
        `/api/communities/${communityId}/channels/${channelId}`,
        channelData
    );
    return response.data;
}

export async function deleteCommunityChannel(communityId, channelId) {
    const response = await api.delete(`/api/communities/${communityId}/channels/${channelId}`);
    return response.data;
}

export async function getCommunityPosts(communityId, { cursor, limit = 20, channelId, search } = {}) {
    const params = { cursor, limit };
    if (channelId) params.channelId = channelId;
    if (search && search.trim()) params.search = search.trim();

    const response = await api.get(`/api/communities/${communityId}/posts`, { params });
    return response.data;
}

export async function getCommunityChannelPosts(communityId, channelId, { cursor, limit = 20, search } = {}) {
    try {
        const params = { cursor, limit };
        if (search && search.trim()) params.search = search.trim();
        const response = await api.get(
            `/api/communities/${communityId}/channels/${channelId}/posts`, { params }
        );
        return response.data;
    } catch (err) {

        if (err.response ?.status === 404) {
            return getCommunityPosts(communityId, { cursor, limit, channelId, search });
        }
        throw err;
    }
}

export async function createCommunityPost(communityId, postData) {
    const payload =
        typeof postData === "string" ? { content: postData } : {...postData };


    if (payload.channelId && payload.channelId !== "general") {
        try {
            const response = await api.post(
                `/api/communities/${communityId}/channels/${payload.channelId}/posts`,
                payload
            );
            return response.data;
        } catch (err) {
            if (err.response ?.status !== 404) throw err;
        }
    }

    const response = await api.post(`/api/communities/${communityId}/posts`, payload);
    return response.data;
}

export async function createCommunityChannelPost(communityId, channelId, postData) {
    const payload = typeof postData === "string" ? { content: postData } : {...postData };
    return createCommunityPost(communityId, {...payload, channelId });
}

export async function updateCommunityPost(postId, delta) {
    const payload = typeof delta === "string" ? { content: delta } : {...delta };

    try {
        const response = await api.patch(`/api/communities/posts/${postId}`, payload);
        return response.data;
    } catch (err) {
        if (err.response ?.status === 404) {
            try {
                const response = await api.patch(`/api/community-posts/${postId}`, payload);
                return response.data;
            } catch (err2) {
                if (err2.response ?.status === 404) {
                    const response = await api.patch(`/api/posts/${postId}`, payload);
                    return response.data;
                }
                throw err2;
            }
        }
        throw err;
    }
}

export async function deleteCommunityPost(postId) {

    try {
        const response = await api.delete(`/api/communities/posts/${postId}`);
        return response.data;
    } catch (err) {
        if (err.response ?.status === 404) {
            try {
                const response = await api.delete(`/api/community-posts/${postId}`);
                return response.data;
            } catch (err2) {
                if (err2.response ?.status === 404) {
                    const response = await api.delete(`/api/posts/${postId}`);
                    return response.data;
                }
                throw err2;
            }
        }
        throw err;
    }
}

export async function searchCommunityFeed(communityId, { cursor, limit = 20, channelId, search } = {}) {
    return getCommunityPosts(communityId, { cursor, limit, channelId, search });
}

export async function getPostComments(postId, { cursor, limit = 20 } = {}) {
    try {
        const response = await api.get(`/api/community-posts/${postId}/comments`, {
            params: { cursor, limit },
        });
        return response.data;
    } catch (err) {
        if (err.response ?.status === 404) {
            const response = await api.get(`/api/posts/${postId}/comments`, {
                params: { cursor, limit },
            });
            return response.data;
        }
        throw err;
    }
}

export async function createPostComment(postId, content) {
    try {
        const response = await api.post(`/api/community-posts/${postId}/comments`, { content });
        return response.data;
    } catch (err) {
        if (err.response ?.status === 404) {
            const response = await api.post(`/api/posts/${postId}/comments`, { content });
            return response.data;
        }
        throw err;
    }
}

export async function updatePostComment(commentId, content) {
    const response = await api.patch(`/api/community-comments/${commentId}`, { content });
    return response.data;
}

export async function deletePostComment(commentId) {
    const response = await api.delete(`/api/community-comments/${commentId}`);
    return response.data;
}

export async function createCommunityInvite(communityId, inviteData = {}) {
    const payload =
        typeof inviteData === "object" ? { expiresInDays: 7, ...inviteData } : { expiresInDays: 7 };

    const response = await api.post(`/api/communities/${communityId}/invites`, payload);
    return response.data;
}
export async function createCommunityInviteLink(communityId, inviteData = {}) {
    try {
        const response = await api.post(`/api/communities/${communityId}/invite-links`, {
            expiresInDays: inviteData.expiresInDays ?? 7,
            ...inviteData,
        });
        return response.data;
    } catch (err) {
        if (err.response ?.status === 404) {

            return createCommunityInvite(communityId, inviteData);
        }
        throw err;
    }
}

export async function revokeCommunityInvite(communityId, inviteId) {
    const response = await api.delete(`/api/communities/${communityId}/invites/${inviteId}`);
    return response.data;
}

export async function getInvitePreview(token) {
    const response = await api.get(`/api/communities/invites/${token}`);
    return response.data;
}

export async function acceptCommunityInvite(token) {
    try {
        const response = await api.post(`/api/communities/invites/${token}/accept`);
        return response.data;
    } catch (err) {
        if (err.response ?.status === 404) {
            const response = await api.post(`/api/communities/invites/${token}/join`);
            return response.data;
        }
        throw err;
    }
}

export async function declineCommunityInvite(token) {
    const response = await api.post(`/api/communities/invites/${token}/decline`);
    return response.data;
}

export async function respondToCommunityInvite(inviteId, responseValue) {
    const response = await api.post(`/api/communities/invites/${inviteId}/respond`, {
        response: responseValue,
        action: responseValue,
    });
    return response.data;
}

export async function joinCommunityInvite(token) {
    return acceptCommunityInvite(token);
}

export async function getInvitableCommunityUsers(communityId, query = "") {
    const trimmed = (query || "").trim();
    if (!trimmed) {
        return { success: true, data: [] };
    }

    try {
        const response = await api.get(`/api/communities/${communityId}/invitable-users`, {
            params: { q: trimmed, limit: 20 },
        });
        return response.data;
    } catch (err) {
        if (err.response ?.status === 404) {
            return searchCommunityUsers(communityId, trimmed);
        }
        throw err;
    }
}

export async function searchCommunityUsers(communityId, query) {
    const trimmed = (query || "").trim();
    if (!trimmed) {
        return { success: true, data: [] };
    }

    const response = await api.get(`/api/communities/${communityId}/users/search`, {
        params: { q: trimmed, limit: 20 },
    });
    return response.data;
}

export async function createUploadSignature(uploadData) {
    const response = await api.post("/api/uploads/sign", uploadData);
    return response.data;
}

export async function uploadFileToS3(uploadData) {
    const response = await api.post("/api/uploads/s3", uploadData);
    return response.data;
}