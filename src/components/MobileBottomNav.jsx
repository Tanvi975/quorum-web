
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiCalendar,
  FiBookmark,
  FiMessageCircle,
  FiGlobe,
  FiCpu,
  FiUsers,
} from "react-icons/fi";

function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

  const navItems = [
    { label: "Home", icon: FiHome, path: "/dashboard" },
    { label: "Meetings", icon: FiCalendar, path: "/calendar" },
    { label: "Saved", icon: FiBookmark, path: "/saved-items" },
    { label: "Chat", icon: FiMessageCircle, path: "/chat" },
  ];

  const moreItems = [
    { label: "Home", icon: FiHome, path: "/dashboard" },
    { label: "Meetings", icon: FiCalendar, path: "/calendar" },
    { label: "Saved Items", icon: FiBookmark, path: "/saved-items" },
    { label: "AI Assistant", icon: FiCpu, path: "/ai-assistant" },
    { label: "Organizations", icon: FiUsers, path: "/organization" },
    { label: "Chat", icon: FiMessageCircle, path: "/chat" },
    { label: "Communities", icon: FiGlobe, path: "/communities" },
  ];

  function goTo(path) {
    setMobileMoreOpen(false);
    navigate(path);
  }

  return (
    <div className="md:hidden">
      {mobileMoreOpen && (
        <>
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setMobileMoreOpen(false)}
            className="fixed inset-0 z-40 bg-black/30"
          />

          <div className="fixed inset-x-3 bottom-[76px] z-50 rounded-2xl border border-white/15 bg-[#062C5F] p-3 shadow-2xl">
            <div className="grid grid-cols-2 gap-2">
              {moreItems.map(({ label, icon: Icon, path }) => (
                <button
                  key={path}
                  type="button"
                  onClick={() => goTo(path)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${
                    location.pathname === path
                      ? "bg-white/15 text-white"
                      : "text-white/90 hover:bg-white/10"
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-white/15 bg-[#062C5F]/95 px-1 pb-[env(safe-area-inset-bottom)] pt-2 text-white backdrop-blur-lg">
        {navItems.map(({ label, icon: Icon, path }) => (
          <button
            key={path}
            type="button"
            onClick={() => goTo(path)}
            className={`flex min-w-0 flex-col items-center gap-1 rounded-lg px-1 py-2 text-[10px] transition ${
              location.pathname === path
                ? "bg-white/15 text-white"
                : "text-white/80 hover:bg-white/10"
            }`}
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </button>
        ))}

        <button
          type="button"
          aria-expanded={mobileMoreOpen}
          onClick={() => setMobileMoreOpen((open) => !open)}
          className={`flex min-w-0 flex-col items-center gap-1 rounded-lg px-1 py-2 text-[10px] transition ${
            mobileMoreOpen
              ? "bg-white/15 text-white"
              : "text-white/80 hover:bg-white/10"
          }`}
        >
          <FiGlobe className="h-5 w-5" />
          <span>More</span>
        </button>
      </nav>
    </div>
  );
}

export default MobileBottomNav;
