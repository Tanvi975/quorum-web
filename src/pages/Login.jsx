import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import CloudBackground from "../components/CloudBackground";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const { login } = useAuth();
  const navigate = useNavigate();

  function validate() {
    const newErrors = {};
    if (!email) {
      newErrors.email = "Email is required";
    }  else if (!email.includes("@") || !email.includes(".")) {
      newErrors.email = "Enter a valid email";
    }
    if (!password) {
      newErrors.password = "Password is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    login({ email }, "dummy-token");
    navigate("/dashboard");
  }

  return (
   
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-900 to-blue-400 p-4">
      <div className="w-full max-w-4xl flex flex-col md:flex-row items-center gap-10">
        <div className="text-white text-center md:text-left md:w-1/2">
          <h1 className="text-2xl md:text-4xl font-bold">
            Seamless Meetings for Modern Teams
          </h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
          <h2 className="text-xl font-bold text-center">Welcome back</h2>
          <p className="text-sm text-gray-500 text-center mb-6">
            Sign into your account
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <label className="block text-sm font-medium mb-1">Work Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className={`w-full border rounded-md px-3 py-2 mb-1 outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.email && (
              <p className="text-xs text-red-500 mb-2">{errors.email}</p>
            )}

            <div className="flex justify-between items-center mt-4 mb-1">
              <label className="text-sm font-medium">Password</label>
              <Link to="/forgot-password" className="text-xs text-blue-600">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className={`w-full border rounded-md px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.password ? "border-red-500" : "border-gray-300"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-400"
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500 mb-2">{errors.password}</p>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 transition text-white py-2 rounded-md mt-6"
            >
              Sign In
            </button>
          </form>

          <p className="text-center text-sm mt-4">
            Don't have an account?{" "}
            <Link to="/signup" className="text-blue-600 font-medium">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
   
  );
}

export default Login;