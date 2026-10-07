import { useState } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingLayout from "../components/OnboardingLayout";

const memberOptions = [
  "1-10 members",
  "11-50 members",
  "51-200 members",
  "200+ members",
];

function CreateOrganization() {
  const [orgName, setOrgName] = useState("");
  const [orgType, setOrgType] = useState("");
  const [memberCount, setMemberCount] = useState("");
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  function validate() {
    const newErrors = {};

    if (!orgName.trim()) {
      newErrors.orgName = "Organization name is required";
    }

    if (!orgType) {
      newErrors.orgType = "Please select an organization type";
    }

    if (!memberCount) {
      newErrors.memberCount = "Please select an organization size";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;

    navigate("/dashboard");
  }

  return (
    <OnboardingLayout>
      <h1 className="text-2xl font-bold text-white mb-1">
        Set up your organization
      </h1>

      <p className="text-sm text-white/70 mb-5">
        Set up a little about your organization to customize your workspace.
      </p>

      <label className="block text-xs font-semibold text-white/90 mb-1">
        Organization Name*
      </label>

      <input
        value={orgName}
        onChange={(e) => setOrgName(e.target.value)}
        placeholder="Enter your organization name"
        className="w-full rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 px-3 py-2 text-sm outline-none mb-1"
      />

      <p className="text-xs text-red-400 min-h-[16px] mb-3">
        {errors.orgName || ""}
      </p>

      <label className="block text-xs font-semibold text-white/90 mb-1">
        Organization Type*
      </label>

      <select
        value={orgType}
        onChange={(e) => setOrgType(e.target.value)}
        className="w-full rounded-lg bg-white/10 border border-white/20 text-white px-3 py-2 text-sm outline-none mb-1"
      >
        <option value="" className="text-black">
          Select your organization type
        </option>

        <option value="startup" className="text-black">
          Startup
        </option>

        <option value="enterprise" className="text-black">
          Enterprise
        </option>

        <option value="nonprofit" className="text-black">
          Non-profit
        </option>
      </select>

      <p className="text-xs text-red-400 min-h-[16px] mb-3">
        {errors.orgType || ""}
      </p>

      <label className="block text-xs font-semibold text-white/90 mb-2">
        Organization Size*
      </label>

      <div className="flex flex-wrap gap-2 mb-1">
        {memberOptions.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setMemberCount(option)}
            className="text-xs px-3 py-1.5 rounded-lg"
            style={{
              backgroundColor:
                memberCount === option
                  ? "rgba(30, 41, 59, 0.4)"
                  : "rgba(30, 41, 59, 0.3)",
              border:
                memberCount === option
                  ? "1px solid rgba(56, 189, 248, 0.8)"
                  : "1px solid #334155",
              color: "#fff",
            }}
          >
            {option}
          </button>
        ))}
      </div>

      <p className="text-xs text-red-400 min-h-[16px] mb-4">
        {errors.memberCount || ""}
      </p>

      <button
        onClick={handleSubmit}
        className="w-full text-white text-sm font-medium py-2.5 rounded-lg"
        style={{
          backgroundImage:
            "linear-gradient(to right, #0068FF, #003D99)",
        }}
      >
        Set Up Organization
      </button>
    </OnboardingLayout>
  );
}

export default CreateOrganization;