import { useState } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingLayout from "../../components/OnboardingLayout";
import OptionCard from "../../components/OptionCard";

function OnboardingStep3() {
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function toggle(key) {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
    setError("");
  }

  function handleSubmit() {
    if (selected.length === 0) {
      setError("Please select at least one option to continue.");
      return;
    }
    navigate("/dashboard");
  }

  const roles = [
    { key: "org", title: "Work at an organization", description: "Internal team meetings, 1-on-1s, and department syncs." },
    { key: "freelance", title: "Freelancing or consulting", description: "Client reviews, project updates, and discussions." },
    { key: "teams", title: "Collaborate across teams", description: "Cross-functional hubs and open meeting spaces." },
    { key: "community", title: "Communities", description: "Large group webinars, town halls, and stage events." },
  ];

  return (
    <OnboardingLayout stepLabel="Step 3 of 3">
      <h1 className="text-2xl font-bold text-white mb-1">Build your team & define your role</h1>
      <p className="text-sm text-white/70 mb-5">
        Select how you'll be using Quorum and invite collaborators to your workspace.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
        {roles.map((role) => (
          <OptionCard
            key={role.key}
            horizontal
            title={role.title}
            description={role.description}
            selected={selected.includes(role.key)}
            onClick={() => toggle(role.key)}
          />
        ))}
      </div>

      <p className="text-xs text-red-400 min-h-[16px] mb-3">{error}</p>

      <button
        onClick={handleSubmit}
        className="w-full text-white text-sm font-medium py-2.5 rounded-lg"
        style={{ backgroundImage: "linear-gradient(to right, #0068FF, #003D99)" }}
      >
        Complete Setup & Launch Dashboard
      </button>
    </OnboardingLayout>
  );
}

export default OnboardingStep3;