import api from "./api";

export const getProjects = async() => {
    const response = await api.get("/api/projects");
    return response.data;
};

export const createProject = async(organizationId, projectData) => {
    const response = await api.post(
        `/api/projects/organization/${organizationId}`,
        projectData
    );
    return response.data;
};

export const getProjectById = async(projectId) => {
    const response = await api.get(`/api/projects/${projectId}`);
    return response.data;
};

export const updateProject = async(projectId, projectData) => {
    const response = await api.patch(
        `/api/projects/${projectId}`,
        projectData
    );
    return response.data;
};

export const deleteProject = async(projectId) => {
    const response = await api.delete(`/api/projects/${projectId}`);
    return response.data;
};

export const inviteProjectMember = async(projectId, payload) => {
    const response = await api.post(
        `/api/projects/${projectId}/invites`,
        payload
    );
    return response.data;
};

export const acceptProjectInvite = async(token) => {
    const response = await api.post("/api/projects/accept-invite", {
        token
    });
    return response.data;
};

export const updateProjectMember = async(projectId, userId, payload) => {
    const response = await api.patch(
        `/api/projects/${projectId}/members/${userId}`,
        payload
    );
    return response.data;
};

export const removeProjectMember = async(projectId, userId) => {
    const response = await api.delete(
        `/api/projects/${projectId}/members/${userId}`
    );
    return response.data;
};

export const getProjectTasks = async(projectId, params = {}) => {
    const response = await api.get(
        `/api/projects/${projectId}/tasks`, { params }
    );
    return response.data;
};

export const createProjectTask = async(projectId, taskData) => {
    const response = await api.post(
        `/api/projects/${projectId}/tasks`,
        taskData
    );
    return response.data;
};

export const updateProjectTask = async(projectId, taskId, taskData) => {
    const response = await api.patch(
        `/api/projects/${projectId}/tasks/${taskId}`,
        taskData
    );
    return response.data;
};

export const updateProjectTaskStatus = async(projectId, taskId, status) => {
    const response = await api.patch(
        `/api/projects/${projectId}/tasks/${taskId}/status`, { status }
    );
    return response.data;
};

export const submitTaskDeliverable = async(
    projectId,
    taskId,
    deliverableData
) => {
    const response = await api.post(
        `/api/projects/${projectId}/tasks/${taskId}/deliverable`,
        deliverableData
    );
    return response.data;
};

export const reviewTaskDeliverable = async(
    projectId,
    taskId,
    reviewData
) => {
    const response = await api.post(
        `/api/projects/${projectId}/tasks/${taskId}/review`,
        reviewData
    );
    return response.data;
};

export const addProjectResource = async(projectId, resourceData) => {
    const response = await api.post(
        `/api/projects/${projectId}/resources`,
        resourceData
    );
    return response.data;
};

export const getProjectResources = async(projectId) => {
    const response = await api.get(
        `/api/projects/${projectId}/resources`
    );
    return response.data;
};

export const deleteProjectResource = async(projectId, resourceId) => {
    const response = await api.delete(
        `/api/projects/${projectId}/resources/${resourceId}`
    );
    return response.data;
};