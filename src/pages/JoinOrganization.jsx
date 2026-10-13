
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingLayout from "../components/OnboardingLayout";
import { FiArrowLeft, FiLink } from "react-icons/fi";

function JoinOrganization() {
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!inviteCode.trim()) {
      setError("Please enter your organization invite code.");
      return;
    }

    setError(
      "Organization invite verification will be available once the backend API is ready."
    );
  }

  return (
    <OnboardingLayout>
      <button
        type="button"
        onClick={() => navigate("/organization")}
        className="flex items-center gap-2 text-sm text-white/70 hover:text-white mb-5"
      >
        <FiArrowLeft size={16} />
        Back
      </button>

      <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-blue-500/15 text-blue-300 mb-4">
        <FiLink size={22} />
      </div>

      <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">
        Join an Organization
      </h1>

      <p className="text-xs sm:text-sm text-white/70 mb-6">
        Enter the invite code provided by your organization administrator
        to join your team's workspace.
      </p>

      <form onSubmit={handleSubmit}>
        <label
          htmlFor="inviteCode"
          className="block text-xs font-semibold text-white/90 mb-2"
        >
          Organization Invite Code
        </label>

        <input
          id="inviteCode"
          type="text"
          value={inviteCode}
          onChange={(e) => {
            setInviteCode(e.target.value);
            setError("");
          }}
          placeholder="Enter invite code"
          autoComplete="off"
          className="w-full rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 px-3 py-3 text-sm outline-none focus:border-blue-400"
        />

        <p
          role="status"
          className="text-xs text-red-400 min-h-[18px] mt-2 mb-4"
        >
          {error}
        </p>

        <button
          type="submit"
          className="w-full text-white text-sm font-medium py-2.5 rounded-lg"
          style={{
            backgroundImage:
              "linear-gradient(to right, #0068FF, #003D99)",
          }}
        >
          Continue
        </button>
      </form>
    </OnboardingLayout>
  );
}

export default JoinOrganization;
