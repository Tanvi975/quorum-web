import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import AuthInput from "../components/AuthInput";
import AuthButton from "../components/AuthButton";
import illustration2 from "../assets/team-illustration-2.svg";
import { registerUser, sendVerificationOTP } from "../services/authService";

function Signup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();

  function validate() {
    const newErrors = {};

    const nameRegex = /^[A-Za-z ]{2,20}$/;
    const emailRegex =
      /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])\S{8,30}$/;

    if (!fullName) {
      newErrors.fullName = "Full name is required";
    } else if (!nameRegex.test(fullName)) {
      newErrors.fullName =
        "Only letters and spaces allowed (2-20 characters)";
    }

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Enter a valid email";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (!passwordRegex.test(password)) {
      newErrors.password =
        "8-30 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character, no spaces";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (confirmPassword !== password) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!validate()) return;

    try {
      const registerResponse = await registerUser(
        fullName,
        email,
        password
      );
      
      const authData = registerResponse.data;
      
      localStorage.setItem("accessToken", authData.accessToken);
      localStorage.setItem("refreshToken", authData.refreshToken);
      
    
      await sendVerificationOTP(email);


      navigate("/verify-code", {
        state: {
          email,
          from: "signup",
          authData,
        },
      });
    } catch (err) {
      const status = err.response && err.response.status;

      let message;

      if (status === 409) {
        message = "An account with this email already exists.";
      } else if (status === 400) {
        message = "Please check your details and try again.";
      } else if (status === 429) {
        message =
          "Too many attempts. Please wait a moment and try again.";
      } else if (status >= 500) {
        message =
          "We're having trouble. Please try again in a moment.";
      } else if (!err.response) {
        message =
          "Unable to connect. Please check your internet connection.";
      } else {
        message =
          "We couldn't create your account. Please try again.";
      }

      setErrors({ form: message });
    }
  }

  return (
    <AuthLayout
    title="Create Account"
    subtitle="Get Started"
    leftTitle="Turn Complex Discussions into Action"
    leftSubtitle="Integrated whiteboards and live agendas to keep projects moving forward."
    leftImage={illustration2}
  >
      <form onSubmit={handleSubmit} noValidate>
        <AuthInput
          label="Full Name*"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Enter your name"
          error={errors.fullName}
        />

        <AuthInput
          label="Email*"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          error={errors.email}
        />

<AuthInput
  label="Password*"
  type="password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  placeholder="E2gv_86q@r"
  error={errors.password}
  checklist={[
    { label: "8-30 characters", test: (v) => v.length >= 8 && v.length <= 30 },
    { label: "No spaces", test: (v) => v.length > 0 && !/\s/.test(v) },
    { label: "1 uppercase & 1 lowercase letter", test: (v) => /[a-z]/.test(v) && /[A-Z]/.test(v) },
    { label: "1 number", test: (v) => /\d/.test(v) },
    { label: "1 special character", test: (v) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(v) },
  ]}
/>

        <AuthInput
          label="Confirm Password*"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter your password"
          error={errors.confirmPassword}
        />

        <div className="h-5 mb-2">
          {errors.form && (
            <p className="text-xs text-red-500 text-center">
              {errors.form}
            </p>
          )}
        </div>

        <AuthButton>Create Account</AuthButton>
      </form>

      <p className="text-center text-sm text-gray-600 mt-4">
        Already have an account?{" "}
        <Link
          to="/login"
          className="text-[#2563EB] text-sm font-medium underline"
        >
          Sign In
        </Link>
      </p>
    </AuthLayout>
  );
}

export default Signup;