import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
    xsrfCookieName: "XSRF-TOKEN",
    xsrfHeaderName: "X-XSRF-TOKEN",
    withXSRFToken: true,
});
let csrfToken = null;

export async function initCsrf() {
    const res = await api.get("/api/csrf-token");

    csrfToken = res.data.csrfToken;

    api.defaults.headers.common["X-XSRF-TOKEN"] = csrfToken;

    return csrfToken;
}
api.interceptors.request.use((config) => {
    const method = config.method ?.toLowerCase();
    const mutatingMethods = ["post", "put", "patch", "delete"];

    if (mutatingMethods.includes(method) && csrfToken) {
        config.headers["X-XSRF-TOKEN"] = csrfToken;
    }

    return config;
});
api.interceptors.response.use(
    (response) => response,
    async(error) => {
        const originalRequest = error.config;
        const status = error.response && error.response.status;

        if (
            status === 401 &&
            originalRequest &&
            !originalRequest._retry
        ) {
            originalRequest._retry = true;

            try {
                await axios.post(
                    `${import.meta.env.VITE_API_URL}/api/auth/refresh-token`, {}, {
                        withCredentials: true,
                        xsrfCookieName: "XSRF-TOKEN",
                        xsrfHeaderName: "X-XSRF-TOKEN",
                        withXSRFToken: true,
                    }
                );

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
