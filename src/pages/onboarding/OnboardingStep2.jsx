import { useState } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingLayout from "../../components/OnboardingLayout";
import OptionCard from "../../components/OptionCard";
import { FiBriefcase, FiLink } from "react-icons/fi";

function OnboardingStep1() {
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function handleAdminSetup() {
    setError("");
    navigate("/onboarding/step-2");
  }

  function handleMemberInvite() {
    setError("Member invite isn't available yet. Please choose Admin Setup for now.");
  }

  return (
    <OnboardingLayout stepLabel="Step 1 of 3">
      <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">Welcome to Quorum</h1>
      <p className="text-xs sm:text-sm text-white/70 mb-4 sm:mb-5">
        How would you like to set up your collaborative workspace today?
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        <OptionCard
          icon={<FiBriefcase size={18} />}
          badge="ADMIN SETUP"
          title="Create an Organization"
          description="Set up a new workspace for your company, configure security controls, and invite your team members."
          button={
            <button
              onClick={handleAdminSetup}
              className="w-full text-white text-sm font-medium py-2 rounded-lg mt-2"
              style={{ backgroundImage: "linear-gradient(to right, #0068FF, #003D99)" }}
            >
              Admin Setup
            </button>
          }
        />
        <OptionCard
          icon={<FiLink size={18} />}
          badge="MEMBER INVITE"
          title="Join an Organization"
          description="Enter an invite code or security key provided by your workspace admin to access your team."
          button={
            <button
              onClick={handleMemberInvite}
              className="w-full text-white text-sm font-medium py-2 rounded-lg mt-2"
              style={{ backgroundImage: "linear-gradient(to right, #0068FF, #003D99)" }}
            >
              Member Invite
            </button>
          }
        />
      </div>

      <p className="text-xs text-red-400 min-h-[18px] mt-3">{error}</p>
    </OnboardingLayout>
  );
}

export default OnboardingStep1;