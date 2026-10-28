import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import {
  FaArrowLeft,
  FaBuilding,
  FaUsers,
  FaUserPlus,
  FaPlus,
  FaEllipsisH,
  FaEdit,
  FaTrash,
  FaSearch,
  FaTimes,
  FaCheck,
  FaLayerGroup,
  FaSpinner,
} from "react-icons/fa";

import api from "../../services/api";
import OnboardingLayout from "../../components/OnboardingLayout";
import AddTeamMember from "./AddTeamMember";
import TeamChat from "./TeamChat";
import OrganizationOverview from "./OrganizationOverview";

const btn =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA] disabled:cursor-not-allowed disabled:opacity-50";

const primary =
  `${btn} border border-[#60A5FA]/40 bg-gradient-to-r from-[#1680FF] to-[#0057D9] text-white shadow-md shadow-blue-900/10 hover:brightness-105`;

const secondary =
  `${btn} border border-white/30 bg-white/15 text-white hover:bg-white/25`;

const input =
  "w-full min-w-0 rounded-xl border border-white/30 bg-white/15 px-3.5 py-3 text-sm text-white outline-none placeholder:text-white/65 transition focus:border-[#93C5FD] focus:ring-2 focus:ring-blue-300/25";

const card =
  "rounded-2xl border border-white/25 bg-white/[0.13] shadow-lg shadow-blue-950/10 backdrop-blur-xl";
const ROLE_LABELS = {
  ORG_ADMIN: "Organization admin",
  ADMIN: "Admin",
  TEAM_HEAD: "Team head",
  MEMBER: "Member",
};

function roleLabel(value) {
  const key = String(value || "MEMBER").toUpperCase();
  return ROLE_LABELS[key] || key.replaceAll("_", " ");
}

function items(data, key) {
  if (Array.isArray(data)) {
    return data;
  }
  if (Array.isArray(data?.[key])) {
    return data[key];
  }
  if (Array.isArray(data?.data?.[key])) {
    return data.data[key];
  }
  if (Array.isArray(data?.data)) {
    return data.data;
  }
  return [];
}

function errorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    "Something went wrong. Please try again."
  );
}
function initials(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U"
  );
}
function Modal({ title, description, close, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          close();
        }
      }}
    >
      <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-[#38BDF8]/25 bg-[#212F44] p-5 shadow-2xl shadow-black/40 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm text-[#B6C6D9]">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="rounded-lg p-2 text-[#B6C6D9] hover:bg-white/10 hover:text-white"
          >
            <FaTimes />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
function OrganizationWorkspace() {
  const { organizationId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTeamId = searchParams.get("teamId");
  const [organization, setOrganization] = useState(null);
  const [teams, setTeams] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("Overview");
  const [search, setSearch] = useState("");
  const [openMenu, setOpenMenu] = useState("");
  const [modal, setModal] = useState("");
  const [showAddTeamMember, setShowAddTeamMember] = useState(false);
  const [selectedChatTeam, setSelectedChatTeam] = useState(null);
  const [teamForm, setTeamForm] = useState({
    name: "",
    description: "",
  });
  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "MEMBER",
    teamId: "",
    teamRole: "MEMBER",
  });
  const [orgForm, setOrgForm] = useState({
    name: "",
    description: "",
    logo: "",
  });
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberRole, setMemberRole] = useState("MEMBER");
  const currentUser = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  const currentUserId =
    currentUser?.id || currentUser?._id || currentUser?.userId;

  const isOrganizationOwner =
    Boolean(currentUserId) &&
    String(organization?.ownerId) === String(currentUserId);

  const role = String(
    organization?.role ||
      organization?.userRole ||
      (isOrganizationOwner ? "ORG_ADMIN" : "MEMBER")
  ).toUpperCase();

  const canCreateTeam =
    role === "ORG_ADMIN" || role === "TEAM_HEAD";
  async function loadWorkspace(showLoader = true) {
    if (showLoader) {
      setLoading(true);
    }
    setError("");
    try {
      const [orgResult, teamResult, memberResult] =
        await Promise.allSettled([
          api.get(`/api/organizations/${organizationId}`),

          api.get(`/api/organizations/${organizationId}/teams`),

          api.get(`/api/organizations/${organizationId}/members`),
        ]);
      if (orgResult.status === "rejected") {
        throw orgResult.reason;
      }
      const data = orgResult.value.data;

      setOrganization(
        data?.organization ||
        data?.data?.organization ||
        data?.data ||
        data
      );
      if (teamResult.status === "fulfilled") {
        setTeams(items(teamResult.value.data, "teams"));
      } else {
        setTeams([]);
      }

      if (memberResult.status === "fulfilled") {
        setMembers(items(memberResult.value.data, "members"));
      } else {
        setMembers([]);
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (organizationId) {
      loadWorkspace();
    }
  }, [organizationId]);
  useEffect(() => {
    if (loading || !requestedTeamId || !teams.length) return;

    const matchedTeam = teams.find(
      (team) =>
        String(team._id || team.id) === String(requestedTeamId)
    );

    if (matchedTeam) {
      setActiveTab("Teams");
      setSelectedChatTeam(matchedTeam);
      setSearchParams({}, { replace: true });
    } else if (organization) {
      setError("Notification wali team is organization mein nahi mili.");
    }
  }, [
    loading,
    requestedTeamId,
    teams,
    organization,
    setSearchParams,
  ]);
  useEffect(() => {
    if (!notice) {
      return;
    }
    const timeout = setTimeout(() => {
      setNotice("");
    }, 3500);

    return () => {
      clearTimeout(timeout);
    };
  }, [notice]);
  function closeModal() {
    setModal("");
    setSelectedMember(null);
    setSaving(false);
  }
  function openOrgEdit() {
    setOrgForm({
      name: organization?.name || "",

      description: organization?.description || "",

      logo:
        organization?.logo ||
        organization?.logoUrl ||
        "",
    });

    setOpenMenu("");
    setModal("edit-org");
  }
  async function createTeam(event) {
    event.preventDefault();

    setSaving(true);

    try {
      await api.post(
        `/api/organizations/${organizationId}/teams`,
        {
          name: teamForm.name.trim(),
          description: teamForm.description.trim(),
        }
      );

      closeModal();

      setTeamForm({
        name: "",
        description: "",
      });

      setNotice("Team created successfully.");

      setActiveTab("Teams");

      await loadWorkspace(false);
    } catch (err) {
      setNotice(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }
  async function inviteMember(event) {
    event.preventDefault();

    if (!inviteForm.email.trim()) {
      setNotice("Please enter an email address.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        email: inviteForm.email.trim().toLowerCase(),
        expiresInDays: 7,
        maxUses: 1,
        ...(inviteForm.teamId
          ? {
              teamId: inviteForm.teamId,
              teamRole: inviteForm.teamRole,
            }
          : {
              role: inviteForm.role,
            }),
      };

      await api.post(
        `/api/organizations/${organizationId}/invites`,
        payload
      );

      closeModal();

      setInviteForm({
        email: "",
        role: "MEMBER",
        teamId: "",
        teamRole: "MEMBER",
      });

      setNotice("Invitation sent successfully.");

      await loadWorkspace(false);
    } catch (err) {
      setNotice(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }
  async function editOrganization(event) {
    event.preventDefault();

    setSaving(true);
    try {
      await api.patch(
        `/api/organizations/${organizationId}`,
        {
          name: orgForm.name.trim(),
          description: orgForm.description.trim(),
          logo: orgForm.logo.trim(),
        }
      );

      closeModal();

      setNotice("Organization updated successfully.");

      await loadWorkspace(false);
    } catch (err) {
      setNotice(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }
  async function editMember(event) {
    event.preventDefault();

    const id =
      selectedMember?.userId ||
      selectedMember?.user?._id ||
      selectedMember?.user?.id ||
      selectedMember?._id ||
      selectedMember?.id;

    if (!id) {
      return setNotice("Member ID is missing.");
    }

    setSaving(true);
    try {
      await api.patch(
        `/api/organizations/${organizationId}/members/${id}`,
        {
          role: memberRole,
        }
      );

      closeModal();
      setNotice("Member updated successfully.");
      await loadWorkspace(false);
    } catch (err) {
      setNotice(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }
  async function removeMember(member) {
    setOpenMenu("");

    const id =
      member?.userId ||
      member?.user?._id ||
      member?.user?.id ||
      member?._id ||
      member?.id;

    if (!id) {
      return setNotice("Member ID is missing.");
    }

    const name =
      member.name ||
      member.user?.name ||
      member.email ||
      "this member";

    const confirmed = window.confirm(
      `Remove ${name} from this organization?`
    );
    if (!confirmed) {
      return;
    }
    try {
      await api.delete(
        `/api/organizations/${organizationId}/members/${id}`
      );
      setNotice("Member removed successfully.");
      await loadWorkspace(false);
    } catch (err) {
      setNotice(errorMessage(err));
    }
  }
  function menu(id, options) {
    return (
      <div className="relative shrink-0">
        <button
          type="button"
          aria-label="More options"
          onClick={() => {
            setOpenMenu(openMenu === id ? "" : id);
          }}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#B6C6D9] transition hover:bg-white/10 hover:text-white"
        >
          <FaEllipsisH />
        </button>
        {openMenu === id && (
          <>
            <button
              type="button"
              aria-label="Close menu"
              className="fixed inset-0 z-20 cursor-default"
              onClick={() => setOpenMenu("")}
            />
            <div className="absolute right-0 top-10 z-30 w-52 rounded-xl border border-[#B6C6D9]/20 bg-[#212F44] p-2 shadow-2xl shadow-black/40">
              {options.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={option.onClick}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium transition ${
                    option.danger
                      ? "text-red-300 hover:bg-red-500/15"
                      : "text-[#E2E8F0] hover:bg-[#38BDF8]/15 hover:text-white"
                  }`}
                >
                  {option.icon}
                  {option.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }
  function teamRow(team) {
    const id = team._id || team.id || team.name;
    return (
      <div
        key={id} 
className="flex flex-col gap-3 rounded-xl border border-[#8BB9E8]/25 bg-[#315A83]/35 px-3 py-4 transition hover:border-[#8BB9E8]/45 hover:bg-[#315A83]/50 sm:flex-row sm:items-center sm:justify-between sm:px-4"
      >
        <div className="flex min-w-0 flex-1 basis-48 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#38BDF8]/25 bg-[#38BDF8]/10 text-[#C6EAFF]">
            <FaLayerGroup />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">
              {team.name || "Unnamed team"}
            </p>

            <p className="mt-1 truncate text-xs text-[#D0E1F3]">
              {team.description || "No description"}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
        <button
         onClick={() => setSelectedChatTeam(team)}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-[#38BDF8]/25 bg-[#38BDF8]/10 px-3 py-2 text-xs font-medium text-[#C6EAFF] transition hover:bg-[#38BDF8]/20 sm:text-sm"
          >
            Open Team Chat
          </button>
          {menu(`team-${id}`, [
            {
              label: "Edit team",
              icon: <FaEdit />,
              onClick: () => {
                setOpenMenu("");

                setNotice(
                  "Edit team UI is ready; connect the backend endpoint to save changes."
                );
              },
            },
            {
              label: "Delete team",
              icon: <FaTrash />,
              danger: true,
              onClick: () => {
                setOpenMenu("");

                setNotice(
                  "Delete team option is visible; connect the backend endpoint to delete this team."
                );
              },
            },
          ])}
        </div>
      </div>
    );
  }
  function memberRow(member) {
    const name =
      member.name ||
      member.user?.name ||
      "Member";

    const email =
      member.email ||
      member.user?.email ||
      "";

    const id =
      member.userId ||
      member.user?._id ||
      member.user?.id ||
      member._id ||
      member.id ||
      email;

    const currentMemberRole =
      member.role ||
      member.user?.role ||
      "MEMBER";
    const avatar =
      member.avatar ||
      member.user?.avatar;
    return (
      <div
        key={id}
        className="flex flex-col gap-3 rounded-xl border border-white/20 bg-[#062C52]/40 px-3 py-4 transition hover:bg-[#062C52]/90] sm:flex-row sm:items-center sm:justify-between sm:px-4"
      >
        <div className="flex min-w-0 items-center gap-3">
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              className="h-10 w-10 shrink-0 rounded-full border border-[#B6C6D9]/30 object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#38BDF8]/25 bg-[#38BDF8]/10 text-sm font-semibold text-[#C6EAFF]">
              {initials(name)}
            </div>
          )}

          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">
              {name}
            </p>

            <p className="mt-1 truncate text-xs text-[#A4A5AF]">
              {email}
            </p>

            <p className="mt-0.5 text-xs text-[#C6EAFF] sm:hidden">
              {roleLabel(currentMemberRole)}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden rounded-lg border border-[#B6C6D9]/25 bg-white/[0.08] px-3 py-1.5 text-xs font-medium text-[#EDEFF7] sm:inline-flex">
            {roleLabel(currentMemberRole)}
          </span>

          {menu(`member-${id}`, [
            {
              label: "Edit member",
              icon: <FaEdit />,
              onClick: () => {
                setSelectedMember(member);
                setMemberRole(currentMemberRole);
                setOpenMenu("");
                setModal("edit-member");
              },
            },
            {
              label: "Remove member",
              icon: <FaTrash />,
              danger: true,
              onClick: () => removeMember(member),
            },
          ])}
        </div>
      </div>
    );
  }

  const normalizedSearch = search.trim().toLowerCase();

  const filteredTeams = teams.filter((team) => {
    const teamDetails = `${team.name || ""} ${team.description || ""}`
      .toLowerCase();

    return teamDetails.includes(normalizedSearch);
  });

  const filteredMembers = members.filter((member) => {
    const memberDetails = [
      member.name,
      member.user?.name,
      member.email,
      member.user?.email,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return memberDetails.includes(normalizedSearch);
  });
  if (loading) {
    return (
      <OnboardingLayout>
        <div className="flex min-h-64 items-center justify-center gap-3 text-[#B6C6D9]">
          <FaSpinner className="animate-spin text-[#38BDF8]" />
          Loading workspace...
        </div>
      </OnboardingLayout>
    );
  }
  if (error && !organization) {
    return (
      <OnboardingLayout>
        <div className="py-12 text-center">
          <FaBuilding className="mx-auto mb-4 text-3xl text-[#B6C6D9]" />

          <h2 className="text-lg font-semibold text-white">
            Unable to load workspace
          </h2>

          <p className="mt-2 text-sm text-[#B6C6D9]">
            {error}
          </p>

          <button
            type="button"
            onClick={() => loadWorkspace()}
            className={`${primary} mt-5`}
          >
            Try again
          </button>
        </div>
      </OnboardingLayout>
    );
  }
  if (selectedChatTeam) {
    return (
      <OnboardingLayout>
        <TeamChat
          organizationId={organizationId}
          team={selectedChatTeam}
          currentUser={currentUser}
          onClose={() => setSelectedChatTeam(null)}
        />
      </OnboardingLayout>
    );
  }
  return (
    <OnboardingLayout>
     <div className="mx-auto w-full max-w-none min-w-0 p-3 text-[#EDEFF7] sm:p-5 lg:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
        <button
  type="button"
  onClick={() => navigate("/organizations", { replace: true })}
  className="mb-4 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/20"
>
  ← 
</button>
        </div>
        {notice && (
          <div className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-[#38BDF8]/30 bg-[#38BDF8]/10 px-4 py-3 text-sm text-[#C6EAFF]">
            <p>{notice}</p>
            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Dismiss"
            >
              <FaTimes />
            </button>
          </div>
        )}
        <div
          className="flex flex-col justify-between gap-5 rounded-2xl border border-white/10 bg-white/[0.07] p-4 shadow-xl shadow-black/10 backdrop-blur-xl sm:flex-row sm:items-center sm:p-6"
        >
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#B6C6D9]/20 bg-[#212F44] text-xl text-[#C6EAFF]">
              {organization?.logo || organization?.logoUrl ? (
                <img
                  src={organization.logo || organization.logoUrl}
                  alt={organization.name || "Organization"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <FaBuilding />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="break-words text-xl font-semibold tracking-tight text-[#EDEFF7] sm:text-2xl">
                {organization?.name || "Organization"}
              </h1>
              <p className="mt-1.5 max-w-xl text-sm leading-6 text-[#B6C6D9]">
                {organization?.description ||
                  "Your team's shared workspace."}
              </p>
              <span className="mt-3 inline-flex rounded-full border border-[#38BDF8]/25 bg-[#38BDF8]/[0.08] px-2.5 py-1 text-xs font-medium text-[#C6EAFF]">
                {roleLabel(role)}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setOpenMenu("");
                setModal("invite");
              }}
              className={primary}
            >
              <FaPlus />
              Invite members
            </button>

            {menu("organization", [
              {
                label: "Edit organization",
                icon: <FaEdit />,
                onClick: openOrgEdit,
              },
              {
                label: "Delete organization",
                icon: <FaTrash />,
                danger: true,
                onClick: () => {
                  setOpenMenu("");

                  setNotice(
                    "Delete organization UI is ready. Connect the backend delete endpoint before enabling deletion."
                  );
                },
              },
            ])}
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
        {["Overview", "Teams", "Members", "About"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setActiveTab(tab);
                setSearch("");
              }}
              className={`rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                activeTab === tab
                  ? "border border-[#38BDF8]/30 bg-[linear-gradient(90deg,#0066FF,#0148B3)] text-white shadow-md shadow-blue-950/30"
                  : "border border-[#B6C6D9]/15 bg-white/[0.06] text-[#B6C6D9] hover:bg-white/10 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        {activeTab === "Overview" && (
          <div className="mt-6 space-y-5">
            <OrganizationOverview
              organization={organization}
              members={members}
              invitations={[]}
              loading={loading}
              currentRole={role}
              currentUserId={currentUserId}
              onEditMember={(member) => {
                setSelectedMember(member);
                setMemberRole(
                  member.role || member.user?.role || "MEMBER"
                );
                setOpenMenu("");
                setModal("edit-member");
              }}
              onRemoveMember={removeMember}
              onViewAllMembers={() => {
                setActiveTab("Members");
                setSearch("");
              }}
            />

            <section className={`${card} p-4 sm:p-6`}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-white">Teams</h2>
                <button
                  type="button"
                  onClick={() => setActiveTab("Teams")}
                  className="text-sm font-medium text-[#C6EAFF] transition hover:text-white"
                >
                  View all
                </button>
              </div>

              {teams.length > 0 ? (
                <div className="space-y-1.5">
                  {teams.slice(0, 3).map(teamRow)}
                </div>
              ) : (
                <div className="rounded-xl border border-white/20 bg-white/[0.10] py-6 text-center text-sm text-white/80">
                  No teams yet.
                  {canCreateTeam && (
                    <div>
                      <button
                        type="button"
                        onClick={() => setModal("create-team")}
                        className={`${primary} mt-3`}
                      >
                        <FaPlus />
                        Create team
                      </button>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === "Teams" && (
          <div className={`${card} mt-6 p-4 sm:p-6`}>
            <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Teams
                </h2>
                <p className="mt-1 text-sm text-[#B6C6D9]">
                  Organize people around shared work.
                </p>
              </div>

              {canCreateTeam && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setModal("create-team")}
                    className={primary}
                  >
                    <FaPlus />
                    Create team
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAddTeamMember(true)}
                    className={primary}
                  >
                    <FaUserPlus />
                    Add Team Member
                  </button>
                </div>
              )}
            </div>
            <div className="relative mb-4">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A4A5AF]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search teams..."
                className={`${input} pl-10`}
              />
            </div>
            {filteredTeams.length ? (
              <div className="space-y-1.5">
                {filteredTeams.map(teamRow)}
              </div>
            ) : (
              <div className="rounded-xl bg-white/[0.04] px-4 py-10 text-center">
                <FaLayerGroup className="mx-auto mb-3 text-2xl text-[#A4A5AF]" />
                <p className="text-sm text-[#B6C6D9]">
                  {search ? "No matching teams" : "No teams yet"}
                </p>
                {!search && canCreateTeam && (
                  <button
                    type="button"
                    onClick={() => setModal("create-team")}
                    className={`${primary} mt-4`}
                  >
                    <FaPlus />
                    Create team
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        {activeTab === "Members" && (
          <div className={`${card} mt-6 p-4 sm:p-6`}>
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-white">
                Members
              </h2>
              <p className="mt-1 text-sm text-[#B6C6D9]">
                People who belong to this organization.
              </p>
            </div>
            <div className="relative mb-4">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A4A5AF]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search members..."
                className={`${input} pl-10`}
              />
            </div>
            {filteredMembers.length ? (
              <div className="space-y-1.5">
                {filteredMembers.map(memberRow)}
              </div>
            ) : (
              <p className="rounded-xl bg-white/[0.04] px-4 py-10 text-center text-sm text-[#B6C6D9]">
                {search ? "No matching members" : "No members found."}
              </p>
            )}
          </div>
        )}
                {activeTab === "About" && (
          <section className={`${card} mt-6 p-4 sm:p-6`}>
            <h2 className="mb-5 text-lg font-semibold text-white">
              About Organization
            </h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-[#B6C6D9]">
                  Organization Name
                </p>
                <p className="mt-1 text-white">
                  {organization?.name || "Not provided"}
                </p>
              </div>

              <div>
                <p className="text-sm text-[#B6C6D9]">
                  Organization ID
                </p>
                <p className="mt-1 break-all text-sm text-white">
                  {organization?._id || organization?.id || organizationId}
                </p>
              </div>

              <div>
                <p className="text-sm text-[#B6C6D9]">
                  Description
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-white">
                  {organization?.description || "No description available."}
                </p>
              </div>

              <div>
                <p className="text-sm text-[#B6C6D9]">
                  Website
                </p>
                <p className="mt-1 break-all text-sm text-white">
                  {organization?.website || "Not provided"}
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
      {modal === "create-team" && (
        <Modal
          title="Create a team"
          description="Create a team for people working together."
          close={closeModal}
        >
          <form
            onSubmit={createTeam}
            className="space-y-4"
          >
            <div>
              <label className="mb-2 block text-sm text-[#B6C6D9]">
                Team name
              </label>
              <input
                required
                maxLength={80}
                value={teamForm.name}
                onChange={(event) => {
                  setTeamForm({
                    ...teamForm,
                    name: event.target.value,
                  });
                }}
                placeholder="e.g. Engineering"
                className={input}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-[#B6C6D9]">
                Description
              </label>
              <textarea
                rows={3}
                maxLength={300}
                value={teamForm.description}
                onChange={(event) => {
                  setTeamForm({
                    ...teamForm,
                    description: event.target.value,
                  });
                }}
                placeholder="What will this team work on?"
                className={`${input} resize-none`}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className={secondary}
              >
                Cancel
              </button>
              <button
                disabled={saving || !teamForm.name.trim()}
                className={primary}
              >
                {saving ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <FaCheck />
                )}
                Create team
              </button>
            </div>
          </form>
        </Modal>
      )}
      {modal === "invite" && (
        <Modal
          title="Invite a member"
          description="Send an invitation to join your organization."
          close={closeModal}
        >
          <form
            onSubmit={inviteMember}
            className="space-y-4"
          >
            <div>
              <label className="mb-2 block text-sm text-[#B6C6D9]">
                Email address
              </label>
              <input
                required
                type="email"
                value={inviteForm.email}
                onChange={(event) => {
                  setInviteForm({
                    ...inviteForm,
                    email: event.target.value,
                  });
                }}
                placeholder="name@example.com"
                className={input}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-[#B6C6D9]">
                Team (Optional)
              </label>

              <select
                value={inviteForm.teamId}
                onChange={(e) =>
                  setInviteForm((prev) => ({
                    ...prev,
                    teamId: e.target.value,
                  }))
                }
                className={input}
              >
                <option value="">Organization-wide invite</option>

                {teams.map((team) => (
                  <option key={team.id || team._id} value={team.id || team._id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            {inviteForm.teamId ? (
              <div>
                <label className="mb-2 block text-sm text-[#B6C6D9]">
                  Team Role
                </label>

                <select
                  value={inviteForm.teamRole}
                  onChange={(e) =>
                    setInviteForm((prev) => ({
                      ...prev,
                      teamRole: e.target.value,
                    }))
                  }
                  className={input}
                >
                  <option value="MEMBER">Team Member</option>
                  <option value="LEAD">Team Lead</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="mb-2 block text-sm text-[#B6C6D9]">
                  Organization Role
                </label>

                <select
                  value={inviteForm.role}
                  onChange={(e) =>
                    setInviteForm((prev) => ({
                      ...prev,
                      role: e.target.value,
                    }))
                  }
                  className={input}
                >
                  <option value="MEMBER">Member</option>
                  <option value="TEAM_HEAD">Team Head</option>
                </select>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className={secondary}
              >
                Cancel
              </button>
              <button
                disabled={saving || !inviteForm.email.trim()}
                className={primary}
              >
                {saving ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <FaUserPlus />
                )}
                Send invite
              </button>
            </div>
          </form>
        </Modal>
      )}
      {modal === "edit-org" && (
        <Modal
          title="Edit organization"
          description="Update your organization's information."
          close={closeModal}
        >
          <form
            onSubmit={editOrganization}
            className="space-y-4"
          >
            <div>
              <label className="mb-2 block text-sm text-[#B6C6D9]">
                Organization name
              </label>
              <input
                required
                value={orgForm.name}
                onChange={(event) => {
                  setOrgForm({
                    ...orgForm,
                    name: event.target.value,
                  });
                }}
                className={input}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-[#B6C6D9]">
                Description
              </label>
              <textarea
                rows={3}
                value={orgForm.description}
                maxLength={20000}
                onChange={(event) => {
                  setOrgForm({
                    ...orgForm,
                    description: event.target.value,
                  });
                }}
                className={`${input} resize-none`}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-[#B6C6D9]">
                Logo URL
              </label>
              <input
                type="url"
                value={orgForm.logo}
                onChange={(event) => {
                  setOrgForm({
                    ...orgForm,
                    logo: event.target.value,
                  });
                }}
                placeholder="https://example.com/logo.png"
                className={input}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className={secondary}
              >
                Cancel
              </button>

              <button
                disabled={saving || !orgForm.name.trim()}
                className={primary}
              >
                {saving ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <FaCheck />
                )}
                Save changes
              </button>
            </div>
          </form>
        </Modal>
      )}
      {modal === "edit-member" && (
        <Modal
          title="Edit member"
          description="Update this member's role."
          close={closeModal}
        >
          <form
            onSubmit={editMember}
            className="space-y-4"
          >
            <div>
              <label className="mb-2 block text-sm text-[#B6C6D9]">
                Member role
              </label>
              <select
                value={memberRole}
                onChange={(event) => {
                  setMemberRole(event.target.value);
                }}
                className={input}
              >
                <option value="MEMBER">Member</option>
                <option value="TEAM_HEAD">Team Head</option>
                <option value="ORG_ADMIN">Organization Admin</option>
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className={secondary}
              >
                Cancel
              </button>

              <button
                disabled={saving}
                className={primary}
              >
                {saving ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <FaCheck />
                )}
                Save changes
              </button>
            </div>
          </form>
        </Modal>
      )}
      {showAddTeamMember && (
        <AddTeamMember
          organizationId={organizationId}
          teams={teams}
          members={members}
          onClose={() => setShowAddTeamMember(false)}
          onSuccess={async () => {
            setShowAddTeamMember(false);
            setNotice("Member added to team successfully.");
            await loadWorkspace(false);
          }}
        />
      )}
    </OnboardingLayout>
  );
}
export default OrganizationWorkspace;
