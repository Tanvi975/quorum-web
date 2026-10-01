import api from "./api";

export async function registerUser(name, email, password) {
    const res = await api.post("/api/auth/register", { name, email, password });
    return res.data;
}

export async function loginUser(email, password) {
    const res = await api.post("/api/auth/login", { email, password });
    return res.data;
}

export async function getCurrentUser() {
    const res = await api.get("/api/auth/me");
    return res.data;
}

export async function logoutUser(refreshToken) {
    const res = await api.post("/api/auth/logout", { refreshToken });
    return res.data;
}

export async function forgotPassword(email) {
    const res = await api.post("/api/otp/forgot-password", { email });
    return res.data;
}

export async function resetPassword(email, otp, newPassword) {
    const res = await api.post("/api/otp/reset-password", {
        email,
        otp,
        newPassword,
    });
    return res.data;
}
export async function sendVerificationOTP(email) {
    const res = await api.post("/api/otp/send-verification", { email });
    return res.data;
}

export async function verifyEmailOTP(email, otp) {
    const res = await api.post("/api/otp/verify-email", { email, otp });
    return res.data;
}