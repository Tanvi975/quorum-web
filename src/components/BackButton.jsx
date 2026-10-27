
import { useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";

function BackButton({ fallback = "/dashboard", className = "" }) {
  const navigate = useNavigate();

  function handleBack() {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label="Go back"
      title="Go back"
      className={`mb-5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/30 bg-white/[0.06] text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${className}`}
    >
      <FiArrowLeft size={20} />
    </button>
  );
}

export default BackButton;
