
import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  FaBuilding,
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
  FaArrowLeft,
  FaVideo,
  FaCopy,
} from "react-icons/fa";

import api from "../../services/api";
import { createMeeting, createScopedMeeting } from "../../services/meetingService";
import OnboardingLayout from "../../components/OnboardingLayout";
import AddTeamMember from "./AddTeamMember";
import TeamChat from "./TeamChat";
import OrganizationOverview from "./OrganizationOverview";
import OrganizationWhiteboards from "../../components/OrganizationWhiteboards";

const btn =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA] disabled:cursor-not-allowed disabled:opacity-50";

const primary =
  `${btn} border border-[#60A5FA]/40 bg-gradient-to-r from-[#0066FF] to-[#0148B3] text-white shadow-md shadow-blue-900/20 hover:brightness-110`;

const secondary =
  `${btn} border border-white/20 bg-white/10 text-white hover:bg-white/20`;

const input =
  "w-full min-w-0 rounded-xl border border-white/20 bg-[#212F44]/60 px-3.5 py-3 text-sm text-white outline-none placeholder:text-[#B6C6D9] transition focus:border-[#38BDF8] focus:ring-2 focus:ring-[#38BDF8]/20";

const card =
  "min-w-0 rounded-2xl border border-[#38BDF8]/20 bg-[#305485]/50 shadow-lg shadow-[#0B1F39]/10 backdrop-blur-xl";

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
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data?.data?.[key])) return data.data[key];
  if (Array.isArray(data?.data)) return data.data;
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0F19]/70 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-[#38BDF8]/25 bg-[#212F44] p-5 shadow-2xl shadow-black/40 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            {description && (
              <p className="mt-1 text-sm leading-5 text-[#B6C6D9]">
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
  const requestedTab = searchParams.get("tab");
  const [organization, setOrganization] = useState(null);
  const [teams, setTeams] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState(["Overview", "Teams", "Members", "About", "Whiteboards"].includes(requestedTab) ? requestedTab : "Overview");
  const [search, setSearch] = useState("");
  const [openMenu, setOpenMenu] = useState("");
  const [modal, setModal] = useState("");
  const [showAddTeamMember, setShowAddTeamMember] = useState(false);
  const [selectedChatTeam, setSelectedChatTeam] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [memberRole, setMemberRole] = useState("MEMBER");
  const [showMeetingInviteModal, setShowMeetingInviteModal] = useState(false);
  const [selectedMeetingMembers, setSelectedMeetingMembers] = useState([]);
  const [meetingMemberSearch, setMeetingMemberSearch] = useState("");
  const [startingMeeting, setStartingMeeting] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedulingMeeting, setSchedulingMeeting] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    title: "",
    scopeType: "ORGANIZATION",
    teamId: "",
    scheduledStartTime: "",
  });
  const [joinMeetingCode, setJoinMeetingCode] = useState("");
  const [organizationInviteLink, setOrganizationInviteLink] = useState("");
  const [generatingInviteLink, setGeneratingInviteLink] = useState(false);
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false);
  const [teamForm, setTeamForm] = useState({
    name: "",
    description: "",
  });
  const [selectedTeam, setSelectedTeam] = useState(null);
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

  let currentUser = null;

  try {
    currentUser = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    currentUser = null;
  }

  const currentUserId =
    currentUser?.id || currentUser?._id || currentUser?.userId;
  const meetingSelectableMembers = members.filter((member) => {
    const id =
      member.userId ||
      member.user?._id ||
      member.user?.id ||
      member._id ||
      member.id;
    return Boolean(id) && (!currentUserId || String(id) !== String(currentUserId));
  });

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
    if (showLoader) setLoading(true);
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

      setTeams(
        teamResult.status === "fulfilled"
          ? items(teamResult.value.data, "teams")
          : []
      );

      setMembers(
        memberResult.status === "fulfilled"
          ? items(memberResult.value.data, "members")
          : []
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (organizationId) loadWorkspace();
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
    if (!notice) return;

    const timeout = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(timeout);
  }, [notice]);

  function closeModal() {
    setModal("");
    setSelectedMember(null);
    setMemberToRemove(null);
    setSaving(false);
  }

  function toggleMeetingMember(memberId) {
    setSelectedMeetingMembers((current) =>
      current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId]
    );
  }

  async function startOrganizationMeeting() {
    if (startingMeeting) return;

    setStartingMeeting(true);
    setNotice("");

    try {
      const meeting = await createMeeting({ organizationId });

      if (!meeting?.code) {
        throw new Error("Meeting code was not found.");
      }

      const meetingUrl =
        `/video-call?code=${encodeURIComponent(meeting.code)}` +
        `&host=1&organizationId=${encodeURIComponent(organizationId)}`;

      setShowMeetingInviteModal(false);
      navigate(meetingUrl);
    } catch (err) {
      setNotice(errorMessage(err));
    } finally {
      setStartingMeeting(false);
    }
  }

  function openScheduleMeetingDialog() {
    setScheduleForm({
      title: "",
      scopeType: "ORGANIZATION",
      teamId: "",
      scheduledStartTime: "",
    });
    setShowScheduleModal(true);
    setOpenMenu("");
  }

  async function scheduleOrganizationMeeting(event) {
    event.preventDefault();
    if (schedulingMeeting) return;

    if (!scheduleForm.scheduledStartTime) {
      setNotice("Please select a meeting date and time.");
      return;
    }

    const startTime = new Date(scheduleForm.scheduledStartTime);
    if (Number.isNaN(startTime.getTime()) || startTime <= new Date()) {
      setNotice("Please choose a future date and time.");
      return;
    }

    if (scheduleForm.scopeType === "TEAM" && !scheduleForm.teamId) {
      setNotice("Please select a team.");
      return;
    }

    setSchedulingMeeting(true);
    setNotice("");

    try {
      const payload = {
        title: scheduleForm.title.trim() || undefined,
        scopeType: scheduleForm.scopeType,
        organizationId,
        scheduledStartTime: startTime.toISOString(),
        ...(scheduleForm.scopeType === "TEAM" ? { teamId: scheduleForm.teamId } : {}),
      };

      const result = await createScopedMeeting(payload);
      const meeting = result?.meeting || result?.data?.meeting || result?.data || result;
      const code = meeting?.code || result?.code;

      setShowScheduleModal(false);
      setNotice(
        code
          ? `Meeting scheduled successfully. Meeting code: ${code}`
          : "Meeting scheduled successfully. Members will receive calendar events and notifications."
      );
    } catch (err) {
      setNotice(errorMessage(err));
    } finally {
      setSchedulingMeeting(false);
    }
  }

  function openMeetingDialog() {
    setSelectedMeetingMembers([]);
    setMeetingMemberSearch("");
    setJoinMeetingCode("");
    setShowMeetingInviteModal(true);
    setOpenMenu("");
  }

  function joinMeetingWithCode(event) {
    event.preventDefault();
    const code = joinMeetingCode.trim();
    if (!code) {
      setNotice("Please enter a meeting code.");
      return;
    }

    setShowMeetingInviteModal(false);
    navigate(
      `/video-call?code=${encodeURIComponent(code)}&organizationId=${encodeURIComponent(organizationId)}`
    );
  }

  function openOrgEdit() {
    setOrgForm({
      name: organization?.name || "",
      description: organization?.description || "",
      logo: organization?.logo || organization?.logoUrl || "",
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
      setTeamForm({ name: "", description: "" });
      setNotice("Team created successfully.");
      setActiveTab("Teams");
      await loadWorkspace(false);
    } catch (err) {
      setNotice(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }
  function openEditTeam(team) {
    setSelectedTeam(team);
  
    setTeamForm({
      name: team.name || "",
      description: team.description || "",
    });
  
    setOpenMenu("");
    setModal("edit-team");
  }
  
  async function updateTeam(event) {
    event.preventDefault();
  
    if (!selectedTeam) return;
  
    const teamId = selectedTeam._id || selectedTeam.id;
  
    if (!teamId) {
      setNotice("Team ID is missing.");
      return;
    }
  
    setSaving(true);
    setNotice("");
  
    try {
      await api.patch(
        `/api/organizations/${organizationId}/teams/${teamId}`,
        {
          name: teamForm.name.trim(),
          description: teamForm.description.trim(),
        }
      );
  
      closeModal();
      setSelectedTeam(null);
      setTeamForm({ name: "", description: "" });
  
      setNotice("Team updated successfully.");
  
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
  async function generateOrganizationInviteLink() {
    if (generatingInviteLink) return;
  
    setGeneratingInviteLink(true);
    setNotice("");
  
    try {
      const response = await api.post(
        `/api/organizations/${organizationId}/invites`,
        {
          role: "MEMBER",
          expiresInDays: 30,
          maxUses: 100,
        }
      );
  
      const result = response?.data?.data ?? response?.data ?? response;
      const token =
        result?.token ||
        result?.invite?.token ||
        result?.data?.token;
  
      if (!token) {
        throw new Error(
          "Invitation was created, but the server did not return an invite token."
        );
      }
  
      const inviteLink = `${window.location.origin}/join/${token}`;
  
      setOrganizationInviteLink(inviteLink);
      setInviteLinkCopied(false);
      setNotice("Organization invite link generated successfully.");
    } catch (err) {
      setNotice(errorMessage(err));
    } finally {
      setGeneratingInviteLink(false);
    }
  }
  
  async function copyOrganizationInviteLink() {
    if (!organizationInviteLink) return;
  
    try {
      await navigator.clipboard.writeText(organizationInviteLink);
      setInviteLinkCopied(true);
      setNotice("Invite link copied successfully.");
    } catch {
      setNotice("Unable to copy automatically. Please copy the link manually.");
    }
  }
<div className="sm:col-span-2 rounded-xl border border-[#38BDF8]/20 bg-white/[0.04] p-4">
  <div className="mb-3">
    <p className="text-sm font-semibold text-white">
      Organization Invite Link
    </p>
    <p className="mt-1 text-xs text-[#B6C6D9]">
      Generate and share this link with people you want to invite.
      It can be used up to 100 times and expires in 30 days.
    </p>
  </div>

  {organizationInviteLink ? (
    <>
      <div className="mb-3 break-all rounded-lg border border-white/10 bg-[#0B1F39]/60 p-3 text-sm text-[#C6EAFF]">
        {organizationInviteLink}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copyOrganizationInviteLink}
          className={primary}
        >
          {inviteLinkCopied ? <FaCheck /> : <FaCopy />}
          {inviteLinkCopied ? "Copied" : "Copy Invite Link"}
        </button>

        <button
          type="button"
          onClick={generateOrganizationInviteLink}
          disabled={generatingInviteLink}
          className={secondary}
        >
          Generate New Link
        </button>
      </div>
    </>
  ) : (
    <button
      type="button"
      onClick={generateOrganizationInviteLink}
      disabled={generatingInviteLink}
      className={primary}
    >
      {generatingInviteLink ? (
        <FaSpinner className="animate-spin" />
      ) : (
        <FaPlus />
      )}
      {generatingInviteLink ? "Generating..." : "Generate Invite Link"}
    </button>
  )}
</div>
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

  async function leaveOrganization() {
    if (saving) return;
    setSaving(true);
    setNotice("");

    try {
      await api.post(`/api/organizations/${organizationId}/leave`);
      setModal("");
      navigate("/organizations", { replace: true });
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
      setNotice("Member ID is missing.");
      return;
    }

    setSaving(true);

    try {
      await api.patch(
        `/api/organizations/${organizationId}/members/${id}`,
        { role: memberRole }
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

  function removeMember(member) {
    setOpenMenu("");

    const id =
      member?.userId ||
      member?.user?._id ||
      member?.user?.id ||
      member?._id ||
      member?.id;

    if (!id) {
      setNotice("Member ID is missing.");
      return;
    }

    const name =
      member.name ||
      member.user?.name ||
      member.email ||
      "this member";

    setMemberToRemove({ id, name });
    setModal("remove-member");
  }

  async function confirmRemoveMember() {
    if (!memberToRemove?.id || saving) return;
    setSaving(true);
    setNotice("");

    try {
      await api.delete(
        `/api/organizations/${organizationId}/members/${memberToRemove.id}`
      );
      setModal("");
      setMemberToRemove(null);
      setNotice("Member removed successfully.");
      await loadWorkspace(false);
    } catch (err) {
      setNotice(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function menu(id, options) {
    return (
      <div className="relative shrink-0">
        <button
          type="button"
          aria-label="More options"
          onClick={() => setOpenMenu(openMenu === id ? "" : id)}
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
        className="flex min-w-0 flex-col gap-3 rounded-xl border border-[#8BB9E8]/25 bg-[#315A83]/35 px-3 py-3 transition hover:border-[#8BB9E8]/45 hover:bg-[#315A83]/50 sm:flex-row sm:items-center sm:justify-between sm:px-4"
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
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
            type="button"
            onClick={() => setSelectedChatTeam(team)}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-[#38BDF8]/25 bg-[#38BDF8]/10 px-3 py-2 text-xs font-medium text-[#C6EAFF] transition hover:bg-[#38BDF8]/20 sm:text-sm"
          >
            Open Team Chat
          </button>

          {menu(`team-${id}`, [
            {
              label: "Edit team",
              icon: <FaEdit />,
              onClick: () => openEditTeam(team),
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
    const name = member.name || member.user?.name || "Member";
    const email = member.email || member.user?.email || "";
    const id =
      member.userId ||
      member.user?._id ||
      member.user?.id ||
      member._id ||
      member.id ||
      email;

    const currentMemberRole =
      member.role || member.user?.role || "MEMBER";

    const avatar = member.avatar || member.user?.avatar;

    return (
      <div
        key={id}
        className="flex min-w-0 flex-col gap-3 rounded-xl border border-white/10 bg-[#062C52]/40 px-3 py-3 transition hover:bg-[#062C52]/70 sm:flex-row sm:items-center sm:justify-between sm:px-4"
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
            <p className="truncate text-sm font-medium text-white">{name}</p>
            <p className="mt-1 truncate text-xs text-[#B6C6D9]">{email}</p>
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

  const filteredTeams = teams.filter((team) =>
    `${team.name || ""} ${team.description || ""}`
      .toLowerCase()
      .includes(normalizedSearch)
  );

  const filteredMembers = members.filter((member) =>
    [
      member.name,
      member.user?.name,
      member.email,
      member.user?.email,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearch)
  );

  if (loading) {
    return (
      <OnboardingLayout fullWidth>
        <div className="flex min-h-64 w-full items-center justify-center gap-3 bg-[linear-gradient(135deg,#253F5B,#305485,#506D91)] text-[#B6C6D9]">
          <FaSpinner className="animate-spin text-[#38BDF8]" />
          Loading workspace...
        </div>
      </OnboardingLayout>
    );
  }

  if (error && !organization) {
    return (
      <OnboardingLayout fullWidth>
        <div className="min-h-screen w-full bg-[linear-gradient(135deg,#253F5B,#305485,#506D91)] px-4 py-12 text-center">
          <FaBuilding className="mx-auto mb-4 text-3xl text-[#B6C6D9]" />
          <h2 className="text-lg font-semibold text-white">
            Unable to load workspace
          </h2>
          <p className="mt-2 text-sm text-[#B6C6D9]">{error}</p>
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
      <OnboardingLayout fullWidth>
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
    <OnboardingLayout fullWidth>
      <main className="organization-workspace relative min-h-full w-full min-w-0 max-w-none flex-1 self-stretch bg-[linear-gradient(135deg,#253F5B_0%,#305485_48%,#506D91_100%)] p-3 text-[#EDEFF7] sm:p-4 lg:p-5">

        <div className="mb-3 flex items-center">
          <button
            type="button"
            onClick={() => navigate("/organizations", { replace: true })}
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white transition hover:bg-white/20"
          >
            <FaArrowLeft />
          </button>
        </div>

        {notice && (
          <div className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-[#38BDF8]/30 bg-[#38BDF8]/10 px-4 py-3 text-sm text-[#C6EAFF]">
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

        {error && (
          <div className="mb-4 rounded-xl border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        )}
        <section className="mb-4 flex w-full min-w-0 flex-col justify-between gap-4 rounded-2xl border border-white/20 bg-white/[0.10] p-4 shadow-xl shadow-[#0B1F39]/10 backdrop-blur-xl sm:flex-row sm:items-center sm:p-5">
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
              <h1 className="break-words text-xl font-semibold tracking-tight text-white sm:text-2xl">
                {organization?.name || "Organization"}
              </h1>

              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#B6C6D9]">
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

            {(role === "ORG_ADMIN" || isOrganizationOwner) && (
              <button
                type="button"
                onClick={openScheduleMeetingDialog}
                className={secondary}
              >
                <FaVideo />
                <span>Schedule meeting</span>
              </button>
            )}

            <button
              type="button"
              onClick={openMeetingDialog}
              className={`${secondary} shrink-0 whitespace-nowrap`}
            >
              <FaVideo className="shrink-0" />
              <span>Join meeting</span>
            </button>

            {menu("organization", [
              {
                label: "Edit organization",
                icon: <FaEdit />,
                onClick: openOrgEdit,
              },
              {
                label: "Leave Organization",
                icon: <FaArrowLeft />,
                danger: true,
                onClick: () => {
                  setOpenMenu("");
                  setModal("leave-organization");
                },
              },
            ])}
          </div>
        </section>
        <nav className="mb-4 flex w-full min-w-0 flex-wrap gap-2">
        {["Overview", "Teams", "Members", "Whiteboards", "About"].map((tab) => (
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
                  : "border border-[#B6C6D9]/20 bg-white/[0.08] text-[#B6C6D9] hover:bg-white/15 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
        {activeTab === "Overview" && (
          <div className="w-full min-w-0 space-y-4">
            <OrganizationOverview
              organization={organization}
              members={members}
              invitations={[]}
              loading={loading}
              currentRole={role}
              currentUserId={currentUserId}
              onEditMember={(member) => {
                setSelectedMember(member);
                setMemberRole(member.role || member.user?.role || "MEMBER");
                setOpenMenu("");
                setModal("edit-member");
              }}
              onRemoveMember={removeMember}
              onViewAllMembers={() => {
                setActiveTab("Members");
                setSearch("");
              }}
            />

            <section className={`${card} p-4 sm:p-5`}>
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
                <div className="space-y-2">
                  {teams.slice(0, 3).map(teamRow)}
                </div>
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/[0.05] py-6 text-center text-sm text-[#B6C6D9]">
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
          <section className={`${card} w-full p-4 sm:p-5`}>
            <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-semibold text-white">Teams</h2>
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
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B6C6D9]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search teams..."
                className={`${input} pl-10`}
              />
            </div>

            {filteredTeams.length ? (
              <div className="space-y-2">{filteredTeams.map(teamRow)}</div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-10 text-center">
                <FaLayerGroup className="mx-auto mb-3 text-2xl text-[#B6C6D9]" />
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
          </section>
        )}
        {activeTab === "Members" && (
          <section className={`${card} w-full p-4 sm:p-5`}>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-white">Members</h2>
              <p className="mt-1 text-sm text-[#B6C6D9]">
                People who belong to this organization.
              </p>
            </div>

            <div className="relative mb-4">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B6C6D9]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search members..."
                className={`${input} pl-10`}
              />
            </div>

            {filteredMembers.length ? (
              <div className="space-y-2">{filteredMembers.map(memberRow)}</div>
            ) : (
              <p className="rounded-xl bg-white/[0.04] px-4 py-10 text-center text-sm text-[#B6C6D9]">
                {search ? "No matching members" : "No members found."}
              </p>
            )}
          </section>
        )}
        {activeTab === "About" && (
          <section className={`${card} w-full p-4 sm:p-5`}>
            <h2 className="mb-5 text-lg font-semibold text-white">
              About Organization
            </h2>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <p className="text-sm text-[#B6C6D9]">Organization Name</p>
                <p className="mt-1 text-white">
                  {organization?.name || "Not provided"}
                </p>
              </div>

              <div>
                <p className="text-sm text-[#B6C6D9]">Organization ID</p>
                <p className="mt-1 break-all text-sm text-white">
                  {organization?._id || organization?.id || organizationId}
                </p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-sm text-[#B6C6D9]">Description</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-white">
                  {organization?.description || "No description available."}
                </p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-sm text-[#B6C6D9]">Website</p>
                <p className="mt-1 break-all text-sm text-white">
                  {organization?.website || "Not provided"}
                </p>
              </div>
            </div>
          </section>
        )}
               {activeTab === "Whiteboards" && (
          <OrganizationWhiteboards organizationId={organizationId} />
        )}
        {showScheduleModal && (
          <Modal
            title="Schedule a meeting"
            description="Choose whether this meeting is for the entire organization or one specific team."
            close={() => !schedulingMeeting && setShowScheduleModal(false)}
          >
            <form onSubmit={scheduleOrganizationMeeting} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-[#B6C6D9]">Meeting title</label>
                <input
                  value={scheduleForm.title}
                  onChange={(event) => setScheduleForm((current) => ({ ...current, title: event.target.value }))}
                  maxLength={120}
                  placeholder="e.g. Weekly organization sync"
                  className={input}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-[#B6C6D9]">Meeting audience</label>
                <select
                  value={scheduleForm.scopeType}
                  onChange={(event) => setScheduleForm((current) => ({ ...current, scopeType: event.target.value, teamId: "" }))}
                  className={input}
                >
                  <option value="ORGANIZATION">Entire organization</option>
                  <option value="TEAM">Specific team</option>
                </select>
              </div>

              {scheduleForm.scopeType === "TEAM" && (
                <div>
                  <label className="mb-2 block text-sm text-[#B6C6D9]">Select team</label>
                  <select
                    required
                    value={scheduleForm.teamId}
                    onChange={(event) => setScheduleForm((current) => ({ ...current, teamId: event.target.value }))}
                    className={input}
                  >
                    <option value="">Choose a team</option>
                    {teams.map((team) => {
                      const id = team._id || team.id;
                      return <option key={id} value={id}>{team.name || "Unnamed team"}</option>;
                    })}
                  </select>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm text-[#B6C6D9]">Date and time</label>
                <input
                  required
                  type="datetime-local"
                  min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                  value={scheduleForm.scheduledStartTime}
                  onChange={(event) => setScheduleForm((current) => ({ ...current, scheduledStartTime: event.target.value }))}
                  className={input}
                />
                <p className="mt-1 text-xs text-[#B6C6D9]">All selected members will receive the meeting through their calendar and notifications.</p>
              </div>

              <div className="flex justify-end gap-3 border-t border-white/10 pt-3">
                <button type="button" onClick={() => setShowScheduleModal(false)} className={secondary} disabled={schedulingMeeting}>
                  Cancel
                </button>
                <button type="submit" className={primary} disabled={schedulingMeeting || !scheduleForm.scheduledStartTime || (scheduleForm.scopeType === "TEAM" && !scheduleForm.teamId)}>
                  {schedulingMeeting ? <FaSpinner className="animate-spin" /> : <FaVideo />}
                  {schedulingMeeting ? "Scheduling..." : "Schedule meeting"}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {showMeetingInviteModal && (
          <Modal
            title="Video call"
            description="Start a new meeting or join an existing meeting with its code."
            close={() => setShowMeetingInviteModal(false)}
          >
            <div className="space-y-4">
              <form
                onSubmit={joinMeetingWithCode}
                className="space-y-3 rounded-xl border border-[#38BDF8]/25 bg-white/[0.04] p-3"
              >
                <div>
                  <h3 className="text-sm font-semibold text-white">Join with code</h3>
                  <p className="mt-1 text-xs text-[#B6C6D9]">Enter the meeting code shared by the host.</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    value={joinMeetingCode}
                    onChange={(event) => setJoinMeetingCode(event.target.value)}
                    placeholder="Enter meeting code"
                    aria-label="Meeting code"
                    className={input}
                    autoComplete="off"
                  />
                  <button type="submit" className={`${primary} shrink-0`} disabled={!joinMeetingCode.trim()}>
                    Join meeting
                  </button>
                </div>
              </form>

              <div className="flex items-center gap-3 text-xs text-[#B6C6D9]">
                <span className="h-px flex-1 bg-white/10" />
                OR START A NEW MEETING
                <span className="h-px flex-1 bg-white/10" />
              </div>
              <div className="text-xs text-[#B6C6D9]">Optionally select organization members below.</div>
              <input
                value={meetingMemberSearch}
                onChange={(event) => setMeetingMemberSearch(event.target.value)}
                placeholder="Search members by name or email..."
                className={input}
              />

              <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {meetingSelectableMembers
                  .filter((member) => {
                    const name = member.name || member.user?.name || "";
                    const email = member.email || member.user?.email || "";
                    return `${name} ${email}`
                      .toLowerCase()
                      .includes(meetingMemberSearch.trim().toLowerCase());
                  })
                  .map((member) => {
                    const id =
                      member.userId ||
                      member.user?._id ||
                      member.user?.id ||
                      member._id ||
                      member.id;
                    const name = member.name || member.user?.name || "Member";
                    const email = member.email || member.user?.email || "";

                    if (!id) return null;

                    const memberId = String(id);

                    return (
                      <label
                        key={memberId}
                        className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 transition hover:border-[#38BDF8]/30 hover:bg-white/[0.08]"
                      >
                        <input
                          type="checkbox"
                          checked={selectedMeetingMembers.includes(memberId)}
                          onChange={() => toggleMeetingMember(memberId)}
                          className="h-4 w-4 shrink-0 accent-blue-500"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-white">
                            {name}
                          </span>
                          <span className="block truncate text-xs text-[#B6C6D9]">
                            {email || "No email available"}
                          </span>
                        </span>
                      </label>
                    );
                  })}

                {meetingSelectableMembers.length === 0 && (
                  <p className="py-6 text-center text-sm text-[#B6C6D9]">
                    No other organization members found.
                  </p>
                )}

                {meetingSelectableMembers.length > 0 &&
                  !meetingSelectableMembers.some((member) => {
                    const name = member.name || member.user?.name || "";
                    const email = member.email || member.user?.email || "";
                    return `${name} ${email}`
                      .toLowerCase()
                      .includes(meetingMemberSearch.trim().toLowerCase());
                  }) && (
                    <p className="py-6 text-center text-sm text-[#B6C6D9]">
                      No members match your search.
                    </p>
                  )}
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-3">
                <p className="text-xs text-[#B6C6D9]">
                  {selectedMeetingMembers.length} selected
                </p>
                <div className="flex shrink-0 justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowMeetingInviteModal(false)}
                    className={secondary}
                    disabled={startingMeeting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={startOrganizationMeeting}
                    disabled={startingMeeting}
                    className={`${primary} whitespace-nowrap`}
                  >
                    {startingMeeting ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      <FaVideo />
                    )}
                    {startingMeeting ? "Starting..." : "Start meeting"}
                  </button>
                </div>
              </div>
            </div>
          </Modal>
        )}

        {modal === "create-team" && (
          <Modal
            title="Create a team"
            description="Create a team for people working together."
            close={closeModal}
          >
            <form onSubmit={createTeam} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-[#B6C6D9]">
                  Team name
                </label>
                <input
                  required
                  maxLength={80}
                  value={teamForm.name}
                  onChange={(event) =>
                    setTeamForm({ ...teamForm, name: event.target.value })
                  }
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
                  onChange={(event) =>
                    setTeamForm({
                      ...teamForm,
                      description: event.target.value,
                    })
                  }
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
                  {saving ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                  Create team
                </button>
              </div>
            </form>
          </Modal>
        )}
{modal === "edit-team" && (
  <Modal
    title="Edit team"
    description="Update your team's information."
    close={closeModal}
  >
    <form onSubmit={updateTeam} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm text-[#B6C6D9]">
          Team name
        </label>

        <input
          required
          maxLength={80}
          value={teamForm.name}
          onChange={(event) =>
            setTeamForm({
              ...teamForm,
              name: event.target.value,
            })
          }
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
          onChange={(event) =>
            setTeamForm({
              ...teamForm,
              description: event.target.value,
            })
          }
          className={`${input} resize-none`}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={closeModal}
          className={secondary}
          disabled={saving}
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving || !teamForm.name.trim()}
          className={primary}
        >
          {saving ? (
            <>
              <FaSpinner className="animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <FaCheck />
              Save Changes
            </>
          )}
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
            <form onSubmit={inviteMember} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-[#B6C6D9]">
                  Email address
                </label>
                <input
                  required
                  type="email"
                  value={inviteForm.email}
                  onChange={(event) =>
                    setInviteForm({ ...inviteForm, email: event.target.value })
                  }
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
                  onChange={(event) =>
                    setInviteForm({ ...inviteForm, teamId: event.target.value })
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
                    onChange={(event) =>
                      setInviteForm({
                        ...inviteForm,
                        teamRole: event.target.value,
                      })
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
                    onChange={(event) =>
                      setInviteForm({ ...inviteForm, role: event.target.value })
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
            <form onSubmit={editOrganization} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-[#B6C6D9]">
                  Organization name
                </label>
                <input
                  required
                  value={orgForm.name}
                  onChange={(event) =>
                    setOrgForm({ ...orgForm, name: event.target.value })
                  }
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
                  onChange={(event) =>
                    setOrgForm({
                      ...orgForm,
                      description: event.target.value,
                    })
                  }
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
                  onChange={(event) =>
                    setOrgForm({ ...orgForm, logo: event.target.value })
                  }
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
                  {saving ? <FaSpinner className="animate-spin" /> : <FaCheck />}
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
            <form onSubmit={editMember} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-[#B6C6D9]">
                  Member role
                </label>
                <select
                  value={memberRole}
                  onChange={(event) => setMemberRole(event.target.value)}
                  className={input}
                >
                  <option value="MEMBER">Member</option>
                  <option value="TEAM_HEAD">Team Head</option>
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
                <button disabled={saving} className={primary}>
                  {saving ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                  Save changes
                </button>
              </div>
            </form>
          </Modal>
        )}

        {modal === "remove-member" && (
          <Modal
            title="Remove member?"
            description={`Are you sure you want to remove ${memberToRemove?.name || "this member"} from this organization? This action cannot be undone.`}
            close={closeModal}
          >
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className={secondary}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRemoveMember}
                disabled={saving || !memberToRemove?.id}
                className={`${btn} border border-red-400/40 bg-red-500/15 text-red-100 hover:bg-red-500/25`}
              >
                {saving ? <FaSpinner className="animate-spin" /> : <FaTrash />}
                {saving ? "Removing..." : "Remove member"}
              </button>
            </div>
          </Modal>
        )}

        {modal === "leave-organization" && (
          <Modal
            title="Leave organization?"
            description={`Are you sure you want to leave ${organization?.name || "this organization"}? You may need a new invitation to join again.`}
            close={closeModal}
          >
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className={secondary}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={leaveOrganization}
                disabled={saving}
                className={`${btn} border border-red-400/40 bg-red-500/15 text-red-100 hover:bg-red-500/25`}
              >
                {saving ? <FaSpinner className="animate-spin" /> : <FaArrowLeft />}
                {saving ? "Leaving..." : "Leave Organization"}
              </button>
            </div>
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
      </main>
    </OnboardingLayout>
  );
}

export default OrganizationWorkspace;
