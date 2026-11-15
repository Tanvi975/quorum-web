import api from "./api";

const AI_BASE = "/api/ai";

export const aiService = {
    chat: (prompt, context, files = []) => {
        if (!files.length) {
            return api.post(`${AI_BASE}/chat`, {
                prompt,
                ...(context ? { context } : {}),
            });
        }
        const formData = new FormData();

        if (prompt.trim()) {
            formData.append("prompt", prompt.trim());
        }

        if (context?.trim()) {
            formData.append("context", context.trim());
        }

        files.slice(0, 5).forEach((file) => {
            formData.append("files", file);
        });
        return api.post(`${AI_BASE}/chat`, formData);
    },
    createWorkflowPlan: (prompt, organizationId) =>
        api.post(`${AI_BASE}/workflows/plan`, {
            prompt,
            ...(organizationId ? { organizationId } : {}),
            autoExecute: false,
        }),

    executeWorkflow: (planId) =>
        api.post(`${AI_BASE}/workflows/execute`, {
            planId,
        }),
    search: (query, limit = 15) =>
        api.post(`${AI_BASE}/search`, { query, limit }),

    projectAssistance: (prompt, target) =>
        api.post(`${AI_BASE}/project-assistance`, { prompt, ...target }),

    quickReplies: (mode, input, tone = "professional") =>
        api.post(`${AI_BASE}/quick-replies`, { mode, tone, ...input }),

    projectUpdate: (timeframe, target) =>
        api.post(`${AI_BASE}/project-update`, { timeframe, ...target }),

    getHistory: (params = {}) =>
        api.get(`${AI_BASE}/history`, { params }),

    deleteHistoryItem: (id) =>
        api.delete(`${AI_BASE}/history/${encodeURIComponent(id)}`),

    clearAllHistory: () =>
        api.delete(`${AI_BASE}/history`),
};
