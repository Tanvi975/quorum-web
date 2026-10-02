import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/AuthLayout";
import AuthInput from "../components/AuthInput";
import AuthButton from "../components/AuthButton";
import { loginUser } from "../services/authService";
import illustration1 from "../assets/team-illustration-1.svg";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      const res = await loginUser(email, password);
      login(res.data.user, res.data.accessToken, res.data.refreshToken);
      navigate("/dashboard");
    } catch (err) {
      const status = err.response && err.response.status;
      let message;

      if (status === 400 || status === 401) {
        message = "The email or password you entered is incorrect.";
      } else if (status === 404) {
        message = "We couldn't find an account with that email.";
      } else if (status === 429) {
        message = "Too many login attempts. Please wait a moment and try again.";
      } else if (status >= 500) {
        message = "We're having trouble. Please try again in a moment.";
      } else if (!err.response) {
        message = "Unable to connect. Please check your internet connection.";
      } else {
        message = "We couldn't sign you in. Please try again.";
      }

      setErrors({ form: message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign into your account"
      leftTitle="Crystal-Clear Syncs for Modern Teams"
      leftSubtitle="Ultra-low latency video and smart audio built for fast team check-ins."
      leftImage={illustration1}
    >
      <form onSubmit={handleSubmit} noValidate>
        <AuthInput
          label="Email*"
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
          label="Password*"
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
              className="text-[#2563EB] text-xs font-medium underline whitespace-nowrap"
            >
              Forgot password?
            </Link>
          }
        />
        <div className="min-h-5 mt-2 mb-4 flex items-center justify-center">
          {errors.form && (
            <p className="text-xs text-red-500 text-center">{errors.form}</p>
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