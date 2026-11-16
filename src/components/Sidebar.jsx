
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiCalendar,
  FiBookmark,
  FiUsers,
  FiMessageCircle,
  FiCpu,
  FiGlobe,
  FiUser,
  FiChevronsLeft,
  FiChevronsRight,
} from "react-icons/fi";

import {
  FaHome,
  FaCalendarAlt,
  FaBookmark,
  FaUsers,
  FaComments,
  FaRobot,
  FaGlobe,
  FaUser,
} from "react-icons/fa";

const navigationItems = [
  {
    label: "Home",
    icon: FiHome,
    activeIcon: FaHome,
    path: "/dashboard",
  },
  {
    label: "Calendar",
    icon: FiCalendar,
    activeIcon: FaCalendarAlt,
    path: "/calendar",
  },
  {
    label: "Saved Items",
    icon: FiBookmark,
    activeIcon: FaBookmark,
    path: "/saved-items",
  },
  {
    label: "AI Assistant",
    icon: FiCpu,
    activeIcon: FaRobot,
    path: "/ai-assistant",
  },
  {
    label: "Organizations",
    icon: FiUsers,
    activeIcon: FaUsers,
    path: "/organization",
  },
  {
    label: "Community",
    icon: FiGlobe,
    activeIcon: FaGlobe,
    path: "/communities",
  },
  {
    label: "Chat",
    icon: FiMessageCircle,
    activeIcon: FaComments,
    path: "/chat",
  },
  {
    label: "Profile",
    icon: FiUser,
    activeIcon: FaUser,
    path: "/profile",
  },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(
    () => window.innerWidth < 1024
  );

  return (
    <aside
      data-tour="sidebar-home"
      className={`hidden h-full shrink-0 overflow-y-auto overflow-x-hidden border-r border-white/10 bg-[#062C5F]/95 transition-all duration-300 md:block ${
        collapsed ? "w-[76px]" : "w-[220px]"
      }`}
    >
      <div className={`pt-7 ${collapsed ? "px-3" : "px-5"}`}>

        {/* Header: Logo and Collapse Toggle */}
        <div className="mb-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            title="Quorum Home"
            className={collapsed ? "text-center" : "text-left"}
          >
            <span className="text-xl font-extrabold tracking-wide text-white lg:text-2xl">
              {collapsed ? "Q" : "Quorum"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`flex rounded-lg p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white ${
              collapsed ? "self-center" : "self-end"
            }`}
          >
            {collapsed ? (
              <FiChevronsRight size={18} />
            ) : (
              <FiChevronsLeft size={18} />
            )}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col items-stretch gap-2">
          {navigationItems.map(
            ({ label, icon: Icon, activeIcon: ActiveIcon, path }) => {
              const active =
                location.pathname === path ||
                (path !== "/dashboard" &&
                  location.pathname.startsWith(`${path}/`));

              return (
                <button
                  key={path}
                  type="button"
                  title={label}
                  aria-label={label}
                  aria-current={active ? "page" : undefined}
                  onClick={() => navigate(path)}
                  className={`flex items-center gap-3 rounded-xl py-3 transition ${
                    collapsed
                      ? "justify-center px-2"
                      : "justify-start px-3"
                  } ${
                    active
                      ? "bg-[#0068FF]/30 text-white ring-1 ring-inset ring-[#60A5FA]/30"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {active ? (
                    <ActiveIcon className="h-5 w-5 shrink-0" />
                  ) : (
                    <Icon className="h-5 w-5 shrink-0" />
                  )}

                  {!collapsed && (
                    <span className="whitespace-nowrap text-sm">
                      {label}
                    </span>
                  )}
                </button>
              );
            }
          )}
        </nav>
      </div>
    </aside>
  );
}
