import { useState } from "react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import AuthInput from "../components/AuthInput";
import AuthButton from "../components/AuthButton";
import { resetPassword } from "../services/authService";
import illustration3 from "../assets/team-illustration-3.svg";

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
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])\S{8,30}$/;
  
    if (!password) {
      newErrors.password = "Password is required";
    } else if (!passwordRegex.test(password)) {
      newErrors.password =
        "8-30 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character, no spaces";
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
      const status = err.response && err.response.status;
      let message;
    
      if (status === 400 || status === 410) {
        message = "This code has expired or is invalid. Please request a new one.";
      } else if (status === 429) {
        message = "Too many attempts. Please wait a moment and try again.";
      } else if (status >= 500) {
        message = "We're having trouble. Please try again in a moment.";
      } else if (!err.response) {
        message = "Unable to connect. Please check your internet connection.";
      } else {
        message = "We couldn't reset your password. Please try again.";
      }
    
      setErrors({ form: message });
    }
  }

  return (
    <AuthLayout
    title="Set New Password"
    subtitle="Your new password must be different from previous ones."
    leftTitle="Architecting Seamless Global Alignment"
    leftSubtitle="Connected video spaces designed to bridge teams everywhere."
    leftImage={illustration3}
  >
      <form onSubmit={handleSubmit} noValidate>
        <AuthInput
          label="Enter Password*"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          error={errors.password}
          hint="8-30 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character."
        />
        <AuthInput
          label="Confirm Password*"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Enter your password"
          error={errors.confirmPassword}
        />

        <div className="h-5 mb-2">
        {errors.form && (
        <p className="text-xs text-red-500 text-center">{errors.form}</p>
         )}
        </div>

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
