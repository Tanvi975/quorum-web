import { useMemo, useState } from "react";
import {
  FaChevronDown,
  FaEdit,
  FaEllipsisH,
  FaEnvelope,
  FaSearch,
  FaShieldAlt,
  FaTimes,
  FaTrash,
} from "react-icons/fa";

const ROLE_LABELS = {
  ORG_ADMIN: "Organization admin",
  ADMIN: "Admin",
  TEAM_HEAD: "Team head",
  MEMBER: "Member",
};

function roleLabel(role) {
  const key = String(role || "MEMBER").toUpperCase();
  return ROLE_LABELS[key] || key.replaceAll("_", " ");
}

function getMemberId(member) {
  const user = member.user || {};
  return member.userId || user._id || user.id || member._id || member.id || member.email;
}

function getMemberName(member) {
  const user = member.user || {};
  return member.name || user.name || member.email || "Member";
}

function getMemberEmail(member) {
  const user = member.user || {};
  return member.email || user.email || "";
}

function getMemberRole(member) {
  const user = member.user || {};
  return String(member.role || user.role || "MEMBER").toUpperCase();
}

function initials(name = "") {
  return (
    name
      .trim()
      .split(/[\s@]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "U"
  );
}

function invitedOn(invite) {
  const raw = invite.createdAt || invite.invitedAt || invite.created_at;
  if (!raw) {
    return "";
  }
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

const card = "rounded-2xl border border-[#38BDF8]/20 bg-[#305485]/50";
const badge =
  "shrink-0 rounded-full border border-[#38BDF8]/25 bg-[#38BDF8]/[0.08] px-2.5 py-1 text-xs font-medium text-[#C6EAFF]";
const rolePill =
  "shrink-0 rounded-lg border border-[#B6C6D9]/25 bg-white/[0.08] px-3 py-1.5 text-xs font-medium text-[#EDEFF7]";
const gradientButton =
  "inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#38BDF8]/30 bg-[linear-gradient(90deg,#0066FF,#0148B3)] px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-blue-950/30 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]";

export default function OrganizationOverview({
  organization,
  members = [],
  invitations = [],
  currentRole = "MEMBER",
  currentUserId,
  loading = false,
  onChangeRole,
  onEditMember,
  onRemoveMember,
  onViewAllMembers,
  onCancelInvitation,
  onResendInvitation,
  onOpenWebsite,
}) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [openMenuId, setOpenMenuId] = useState("");

  const filteredMembers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return members.filter((member) => {
      const name = getMemberName(member).toLowerCase();
      const memberEmail = getMemberEmail(member).toLowerCase();
      const matchesSearch =
        !term || name.includes(term) || memberEmail.includes(term);
      const matchesRole =
        roleFilter === "ALL" || getMemberRole(member) === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [members, search, roleFilter]);

  const activeMembers = members.length;
  const adminCount = members.filter((member) => {
    const memberRole = getMemberRole(member);
    return memberRole === "ORG_ADMIN" || memberRole === "ADMIN";
  }).length;
  const orgWebsite = organization && organization.website ? organization.website : "";
  const hasMemberMenu =
    typeof onEditMember === "function" || typeof onRemoveMember === "function";

  const stats = [
    { label: "Active members", value: activeMembers },
    { label: "Workspace admins", value: adminCount },
    { label: "Pending invitations", value: invitations.length },
  ];

  function openWebsite() {
    if (typeof onOpenWebsite === "function") {
      onOpenWebsite(orgWebsite);
      return;
    }
    const url = orgWebsite.startsWith("http") ? orgWebsite : `https://${orgWebsite}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="w-full min-w-0 space-y-5 text-[#EDEFF7]">

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`${card} flex items-center gap-3 px-4 py-4 sm:px-5`}
          >
            <span className="text-3xl font-semibold leading-none text-white">
              {loading ? "—" : stat.value}
            </span>
            <span className="text-sm text-[#B6C6D9]">{stat.label}</span>
          </div>
        ))}
      </div>

      <div className="grid min-w-0 grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-5">
          <section className={`${card} min-w-0 p-4 sm:p-5`}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-white">Members</h3>
              <span className={badge}>
                {loading ? "—" : `${activeMembers} ${activeMembers === 1 ? "member" : "members"}`}
              </span>
            </div>

            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="flex min-h-10 min-w-0 flex-1 items-center gap-2 rounded-full border border-[#B6C6D9]/25 bg-[#0B0F19]/60 px-4 focus-within:border-[#38BDF8]">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search members..."
                  aria-label="Search members"
                  className="w-full min-w-0 bg-transparent text-sm text-[#EDEFF7] outline-none placeholder:text-[#A4A5AF]"
                />
                <FaSearch className="shrink-0 text-sm text-[#B6C6D9]" />
              </label>

              <div className="relative shrink-0 sm:w-40">
                <select
                  aria-label="Filter by role"
                  value={roleFilter}
                  onChange={(event) => setRoleFilter(event.target.value)}
                  className="min-h-10 w-full appearance-none rounded-lg border border-[#38BDF8]/30 bg-[linear-gradient(90deg,#0066FF,#0148B3)] py-2 pl-4 pr-10 text-sm font-medium text-white outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
                >
                  <option value="ALL" className="bg-[#212F44]">All roles</option>
                  <option value="ORG_ADMIN" className="bg-[#212F44]">Organization admin</option>
                  <option value="ADMIN" className="bg-[#212F44]">Admin</option>
                  <option value="TEAM_HEAD" className="bg-[#212F44]">Team head</option>
                  <option value="MEMBER" className="bg-[#212F44]">Member</option>
                </select>
                <FaChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-white" />
              </div>
            </div>

            <div className="mb-1 flex items-center justify-between px-3 text-[11px] font-medium tracking-wide text-[#A4A5AF] sm:px-4">
              <span>Member</span>
              <span className={hasMemberMenu ? "sm:pr-12" : ""}>Role</span>
            </div>

            {loading ? (
              <div className="rounded-xl bg-white/[0.04] p-10 text-center text-sm text-[#B6C6D9]">
                Loading members...
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="rounded-xl bg-white/[0.04] px-4 py-9 text-center">
                <p className="font-medium text-white">
                  {members.length ? "No matching members" : "No members yet"}
                </p>
                <p className="mt-1 text-sm text-[#B6C6D9]">
                  {members.length
                    ? "Try another search or role filter."
                    : "Members will appear here when they join the organization."}
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {filteredMembers.map((member) => {
                  const name = getMemberName(member);
                  const memberEmail = getMemberEmail(member);
                  const memberRole = getMemberRole(member);
                  const id = getMemberId(member);
                  const rowKey = String(id || `${name}-${memberEmail}`);
                  const avatar = member.avatar || (member.user && member.user.avatar);
                  const isYou =
                    Boolean(currentUserId) && String(id) === String(currentUserId);

                  return (
                    <div
                      key={rowKey}
                      className="flex min-w-0 items-center gap-3 rounded-xl bg-white/[0.04] px-3 py-3 transition hover:bg-white/[0.08] sm:px-4"
                    >
                      {avatar ? (
                        <img
                          src={avatar}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded-full border border-[#B6C6D9]/30 object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#38BDF8]/25 bg-[#38BDF8]/10 text-xs font-semibold text-[#C6EAFF]">
                          {initials(name)}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">
                          {name}
                          {isYou && (
                            <span className="ml-1.5 font-normal text-[#B6C6D9]">(You)</span>
                          )}
                        </p>
                        <p className="truncate text-xs text-[#A4A5AF]">
                          {memberEmail || "No email provided"}
                        </p>
                        <p className="mt-0.5 text-xs text-[#C6EAFF] sm:hidden">
                          {roleLabel(memberRole)}
                        </p>
                      </div>

                      {typeof onChangeRole === "function" && memberRole !== "ORG_ADMIN" ? (
  <select
    aria-label={`Change role for ${name}`}
    value={memberRole}
    onChange={(event) => onChangeRole(id, event.target.value)}
    className="hidden max-w-40 rounded-lg border border-[#B6C6D9]/25 bg-[#212F44] px-2 py-1.5 text-xs text-white outline-none focus:border-[#38BDF8] sm:block"
  >
    <option value="ADMIN">Admin</option>
    <option value="TEAM_HEAD">Team head</option>
    <option value="MEMBER">Member</option>
  </select>
) : (
  <span className={`${rolePill} hidden sm:inline-flex`}>
    {roleLabel(memberRole)}
  </span>
)}
                          
                       {hasMemberMenu &&
                      !isYou &&
                       memberRole !== "ORG_ADMIN" &&
                        currentRole === "ORG_ADMIN" && ( 
                        <div className="relative shrink-0">
                          <button
                            type="button"
                            aria-label={`More options for ${name}`}
                            onClick={() =>
                              setOpenMenuId(openMenuId === rowKey ? "" : rowKey)
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#B6C6D9] transition hover:bg-white/10 hover:text-white"
                          >
                            <FaEllipsisH />
                          </button>
                          {openMenuId === rowKey && (
                            <>
                              <button
                                type="button"
                                aria-label="Close menu"
                                className="fixed inset-0 z-20 cursor-default"
                                onClick={() => setOpenMenuId("")}
                              />
                              <div className="absolute right-0 top-10 z-30 w-48 rounded-xl border border-[#B6C6D9]/20 bg-[#212F44] p-2 shadow-2xl shadow-black/40">
                                {typeof onEditMember === "function" && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuId("");
                                      onEditMember(member);
                                    }}
                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[#E2E8F0] transition hover:bg-[#38BDF8]/15 hover:text-white"
                                  >
                                    <FaEdit />
                                    Edit member
                                  </button>
                                )}
                                {typeof onRemoveMember === "function" && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuId("");
                                      onRemoveMember(member);
                                    }}
                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-300 transition hover:bg-red-500/15"
                                  >
                                    <FaTrash />
                                    Remove member
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {typeof onViewAllMembers === "function" && !loading && members.length > 0 && (
              <div className="mt-3 text-center">
                <button
                  type="button"
                  onClick={onViewAllMembers}
                  className="text-sm font-medium text-[#C6EAFF] transition hover:text-white"
                >
                  View all members
                </button>
              </div>
            )}
          </section>

          <section className={`${card} min-w-0 p-4 sm:p-5`}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-white">Pending invitations</h3>
              <span className={badge}>{loading ? "—" : `${invitations.length} pending`}</span>
            </div>

            {loading ? (
              <p className="rounded-xl bg-white/[0.04] p-4 text-center text-sm text-[#B6C6D9]">
                Loading invitations...
              </p>
            ) : invitations.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[#B6C6D9]/25 p-4 text-center text-sm text-[#B6C6D9]">
                No pending invitations.
              </p>
            ) : (
              <div className="space-y-1.5">
                {invitations.map((invite) => {
                  const inviteId = invite.id || invite._id;
                  const date = invitedOn(invite);
                  const detail =
                    roleLabel(invite.role) +
                    (date ? ` · Invited ${date}` : "") +
                    (invite.status ? ` · ${invite.status}` : "");

                  return (
                    <div
                      key={inviteId || invite.email}
                      className="flex min-w-0 items-center gap-3 rounded-xl bg-white/[0.04] px-3 py-3 sm:px-4"
                    >
                      <FaEnvelope className="shrink-0 text-[#B6C6D9]" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-white">{invite.email}</p>
                        <p className="mt-0.5 truncate text-xs text-[#A4A5AF]">{detail}</p>
                      </div>
                      {typeof onResendInvitation === "function" && (
                        <button
                          type="button"
                          onClick={() => onResendInvitation(inviteId)}
                          className="shrink-0 text-xs font-medium text-[#C6EAFF] transition hover:text-white"
                        >
                          Resend
                        </button>
                      )}
                      {typeof onCancelInvitation === "function" && (
                        <button
                          type="button"
                          aria-label={`Cancel invitation for ${invite.email}`}
                          onClick={() => onCancelInvitation(inviteId)}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#B6C6D9] transition hover:bg-white/10 hover:text-white"
                        >
                          <FaTimes />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <div className="min-w-0 space-y-5">
          <section className={`${card} p-4 sm:p-5`}>
            <h3 className="mb-4 text-base font-semibold text-white">Workspace details</h3>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-[#A4A5AF]">Organization website</p>
                <p className="mt-1 break-all text-sm font-medium text-[#EDEFF7]">
                  {orgWebsite || "Not provided"}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#A4A5AF]">Your role</p>
                <p className="mt-1 flex items-center gap-2 text-sm font-medium text-[#EDEFF7]">
                  <FaShieldAlt className="text-xs text-[#C6EAFF]" />
                  {roleLabel(currentRole)}
                </p>
              </div>
            </div>

            {orgWebsite && (
              <div className="mt-5">
                <p className="mb-3 text-xs text-[#B6C6D9]">
                  Visit your organization's website in a new tab.
                </p>
                <button type="button" onClick={openWebsite} className={gradientButton}>
                  Visit the website
                </button>
              </div>
            )}
          </section>

          <section className={`${card} p-4 sm:p-5`}>
            <FaShieldAlt className="mb-3 text-lg text-[#C6EAFF]" />
            <h3 className="text-base font-semibold text-white">Manage access safely</h3>
            <p className="mt-2 text-sm leading-6 text-[#B6C6D9]">
              Admins can invite people and manage member roles. The workspace
              owner controls ownership and organization settings.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
