import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import CloudBackground from "../components/CloudBackground";

function SetNewPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  function validate() {
    const newErrors = {};
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
    }
    if (confirmPassword !== password) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSuccess(true);
  }

  return (
    <CloudBackground>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
          <h2 className="text-xl font-bold text-center">Set New Password</h2>
          <p className="text-sm text-gray-500 text-center mb-6">
            Your new password must be different from previous ones.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <label className="block text-sm font-medium mb-1">Enter Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full border rounded-md px-3 py-2 pr-10 mb-1 outline-none focus:ring-2 focus:ring-blue-500 ${
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

            <label className="block text-sm font-medium mt-3 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full border rounded-md px-3 py-2 pr-10 mb-1 outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.confirmPassword ? "border-red-500" : "border-gray-300"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-2.5 text-gray-400"
              >
                {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-500 mb-2">{errors.confirmPassword}</p>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 transition text-white py-2 rounded-md mt-6"
            >
              Reset & Sign In
            </button>
          </form>
        </div>

        {success && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-20">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm text-center">
              <h2 className="text-xl font-bold text-blue-700 mb-2">
                Password updated !
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Your password has been changed successfully. You can now log
                into your workspace.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="w-full bg-blue-600 hover:bg-blue-700 transition text-white py-2 rounded-md"
              >
                Back to Log In
              </button>
            </div>
          </div>
        )}
      </div>
    </CloudBackground>
  );
}

export default SetNewPassword;