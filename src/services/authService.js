import api, { resetRefreshState } from "./api";

export async function registerUser(name, email, password) {
    const res = await api.post("/api/auth/register", {
        name: name.trim(),
        email: email.trim(),
        password,
    });

    return res.data;
}

export async function loginUser(email, password, rememberMe = false) {
    const res = await api.post("/api/auth/login", {
        email: email.trim(),
        password,
        rememberMe,
    });

    resetRefreshState();
    return res.data;
}

export async function getCurrentUser() {
    const res = await api.get("/api/auth/me");
    return res.data;
}

export async function logoutUser() {
    const res = await api.post("/api/auth/logout");
    return res.data;
}

export async function sendVerificationOTP(email) {
    const res = await api.post("/api/otp/send-otp", {
        email: email.trim(),
        type: "verification",
    });

    return res.data;
}

export async function verifyEmailOTP(email, otp) {
    const res = await api.post("/api/otp/verify-email", {
        email: email.trim(),
        otp,
    });

    resetRefreshState();
    return res.data;
}

export async function sendPasswordResetOTP(email) {
    const res = await api.post("/api/otp/send-otp", {
        email: email.trim(),
        type: "password-reset",
    });

    return res.data;
}

export async function forgotPassword(email) {
    const res = await api.post("/api/otp/forgot-password", {
        email: email.trim(),
    });

    return res.data;
}

export async function verifyPasswordResetOTP(email, otp) {
    const res = await api.post("/api/otp/verify-email", {
        email: email.trim(),
        otp,
    });

    return res.data;
}

export async function resetPassword(email, otp, newPassword) {
    const res = await api.post("/api/otp/reset-password", {
        email: email.trim(),
        otp,
        newPassword,
    });

    return res.data;
}