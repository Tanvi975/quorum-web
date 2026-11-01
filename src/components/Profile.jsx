
import React, { useEffect, useRef, useState } from "react";
import {
  FaArrowLeft,
  FaCamera,
  FaSpinner,
  FaUser,
} from "react-icons/fa";

import {
  getProfile,
  updateProfile,
  uploadProfileAvatar,
} from "../services/profileService";

const USE_CASE_OPTIONS = [
  { value: "ORGANIZATION", label: "Organization" },
  { value: "FREELANCE", label: "Freelance" },
  { value: "HIRE_COLLABORATE", label: "Hire & Collaborate" },
  { value: "COMMUNITY", label: "Community" },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const Profile = ({ user = {}, onSave, onBack }) => {
  const fileInputRef = useRef(null);
  const previewUrlRef = useRef(null);

  const [profile, setProfile] = useState(user);
  const [name, setName] = useState(
    user.name || user.fullName || ""
  );
  const [useCases, setUseCases] = useState(
    Array.isArray(user.useCases) ? user.useCases : []
  );

  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(user.avatar || "");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const email = profile.email || user.email || "";
  const role = profile.role || user.role || "Member";

  const isVerified =
    profile.isEmailVerified ??
    profile.verified ??
    user.isEmailVerified ??
    user.verified ??
    false;

  const isOnboarded = profile.isOnboarded ?? false;

  const firstLetter = (
    name ||
    email ||
    "U"
  ).trim().charAt(0).toUpperCase();

  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : "Not available";

  const lastLogin = profile.lastLogin
    ? new Date(profile.lastLogin).toLocaleString()
    : "Not available";

  function showMessage(text, type = "success") {
    setMessage(text);
    setMessageType(type);
  }

  function clearPreviewUrl() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const data = await getProfile();

        if (!active || !data) return;

        setProfile(data);
        setName(data.name || "");
        setUseCases(
          Array.isArray(data.useCases) ? data.useCases : []
        );
        setPreview(data.avatar || "");
      } catch (error) {
        if (active) {
          showMessage(
            error?.response?.data?.message ||
              "Unable to load profile. Showing available account information.",
            "error"
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      active = false;
      clearPreviewUrl();
    };
  }, []);

  function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/gif",
    ];

    if (!allowedTypes.includes(file.type)) {
      showMessage(
        "Please select JPG, PNG, WEBP, HEIC or GIF image.",
        "error"
      );
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      showMessage("Image size must be under 10 MB.", "error");
      event.target.value = "";
      return;
    }

    clearPreviewUrl();

    const localUrl = URL.createObjectURL(file);
    previewUrlRef.current = localUrl;

    setSelectedFile(file);
    setPreview(localUrl);
    showMessage("Photo selected. Click Save Changes to upload.");
  }

  function toggleUseCase(value) {
    setUseCases((previous) =>
      previous.includes(value)
        ? previous.filter((item) => item !== value)
        : [...previous, value]
    );
  }

  async function handleSave() {
    if (!name.trim()) {
      showMessage("Please enter your name.", "error");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      let updatedUser;

      if (selectedFile) {
        updatedUser = await uploadProfileAvatar(selectedFile, {
          name: name.trim(),
          useCases,
          isOnboarded,
        });
      } else {
        updatedUser = await updateProfile({
          name: name.trim(),
          useCases,
          isOnboarded,
        });
      }

      if (!updatedUser) {
        throw new Error("Profile update response was empty.");
      }

      setProfile((previous) => ({
        ...previous,
        ...updatedUser,
      }));

      setName(updatedUser.name || name.trim());

      setUseCases(
        Array.isArray(updatedUser.useCases)
          ? updatedUser.useCases
          : useCases
      );

      setPreview(updatedUser.avatar || preview);
      setSelectedFile(null);

      clearPreviewUrl();

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      if (onSave) {
        await onSave(updatedUser);
      }

      showMessage("Profile updated successfully!");
    } catch (error) {
      showMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to update profile.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

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

   
        <div
          className="grid w-full grid-cols-1 gap-3 overflow-hidden rounded-2xl border border-white/25 p-3 shadow-2xl md:grid-cols-[280px_minmax(0,1fr)] md:gap-4 md:p-4"
          style={{
            backgroundColor: "rgba(220, 232, 246, 0.16)",
            backdropFilter: "blur(5px)",
            WebkitBackdropFilter: "blur(5px)",
          }}
        >
      
          <div
            className="flex min-w-0 flex-col items-center justify-center rounded-xl px-4 py-8 text-center sm:py-10"
            style={{
              backgroundColor: "rgba(220, 232, 246, 0.18)",
            }}
          >
    
            <div className="relative mb-5">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white/40 bg-[#315A8A] text-5xl font-bold text-white shadow-lg sm:h-36 sm:w-36 sm:text-6xl">
                {preview ? (
                  <img
                    src={preview}
                    alt="Profile"
                    className="h-full w-full object-cover"
                    onError={() => {
                      if (!selectedFile) setPreview("");
                    }}
                  />
                ) : (
                  firstLetter
                )}
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={saving}
                title="Upload profile photo"
                aria-label="Upload profile photo"
                className="absolute bottom-1 right-1 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/50 bg-[#315A8A] text-white shadow-md transition hover:bg-[#213F70] disabled:opacity-50"
              >
                <FaCamera />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.heic,.gif,image/jpeg,image/png,image/webp,image/heic,image/gif"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={saving}
              className="mb-4 rounded-lg border border-white/30 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
            >
              Change Profile Photo
            </button>

            <p className="mb-4 text-xs text-[#E0EAF6]">
              JPG, PNG, WEBP, HEIC or GIF · Max 10 MB
            </p>

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
                onChange={(event) => setName(event.target.value)}
                placeholder="Enter your full name"
                maxLength={100}
                className="w-full min-w-0 border-b border-transparent bg-transparent py-2 text-white outline-none transition placeholder:text-white/60 focus:border-white"
              />
            </div>


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

            <div className="grid min-w-0 gap-2 border-b border-white/25 py-5 sm:grid-cols-[35%_1fr] sm:items-center">
              <span className="text-sm text-white">Role</span>
              <span className="text-white capitalize">{role}</span>
            </div>

  
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

            <div className="grid min-w-0 gap-2 border-b border-white/25 py-5 sm:grid-cols-[35%_1fr] sm:items-center">
              <span className="text-sm text-white">
                Onboarding Status
              </span>

              <span className="text-white">
                {isOnboarded ? "Completed" : "Pending"}
              </span>
            </div>

            <div className="grid min-w-0 gap-2 border-b border-white/25 py-5 sm:grid-cols-[35%_1fr] sm:items-center">
              <span className="text-sm text-white">
                Member Since
              </span>

              <span className="text-white">{memberSince}</span>
            </div>
            <div className="grid min-w-0 gap-2 border-b border-white/25 py-5 sm:grid-cols-[35%_1fr] sm:items-center">
              <span className="text-sm text-white">
                Last Login
              </span>

              <span className="break-words text-sm text-white">
                {lastLogin}
              </span>
            </div>

            <div className="border-b border-white/25 py-5">
              <p className="mb-4 text-sm font-medium text-white">
                Collaboration Interests
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {USE_CASE_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex min-w-0 items-center gap-2 text-sm text-white"
                  >
                    <input
                      type="checkbox"
                      checked={useCases.includes(option.value)}
                      onChange={() => toggleUseCase(option.value)}
                      disabled={saving}
                      className="h-4 w-4 shrink-0 accent-[#315A8A]"
                    />

                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
            {message && (
              <p
                role="status"
                aria-live="polite"
                className={`mt-4 break-words text-sm ${
                  messageType === "error"
                    ? "text-amber-200"
                    : "text-white"
                }`}
              >
                {message}
              </p>
            )}
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#315A8A] px-7 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#213F70] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {saving && <FaSpinner className="animate-spin" />}
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
