import { useState, useRef } from "react";
import { Link, Navigate, useNavigate, useLocation } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import AuthButton from "../components/AuthButton";
import {
  forgotPassword,
  verifyEmailOTP,
  sendVerificationOTP,
} from "../services/authService";

function VerifyCode() {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state && location.state.email;
  const from = location.state && location.state.from;

  if (!email) {
    return <Navigate to="/forgot-password" replace />;
  }

  function handleChange(index, value) {
    if (value !== "" && !/^\d$/.test(value)) return;

    const updated = [...code];
    updated[index] = value;
    setCode(updated);
    setError("");

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const otp = code.join("");

    if (otp.length !== 6) {
      setError("Enter the complete 6-digit code");
      return;
    }

    try {
      if (from === "signup") {
        // Signup OTP → verify email
        await verifyEmailOTP(email, otp);

        setInfo("Email verified successfully!");

        // Abhi signup verification complete hai.
        // Next step mein login/dashboard flow connect karenge.
        navigate("/login");
      } else {
        // Forgot password OTP → directly password reset page
        navigate("/set-new-password", {
          state: {
            email,
            otp,
          },
        });
      }
    } catch (err) {
      const status = err.response && err.response.status;

      if (status === 400) {
        setError("Invalid or expired verification code");
      } else if (status === 429) {
        setError("Too many attempts. Please wait a moment.");
      } else if (!err.response) {
        setError("Unable to connect. Please check your internet connection.");
      } else {
        setError("Verification failed. Please try again.");
      }
    }
  }

  async function handleResend() {
    try {
      if (from === "signup") {
        await sendVerificationOTP(email);
      } else {
        await forgotPassword(email);
      }

      setError("");
      setInfo("A new code has been sent to your email.");
      setCode(["", "", "", "", "", ""]);
    } catch (err) {
      const status = err.response && err.response.status;

      setInfo("");

      if (status === 429) {
        setError("Please wait a moment before requesting another code.");
      } else if (!err.response) {
        setError("Unable to connect. Please check your internet connection.");
      } else {
        setError("We couldn't resend the code. Please try again.");
      }
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
    >
      <form onSubmit={handleSubmit}>
        <div className="flex justify-center gap-2 mb-1">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength="1"
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-11 h-12 text-center rounded-xl bg-gray-100 border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500"
            />
          ))}
        </div>

        {error && (
          <p className="text-xs text-red-500 text-center mb-2">
            {error}
          </p>
        )}

        {info && (
          <p className="text-xs text-green-700 text-center mb-2">
            {info}
          </p>
        )}

        <div className="text-right mb-6">
          <button
            type="button"
            onClick={handleResend}
            className="text-xs text-[#2563EB] font-medium underline"
          >
            Resend Code
          </button>
        </div>

        <AuthButton>Verify & Continue</AuthButton>
      </form>

      <p className="text-center text-sm text-gray-600 mt-4">
        Already have an account?{" "}
        <Link
          to="/login"
          className="text-[#2563EB] font-medium underline"
        >
          Sign In
        </Link>
      </p>
    </AuthLayout>
  );
}

export default VerifyCode;