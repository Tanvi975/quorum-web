
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingLayout from "../components/OnboardingLayout";
import OptionCard from "../components/OptionCard";
import BackButton from "../components/BackButton";
import { FiBriefcase, FiLink } from "react-icons/fi";

function Organization() {
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function handleAdminSetup() {
    setError("");
    navigate("/organization/create");
  }

  function handleMemberInvite() {
    setError("");
    navigate("/organization/join");
  }

  return (
    <OnboardingLayout>
      <div className="mx-auto w-full max-w-5xl px-1 py-2 sm:px-3 sm:py-4">
      <button
  type="button"
  onClick={() => navigate("/dashboard", { replace: true })}
  className="mb-4 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white transition hover:bg-white/20"
>
  ← 
</button>

        <h1 className="mb-2 text-xl font-bold text-white sm:text-2xl">
          Welcome to Quorum
        </h1>

        <p className="mb-5 text-xs leading-relaxed text-white/75 sm:text-sm">
          How would you like to set up your collaborative workspace today?
        </p>

        <div className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-2 md:gap-4">
          <OptionCard
            organizationStyle
            icon={<FiBriefcase size={21} />}
            badge="ADMIN SETUP"
            title="Create an Organization"
            description="Set up a new workspace for your company, configure security controls, and invite your team members."
            button={
              <button
                type="button"
                onClick={handleAdminSetup}
                className="w-full rounded-lg py-2.5 text-sm font-medium text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, #0068FF, #003D99)",
                }}
              >
                Admin Setup
              </button>
            }
          />

          <OptionCard
            organizationStyle
            icon={<FiLink size={21} />}
            badge="MEMBER INVITE"
            title="Join an Organization"
            description="Enter an invite code or security key provided by your workspace admin to access your team."
            button={
              <button
                type="button"
                onClick={handleMemberInvite}
                className="w-full rounded-lg py-2.5 text-sm font-medium text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, #0068FF, #003D99)",
                }}
              >
                Member Invite
              </button>
            }
          />
        </div>

        <p
          role="alert"
          className="mt-3 min-h-[18px] text-xs text-red-400"
        >
          {error}
        </p>

        <button
          type="button"
          onClick={() => navigate("/organizations")}
          className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-white/25 bg-white/[0.05] px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 sm:min-h-14"
        >
          <FiBriefcase size={18} />
          <span>View My Organizations</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </OnboardingLayout>
  );
}

export default Organization;
