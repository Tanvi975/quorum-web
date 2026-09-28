import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import AuthInput from "../components/AuthInput";
import AuthButton from "../components/AuthButton";
import { forgotPassword } from "../services/authService";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Enter a valid email");
      return;
    }
    try {
      await forgotPassword(email);
      navigate("/verify-code", { state: { email } });
    } catch (err) {
      setError(
        (err.response && err.response.data && err.response.data.message) ||
          "Something went wrong"
      );
    }
  }

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Enter your registered email and we'll send a recovery code."
    >
      <form onSubmit={handleSubmit} noValidate>
        <AuthInput
          label="Email*"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
          error={error}
        />
        <AuthButton>Send Code</AuthButton>
      </form>

      <p className="text-center text-sm text-gray-600 mt-4">
        Already have an account?{" "}
        <Link to="/login" className="text-blue-700 font-medium">
          Sign In
        </Link>
      </p>
    </AuthLayout>
  );
}

export default ForgotPassword;
