
import { Icon } from "./LandingShared";

export default function BackToTop({ visible }) {
  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      title="Back to top"
      className="fixed bottom-6 right-6 z-[60] flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-[#0866E8] text-white shadow-[0_8px_28px_rgba(0,0,0,0.3)] transition duration-300 hover:-translate-y-1 hover:bg-[#0759CC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
    >
      <Icon name="arrow" className="h-5 w-5" />
    </button>
  );
}
