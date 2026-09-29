import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/AuthLayout";
import AuthInput from "../components/AuthInput";
import AuthButton from "../components/AuthButton";
import { loginUser } from "../services/authService";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const { login } = useAuth();
  const navigate = useNavigate();

  function validate() {
    const newErrors = {};
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!email.includes("@") || !email.includes(".")) {
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

    try {
      const res = await loginUser(email, password);
      login(res.data.user, res.data.accessToken, res.data.refreshToken);
      navigate("/dashboard");
    } catch (err) {
      const message =
        (err.response && err.response.data && err.response.data.message) ||
        "Login failed. Try again.";
      setErrors({ form: message });
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign into your account">
      <form onSubmit={handleSubmit} noValidate>
        <AuthInput
          label="Email*"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@company.com"
          error={errors.email}
        />
        <AuthInput
          label="Password*"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          error={errors.password}
        />
        <div className="text-right -mt-2 mb-4">
          <Link to="/forgot-password" className="text-xs text-blue-700 underline">
            Forgot password?
          </Link>
        </div>

        {errors.form && (
          <p className="text-xs text-red-500 text-center mb-3">{errors.form}</p>
        )}

        <AuthButton>Sign In</AuthButton>
      </form>

      <p className="text-center text-sm text-gray-600 mt-4">
        Don't have an account?{" "}
        <Link to="/signup" className="text-blue-700 font-medium underline">
          Sign Up
        </Link>
      </p>
    </AuthLayout>
  );
}

export default Login;
