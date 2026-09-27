import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import CloudBackground from "../components/CloudBackground";

function VerifyCode() {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const inputRefs = useRef([]);
  const navigate = useNavigate();

  function handleChange(index, value) {
    if (!/^[0-9]?$/.test(value)) return;
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
    navigate("/set-new-password");
  }

  return (
    <CloudBackground>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
          <h2 className="text-xl font-bold text-center">Enter Verification Code</h2>
          <p className="text-sm text-gray-500 text-center mb-6">
            We have sent a recovery code to your email.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="flex justify-center gap-2 mb-1">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-10 h-12 text-center border rounded-md outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
                />
              ))}
            </div>
            {error && (
              <p className="text-xs text-red-500 text-center mb-2">{error}</p>
            )}

            <div className="text-right mb-6">
              <button type="button" className="text-xs text-blue-600">
                Resend Code
              </button>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 transition text-white py-2 rounded-md"
            >
              Verify & Continue
            </button>
          </form>

          <p className="text-center text-sm mt-4">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600 font-medium">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </CloudBackground>
  );
}

export default VerifyCode;