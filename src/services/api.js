import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");

    if (token) {
        config.headers.Authorization = "Bearer " + token;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,

    async(error) => {
        const originalRequest = error.config;
        const status = error.response && error.response.status;


        const accessToken = localStorage.getItem("accessToken");
        const refreshToken = localStorage.getItem("refreshToken");

        if (
            status === 401 &&
            accessToken &&
            refreshToken &&
            !originalRequest._retry
        ) {
            originalRequest._retry = true;

            try {
                const res = await axios.post(
                    import.meta.env.VITE_API_URL + "/api/auth/refresh-token", { refreshToken }, { withCredentials: true }
                );

                const newAccessToken = res.data.data.accessToken;
                const newRefreshToken = res.data.data.refreshToken;

                localStorage.setItem("accessToken", newAccessToken);

                if (newRefreshToken) {
                    localStorage.setItem("refreshToken", newRefreshToken);
                }

                originalRequest.headers.Authorization =
                    "Bearer " + newAccessToken;

                return api(originalRequest);

            } catch (refreshError) {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
                localStorage.removeItem("user");

                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;