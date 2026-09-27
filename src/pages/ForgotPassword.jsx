import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CloudBackground from "../components/CloudBackground";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    if (!email) {
      setError("Email is required");
      return;
    }
    if (!email.includes("@") || !email.includes(".")) {
      setError("Enter a valid email");
      return;
    }
    setError("");
    navigate("/verify-code");
  }

  return (
    <CloudBackground>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
          <h2 className="text-xl font-bold text-center">Reset Password</h2>
          <p className="text-sm text-gray-500 text-center mb-6">
            Enter your registered email and we'll send a recovery code.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className={`w-full border rounded-md px-3 py-2 mb-1 outline-none focus:ring-2 focus:ring-blue-500 ${
                error ? "border-red-500" : "border-gray-300"
              }`}
            />
            {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 transition text-white py-2 rounded-md mt-4"
            >
              Send Code
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

export default ForgotPassword;