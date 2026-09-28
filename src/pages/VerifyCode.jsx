import { useState, useRef } from "react";
import { Link, Navigate, useNavigate, useLocation } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import AuthButton from "../components/AuthButton";
import { forgotPassword } from "../services/authService";

function VerifyCode() {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state && location.state.email;


  if (!email) {
    return <Navigate to="/forgot-password" replace />;
  }

  function handleChange(index, value) {
    if (value !== "" && isNaN(Number(value))) return;
    const updated = [...code];
    updated[index] = value;
    setCode(updated);
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (code.some((digit) => digit === "")) {
      setError("Enter the complete 6-digit code");
      return;
    }
    navigate("/set-new-password", { state: { email, otp: code.join("") } });
  }

  async function handleResend() {
    try {
      await forgotPassword(email);
      setError("");
      setInfo("A new code has been sent to your email.");
    } catch (err) {
      setInfo("");
      setError(
        (err.response && err.response.data && err.response.data.message) ||
          "Could not resend the code"
      );
    }
  }

  return (
    <AuthLayout
      title="Enter Verification Code"
      subtitle="We have sent a recovery code to your email."
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
              className="w-11 h-12 text-center rounded-xl bg-gray-100 border border-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
            />
          ))}
        </div>
        {error && <p className="text-xs text-red-500 text-center mb-2">{error}</p>}
        {info && <p className="text-xs text-green-700 text-center mb-2">{info}</p>}

        <div className="text-right mb-6">
          <button
            type="button"
            onClick={handleResend}
            className="text-xs text-blue-700"
          >
            Resend Code
          </button>
        </div>

        <AuthButton>Verify & Continue</AuthButton>
      </form>

      <p className="text-center text-sm text-gray-600 mt-4">
        Already have an account?{" "}
        <Link to="/login" className="text-blue-700 font-medium">
          Sign In
        </Link>
      </p>
    </AuthLayout>
  );
}

export default VerifyCode;
