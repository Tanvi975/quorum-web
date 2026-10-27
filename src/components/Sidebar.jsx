import { useLocation, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiCalendar,
  FiBookmark,
  FiUsers,
  FiMessageCircle,
  FiGlobe,
  FiCpu,
} from "react-icons/fi";

const navigationItems = [
  { label: "Home", icon: FiHome, path: "/dashboard" },
  { label: "Calender", icon: FiCalendar, path: "/calendar" },
  { label: "Saved Items", icon: FiBookmark, path: "/saved-items" },
  { label: "AI Assistant", icon: FiCpu, path: "/ai-assistant" },
  { label: "Organizations", icon: FiUsers, path: "/organization" },
  { label: "Chat", icon: FiMessageCircle, path: "/chat" },
  { label: "Communities", icon: FiGlobe, path: "/communities" },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className="hidden h-full w-[76px] shrink-0 overflow-y-auto border-r border-white/10 bg-[#062C5F]/95 md:block lg:w-[220px]">
      <div className="flex flex-col items-stretch gap-2 px-2 pt-6 lg:px-3">
        {navigationItems.map(({ label, icon: Icon, path }) => {
          const active =
            location.pathname === path ||
            (path !== "/dashboard" &&
              location.pathname.startsWith(`${path}/`));

          return (
            <button
              key={path}
              type="button"
              title={label}
              aria-current={active ? "page" : undefined}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-3 transition lg:flex-row lg:justify-start lg:gap-3 lg:px-3 ${
                active
                  ? "bg-[#0068FF]/30 text-white ring-1 ring-inset ring-[#60A5FA]/30"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="text-[11px] lg:text-sm">{label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}