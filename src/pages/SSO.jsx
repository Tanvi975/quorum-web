import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import AuthInput from "../components/AuthInput";
import AuthButton from "../components/AuthButton";
import illustration1 from "../assets/team-illustration-1.svg";

function SSO() {
  const [orgId, setOrgId] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    if (!orgId) {
      setError("Organization ID or Work Email is required");
      return;
    }
    setError("");
    navigate("/dashboard");
  }

  return (
    <AuthLayout
    title="Single Sign-On (SSO)"
    subtitle="Enter your Organization ID or Work Email to proceed."
    leftTitle="Crystal-Clear Syncs for Modern Teams"
    leftSubtitle="Ultra-low latency video and smart audio built for fast team check-ins."
    leftImage={illustration1}
  >
      <form onSubmit={handleSubmit} noValidate>
        <AuthInput
          label="Organization ID or Work Email*"
          value={orgId}
          onChange={(e) => setOrgId(e.target.value)}
          placeholder="name@example.com"
          error={error}
        />
        <AuthButton>Continue with SSO</AuthButton>
      </form>

      <p className="text-center text-sm text-gray-600 mt-4">
        Back to standard{" "}
        <Link to="/login" className="text-[#2563EB] font-medium underline">
         Sign In
        </Link>
      </p>
    </AuthLayout>
  );
}

export default SSO;
