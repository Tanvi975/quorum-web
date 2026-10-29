
import {
    FaArrowLeft,
    FaTimes,
    FaSignOutAlt,
    FaPhoneSlash,
    FaTrashAlt,
    FaExclamationTriangle,
    FaUsers,
    FaShieldAlt,
  } from "react-icons/fa";
  
  const DIALOG_CONFIG = {
    logout: {
      icon: FaSignOutAlt,
      defaultTitle: "Log out of Quorum?",
      defaultMessage:
        "Your work and meeting history are saved. You can sign back in whenever you're ready.",
      confirmText: "Log out",
      variant: "primary",
    },
    leave: {
      icon: FaPhoneSlash,
      defaultTitle: "Leave this meeting?",
      defaultMessage:
        "The meeting will continue for the other participants. You can rejoin from All Meetings.",
      confirmText: "Leave meeting",
      variant: "primary",
    },
    delete: {
      icon: FaTrashAlt,
      defaultTitle: "Delete this item?",
      defaultMessage:
        "Are you sure you want to delete this item? This action cannot be undone.",
      confirmText: "Delete",
      variant: "danger",
    },
  };
  
  function getInitials(name = "") {
    const parts = name.trim().split(/\s+/).filter(Boolean);
  
    if (!parts.length) return "?";
  
    return parts
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("");
  }
  
  export default function ConfirmDialog({
    open,
    type = "delete",
    title,
    message,
    confirmText,
    cancelText = "Cancel",
    loading = false,
    onConfirm,
    onCancel,
    onBack,
  
    userName = "",
    userEmail = "",
    avatarUrl = "",
  
    detailTitle = "",
    detailSubtitle = "",
    detailIcon: DetailIcon = FaUsers,
  
    showOrganizerWarning = false,
    warningTitle = "Organizer only",
    warningMessage = "",
    onEndForEveryone,
    endingForEveryone = false,
  }) {
    if (!open) return null;
  
    const config = DIALOG_CONFIG[type] || DIALOG_CONFIG.delete;
    const ActionIcon = config.icon;
  
    const heading = title || config.defaultTitle;
    const description = message || config.defaultMessage;
    const actionLabel = confirmText || config.confirmText;
  
    const isDanger = config.variant === "danger";
  
    const buttonClass = isDanger
    ? "border border-white/30 bg-white/10 text-red-300 hover:bg-white/20 hover:text-red-200"
    : "bg-gradient-to-r from-[#0066FF] to-[#0148B3] hover:brightness-110";
  
    const hasProfile = Boolean(userName || userEmail || avatarUrl);
    const hasDetails = Boolean(detailTitle || detailSubtitle);
  
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#0B0F19]/75 p-4 backdrop-blur-sm"
        onMouseDown={(event) => {
          if (
            event.target === event.currentTarget &&
            !loading &&
            !endingForEveryone
          ) {
            onCancel?.();
          }
        }}
      >
        <section
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          aria-describedby="confirm-dialog-message"
          className="relative my-auto w-full max-w-[595px] overflow-hidden rounded-[22px] border border-white/20 bg-gradient-to-br from-[#253F5B] via-[#3C6087] to-[#506D91] p-5 text-[#EDEFF7] shadow-2xl shadow-black/40 sm:p-7 md:p-9"
        >
          <div className="mb-6 flex items-center justify-between">
            <button
              type="button"
              onClick={onBack || onCancel}
              disabled={loading || endingForEveryone}
              aria-label="Go back"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-[#C6EAFF] transition hover:bg-white/20 disabled:opacity-50"
            >
              <FaArrowLeft />
            </button>
  
            <button
              type="button"
              onClick={onCancel}
              disabled={loading || endingForEveryone}
              aria-label="Close dialog"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[#B6C6D9] transition hover:bg-white/10 hover:text-white disabled:opacity-50"
            >
              <FaTimes />
            </button>
          </div>
  
          <div
            className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border ${
              isDanger
                ? "border-red-300/25 bg-red-500/10 text-red-200"
                : "border-[#38BDF8]/25 bg-[#38BDF8]/10 text-[#C6EAFF]"
            }`}
          >
            <ActionIcon className="text-xl" />
          </div>

          <h2
            id="confirm-dialog-title"
            className="text-2xl font-semibold tracking-tight text-white sm:text-[28px]"
          >
            {heading}
          </h2>
  
          <p
            id="confirm-dialog-message"
            className="mt-3 max-w-xl text-sm leading-6 text-[#D0DEEE] sm:text-base"
          >
            {description}
          </p>
  

          {hasProfile && (
            <div className="mt-6 flex min-w-0 items-center gap-3 rounded-2xl border border-white/[0.06] bg-[#142F50]/55 p-4">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={userName ? `${userName}'s profile` : "User profile"}
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                    event.currentTarget.nextElementSibling?.classList.remove(
                      "hidden"
                    );
                  }}
                  className="h-12 w-12 shrink-0 rounded-full border border-white/20 object-cover"
                />
              ) : null}
  
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#38BDF8]/30 bg-[#38BDF8]/15 text-base font-semibold text-[#D8F0FF] ${
                  avatarUrl ? "hidden" : ""
                }`}
              >
                {getInitials(userName || userEmail || "User")}
              </div>
  
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white sm:text-base">
                  {userName || "Your account"}
                </p>
  
                {userEmail && (
                  <p className="mt-1 truncate text-sm text-[#B6C6D9]">
                    {userEmail}
                  </p>
                )}
              </div>
            </div>
          )}
  
          {hasDetails && (
            <div className="mt-6 flex min-w-0 items-center gap-3 rounded-2xl border border-white/[0.06] bg-[#142F50]/55 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#B6D9F5]">
                <DetailIcon className="text-lg" />
              </div>
  
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {detailTitle}
                </p>
                {detailSubtitle && (
                  <p className="mt-1 text-sm leading-5 text-[#B6C6D9]">
                    {detailSubtitle}
                  </p>
                )}
              </div>
            </div>
          )}
  
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading || endingForEveryone}
              className="min-h-12 rounded-xl border border-white/20 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
            >
              {cancelText}
            </button>
  
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading || endingForEveryone}
              className={`min-h-12 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-black/10 transition disabled:cursor-not-allowed disabled:opacity-60 sm:text-base ${buttonClass}`}
            >
              {loading ? "Please wait..." : actionLabel}
            </button>
          </div>
  
          {showOrganizerWarning && (
            <div className="mt-5 rounded-2xl border border-red-300/20 bg-red-500/[0.05] p-4 sm:p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-red-200">
                <FaShieldAlt />
                {warningTitle}
              </div>
  
              <p className="mt-2 text-sm font-medium text-red-100">
                End meeting for everyone
              </p>
  
              <p className="mt-1 text-sm leading-5 text-[#C4D2E3]">
                {warningMessage ||
                  "Only the meeting organizer can end the call for all participants. Leaving does not stop the meeting."}
              </p>
  
              {onEndForEveryone && (
                <button
                  type="button"
                  onClick={onEndForEveryone}
                  disabled={loading || endingForEveryone}
                  className="mt-4 min-h-10 rounded-xl border border-red-300/25 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-500/20 disabled:opacity-50"
                >
                  {endingForEveryone
                    ? "Ending meeting..."
                    : "End meeting for everyone"}
                </button>
              )}
            </div>
          )}
        </section>
      </div>
    );
  }
  