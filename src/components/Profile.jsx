
import React, { useRef, useState } from "react";

const Profile = ({ user = {}, onSave, onBack }) => {
  const fileInputRef = useRef(null);

  const [name, setName] = useState(user.name || user.fullName || "");
  const [photo, setPhoto] = useState(
    user.profilePhoto || user.avatar || ""
  );
  const [selectedFile, setSelectedFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const email = user.email || "";
  const isVerified = user.isEmailVerified ?? user.verified ?? false;

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : "Not available";

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Please select a valid image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("Image must be smaller than 5 MB.");
      return;
    }

    setSelectedFile(file);
    setPhoto(URL.createObjectURL(file));
    setMessage("");
  };

  const handleSave = async () => {
    if (!onSave) {
      setMessage("Profile API is not connected yet.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      await onSave({
        name: name.trim(),
        profilePhoto: selectedFile,
      });

      setSelectedFile(null);
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
      <div className="flex items-center gap-5 border-b border-white/20 bg-[#213F70]/50 px-6 py-5 backdrop-blur-sm md:px-12">
        <button
          onClick={onBack}
          className="text-3xl text-white transition hover:text-[#D5E6FA]"
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
      <div className="mx-auto max-w-6xl px-5 py-10 md:px-8">

        <div className="mb-7">
          <p className="mb-2 text-xs font-semibold tracking-[3px] text-[#D5E6FA]">
            ACCOUNT PROFILE
          </p>

          <h2 className="text-3xl font-semibold text-white">
            Your Profile
          </h2>

          <p className="mt-2 text-sm text-[#E0EAF6]">
            View and manage your Quorum account details.
          </p>
        </div>

        {/* Profile Card */}
        <div
          className="grid overflow-hidden rounded-2xl border border-white/25 p-3 shadow-2xl md:grid-cols-[300px_1fr] md:gap-4 md:p-4"
          style={{
            backgroundColor: "rgba(220, 232, 246, 0.16)",
            backdropFilter: "blur(5px)",
            WebkitBackdropFilter: "blur(5px)",
          }}
        >

          {/* Left: Profile Photo */}
          <div
            className="flex flex-col items-center justify-center rounded-xl px-5 py-10 text-center"
            style={{
              backgroundColor: "rgba(220, 232, 246, 0.18)",
            }}
          >
            <div className="relative mb-5">

              {photo ? (
                <img
                  src={photo}
                  alt="Profile"
                  className="h-36 w-36 rounded-full border-4 border-white/40 object-cover"
                />
              ) : (
                <div className="flex h-36 w-36 items-center justify-center rounded-full border-4 border-white/40 bg-[#315A8A] text-5xl font-bold text-white">
                  {(name || email || "U").charAt(0).toUpperCase()}
                </div>
              )}

              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1 right-0 flex h-10 w-10 items-center justify-center rounded-full border-4 border-[#506D9A] bg-[#315A8A] text-2xl font-bold text-white transition hover:bg-[#213F70]"
                title="Change profile photo"
              >
                +
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handlePhotoChange}
              />
            </div>

            <h3 className="text-2xl font-semibold text-white">
              {name || "Your Name"}
            </h3>

            <p className="mt-2 break-all text-sm text-[#E0EAF6]">
              {email}
            </p>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-6 rounded-lg border border-white/40 bg-[#315A8A]/70 px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#213F70]"
            >
              Upload / Change Photo
            </button>

            <div className="mt-7 flex items-center gap-2 text-sm">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
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
            className="rounded-xl border border-white/20 p-6 md:p-8"
            style={{
              backgroundColor: "rgba(220, 232, 246, 0.20)",
            }}
          >
            <div className="mb-5 flex items-center justify-between">

              <div>
                <p className="text-xs font-semibold tracking-[2px] text-[#E0EAF6]">
                  PERSONAL INFORMATION
                </p>

                <h3 className="mt-2 text-2xl font-semibold text-white">
                  Account Details
                </h3>
              </div>

            </div>

            {/* Full Name */}
            <div className="grid gap-2 border-b border-white/25 py-5 sm:grid-cols-[35%_1fr] sm:items-center">

              <label className="text-sm text-white">
                Full Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full border-b border-transparent bg-transparent py-2 text-white outline-none transition placeholder:text-white/60 focus:border-white"
              />
            </div>

            {/* Email */}
            <div className="grid gap-2 border-b border-white/25 py-5 sm:grid-cols-[35%_1fr] sm:items-center">

              <label className="text-sm text-white">
                Email Address
              </label>

              <input
                type="email"
                value={email}
                readOnly
                className="w-full bg-transparent py-2 text-white/80 outline-none"
              />
            </div>

            {/* Verification */}
            <div className="grid gap-2 border-b border-white/25 py-5 sm:grid-cols-[35%_1fr] sm:items-center">

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
            <div className="grid gap-2 py-5 sm:grid-cols-[35%_1fr] sm:items-center">

              <span className="text-sm text-white">
                Member Since
              </span>

              <span className="text-white">
                {memberSince}
              </span>
            </div>

            {message && (
              <p className="mt-3 text-sm text-white">
                {message}
              </p>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-[#315A8A] px-7 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#213F70] disabled:cursor-not-allowed disabled:opacity-60"
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
