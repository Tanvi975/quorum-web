
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
import { getProfile } from "../services/profileService";
import {
  updateUserStatus,
  resetUserStatus,
} from "../services/presenceService";
const dashboardStatusOptions = [
  { value: "AVAILABLE", label: "Available", color: "#22C55E" },
  { value: "BUSY", label: "Busy", color: "#EF4444" },
  { value: "DO_NOT_DISTURB", label: "Do Not Disturb", color: "#DC2626" },
  { value: "BE_RIGHT_BACK", label: "Be Right Back", color: "#F59E0B" },
  { value: "AWAY", label: "Appear Away", color: "#F59E0B" },
];

const dashboardStatusDurations = [
  { label: "30 minutes", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "4 hours", value: 240 },
  { label: "Never", value: null },
];
function Dashboard() {
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [upcomingLoading, setUpcomingLoading] = useState(true);
  const [upcomingError, setUpcomingError] = useState("");

  const { user, logout } = useAuth();
  const [currentUser, setCurrentUser] = useState(user || {});

useEffect(() => {
  setCurrentUser(user || {});
}, [user]);

useEffect(() => {
  let active = true;

  getProfile()
    .then((profile) => {
      if (active && profile) {
        setCurrentUser(profile);
      }
    })
    .catch((error) => {
      console.error("Profile fetch failed:", error);
    });

  return () => {
    active = false;
  };
}, []);
  const navigate = useNavigate();

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
const [selectedStatus, setSelectedStatus] = useState("AVAILABLE");
const [statusMessage, setStatusMessage] = useState("");
const [statusDuration, setStatusDuration] = useState(60);
const [savingStatus, setSavingStatus] = useState(false);
const [statusError, setStatusError] = useState("");
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
  async function handleUpdateDashboardStatus() {
    setSavingStatus(true);
    setStatusError("");
  
    try {
      await updateUserStatus({
        status: selectedStatus,
        statusMessage: statusMessage.trim(),
        clearAfterMinutes: statusDuration,
      });
  
      setCurrentUser((previous) => ({
        ...previous,
        status: selectedStatus,
        statusMessage: statusMessage.trim(),
      }));
  
      setShowStatusPicker(false);
    } catch (error) {
      setStatusError(
        error?.response?.data?.message || "Unable to update status."
      );
    } finally {
      setSavingStatus(false);
    }
  }
  
  async function handleResetDashboardStatus() {
    setSavingStatus(true);
    setStatusError("");
  
    try {
      await resetUserStatus();
  
      setSelectedStatus("AVAILABLE");
      setStatusMessage("");
      setStatusDuration(60);
  
      setCurrentUser((previous) => ({
        ...previous,
        status: "AVAILABLE",
        statusMessage: "",
      }));
  
      setShowStatusPicker(false);
    } catch (error) {
      setStatusError(
        error?.response?.data?.message || "Unable to reset status."
      );
    } finally {
      setSavingStatus(false);
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

  const userName = currentUser?.name || "Karan";

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
  className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-[#65A7FF]/50 bg-[#2878D5] text-sm font-semibold text-white transition hover:ring-4 hover:ring-[#2878D5]/25"
>
  {currentUser?.avatar ? (
    <img
      src={currentUser.avatar}
      alt="Profile"
      className="h-full w-full object-cover"
    />
  ) : (
    userName.charAt(0).toUpperCase()
  )}
</button>

    {profileMenuOpen && (
     <div className="absolute right-0 top-12 z-50 w-72 overflow-hidden rounded-xl border border-[#355574] bg-[#142B45] py-2 shadow-2xl shadow-black/40">
        <div className="border-b border-[#355574] px-4 py-3">
          <p className="truncate text-sm font-semibold text-white">
            {userName}
          </p>
          <p className="mt-1 text-xs text-[#A9BED6]">
            My account
          </p>
          <button
  type="button"
  onClick={() => setShowStatusPicker((open) => !open)}
  className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[#24476B]"
>
  <span
    className="h-2.5 w-2.5 rounded-full"
    style={{
      backgroundColor:
        dashboardStatusOptions.find(
          (item) => item.value === selectedStatus
        )?.color || "#22C55E",
    }}
  />
  <span className="flex-1 text-sm text-white">
    Set Status
  </span>
  <span className="text-xs text-[#A9BED6]">
    {showStatusPicker ? "▲" : "▼"}
  </span>
</button>

{showStatusPicker && (
  <div className="border-y border-[#355574] px-4 py-3">
    <div className="space-y-1">
      {dashboardStatusOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setSelectedStatus(option.value)}
          className={`flex w-full items-center gap-2 whitespace-nowrap rounded-lg px-2 py-2 text-left text-sm ${
            selectedStatus === option.value
              ? "bg-[#24476B] text-white"
              : "text-[#D8E7F8] hover:bg-[#24476B]"
          }`}
        >
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: option.color }}
          />
          {option.label}
        </button>
      ))}
    </div>

    <input
      type="text"
      maxLength={100}
      value={statusMessage}
      onChange={(event) => setStatusMessage(event.target.value)}
      placeholder="What's your status?"
      className="mt-3 w-full rounded-lg border border-[#355574] bg-[#0E2238] px-3 py-2 text-sm text-white outline-none placeholder:text-[#7891AD]"
    />

    <select
      value={statusDuration === null ? "never" : statusDuration}
      onChange={(event) =>
        setStatusDuration(
          event.target.value === "never"
            ? null
            : Number(event.target.value)
        )
      }
      className="mt-3 w-full rounded-lg border border-[#355574] bg-[#0E2238] px-3 py-2 text-sm text-white"
    >
      {dashboardStatusDurations.map((item) => (
        <option
          key={item.label}
          value={item.value === null ? "never" : item.value}
        >
          {item.label}
        </option>
      ))}
    </select>

    {statusError && (
      <p className="mt-2 text-xs text-red-400">{statusError}</p>
    )}

    <button
      type="button"
      disabled={savingStatus}
      onClick={handleUpdateDashboardStatus}
      className="mt-3 w-full rounded-lg bg-[#2878D5] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
    >
      {savingStatus ? "Updating..." : "Update Status"}
    </button>

    <button
      type="button"
      disabled={savingStatus}
      onClick={handleResetDashboardStatus}
      className="mt-2 w-full rounded-lg border border-[#355574] px-3 py-2 text-sm text-[#D8E7F8] disabled:opacity-50"
    >
      Reset to Default
    </button>
  </div>
)}
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
            <section
  data-tour="welcome"
  className="flex min-h-[105px] flex-col items-stretch justify-between gap-4 rounded-xl border border-[#355D83] bg-[#173B60]/95 px-4 py-5 shadow-[0_10px_35px_rgba(0,0,0,0.22)] sm:flex-row sm:items-center sm:px-6 lg:px-7"
>
                <div className="min-w-0 flex-1">
                  <h1 className="text-[18px] font-semibold text-white sm:text-[20px]">
                    Welcome back, {userName}
                  </h1>

                  <p className="mt-2 text-[12px] text-[#BDD0E6] sm:text-[13px]">
                    Here's what's happening with your workspace today.
                  </p>

                  <div className="mt-5 grid w-full grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-center">

<input
  type="text"
  value={meetingCode}
  onChange={(e) => setMeetingCode(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === "Enter") handleJoinMeeting();
  }}
  placeholder="Enter meeting code"
  className="w-full min-w-0 rounded-lg border border-[#52789E] bg-[#102D4B] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#9EB5CF] focus:border-[#55A0FF] focus:ring-2 focus:ring-[#3988F5]/25 sm:w-auto sm:flex-1"
/>

<button
  type="button"
  onClick={handleJoinMeeting}
  className="w-full rounded-lg border border-[#6484A5] bg-[#E5EEF9] px-5 py-3 text-sm font-semibold text-[#173B60] transition hover:bg-white sm:w-auto"
>
  Join Meeting
</button>

<div className="grid grid-cols-2 gap-2 sm:contents">
  <button
    type="button"
    onClick={handleNewMeeting}
    disabled={creatingMeeting}
    className="w-full rounded-lg bg-[#2878E8] px-3 py-3 text-sm font-semibold text-white shadow-md shadow-blue-950/30 transition hover:bg-[#3D8BFA] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-5"
  >
    {creatingMeeting ? "Creating..." : "+ New Meeting"}
  </button>

  <button
    type="button"
    onClick={() => navigate("/meeting-history")}
    className="inline-flex w-full items-center justify-center rounded-lg border border-[#6484A5] bg-[#173B60] px-3 py-3 text-sm font-semibold text-white transition hover:bg-[#244F78] sm:w-auto sm:px-5"
  >
    Meeting History
  </button>
</div>
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
