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
    const method = config.method?.toLowerCase();
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
        const status = error.response?.status;
        const url = originalRequest?.url || "";

        const isAuthEndpoint =
            url.includes("/api/auth/login") ||
            url.includes("/api/auth/register") ||
            url.includes("/api/auth/refresh-token") ||
            url.includes("/api/auth/refresh") ||
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

export function getApiErrorMessage(error, fallback = "Something went wrong. Please try again.") {
    if (!error) {
        return fallback;
    }

    if (error.code === "ERR_NETWORK" || !error.response) {
        return "Unable to connect to the server. Please check your internet connection.";
    }

    const status = error.response.status;

    switch (status) {
        case 400:
            return error.response.data?.message || "Invalid request. Please check your information.";

        case 401:
            return "Your session has expired. Please login again.";

        case 403:
            return "You don't have permission to perform this action.";

        case 404:
            return "The requested information was not found.";

        case 409:
            return error.response.data?.message || "This action conflicts with existing information.";

        case 422:
            return error.response.data?.message || "Please check the information you entered.";

        case 429:
            return "Too many requests. Please try again later.";

        case 500:
        case 502:
        case 503:
        case 504:
            return "Server is temporarily unavailable. Please try again later.";

        default:
            return fallback;
    }
}


export default api;
