import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import AuthInput from "../components/AuthInput";
import AuthButton from "../components/AuthButton";
import { forgotPassword } from "../services/authService";
import illustration3 from "../assets/team-illustration-3.svg";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!email || !emailRegex.test(email)) {
      setError("Enter a valid email");
      return;
    }
    try {
      await forgotPassword(email);
      navigate("/verify-code", { state: { email } });
    } catch (err) {
      const status = err.response && err.response.status;
      let message;
    
      if (status === 404) {
        message = "We couldn't find an account with that email.";
      } else if (status === 429) {
        message = "Too many requests. Please wait a moment and try again.";
      } else if (status >= 500) {
        message = "We're having trouble. Please try again in a moment.";
      } else if (!err.response) {
        message = "Unable to connect. Please check your internet connection.";
      } else {
        message = "We couldn't send the code. Please try again.";
      }
    
      setError(message);
    }
  }

  return (
    <AuthLayout
    title="Reset Password"
    subtitle="Enter your registered email and we'll send a recovery code."
    leftTitle="Architecting Seamless Global Alignment"
    leftSubtitle="Connected video spaces designed to bridge teams everywhere."
    leftImage={illustration3}
  >
      <form onSubmit={handleSubmit} noValidate>
        <AuthInput
          label="Email*"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          error={error}
        />
        <AuthButton>Send Code</AuthButton>
      </form>

      <p className="text-center text-sm text-gray-600 mt-4">
        Already have an account?{" "}
        <Link to="/login" className="text-[#2563EB] font-medium underline">
        Sign In
        </Link>
      </p>
    </AuthLayout>
  );
}

export default ForgotPassword;
