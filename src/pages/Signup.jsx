import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/AuthLayout";
import AuthInput from "../components/AuthInput";
import AuthButton from "../components/AuthButton";
import { registerUser } from "../services/authService";

function Signup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const { login } = useAuth();
  const navigate = useNavigate();

  function validate() {
    const newErrors = {};
    if (!fullName) newErrors.fullName = "Full name is required";
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!email.includes("@") || !email.includes(".")) {
      newErrors.email = "Enter a valid email";
    }
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
      const res = await registerUser(fullName, email, password);
      login(res.data.user, res.data.accessToken, res.data.refreshToken);
      navigate("/dashboard");
    } catch (err) {
      const message =
        (err.response && err.response.data && err.response.data.message) ||
        "Sign up failed. Try again.";
      setErrors({ form: message });
    }
  }

  return (
    <AuthLayout title="Create Account" subtitle="Get Started">
      <form onSubmit={handleSubmit} noValidate>
        <AuthInput
          label="Full Name*"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="e.g. Karan Grover"
          error={errors.fullName}
        />
        <AuthInput
          label="Email*"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@gmail.com"
          error={errors.email}
        />
        <AuthInput
          label="Password*"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          error={errors.password}
          hint="Password must be atleast 8 characters long."
        />
        <AuthInput
          label="Confirm Password*"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter your password"
          error={errors.confirmPassword}
        />

        {errors.form && (
          <p className="text-xs text-red-500 text-center mb-3">{errors.form}</p>
        )}

        <AuthButton>Create Account</AuthButton>
      </form>

      <p className="text-center text-sm text-gray-600 mt-4">
        Already have an account?{" "}
        <Link to="/login" className="text-blue-700 text-sm underline">
          Log In
        </Link>
      </p>
    </AuthLayout>
  );
}

export default Signup;
