
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiPlus,
  FiSearch,
  FiBriefcase,
  FiMoreVertical,
  FiEdit2,
  FiTrash2,
  FiX,
  FiRefreshCw,
} from "react-icons/fi";
import api from "../../services/api";
import OnboardingLayout from "../../components/OnboardingLayout";

const MESSAGE_DURATION = 3000;

const getOrganizationId = (org) => org?.id || org?._id;

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  "Something went wrong. Please try again.";

const getRoleLabel = (role) =>
  role
    ? role
        .toString()
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
    : "Member";

const getItems = (response, key) => {
  const payload = response?.data?.data ?? response?.data;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.[key])) return payload[key];

  return [];
};

const primaryButton =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#0066FF] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#0148B3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] disabled:cursor-wait disabled:opacity-60";

const secondaryButton =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#B6C6D9]/40 bg-[#315A8A]/70 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#315A8A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]";

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
    if (noticeTimer.current) {
      clearTimeout(noticeTimer.current);
    }

    setNotice({ message, type });

    noticeTimer.current = setTimeout(() => {
      setNotice(null);
      noticeTimer.current = null;
    }, MESSAGE_DURATION);
  }, []);

  useEffect(() => {
    return () => {
      if (noticeTimer.current) {
        clearTimeout(noticeTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setActiveMenu(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const fetchCounts = async (organizationId) => {
    try {
      const [membersResponse, teamsResponse] = await Promise.all([
        api.get(`/api/organizations/${organizationId}/members`),
        api.get(`/api/organizations/${organizationId}/teams`),
      ]);

      return {
        membersCount: getItems(membersResponse, "members").length,
        teamsCount: getItems(teamsResponse, "teams").length,
      };
    } catch (error) {
      console.error(
        "Failed to load organization counts:",
        organizationId,
        error
      );

      return {
        membersCount: 0,
        teamsCount: 0,
      };
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
            return {
              ...org,
              membersCount: null,
              teamsCount: null,
            };
          }

          const counts = await fetchCounts(organizationId);

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

  const dismissNotice = () => {
    if (noticeTimer.current) {
      clearTimeout(noticeTimer.current);
    }

    noticeTimer.current = null;
    setNotice(null);
  };

  return (
    <OnboardingLayout wide>
      <div className="w-full min-w-0 text-[#EDEFF7]">
        {/* Page heading */}
        <header className="mb-6 border-b border-white/20 pb-6 sm:mb-7">
          <button
            type="button"
            onClick={() => navigate("/organization")}
            aria-label="Back to organization options"
            className="mb-5 flex h-9 w-9 items-center justify-center rounded-lg border border-white/30 bg-[#315A8A]/60 text-white transition hover:bg-[#315A8A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
          >
            <FiArrowLeft size={18} />
          </button>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#C6EAFF]">
                Your workspace
              </p>

              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Organizations
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-white/80">
                Manage your organizations and continue where your team works.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/organization/create")}
              className={`${primaryButton} w-full shrink-0 sm:w-auto`}
            >
              <FiPlus size={17} />
              Create organization
            </button>
          </div>
        </header>

        {/* Search */}
        <section className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex min-h-11 w-full items-center gap-3 rounded-lg border border-[#B6C6D9]/40 bg-[#315A8A]/75 px-4 shadow-sm transition focus-within:border-[#C6EAFF] focus-within:ring-2 focus-within:ring-[#38BDF8]/20 sm:max-w-md">
            <FiSearch className="shrink-0 text-[#EDEFF7]" size={17} />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search organizations..."
              aria-label="Search organizations"
              className="w-full min-w-0 bg-transparent py-2 text-sm text-white outline-none placeholder:text-white/70"
            />
          </label>

          <p className="text-sm font-medium text-white/90 sm:text-right">
            {filteredOrganizations.length} of {organizations.length}{" "}
            {organizations.length === 1
              ? "organization"
              : "organizations"}
          </p>
        </section>

        {/* Notifications */}
        {notice && (
          <div
            role="status"
            className={`mb-5 flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${
              notice.type === "error"
                ? "border-red-200/40 bg-red-400/15 text-red-50"
                : notice.type === "info"
                  ? "border-[#38BDF8]/40 bg-[#38BDF8]/15 text-white"
                  : "border-emerald-200/40 bg-emerald-400/15 text-emerald-50"
            }`}
          >
            <p>{notice.message}</p>

            <button
              type="button"
              onClick={dismissNotice}
              aria-label="Dismiss notification"
              className="shrink-0 rounded-md p-1 opacity-80 transition hover:opacity-100"
            >
              <FiX size={17} />
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="rounded-xl border border-white/25 bg-[#315A8A]/45 px-5 py-16 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />

            <p className="text-sm text-white/85">
              Loading your organizations...
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && loadError && (
          <div className="rounded-xl border border-red-200/35 bg-[#315A8A]/45 px-5 py-12 text-center">
            <p className="text-sm text-red-50">{loadError}</p>

            <button
              type="button"
              onClick={fetchOrganizations}
              className={`${secondaryButton} mt-5`}
            >
              <FiRefreshCw size={16} />
              Try again
            </button>
          </div>
        )}

        {/* Organization cards */}
        {!loading &&
          !loadError &&
          (filteredOrganizations.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
              {filteredOrganizations.map((org) => {
                const organizationId = getOrganizationId(org);

                return (
                  <article
                    key={organizationId || org.slug || org.name}
                    role="button"
                    tabIndex={0}
                    aria-label={`Open ${org.name || "organization"}`}
                    onClick={() => openWorkspace(org)}
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" ||
                        event.key === " "
                      ) {
                        event.preventDefault();
                        openWorkspace(org);
                      }
                    }}
                    className="group relative flex min-h-[150px] min-w-0 cursor-pointer flex-col justify-center gap-4 rounded-xl border border-[#B6C6D9]/30 bg-[#7191B0]/55 p-4 shadow-sm transition duration-200 hover:border-[#C6EAFF]/60 hover:bg-[#85A4C1]/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] sm:p-5"
                  >
                    <div className="flex min-w-0 items-center gap-3 pr-9 sm:gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/30 bg-[#315A8A]/70 text-white sm:h-12 sm:w-12">
                        {org.logo ? (
                          <img
                            src={org.logo}
                            alt={`${org.name || "Organization"} logo`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <FiBriefcase size={22} />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h2 className="break-words text-base font-semibold text-white transition group-hover:text-[#EDEFF7] sm:text-lg">
                          {org.name || "Untitled organization"}
                        </h2>

                        {org.slug && (
                          <p className="mt-1 break-all text-sm text-white/80">
                            {org.slug}
                          </p>
                        )}

                        {org.role && (
                          <span className="mt-2 inline-flex max-w-full items-center rounded-md border border-white/30 bg-[#315A8A]/45 px-2.5 py-1 text-xs font-medium text-white">
                            {getRoleLabel(org.role)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Organization options */}
                    <div
                      className="absolute right-3 top-3"
                      ref={activeMenu === organizationId ? menuRef : null}
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => event.stopPropagation()}
                    >
                      <button
                        type="button"
                        aria-label={`Options for ${org.name || "organization"}`}
                        aria-expanded={activeMenu === organizationId}
                        onClick={() =>
                          setActiveMenu((current) =>
                            current === organizationId
                              ? null
                              : organizationId
                          )
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-white/90 transition hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
                      >
                        <FiMoreVertical size={19} />
                      </button>

                      {activeMenu === organizationId && (
                        <div className="absolute right-0 top-9 z-30 w-48 overflow-hidden rounded-lg border border-white/25 bg-[#315A8A] p-1.5 shadow-xl shadow-[#213F70]/25">
                          <button
                            type="button"
                            onClick={() => openEditModal(org)}
                            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm text-white transition hover:bg-white/15"
                          >
                            <FiEdit2 size={16} />
                            Edit organization
                          </button>

                          <button
                            type="button"
                            onClick={() => openDeleteConfirmation(org)}
                            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm text-red-100 transition hover:bg-red-400/20"
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
            <div className="rounded-xl border border-white/25 bg-[#7191B0]/40 px-5 py-14 text-center sm:py-16">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/30 bg-[#315A8A]/45 text-white">
                {search ? <FiSearch size={22} /> : <FiBriefcase size={22} />}
              </div>

              <h2 className="text-lg font-semibold text-white">
                {search
                  ? "No matching organizations"
                  : "No organizations yet"}
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/80">
                {search
                  ? "Try a different name or search term."
                  : "Create an organization or join one using an invitation to get started."}
              </p>

              {!search && (
                <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => navigate("/organization/create")}
                    className={primaryButton}
                  >
                    <FiPlus size={17} />
                    Create organization
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/organization/join")}
                    className={secondaryButton}
                  >
                    Join organization
                  </button>
                </div>
              )}
            </div>
          ))}

        {/* Edit organization modal */}
        {editingOrg && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#213F70]/65 p-3 backdrop-blur-sm sm:p-5"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeEditModal();
              }
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-organization-title"
              className="my-auto w-full max-w-md rounded-xl border border-white/30 bg-[#315A8A] p-5 shadow-2xl sm:p-6"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2
                    id="edit-organization-title"
                    className="text-xl font-semibold text-white"
                  >
                    Edit organization
                  </h2>

                  <p className="mt-1 text-sm text-white/80">
                    Update the name of your organization.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={saving}
                  aria-label="Close edit dialog"
                  className="rounded-lg p-2 text-white/80 transition hover:bg-white/15 hover:text-white disabled:opacity-50"
                >
                  <FiX size={19} />
                </button>
              </div>

              <form onSubmit={handleEditOrganization}>
                <label
                  htmlFor="organization-name"
                  className="mb-2 block text-sm font-medium text-white"
                >
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
                  className="w-full rounded-lg border border-white/30 bg-[#213F70]/60 px-4 py-3 text-sm text-white outline-none placeholder:text-white/60 focus:border-[#C6EAFF] focus:ring-2 focus:ring-[#38BDF8]/25"
                  placeholder="Enter organization name"
                />

                {modalError && (
                  <p role="alert" className="mt-3 text-sm text-red-100">
                    {modalError}
                  </p>
                )}

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    disabled={saving}
                    className={secondaryButton}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className={primaryButton}
                  >
                    {saving && (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    )}

                    {saving ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        {/* Delete confirmation */}
        {confirmDeleteOrg && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#213F70]/65 p-3 backdrop-blur-sm sm:p-5"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setConfirmDeleteOrg(null);
              }
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-organization-title"
              className="my-auto w-full max-w-md rounded-xl border border-white/30 bg-[#315A8A] p-5 shadow-2xl sm:p-6"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-red-200/35 bg-red-300/15 text-red-100">
                <FiTrash2 size={21} />
              </div>

              <h2
                id="delete-organization-title"
                className="text-xl font-semibold text-white"
              >
                Delete organization?
              </h2>

              <p className="mt-2 text-sm leading-6 text-white/85">
                The delete action is not connected because the backend
                delete endpoint has not been confirmed.
              </p>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteOrg(null)}
                  className={secondaryButton}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleDeleteOrganization}
                  className="inline-flex min-h-10 items-center justify-center rounded-lg border border-red-200/40 bg-red-300/15 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-300/25"
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
