
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiUser } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { getProfile } from "../services/profileService";
import ConfirmDialog from "./ConfirmDialog";

export default function ProfileMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(user || {});
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
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
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setMenuOpen(false);
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

  const userName = currentUser?.name || "User";
  const avatar = currentUser?.avatar;

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Open profile menu"
          aria-expanded={menuOpen}
          className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-[#65A7FF]/50 bg-[#2878D5] text-sm font-semibold text-white transition hover:ring-4 hover:ring-[#2878D5]/25"
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
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-12 z-[100] w-48 overflow-hidden rounded-xl border border-[#355574] bg-[#142B45] py-2 shadow-2xl shadow-black/40">
            <div className="border-b border-[#355574] px-4 py-3">
              <p className="truncate text-sm font-semibold text-white">
                {userName}
              </p>
              <p className="mt-1 text-xs text-[#A9BED6]">My account</p>
            </div>

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
