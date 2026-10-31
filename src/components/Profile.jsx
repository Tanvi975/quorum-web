
import React, { useState } from "react";

const Profile = ({ user = {}, onSave, onBack }) => {
  const [name, setName] = useState(user.name || user.fullName || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const email = user.email || "";
  const isVerified = user.isEmailVerified ?? user.verified ?? false;

  const firstLetter = (name || email || "U").trim().charAt(0).toUpperCase();

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : "Not available";

  const handleSave = async () => {
    if (!onSave) {
      setMessage("Profile API is not connected yet.");
      return;
    }

    if (!name.trim()) {
      setMessage("Please enter your name.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      await onSave({
        name: name.trim(),
      });

      setMessage("Profile updated successfully!");
    } catch (error) {
      setMessage(error.message || "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden text-white"
      style={{
        backgroundColor: "#062C5F",
        backgroundImage: `
          linear-gradient(
            to bottom,
            #213F70 0%,
            #315A8A 35%,
            #506D9A 65%,
            #7698C5 100%
          )
        `,
        backgroundRepeat: "no-repeat",
        backgroundSize: "100% 100%",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-white/20 bg-[#213F70]/50 px-4 py-5 backdrop-blur-sm sm:px-6 md:px-12">
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-2xl text-white transition hover:bg-white/10 hover:text-[#D5E6FA]"
        >
          ←
        </button>

        <div>
          <h1 className="text-lg font-semibold tracking-wide">
            PROFILE
          </h1>
          <p className="text-xs text-[#D5E2F2]">
            Manage your personal information
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 sm:py-10 md:px-8">

        <div className="mb-7">
          <p className="mb-2 text-xs font-semibold tracking-[3px] text-[#D5E6FA]">
            ACCOUNT PROFILE
          </p>

          <h2 className="text-2xl font-semibold text-white sm:text-3xl">
            Your Profile
          </h2>

          <p className="mt-2 text-sm text-[#E0EAF6]">
            View and manage your Quorum account details.
          </p>
        </div>

        {/* Profile Card */}
        <div
          className="grid w-full grid-cols-1 gap-3 overflow-hidden rounded-2xl border border-white/25 p-3 shadow-2xl md:grid-cols-[280px_minmax(0,1fr)] md:gap-4 md:p-4"
          style={{
            backgroundColor: "rgba(220, 232, 246, 0.16)",
            backdropFilter: "blur(5px)",
            WebkitBackdropFilter: "blur(5px)",
          }}
        >
          {/* Left: Avatar and Basic Details */}
          <div
            className="flex min-w-0 flex-col items-center justify-center rounded-xl px-4 py-8 text-center sm:py-10"
            style={{
              backgroundColor: "rgba(220, 232, 246, 0.18)",
            }}
          >
            {/* Initial Avatar */}
            <div className="mb-5 flex h-28 w-28 items-center justify-center rounded-full border-4 border-white/40 bg-[#315A8A] text-5xl font-bold text-white shadow-lg sm:h-36 sm:w-36 sm:text-6xl">
              {firstLetter}
            </div>

            <h3 className="max-w-full break-words text-xl font-semibold text-white sm:text-2xl">
              {name || "Your Name"}
            </h3>

            <p className="mt-2 max-w-full break-all text-sm text-[#E0EAF6]">
              {email}
            </p>

            <div className="mt-7 flex items-center gap-2 text-sm">
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                  isVerified ? "bg-emerald-400" : "bg-amber-300"
                }`}
              />

              <span className="text-white">
                {isVerified ? "Verified Account" : "Email Not Verified"}
              </span>
            </div>
          </div>

          {/* Right: Account Details */}
          <div
            className="min-w-0 rounded-xl border border-white/20 p-4 sm:p-6 md:p-8"
            style={{
              backgroundColor: "rgba(220, 232, 246, 0.20)",
            }}
          >
            <div className="mb-5">
              <p className="text-xs font-semibold tracking-[2px] text-[#E0EAF6]">
                PERSONAL INFORMATION
              </p>

              <h3 className="mt-2 text-xl font-semibold text-white sm:text-2xl">
                Account Details
              </h3>
            </div>

            {/* Full Name */}
            <div className="grid min-w-0 gap-2 border-b border-white/25 py-5 sm:grid-cols-[35%_1fr] sm:items-center">
              <label
                htmlFor="profile-name"
                className="text-sm text-white"
              >
                Full Name
              </label>

              <input
                id="profile-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full min-w-0 border-b border-transparent bg-transparent py-2 text-white outline-none transition placeholder:text-white/60 focus:border-white"
              />
            </div>

            {/* Email */}
            <div className="grid min-w-0 gap-2 border-b border-white/25 py-5 sm:grid-cols-[35%_1fr] sm:items-center">
              <label
                htmlFor="profile-email"
                className="text-sm text-white"
              >
                Email Address
              </label>

              <input
                id="profile-email"
                type="email"
                value={email}
                readOnly
                className="w-full min-w-0 bg-transparent py-2 text-white/80 outline-none"
              />
            </div>

            {/* Verification */}
            <div className="grid min-w-0 gap-2 border-b border-white/25 py-5 sm:grid-cols-[35%_1fr] sm:items-center">
              <span className="text-sm text-white">
                Account Status
              </span>

              <span
                className={
                  isVerified
                    ? "font-semibold text-emerald-100"
                    : "font-semibold text-amber-100"
                }
              >
                {isVerified ? "✓ Verified" : "Not Verified"}
              </span>
            </div>

            {/* Member Since */}
            <div className="grid min-w-0 gap-2 py-5 sm:grid-cols-[35%_1fr] sm:items-center">
              <span className="text-sm text-white">
                Member Since
              </span>

              <span className="text-white">
                {memberSince}
              </span>
            </div>

            {/* Feedback */}
            {message && (
              <p
                role="status"
                className="mt-3 break-words text-sm text-white"
              >
                {message}
              </p>
            )}

            {/* Save Button */}
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-lg bg-[#315A8A] px-7 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#213F70] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-white/80">
          Your account information is managed securely by Quorum.
        </p>
      </div>
    </div>
  );
};

export default Profile;
