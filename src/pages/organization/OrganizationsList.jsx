
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft, FiPlus, FiSearch, FiUsers, FiGrid,
  FiBriefcase, FiMoreVertical, FiEdit2, FiTrash2,
  FiX, FiRefreshCw,
} from "react-icons/fi";
import api from "../../services/api";
import OnboardingLayout from "../../components/OnboardingLayout";

const MESSAGE_DURATION = 3000;

const getOrganizationId = (org) => org?.id || org?._id;
const getErrorMessage = (error) =>
  error?.response?.data?.message || "Something went wrong. Please try again.";
const getRoleLabel = (role) =>
  role
    ? role.toString().replaceAll("_", " ").toLowerCase()
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
    : "Member";
    const getCount = (org, fields) => {
      for (const field of fields) {
        const value = org?.[field];
    
        if (typeof value === "number" && Number.isFinite(value)) {
          return value;
        }
    
        if (Array.isArray(value)) {
          return value.length;
        }
      }
    
      return 0;
    };
export default function OrganizationsList() {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [activeMenu, setActiveMenu] = useState(null);
  const [editingOrg, setEditingOrg] = useState(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDeleteOrg, setConfirmDeleteOrg] = useState(null);
  const [notice, setNotice] = useState(null);
  const [modalError, setModalError] = useState("");
  const noticeTimer = useRef(null);
  const menuRef = useRef(null);

  const showNotice = useCallback((message, type = "success") => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    setNotice({ message, type });
    noticeTimer.current = setTimeout(() => {
      setNotice(null);
      noticeTimer.current = null;
    }, MESSAGE_DURATION);
  }, []);

  useEffect(() => () => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);
  const fetchOrganizationCounts = async (organizationId) => {
    try {
      const [membersResponse, teamsResponse] = await Promise.all([
        api.get(`/api/organizations/${organizationId}/members`),
        api.get(`/api/organizations/${organizationId}/teams`),
      ]);
  
      const getItems = (response, key) => {
        const payload = response?.data?.data ?? response?.data;
  
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload?.[key])) return payload[key];
  
        return [];
      };
  
      return {
        membersCount: getItems(membersResponse, "members").length,
        teamsCount: getItems(teamsResponse, "teams").length,
      };
    } catch (error) {
      console.error("Failed to load organization counts:", organizationId, error);
      return { membersCount: 0, teamsCount: 0 };
    }
  };
  const fetchOrganizations = useCallback(async () => {
    setLoading(true);
    setLoadError("");
  
    try {
      const response = await api.get("/api/organizations");
      const payload = response?.data?.data ?? response?.data;
  
      const orgs = Array.isArray(payload)
        ? payload
        : payload?.organizations ?? [];
  
      const orgsWithCounts = await Promise.all(
        orgs.map(async (org) => {
          const organizationId = getOrganizationId(org);
  
          if (!organizationId) {
            return { ...org, membersCount: 0, teamsCount: 0 };
          }
  
          const counts = await fetchOrganizationCounts(organizationId);
  
          return {
            ...org,
            membersCount: counts.membersCount,
            teamsCount: counts.teamsCount,
          };
        })
      );
  
      setOrganizations(orgsWithCounts);
    } catch (error) {
      setLoadError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const filteredOrganizations = organizations.filter((org) => {
    const query = search.trim().toLowerCase();
    return (
      (org?.name || "").toLowerCase().includes(query) ||
      (org?.slug || "").toLowerCase().includes(query)
    );
  });

  const openEditModal = (org) => {
    setEditingOrg(org);
    setEditName(org?.name || "");
    setModalError("");
    setActiveMenu(null);
  };

  const closeEditModal = () => {
    if (saving) return;
    setEditingOrg(null);
    setEditName("");
    setModalError("");
  };

  const handleEditOrganization = async (event) => {
    event.preventDefault();
    const name = editName.trim();
    const organizationId = getOrganizationId(editingOrg);

    if (!name) {
      setModalError("Organization name cannot be empty.");
      return;
    }
    if (!organizationId) {
      setModalError("Organization ID is missing.");
      return;
    }

    setSaving(true);
    setModalError("");
    try {
      const response = await api.patch(
        `/api/organizations/${encodeURIComponent(organizationId)}`,
        { name }
      );
      const payload = response?.data?.data ?? response?.data ?? {};
      setOrganizations((current) =>
        current.map((org) =>
          getOrganizationId(org) === organizationId
            ? { ...org, ...payload, name: payload.name || name }
            : org
        )
      );
      setEditingOrg(null);
      setEditName("");
      showNotice("Organization updated successfully.");
    } catch (error) {
      setModalError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const openDeleteConfirmation = (org) => {
    setConfirmDeleteOrg(org);
    setActiveMenu(null);
  };

  const handleDeleteOrganization = () => {
    setConfirmDeleteOrg(null);
    showNotice(
      "Delete is not connected yet. The backend delete endpoint is needed.",
      "info"
    );
  };

  const openWorkspace = (org) => {
    const organizationId = getOrganizationId(org);
    if (!organizationId) {
      showNotice("This organization has no valid ID.", "error");
      return;
    }
    navigate(`/organizations/${encodeURIComponent(organizationId)}`);
  };

  return (
    <OnboardingLayout>
      <div className="min-h-screen w-full px-3 py-3 sm:px-4 lg:px-5">
        <div className="mx-auto w-full max-w-none">
          <header className="mb-7">
            <button
              type="button"
              onClick={() => navigate("/organization")}
              aria-label="Back to organization options"
              className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white transition hover:bg-white/10"
            >
              <FiArrowLeft size={19} />
            </button>

            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">
                  Your workspace
                </p>
                <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Organizations
                </h1>
                <p className="mt-2 text-sm leading-6 text-blue-100/70 sm:text-base">
                  Manage your organizations and continue where your team works.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/organization/create")}
                className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-gradient-to-r from-[#1680FF] to-[#0057D9] px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-110 sm:self-auto"
              >
                <FiPlus size={18} />
                Create organization
              </button>
            </div>
          </header>

          <section className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-md">
              <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-blue-200/60" size={18} />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search organizations..."
                aria-label="Search organizations"
                className="w-full rounded-xl border border-white/15 bg-[#0A376D]/70 py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-blue-100/45 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
              />
            </div>
            <p className="text-sm text-blue-100/70">
              {organizations.length} {organizations.length === 1 ? "organization" : "organizations"}
            </p>
          </section>

          {notice && (
            <div
              role="status"
              className={`mb-5 flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
                notice.type === "error"
                  ? "border-red-300/20 bg-red-500/10 text-red-100"
                  : notice.type === "info"
                    ? "border-blue-300/20 bg-blue-400/10 text-blue-100"
                    : "border-emerald-300/20 bg-emerald-500/10 text-emerald-100"
              }`}
            >
              <p>{notice.message}</p>
              <button
                type="button"
                onClick={() => {
                  if (noticeTimer.current) clearTimeout(noticeTimer.current);
                  noticeTimer.current = null;
                  setNotice(null);
                }}
                aria-label="Dismiss notification"
                className="shrink-0 opacity-80 hover:opacity-100"
              >
                <FiX size={17} />
              </button>
            </div>
          )}

          {loading && (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-16 text-center">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-blue-400" />
              <p className="text-sm text-blue-100/70">Loading your organizations...</p>
            </div>
          )}

          {!loading && loadError && (
            <div className="rounded-2xl border border-red-300/20 bg-red-500/5 px-5 py-12 text-center">
              <p className="text-sm text-red-100">{loadError}</p>
              <button
                type="button"
                onClick={fetchOrganizations}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/15"
              >
                <FiRefreshCw size={16} />
                Try again
              </button>
            </div>
          )}

          {!loading && !loadError && (
            filteredOrganizations.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {filteredOrganizations.map((org) => {
                  const organizationId = getOrganizationId(org);

                  return (
                    <article
                      key={organizationId || org.slug || org.name}
                      role="button"
                      tabIndex={0}
                      onClick={() => openWorkspace(org)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openWorkspace(org);
                        }
                      }}
                      className="group relative flex min-h-[190px] cursor-pointer flex-col gap-4 rounded-2xl border border-white/10 bg-gradient-to-br from-[#163B66]/85 via-[#102F56]/85 to-[#0B2850]/90 p-5 shadow-lg shadow-black/10 backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-300/35 hover:shadow-blue-950/20 sm:p-6"
                    >
                      <div className="flex items-start gap-4 pr-9">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.07] text-blue-200">
                          {org.logo ? (
                            <img src={org.logo} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <FiBriefcase size={25} />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h2 className="break-words text-lg font-semibold text-white transition group-hover:text-blue-200">
                            {org.name || "Untitled organization"}
                          </h2>
                          {org.slug && (
                            <p className="mt-1 truncate text-sm text-blue-100/55">{org.slug}</p>
                          )}
                        </div>
                      </div>

                      {org.role && (
                        <span className="w-fit rounded-full border border-blue-300/20 bg-blue-400/10 px-2.5 py-1 text-[11px] font-medium text-blue-100">
                          {getRoleLabel(org.role)}
                        </span>
                      )}

                      <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/10 pt-4">
                        <span className="inline-flex items-center gap-2 text-xs text-blue-100/75">
                          <FiUsers size={15} />
                          {org.membersCount ?? org.memberCount ?? 0} members
                        </span>
                        <span className="inline-flex items-center gap-2 text-xs text-blue-100/75">
                          <FiGrid size={15} />
                          {org.teamsCount ?? org.teamCount ?? 0} teams
                        </span>
                      </div>

                      <div
                        className="absolute right-4 top-4"
                        ref={activeMenu === organizationId ? menuRef : null}
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                      >
                        <button
                          type="button"
                          aria-label={`Options for ${org.name || "organization"}`}
                          aria-expanded={activeMenu === organizationId}
                          onClick={() => setActiveMenu((current) => current === organizationId ? null : organizationId)}
                          className="flex h-8 w-8 items-center justify-center text-blue-100/80 transition hover:text-white"
                        >
                          <FiMoreVertical size={21} />
                        </button>

                        {activeMenu === organizationId && (
                          <div className="absolute right-0 top-9 z-20 w-44 overflow-hidden rounded-xl border border-white/10 bg-[#092952] p-1.5 shadow-2xl">
                            <button
                              type="button"
                              onClick={() => openEditModal(org)}
                              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-blue-50 transition hover:bg-white/10"
                            >
                              <FiEdit2 size={16} />
                              Edit organization
                            </button>
                            <button
                              type="button"
                              onClick={() => openDeleteConfirmation(org)}
                              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-red-200 transition hover:bg-red-500/10"
                            >
                              <FiTrash2 size={16} />
                              Delete organization
                            </button>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-14 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-blue-200">
                  {search ? <FiSearch size={24} /> : <FiBriefcase size={24} />}
                </div>
                <h2 className="text-lg font-semibold text-white">
                  {search ? "No matching organizations" : "No organizations yet"}
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-blue-100/65">
                  {search
                    ? "Try a different name or search term."
                    : "Create an organization or join one using an invitation to get started."}
                </p>
                {!search && (
                  <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => navigate("/organization/create")}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1680FF] to-[#0057D9] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
                    >
                      <FiPlus size={17} />
                      Create organization
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate("/organization/join")}
                      className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                    >
                      Join organization
                    </button>
                  </div>
                )}
              </div>
            )
          )}
        </div>

        {editingOrg && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/65 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeEditModal();
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-organization-title"
              className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0B2B52] p-5 shadow-2xl sm:p-6"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 id="edit-organization-title" className="text-xl font-semibold text-white">Edit organization</h2>
                  <p className="mt-1 text-sm text-blue-100/65">Update the name of your organization.</p>
                </div>
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={saving}
                  aria-label="Close edit dialog"
                  className="rounded-lg p-2 text-blue-100/70 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                >
                  <FiX size={19} />
                </button>
              </div>

              <form onSubmit={handleEditOrganization}>
                <label htmlFor="organization-name" className="mb-2 block text-sm font-medium text-blue-50">
                  Organization name
                </label>
                <input
                  id="organization-name"
                  type="text"
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  maxLength={100}
                  autoFocus
                  required
                  className="w-full rounded-xl border border-white/15 bg-[#062044] px-4 py-3 text-sm text-white outline-none placeholder:text-blue-100/40 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                  placeholder="Enter organization name"
                />
                {modalError && <p role="alert" className="mt-3 text-sm text-red-300">{modalError}</p>}
                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    disabled={saving}
                    className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1680FF] to-[#0057D9] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60"
                  >
                    {saving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
                    {saving ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        {confirmDeleteOrg && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setConfirmDeleteOrg(null);
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-organization-title"
              className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0B2B52] p-5 shadow-2xl sm:p-6"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-300">
                <FiTrash2 size={22} />
              </div>
              <h2 id="delete-organization-title" className="text-xl font-semibold text-white">Delete organization?</h2>
              <p className="mt-2 text-sm leading-6 text-blue-100/70">
                The delete action is not connected because the backend delete endpoint has not been confirmed.
              </p>
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteOrg(null)}
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteOrganization}
                  className="rounded-xl border border-red-300/20 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-200 transition hover:bg-red-500/20"
                >
                  Close
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </OnboardingLayout>
  );
}