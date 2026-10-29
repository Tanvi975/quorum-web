import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/AuthLayout";
import AuthInput from "../components/AuthInput";
import AuthButton from "../components/AuthButton";
import { loginUser } from "../services/authService";
import illustration1 from "../assets/team-illustration-1.svg";
import { FiArrowLeft } from "react-icons/fi";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  function validate() {
    const newErrors = {};
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Enter a valid email";
    }
    if (!password) {
      newErrors.password = "Password is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await loginUser(email, password, rememberMe);
      login(res.data.user);
      if (res.data.user.isOnboarded) {
      navigate("/dashboard");
      } else {
       navigate("/onboarding/step-1");
      }
    } catch (err) {
      const status = err.response?.status;
      const backendMessage = err.response?.data?.message;
    
      if (
        status === 403 &&
        backendMessage ===
        "Email not verified. A fresh verification code has been sent to your email."
      ) {
        navigate("/verify-code", {
          state: {
            email,
            from: "signup",
          },
        });
        return;
      }
    
      let errorMessage;
    
      if (status === 400 || status === 401) {
        errorMessage = "The email or password you entered is incorrect.";
      } else if (status === 404) {
        errorMessage = "We couldn't find an account with that email.";
      } else if (status === 429) {
        errorMessage = "Too many login attempts. Please wait a moment and try again.";
      } else if (status >= 500) {
        errorMessage = "We're having trouble. Please try again in a moment.";
      } else if (!err.response) {
        errorMessage = "Unable to connect. Please check your internet connection.";
      } else {
        errorMessage = "We couldn't sign you in. Please try again.";
      }

      setErrors({ form:errorMessage });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      leftTitle="Real-Time Collaboration for Modern Teams"
      leftSubtitle="High-fidelity video syncs integrated directly into your workspace."
      leftImage={illustration1}
      showBack={true}
    >
      <form onSubmit={handleSubmit} noValidate>
        <AuthInput
          label="Email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setLoading(false);
          }}
          placeholder="Enter your email"
          error={errors.email}
        />
        <AuthInput
          label="Password"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setLoading(false);
          }}
          placeholder="Enter your password"
          error={errors.password}
          belowRight={
            <Link
              to="/forgot-password"
              className="text-[#2563EB] text-xs font-medium underline whitespace-nowrap shrink-0"
            >
              Forgot password?
            </Link>
          }
        />

<div className="mt-3 mb-2 flex items-center">
  <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
    <input
      type="checkbox"
      checked={rememberMe}
      onChange={(e) => setRememberMe(e.target.checked)}
      className="h-4 w-4 rounded border-gray-300 accent-[#2563EB]"
    />
    Remember me
  </label>
</div>

        <div className="min-h-5 mt-2 mb-4 flex items-center justify-center">
          {errors.form && (
           <p className="w-full max-w-full break-words text-xs text-red-500 text-center">
           {errors.form}
         </p>
          )}
        </div>
        <AuthButton disabled={loading}>
          {loading ? "Signing In..." : "Sign In"}
        </AuthButton>
      </form>

      <p className="text-center text-sm text-gray-600 mt-4">
        Don't have an account?{" "}
        <Link to="/signup" className="text-[#2563EB] text-sm font-medium underline">
          Sign Up
        </Link>
      </p>
    </AuthLayout>
  );
}

export default Login;