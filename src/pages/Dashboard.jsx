import { useAuth } from "../context/AuthContext";
import DashboardBackground from "../components/DashboardBackground";
import {FiHome, FiCalendar, FiBookmark, FiUsers, FiMessageCircle, FiGlobe, FiCpu} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { createMeeting } from "../services/meetingService";
import { useState, useEffect, useRef } from "react";
import NotificationBell from "../components/NotificationBell";

function Dashboard() {
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
      error.response?.data?.message || error.message || "Could not create meeting."
    );
  } finally {
    setCreatingMeeting(false);
  }
}

function handleJoinMeeting() {
  const code = meetingCode.trim();

  if (!code) {
    setMeetingError("Please enter a meeting code.");
    return;
  }

  setMeetingError("");
  navigate(`/video-call?code=${encodeURIComponent(code)}`);
}

  const userName = user?.name || "Karan";

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#062C5F]">
      <DashboardBackground />

      <div className="relative z-10 min-h-screen">
        <header className="h-[64px] bg-white border-b border-[#E5E7EB] flex items-center justify-between px-6 lg:px-10">
          <div className="text-[#062C5F] font-bold text-[18px] tracking-wide">
            QUORUM
          </div>
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

         
<div className="flex flex-wrap items-center gap-2">
  <input
    type="text"
    value={meetingCode}
    onChange={(e) => setMeetingCode(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === "Enter") handleJoinMeeting();
    }}
    placeholder="Enter meeting code"
    aria-label="Meeting code"
    className="w-36 sm:w-44 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#334155] outline-none focus:border-[#0068FF]"
  />

  <button
    onClick={handleJoinMeeting}
    className="rounded-lg bg-[#0B8FD8] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#087FBF]"
  >
    Join Meeting
  </button>

  <button
    onClick={handleNewMeeting}
    disabled={creatingMeeting}
    className="hidden sm:block rounded-lg bg-[#0068FF] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#005BE0] disabled:opacity-60"
  >
    {creatingMeeting ? "Creating..." : "+ New Meeting"}
  </button>
</div>

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

        <div className="flex">
          <aside
            className="
            hidden md:block
            w-[76px]
            lg:w-[220px]
              min-h-[calc(100vh-64px)]
              bg-[#062C5F]/90
              border-r border-white/10
            "
          >
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
    onClick={() => navigate("/dashboard")}
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
          <main className="flex-1 px-5 sm:px-8 lg:px-12 py-8">

            <div className="max-w-[1180px] mx-auto">
              <section
                className="
                  h-[105px]
                  rounded-[10px]
                  bg-[#1F5A91]/80
                  border border-white/10
                  shadow-[0_8px_25px_rgba(0,0,0,0.08)]
                  px-7
                  flex
                  items-center
                  justify-between
                "
              >
                <div>
                  <h1 className="text-white text-[18px] sm:text-[20px] font-semibold">
                    Welcome back, {userName}
                  </h1>

                  <p className="text-white/60 text-[12px] sm:text-[13px] mt-2">
                    Here's what's happening with your workspace today.
                  </p>
                </div>

                <div className="hidden sm:block text-white/50 text-xs">
                  2 upcoming syncs today
                </div>
              </section>
              <section className="grid grid-cols-1 lg:grid-cols-[1fr_330px] gap-5 mt-5">
                <div
                  className="
                    min-h-[360px]
                    bg-white/90
                    backdrop-blur-sm
                    rounded-[8px]
                    border border-white/60
                    shadow-[0_10px_35px_rgba(0,0,0,0.08)]
                    p-6
                  "
                >
                  <div className="flex items-center justify-between mb-5">

                    <h2 className="text-[#062C5F] font-semibold text-[16px]">
                      Upcoming Meetings
                    </h2>

                    <button className="text-[#0068FF] text-xs font-medium">
                      View all
                    </button>

                  </div>
                  <div className="h-[275px] rounded-lg border border-[#EEF2F7] flex items-center justify-center">
                    <p className="text-[#94A3B8] text-sm">
                      No upcoming meetings
                    </p>
                  </div>
                </div>
                <div
                  className="
                    min-h-[360px]
                    bg-white/90
                    backdrop-blur-sm
                    rounded-[8px]
                    border border-white/60
                    shadow-[0_10px_35px_rgba(0,0,0,0.08)]
                    p-6
                  "
                >
                  <div className="flex items-center justify-between mb-5">

                    <h2 className="text-[#062C5F] font-semibold text-[16px]">
                      AI Meeting Summaries
                    </h2>

                  </div>

                  <div className="h-[275px] rounded-lg border border-[#EEF2F7] flex items-center justify-center">
                    <p className="text-[#94A3B8] text-sm text-center">
                      No summaries available
                    </p>
                  </div>
                </div>

              </section>

            </div>
          </main>

        </div>
      </div>
    </div>
  );
}

export default Dashboard;