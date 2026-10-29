import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "",
    withCredentials: true,
    xsrfCookieName: "XSRF-TOKEN",
    xsrfHeaderName: "X-XSRF-TOKEN",
});
let csrfToken = null;

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

        if (
            status === 401 &&
            originalRequest &&
            !originalRequest._retry &&
            !originalRequest.url ?.includes("/api/auth/refresh-token") &&
            !originalRequest.url ?.includes("/api/auth/login")
        ) {
            originalRequest._retry = true;

            try {
                await api.post("/api/auth/refresh-token", {});
                return api(originalRequest);
            } catch (refreshError) {
                localStorage.removeItem("user");
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;