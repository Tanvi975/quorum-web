import { useState } from "react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import AuthInput from "../components/AuthInput";
import AuthButton from "../components/AuthButton";
import { resetPassword } from "../services/authService";

function SetNewPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { email, otp } = location.state || {};


  if (!email || !otp) {
    return <Navigate to="/forgot-password" replace />;
  }

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

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    try {
      await resetPassword(email, otp, password);
      setSuccess(true);
    } catch (err) {
      setErrors({
        form:
          (err.response && err.response.data && err.response.data.message) ||
          "Something went wrong",
      });
    }
  }

  return (
    <AuthLayout
      title="Set New Password"
      subtitle="Your new password must be different from previous ones."
    >
      <form onSubmit={handleSubmit} noValidate>
        <AuthInput
          label="Enter Password*"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter new password"
          error={errors.password}
        />
        <AuthInput
          label="Confirm Password*"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter new password"
          error={errors.confirmPassword}
        />

        {errors.form && (
          <p className="text-xs text-red-500 text-center mb-3">{errors.form}</p>
        )}

        <AuthButton>Reset & Sign In</AuthButton>
      </form>

      {success && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-20 p-4">
          <div className="bg-[#F7F6F2] rounded-2xl shadow-xl p-8 w-full max-w-sm text-center">
            <h2 className="text-xl font-bold text-[#0B2A5B] mb-2">
              Password updated!
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Your password has been changed successfully. You can now log into
              your workspace.
            </p>
            <AuthButton type="button" onClick={() => navigate("/login")}>
              Back to Log In
            </AuthButton>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}

export default SetNewPassword;
