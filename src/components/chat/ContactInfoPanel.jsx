import React from "react";

const USE_CASE_LABELS = {
  ORGANIZATION: "Organization",
  FREELANCE: "Freelance",
  HIRE_COLLABORATE: "Hire & Collaborate",
  COMMUNITY: "Community",
};

function formatDate(value, options) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleString("en-US", options);
}

function DetailRow({ label, value }) {
  return (
    <div className="border-b border-white/15 py-3 last:border-0">
      <p className="mb-1 text-[10px] font-medium text-white/55">
        {label}
      </p>
      <p className="break-words text-xs text-[#E6EDF5]">
        {value || "Not available"}
      </p>
    </div>
  );
}

export default function ContactInfoPanel({
  contact = {},
  name = "User",
  avatar = "",
  presence = "Offline",
}) {
  const profilePhoto =
  (typeof avatar === "string" && avatar) ||
  (typeof contact.profilePicture === "string" && contact.profilePicture) ||
  contact.profilePicture?.url ||
  (typeof contact.avatar === "string" && contact.avatar) ||
  contact.avatar?.url ||
  contact.avatarUrl ||
  contact.profileImageUrl ||
  contact.photoUrl ||
  "";
  const email = contact.email;
  const role = contact.role || contact.userRole;

  const isVerified =
    contact.isEmailVerified ??
    contact.verified;

  const isOnboarded = contact.isOnboarded;

  const memberSince = formatDate(contact.createdAt, {
    month: "short",
    year: "numeric",
  });

  const lastLogin = formatDate(
    contact.lastLogin || contact.lastLoginAt,
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );

  const useCases = Array.isArray(contact.useCases)
    ? contact.useCases
    : [];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
      <div className="flex flex-col items-center border-b border-white/20 pb-5 text-center">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-[#AAB5C5] text-xl font-semibold text-[#172A40]">
        {profilePhoto ? (
  <img
    src={profilePhoto}
    alt={`${name} profile`}
    className="h-full w-full rounded-full object-cover"
  />
) : (
  name.charAt(0).toUpperCase()
)}
        </div>

        <h3 className="mt-3 break-words text-sm font-semibold text-white">
          {name}
        </h3>

        <p className="mt-1 text-[11px] text-white/65">
          {presence}
        </p>
      </div>

      <section>
        <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-[1px] text-white/60">
          Contact details
        </h4>

        <DetailRow label="Name" value={name} />
        <DetailRow label="Email" value={email} />
        <DetailRow label="Role" value={role} />
      </section>

      <section className="border-t border-white/15 pt-3">
        <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-[1px] text-white/60">
          Account information
        </h4>

        <DetailRow
          label="Account Status"
          value={
            isVerified === undefined
              ? "Not available"
              : isVerified
                ? "Verified"
                : "Not Verified"
          }
        />

        <DetailRow
          label="Onboarding Status"
          value={
            isOnboarded === undefined
              ? "Not available"
              : isOnboarded
                ? "Completed"
                : "Pending"
          }
        />

        <DetailRow
          label="Member Since"
          value={memberSince}
        />

        <DetailRow
          label="Last Login"
          value={lastLogin}
        />
      </section>

      <section className="border-t border-white/15 pt-3">
        <h4 className="mb-3 text-[10px] font-semibold uppercase tracking-[1px] text-white/60">
          Collaboration Interests
        </h4>

        {useCases.length ? (
          <div className="flex flex-wrap gap-2">
            {useCases.map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] text-white/85"
              >
                {USE_CASE_LABELS[item] || item}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-white/50">
            No collaboration interests available.
          </p>
        )}
      </section>
    </div>
  );
}