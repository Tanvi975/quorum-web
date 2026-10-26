import { useAuth } from "../context/AuthContext";
import DashboardBackground from "../components/DashboardBackground";
import {FiHome, FiCalendar, FiBookmark, FiUsers, FiMessageCircle, FiGlobe, FiCpu} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { createMeeting } from "../services/meetingService";
import { useState, useEffect, useRef } from "react";
import NotificationBell from "../components/NotificationBell";
import { getUpcomingEvents } from "../services/calendarService";
import DashboardOverview from "../components/DashboardOverview";

function Dashboard() {
  const [upcomingEvents, setUpcomingEvents] = useState([]);
const [upcomingLoading, setUpcomingLoading] = useState(true);
const [upcomingError, setUpcomingError] = useState("");
const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

useEffect(() => {
  async function loadUpcomingEvents() {
    try {
      setUpcomingLoading(true);
      setUpcomingError("");

      const events = await getUpcomingEvents(5);
      setUpcomingEvents(events);
    } catch (error) {
      setUpcomingError(
        error.response?.data?.message ||
          "Upcoming meetings load nahi ho paayi."
      );
    } finally {
      setUpcomingLoading(false);
    }
  }

  loadUpcomingEvents();
}, []);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
const [profileMenuOpen, setProfileMenuOpen] = useState(false);
const profileMenuRef = useRef(null);

useEffect(() => {
  function handleOutsideClick(event) {
    if (
      profileMenuRef.current &&
      !profileMenuRef.current.contains(event.target)
    ) {
      setProfileMenuOpen(false);
    }
  }

  function handleEscape(event) {
    if (event.key === "Escape") {
      setProfileMenuOpen(false);
    }
  }

  document.addEventListener("mousedown", handleOutsideClick);
  document.addEventListener("keydown", handleEscape);

  return () => {
    document.removeEventListener("mousedown", handleOutsideClick);
    document.removeEventListener("keydown", handleEscape);
  };
}, []);

function handleLogout() {
  setProfileMenuOpen(false);
  logout();
  navigate("/login", { replace: true });
}
  const [creatingMeeting, setCreatingMeeting] = useState(false);
const [meetingError, setMeetingError] = useState("");
const [meetingCode, setMeetingCode] = useState("");


function handleJoinMeeting() {
  const code = meetingCode.trim();

  if (!code) {
    setMeetingError("Please enter a meeting code.");
    return;
  }

  setMeetingError("");
  navigate(`/video-call?code=${encodeURIComponent(code)}`);
}

async function handleNewMeeting() {
  try {
    setCreatingMeeting(true);
    setMeetingError("");

    const meeting = await createMeeting();

    if (!meeting?.code) {
      throw new Error("Meeting code was not returned by the server.");
    }

    navigate(`/video-call?code=${encodeURIComponent(meeting.code)}&host=1`);
  } catch (error) {
    setMeetingError(
      error.response?.data?.message ||
        error.message ||
        "Could not create meeting."
    );
  } finally {
    setCreatingMeeting(false);
  }
}

  const userName = user?.name || "Karan";

  return (
    <div className="relative h-dvh overflow-hidden bg-[#EAF4FF]">
      <DashboardBackground />

      <div className="relative z-10 flex h-dvh min-h-0 flex-col">
      
     
<header className="sticky top-0 z-50 flex h-16 min-h-16 w-full shrink-0 items-center justify-between gap-3 border-b border-[#E5E7EB] bg-white px-3 shadow-sm sm:px-5 lg:px-8">

     
          <h1 className="text-[#062C5F] font-bold">
  QUORUM
</h1>
          
          <div className="hidden md:flex items-center w-[280px] lg:w-[360px] h-[38px] bg-[#F7F9FC] border border-[#E5E7EB] rounded-lg px-4">
            <svg
              className="w-4 h-4 text-[#64748B] mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z"
              />
            </svg>

            <input
              type="text"
              placeholder="Search"
              className="w-full bg-transparent outline-none text-sm text-[#334155] placeholder-[#94A3B8]"
            />
          </div>

          <div className="flex items-center gap-4">

{meetingError && (
  <p className="text-sm text-red-500">{meetingError}</p>
)}

<NotificationBell />

<div className="relative" ref={profileMenuRef}>
  <button
    type="button"
    onClick={() => setProfileMenuOpen((open) => !open)}
    aria-label="Open profile menu"
    aria-expanded={profileMenuOpen}
    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0068FF] text-sm font-semibold text-white transition hover:ring-4 hover:ring-blue-100"
  >
    {userName.charAt(0).toUpperCase()}
  </button>

  {profileMenuOpen && (
    <div className="absolute right-0 top-12 z-50 w-48 overflow-hidden rounded-xl border border-[#E2E8F0] bg-white py-2 shadow-xl">
      <div className="border-b border-[#E2E8F0] px-4 py-3">
        <p className="truncate text-sm font-semibold text-[#0F172A]">
          {userName}
        </p>
        <p className="mt-1 text-xs text-[#64748B]">
          My account
        </p>
      </div>

      <button
        type="button"
        onClick={() => {
          setProfileMenuOpen(false);
          navigate("/dashboard");
        }}
        className="w-full px-4 py-2.5 text-left text-sm text-[#334155] hover:bg-[#F1F5F9]"
      >
        Profile
      </button>

      <button
        type="button"
        onClick={handleLogout}
        className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
      >
        Logout
      </button>
    </div>
  )}
</div>

          </div>
        </header>

        <div className="flex min-h-0 min-w-0 flex-1">
          <aside
            className="hidden h-full w-[76px] shrink-0 overflow-y-auto md:block lg:w-[220px] bg-[#062C5F]/90 border-r border-white/10">
           <div className="flex flex-col items-stretch pt-6 px-2 lg:px-3 gap-2">
  <button
    title="Home"
    onClick={() => navigate("/dashboard")}
    className="flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-1 lg:gap-3 rounded-xl bg-white/15 text-white px-2 py-3 lg:px-3"
  >
    <FiHome className="w-5 h-5 shrink-0" />
    <span className="text-[11px] lg:text-sm">Home</span>
  </button>

  <button
    title="Meetings"
    onClick={() => navigate("/calendar")}
    className="flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-1 lg:gap-3 rounded-xl text-white/70 hover:bg-white/10 hover:text-white px-2 py-3 lg:px-3 transition"
  >
    <FiCalendar className="w-5 h-5 shrink-0" />
    <span className="text-[11px] lg:text-sm">Meetings</span>
  </button>

  <button
    title="Saved Items"
    onClick={() => navigate("/saved-items")}
    className="flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-1 lg:gap-3 rounded-xl text-white/70 hover:bg-white/10 hover:text-white px-2 py-3 lg:px-3 transition"
  >
    <FiBookmark className="w-5 h-5 shrink-0" />
    <span className="text-[11px] lg:text-sm">Saved Items</span>
  </button>
 
<button
  title="AI Assistant"
  onClick={() => navigate("/ai-assistant")}
  className="flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-1 lg:gap-3 rounded-xl text-white/70 hover:bg-white/10 hover:text-white px-2 py-3 lg:px-3 transition"
>
  <FiCpu className="w-5 h-5 shrink-0" />
  <span className="text-[11px] lg:text-sm">AI Assistant</span>
</button>

  <button
    title="Organizations"
    onClick={() => navigate("/organization")}
    className="flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-1 lg:gap-3 rounded-xl text-white/70 hover:bg-white/10 hover:text-white px-2 py-3 lg:px-3 transition"
  >
    <FiUsers className="w-5 h-5 shrink-0" />
    <span className="text-[11px] lg:text-sm">Organizations</span>
  </button>

  <button
    title="Chat"
    onClick={() => navigate("/chat")}
    className="flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-1 lg:gap-3 rounded-xl text-white/70 hover:bg-white/10 hover:text-white px-2 py-3 lg:px-3 transition"
  >
    <FiMessageCircle className="w-5 h-5 shrink-0" />
    <span className="text-[11px] lg:text-sm">Chat</span>
  </button>

  <button
    title="Communities"
    onClick={() => navigate("/communities")}
    className="flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-1 lg:gap-3 rounded-xl text-white/70 hover:bg-white/10 hover:text-white px-2 py-3 lg:px-3 transition"
  >
    <FiGlobe className="w-5 h-5 shrink-0" />
    <span className="text-[11px] lg:text-sm">Communities</span>
  </button>
</div>
          </aside>
          <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-y-contain px-3 pb-24 pt-4 sm:px-5 sm:pb-8 sm:pt-6 lg:px-8 lg:pt-8">

            <div className="max-w-[1180px] mx-auto">
              <section
                className="min-h-[105px] rounded-xl border border-white/10 bg-[#1F5A91]/80 px-4 py-5 shadow-[0_8px_25px_rgba(0,0,0,0.08)] sm:px-6 lg:px-7 flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h1 className="text-white text-[18px] sm:text-[20px] font-semibold">
                    Welcome back, {userName}
                  </h1>
                  <p className="text-white/60 text-[12px] sm:text-[13px] mt-2">
                    Here's what's happening with your workspace today.
                  </p>
 <div className="mt-5 flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
  <input
    type="text"
    value={meetingCode}
    onChange={(e) => setMeetingCode(e.target.value)}
    placeholder="Enter meeting code"
    className="w-full min-w-0 flex-1 rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/60 outline-none focus:border-white/50 sm:w-auto"
  />

  <button
    type="button"
    onClick={handleJoinMeeting}
    className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#062C5F] hover:bg-blue-50"
  >
    Join Meeting
  </button>

  <button
    type="button"
    onClick={handleNewMeeting}
    disabled={creatingMeeting}
    className="rounded-lg bg-[#0068FF] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#005BE0] disabled:opacity-60"
  >
    {creatingMeeting ? "Creating..." : "+ New Meeting"}
  </button>
</div>

{meetingError && (
  <p className="mt-3 text-sm text-red-200">
    {meetingError}
  </p>
)}


</div>
   </section>
   <DashboardOverview
  upcomingEvents={upcomingEvents}
  upcomingLoading={upcomingLoading}
  upcomingError={upcomingError}
/>

            </div>
          </main>

{/* Mobile Navigation */}
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
          {[
            { label: "Home", icon: FiHome, path: "/dashboard" },
            { label: "Meetings", icon: FiCalendar, path: "/calendar" },
            { label: "Saved Items", icon: FiBookmark, path: "/saved-items" },
            { label: "AI Assistant", icon: FiCpu, path: "/ai-assistant" },
            { label: "Organizations", icon: FiUsers, path: "/organization" },
            { label: "Chat", icon: FiMessageCircle, path: "/chat" },
            { label: "Communities", icon: FiGlobe, path: "/communities" },
          ].map(({ label, icon: Icon, path }) => (
            <button
              key={path}
              type="button"
              onClick={() => {
                setMobileMoreOpen(false);
                navigate(path);
              }}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-white/90 transition hover:bg-white/10"
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
    {[
      { label: "Home", icon: FiHome, path: "/dashboard" },
      { label: "Meetings", icon: FiCalendar, path: "/calendar" },
      { label: "Saved", icon: FiBookmark, path: "/saved-items" },
      { label: "Chat", icon: FiMessageCircle, path: "/chat" },
    ].map(({ label, icon: Icon, path }) => (
      <button
        key={path}
        type="button"
        onClick={() => navigate(path)}
        className="flex min-w-0 flex-col items-center gap-1 rounded-lg px-1 py-2 text-[10px] text-white/80 transition hover:bg-white/10"
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

        </div>
      </div>
    </div>
  );
}

export default Dashboard;