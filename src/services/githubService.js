import api from "./api";

const BASE = "/api/github";

const unwrap = (response) => response ?.data ?.data ?? response ?.data ?? response;

export async function getGitHubStatus() {
    return unwrap(await api.get(`${BASE}/status`));
}

export async function getGitHubAuthorizeUrl() {
    const data = unwrap(await api.get(`${BASE}/oauth/authorize-url`));
    return data ?.authorizeUrl || data ?.data ?.authorizeUrl || "";
}

export async function disconnectGitHub() {
    return unwrap(await api.post(`${BASE}/disconnect`));
}

export async function getGitHubRepos(page = 1, perPage = 30) {
    const data = unwrap(await api.get(`${BASE}/user/repos`, { params: { page, per_page: perPage } }));
    if (Array.isArray(data)) return data;
    return data ?.repos || data ?.repositories || [];
}

export async function getTeamGitHubRepo(teamId) {
    return unwrap(await api.get(`${BASE}/teams/${teamId}/repo`));
}

export async function linkTeamGitHubRepo(teamId, repoFullName) {
    return unwrap(await api.post(`${BASE}/teams/${teamId}/repo`, { repoFullName }));
}

export async function unlinkTeamGitHubRepo(teamId, repoFullName) {
    return unwrap(await api.delete(`${BASE}/teams/${teamId}/repo`, { data: { repoFullName } }));
}

export async function getTeamGitHubIssues(teamId, state = "open", page = 1, perPage = 20) {
    const data = unwrap(await api.get(`${BASE}/teams/${teamId}/issues`, { params: { state, page, per_page: perPage } }));
    return Array.isArray(data) ? data : data ?.issues || [];
}

export async function createTeamGitHubIssue(teamId, payload) {
    return unwrap(await api.post(`${BASE}/teams/${teamId}/issues`, payload));
}

export async function updateTeamGitHubIssue(teamId, issueNumber, state) {
    return unwrap(await api.patch(`${BASE}/teams/${teamId}/issues/${issueNumber}`, { state }));
}

export async function getTeamGitHubPulls(teamId, state = "open", page = 1, perPage = 20) {
    const data = unwrap(await api.get(`${BASE}/teams/${teamId}/pulls`, { params: { state, page, per_page: perPage } }));
    return Array.isArray(data) ? data : data ?.pulls || [];
}

export async function getTeamGitHubCommits(teamId, page = 1, perPage = 20, branch = "main") {
    const data = unwrap(await api.get(`${BASE}/teams/${teamId}/commits`, { params: { page, per_page: perPage, branch } }));
    return Array.isArray(data) ? data : data ?.commits || [];
}

export async function getTeamGitHubBranches(teamId) {
    const data = unwrap(await api.get(`${BASE}/teams/${teamId}/branches`));
    return Array.isArray(data) ? data : data ?.branches || [];
}

export async function getTeamGitHubCollaborators(teamId) {
    const data = unwrap(await api.get(`${BASE}/teams/${teamId}/collaborators`));
    return Array.isArray(data) ? data : data ?.collaborators || [];
}
