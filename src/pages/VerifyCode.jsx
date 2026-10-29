
import { useState, useRef } from "react";
import { Link, Navigate, useNavigate, useLocation } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import AuthButton from "../components/AuthButton";
import illustration1 from "../assets/team-illustration-1.svg";
import { useAuth } from "../context/AuthContext";
import {
  forgotPassword,
  verifyEmailOTP,
  sendVerificationOTP,
} from "../services/authService";

function VerifyCode() {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const { login } = useAuth();
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email;
  const from = location.state?.from;

  if (!email) {
    return <Navigate to="/forgot-password" replace />;
  }

  function handleChange(index, value) {
    if (value !== "" && !/^\d$/.test(value)) return;

    const updated = [...code];
    updated[index] = value;
    setCode(updated);
    setError("");
    setInfo("");

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e) {
    e.preventDefault();

    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (!pasted) return;

    const updated = [...code];

    for (let i = 0; i < 6; i++) {
      updated[i] = pasted[i] || "";
    }

    setCode(updated);
    setError("");
    setInfo("");

    const nextIndex = pasted.length < 6 ? pasted.length : 5;
    inputRefs.current[nextIndex]?.focus();
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (isSubmitting) return;

    const otp = code.join("");

    if (otp.length !== 6) {
      setError("Enter the complete 6-digit code");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setInfo("");

    try {
      if (from === "signup") {
        const res = await verifyEmailOTP(email, otp);
        const payload = res?.data ?? res;
        const verifiedUser = payload?.user ?? payload?.data?.user;

        if (!verifiedUser) {
          throw new Error("User information was not returned.");
        }

        login(verifiedUser);
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/set-new-password", {
          state: {
            email,
            otp,
          },
        });
      }
    } catch (err) {
      const status = err.response?.status;

      if (status === 400) {
        setError("Invalid or expired verification code");
      } else if (status === 401) {
        setError("Your session could not be verified. Please try again.");
      } else if (status === 429) {
        setError("Too many attempts. Please wait before trying again.");
      } else if (!err.response) {
        setError("Unable to connect. Please check your internet connection.");
      } else {
        setError(
          err.response?.data?.message ||
            "Verification failed. Please try again."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    if (isResending) return;

    setIsResending(true);
    setError("");
    setInfo("");

    try {
      if (from === "signup") {
        await sendVerificationOTP(email);
      } else {
        await forgotPassword(email);
      }

      setInfo("A new code has been sent to your email.");
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err) {
      const status = err.response?.status;

      if (status === 429) {
        setError("Too many attempts. Please wait before requesting another code.");
      } else if (!err.response) {
        setError("Unable to connect. Please check your internet connection.");
      } else {
        setError(
          err.response?.data?.message ||
            "We couldn't resend the code. Please try again."
        );
      }
    } finally {
      setIsResending(false);
    }
  }

  return (
    <AuthLayout
      title="Enter Verification Code"
      subtitle={
        from === "signup"
          ? "We have sent a verification code to your email."
          : "We have sent a recovery code to your email."
      }
      leftTitle="Real-Time Collaboration for Modern Teams"
      leftSubtitle="High-fidelity video syncs integrated directly into your workspace."
      leftImage={illustration1}
    >
      <form onSubmit={handleSubmit}>
        <div className="mb-1 flex w-full min-w-0 justify-center gap-1.5 sm:gap-2">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              aria-label={`Verification digit ${index + 1}`}
              className="h-12 w-10 min-w-0 shrink rounded-xl border border-gray-300 bg-gray-100 text-center text-base outline-none focus:ring-2 focus:ring-blue-500 sm:w-11 sm:shrink-0"
            />
          ))}
        </div>

        {error && (
          <p className="mb-2 w-full break-words text-center text-xs text-red-500">
            {error}
          </p>
        )}

        {info && (
          <p className="mb-2 w-full break-words text-center text-xs text-green-700">
            {info}
          </p>
        )}

        <div className="mb-6 text-right">
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending || isSubmitting}
            className="text-xs font-medium text-[#2563EB] underline disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isResending ? "Sending..." : "Resend Code"}
          </button>
        </div>

        <AuthButton disabled={isSubmitting || isResending}>
          {isSubmitting ? "Verifying..." : "Verify & Continue"}
        </AuthButton>
      </form>

      <p className="mt-4 text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link
          to="/login"
          className="font-medium text-[#2563EB] underline"
        >
          Sign In
        </Link>
      </p>
    </AuthLayout>
  );
}

export default VerifyCode;
