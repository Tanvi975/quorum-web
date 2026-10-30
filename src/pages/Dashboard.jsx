
import { useAuth } from "../context/AuthContext";
import DashboardBackground from "../components/DashboardBackground";
import {
  FiHome,
  FiCalendar,
  FiBookmark,
  FiUsers,
  FiMessageCircle,
  FiGlobe,
  FiCpu,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { createMeeting } from "../services/meetingService";
import { useState, useEffect, useRef } from "react";
import NotificationBell from "../components/NotificationBell";
import { getUpcomingEvents } from "../services/calendarService";
import DashboardOverview from "../components/DashboardOverview";
import ConfirmDialog from "../components/ConfirmDialog";

function Dashboard() {
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [upcomingLoading, setUpcomingLoading] = useState(true);
  const [upcomingError, setUpcomingError] = useState("");

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const profileMenuRef = useRef(null);

  const [creatingMeeting, setCreatingMeeting] = useState(false);
  const [meetingError, setMeetingError] = useState("");
  const [meetingCode, setMeetingCode] = useState("");

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
            "The upcoming meetings failed to load."
        );
      } finally {
        setUpcomingLoading(false);
      }
    }

    loadUpcomingEvents();
  }, []);

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
    setShowLogoutDialog(true);
  }


  async function confirmLogout() {
    setShowLogoutDialog(false);
  
    try {
      await logout();
    } finally {
      navigate("/login", { replace: true });
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

  async function handleNewMeeting() {
    try {
      setCreatingMeeting(true);
      setMeetingError("");

      const meeting = await createMeeting();

      if (!meeting?.code) {
        throw new Error("Meeting code was not found.");
      }

      navigate(
        `/video-call?code=${encodeURIComponent(meeting.code)}&host=1`
      );
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
    <div className="relative h-dvh overflow-hidden bg-[#0B1729] text-[#EAF2FF]">
      <DashboardBackground />

      <div className="relative z-10 flex h-dvh min-h-0 flex-col">

      <header className="sticky top-0 z-50 relative flex h-16 min-h-16 w-full shrink-0 items-center justify-between gap-3 border-b border-[#294766] bg-[#102A46] px-3 shadow-lg shadow-black/20 sm:px-5 lg:px-8">

<h1 className="absolute left-1/2 -translate-x-1/2 font-sans text-xl font-extrabold tracking-[0.18em] text-white transition hover:text-blue-200 sm:text-2xl">
  QUORUM
</h1>

<div className="ml-auto flex items-center gap-4">
  {meetingError && (
    <p className="text-sm text-red-300">{meetingError}</p>
  )}

  <NotificationBell />

  <div className="relative" ref={profileMenuRef}>
    <button
      type="button"
      onClick={() => setProfileMenuOpen((open) => !open)}
      aria-label="Open profile menu"
      aria-expanded={profileMenuOpen}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-[#65A7FF]/50 bg-[#2878D5] text-sm font-semibold text-white transition hover:ring-4 hover:ring-[#2878D5]/25"
    >
      {userName.charAt(0).toUpperCase()}
    </button>

    {profileMenuOpen && (
      <div className="absolute right-0 top-12 z-50 w-48 overflow-hidden rounded-xl border border-[#355574] bg-[#142B45] py-2 shadow-2xl shadow-black/40">
        <div className="border-b border-[#355574] px-4 py-3">
          <p className="truncate text-sm font-semibold text-white">
            {userName}
          </p>
          <p className="mt-1 text-xs text-[#A9BED6]">
            My account
          </p>
        </div>

        <button
  type="button"
  onClick={() => {
    setProfileMenuOpen(false);
    navigate("/profile");
  }}
  className="w-full px-4 py-2.5 text-left text-sm text-[#D8E7F8] transition hover:bg-[#24476B]"
>
  Profile
</button>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-300 transition hover:bg-red-500/10"
        >
          Logout
        </button>
      </div>
    )}
  </div>
</div>
</header>

        <div className="flex min-h-0 min-w-0 flex-1">
          <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-y-contain px-3 pb-24 pt-4 sm:px-5 sm:pb-8 sm:pt-6 lg:px-8 lg:pt-8">
            <div className="mx-auto max-w-[1180px]">
              {/* Welcome panel */}
              <section className="flex min-h-[105px] flex-col items-stretch justify-between gap-4 rounded-xl border border-[#355D83] bg-[#173B60]/95 px-4 py-5 shadow-[0_10px_35px_rgba(0,0,0,0.22)] sm:flex-row sm:items-center sm:px-6 lg:px-7">
                <div className="min-w-0 flex-1">
                  <h1 className="text-[18px] font-semibold text-white sm:text-[20px]">
                    Welcome back, {userName}
                  </h1>

                  <p className="mt-2 text-[12px] text-[#BDD0E6] sm:text-[13px]">
                    Here's what's happening with your workspace today.
                  </p>

                  <div className="mt-5 flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                    <input
                      type="text"
                      value={meetingCode}
                      onChange={(e) => setMeetingCode(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleJoinMeeting();
                      }}
                      placeholder="Enter meeting code"
                      className="w-full min-w-0 flex-1 rounded-lg border border-[#52789E] bg-[#102D4B] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#9EB5CF] focus:border-[#55A0FF] focus:ring-2 focus:ring-[#3988F5]/25 sm:w-auto"
                    />

                    <button
                      type="button"
                      onClick={handleJoinMeeting}
                      className="rounded-lg border border-[#6484A5] bg-[#E5EEF9] px-5 py-3 text-sm font-semibold text-[#173B60] transition hover:bg-white"
                    >
                      Join Meeting
                    </button>

                    <button
                      type="button"
                      onClick={handleNewMeeting}
                      disabled={creatingMeeting}
                      className="rounded-lg bg-[#2878E8] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-950/30 transition hover:bg-[#3D8BFA] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {creatingMeeting ? "Creating..." : "+ New Meeting"}
                    </button>
                  </div>

                  {meetingError && (
                    <p className="mt-3 text-sm text-red-300">
                      {meetingError}
                    </p>
                  )}
                </div>
              </section>
              <div className="mt-5">
                <DashboardOverview
                  upcomingEvents={upcomingEvents}
                  upcomingLoading={upcomingLoading}
                  upcomingError={upcomingError}
                />
              </div>
            </div>
          </main>
        </div>
      </div>
    
      <ConfirmDialog
        open={showLogoutDialog}
        type="logout"
        onCancel={() => setShowLogoutDialog(false)}
        onConfirm={confirmLogout}
        title="Log out of Quorum?"
        message="Are you sure you want to log out of your account?"
        confirmText="Log out"
        cancelText="Cancel"
      />

    </div>
  );
}

export default Dashboard;
