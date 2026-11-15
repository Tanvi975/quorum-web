
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiUser } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { getProfile } from "../services/profileService";
import {
  updateUserStatus,
  resetUserStatus,
} from "../services/presenceService";
import ConfirmDialog from "./ConfirmDialog";

const statusOptions = [
  { value: "AVAILABLE", label: "Available", color: "#22C55E" },
  { value: "BUSY", label: "Busy", color: "#EF4444" },
  {
    value: "DO_NOT_DISTURB",
    label: "Do Not Disturb",
    color: "#DC2626",
  },
  {
    value: "BE_RIGHT_BACK",
    label: "Be Right Back",
    color: "#F59E0B",
  },
  { value: "AWAY", label: "Appear Away", color: "#F59E0B" },
];

const durations = [
  { label: "30 minutes", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "4 hours", value: 240 },
  { label: "Never", value: null },
];

export default function ProfileMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(user || {});
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("AVAILABLE");
  const [statusMessage, setStatusMessage] = useState("");
  const [duration, setDuration] = useState(60);
  const [savingStatus, setSavingStatus] = useState(false);
  const [statusError, setStatusError] = useState("");
  const menuRef = useRef(null);

  useEffect(() => {
    setCurrentUser(user || {});
  }, [user]);

  useEffect(() => {
    let active = true;

    getProfile()
      .then((profile) => {
        if (active && profile) {
          setCurrentUser(profile);

          if (profile.status) {
            setSelectedStatus(profile.status);
          }

          if (profile.statusMessage) {
            setStatusMessage(profile.statusMessage);
          }
        }
      })
      .catch((error) => {
        console.error("Profile fetch failed:", error);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
        setShowStatusPicker(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setShowStatusPicker(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function confirmLogout() {
    setShowLogoutDialog(false);

    try {
      await logout();
    } finally {
      navigate("/login", { replace: true });
    }
  }

  async function handleUpdateStatus() {
    setSavingStatus(true);
    setStatusError("");

    try {
      await updateUserStatus({
        status: selectedStatus,
        statusMessage: statusMessage.trim(),
        clearAfterMinutes: duration,
      });

      setCurrentUser((previous) => ({
        ...previous,
        status: selectedStatus,
        statusMessage: statusMessage.trim(),
      }));

      setShowStatusPicker(false);
      setMenuOpen(false);
    } catch (error) {
      setStatusError(
        error?.response?.data?.message || "Unable to update status."
      );
    } finally {
      setSavingStatus(false);
    }
  }

  async function handleResetStatus() {
    setSavingStatus(true);
    setStatusError("");

    try {
      await resetUserStatus();

      setSelectedStatus("AVAILABLE");
      setStatusMessage("");
      setDuration(60);

      setCurrentUser((previous) => ({
        ...previous,
        status: "AVAILABLE",
        statusMessage: "",
      }));

      setShowStatusPicker(false);
      setMenuOpen(false);
    } catch (error) {
      setStatusError(
        error?.response?.data?.message || "Unable to reset status."
      );
    } finally {
      setSavingStatus(false);
    }
  }

  const userName = currentUser?.name || "User";
  const avatar = currentUser?.avatar;
  const activeStatus =
    statusOptions.find((item) => item.value === selectedStatus) ||
    statusOptions[0];

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Open profile menu"
          aria-expanded={menuOpen}
          className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-[#65A7FF]/50 bg-[#2878D5] text-sm font-semibold text-white transition hover:ring-4 hover:ring-[#2878D5]/25"
        >
          {avatar ? (
            <img
              src={avatar}
              alt="Profile"
              className="h-full w-full object-cover"
            />
          ) : (
            userName.charAt(0).toUpperCase()
          )}

          <span
            className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#142B45]"
            style={{ backgroundColor: activeStatus.color }}
          />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-12 z-[100] w-64 overflow-hidden rounded-xl border border-[#355574] bg-[#142B45] py-2 shadow-2xl shadow-black/40">
            <div className="border-b border-[#355574] px-4 py-3">
              <p className="truncate text-sm font-semibold text-white">
                {userName}
              </p>
              <p className="mt-1 text-xs text-[#A9BED6]">My account</p>
            </div>

            <button
              type="button"
              onClick={() => setShowStatusPicker((open) => !open)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[#24476B]"
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: activeStatus.color }}
              />
              <span className="flex-1">
                <span className="block text-sm text-white">
                  {activeStatus.label}
                </span>
                <span className="block text-xs text-[#A9BED6]">
                  Set your status
                </span>
              </span>
              <span className="text-xs text-[#A9BED6]">
                {showStatusPicker ? "▲" : "▼"}
              </span>
            </button>

            {showStatusPicker && (
              <div className="border-y border-[#355574] px-4 py-3">
                <p className="mb-2 text-xs font-semibold text-[#A9BED6]">
                  SET STATUS
                </p>

                <div className="space-y-1">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSelectedStatus(option.value)}
                      className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition ${
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

                <label className="mb-1 mt-3 block text-xs text-[#A9BED6]">
                  Status message
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={statusMessage}
                  onChange={(event) => setStatusMessage(event.target.value)}
                  placeholder="What's your status?"
                  className="w-full rounded-lg border border-[#355574] bg-[#0E2238] px-3 py-2 text-sm text-white outline-none placeholder:text-[#7891AD] focus:border-[#65A7FF]"
                />
                <p className="mt-1 text-right text-xs text-[#7891AD]">
                  {statusMessage.length}/100
                </p>

                <label className="mb-1 mt-2 block text-xs text-[#A9BED6]">
                  Clear status after
                </label>
                <select
                  value={duration === null ? "never" : duration}
                  onChange={(event) =>
                    setDuration(
                      event.target.value === "never"
                        ? null
                        : Number(event.target.value)
                    )
                  }
                  className="w-full rounded-lg border border-[#355574] bg-[#0E2238] px-3 py-2 text-sm text-white outline-none focus:border-[#65A7FF]"
                >
                  {durations.map((item) => (
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
                  onClick={handleUpdateStatus}
                  className="mt-3 w-full rounded-lg bg-[#2878D5] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#3589E8] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingStatus ? "Updating..." : "Update Status"}
                </button>

                <button
                  type="button"
                  disabled={savingStatus}
                  onClick={handleResetStatus}
                  className="mt-2 w-full rounded-lg border border-[#355574] px-3 py-2 text-sm text-[#D8E7F8] transition hover:bg-[#24476B] disabled:opacity-50"
                >
                  Reset to Default
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                navigate("/profile");
              }}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-[#D8E7F8] transition hover:bg-[#24476B]"
            >
              <FiUser size={15} />
              Profile
            </button>

            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setShowLogoutDialog(true);
              }}
              className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-300 transition hover:bg-red-500/10"
            >
              Logout
            </button>
          </div>
        )}
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
    </>
  );
}
