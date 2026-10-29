import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "",
    withCredentials: true,
    xsrfCookieName: "XSRF-TOKEN",
    xsrfHeaderName: "X-XSRF-TOKEN",
});

let csrfToken = null;
let refreshPromise = null;
let refreshFailed = false;

export function resetRefreshState() {
    refreshFailed = false;
    refreshPromise = null;
}

export async function initCsrf() {
    const res = await api.get("/api/csrf-token");
    csrfToken = res.data.csrfToken;

    if (csrfToken) {
        api.defaults.headers.common["X-XSRF-TOKEN"] = csrfToken;
    }

    return csrfToken;
}

api.interceptors.request.use((config) => {
    const method = config.method ?.toLowerCase();
    const mutatingMethods = ["post", "put", "patch", "delete"];

    if (mutatingMethods.includes(method) && csrfToken) {
        config.headers = config.headers || {};
        config.headers["X-XSRF-TOKEN"] = csrfToken;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    async(error) => {
        const originalRequest = error.config;
        const status = error.response ?.status;
        const url = originalRequest ?.url || "";

        const isAuthEndpoint =
            url.includes("/api/auth/login") ||
            url.includes("/api/auth/register") ||
            url.includes("/api/auth/refresh-token") ||
            url.includes("/api/auth/logout") ||
            url.includes("/api/auth/logout-all") ||
            url.includes("/api/csrf-token");

        if (
            status !== 401 ||
            !originalRequest ||
            originalRequest._retry ||
            isAuthEndpoint ||
            refreshFailed
        ) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
            if (!refreshPromise) {
                refreshPromise = api
                    .post("/api/auth/refresh-token", {})
                    .then((response) => {
                        refreshFailed = false;
                        return response;
                    })
                    .catch((refreshError) => {
                        refreshFailed = true;
                        localStorage.removeItem("user");
                        return Promise.reject(refreshError);
                    })
                    .finally(() => {
                        refreshPromise = null;
                    });
            }

            await refreshPromise;
            return api(originalRequest);
        } catch (refreshError) {
            return Promise.reject(refreshError);
        }
    }
);

export default api;
