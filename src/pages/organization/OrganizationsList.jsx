
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiPlus,
  FiSearch,
  FiUsers,
  FiGrid,
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
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
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
    <OnboardingLayout>
    
      {/* <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-b from-[#0C315B] via-[#204D79] to-[#B8CCDD] px-3 py-5 text-white sm:px-5 sm:py-8 lg:px-8"> */}
        {/* <main className="mx-auto w-full max-w-6xl rounded-2xl border border-white/20 bg-[#244A70]/55 p-4 shadow-2xl shadow-[#082747]/15 backdrop-blur-xl sm:rounded-3xl sm:p-6 lg:p-8"> */}


          <header className="mb-7">
            <button
              type="button"
              onClick={() => navigate("/organization")}
              aria-label="Back to organization options"
              className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
            >
              <FiArrowLeft size={19} />
            </button>

            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#A8D7FF]">
                  Your workspace
                </p>

                <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                  Organizations
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-50/80 sm:text-base">
                  Manage your organizations and continue where your
                  team works.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/organization/create")}
                className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1680FF] to-[#0758D8] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/20 transition hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 sm:w-auto"
              >
                <FiPlus size={18} />
                Create organization
              </button>
            </div>
          </header>

          <section className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-md">
              <FiSearch
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-blue-100/75"
                size={18}
              />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search organizations..."
                aria-label="Search organizations"
                className="min-h-12 w-full rounded-xl border border-white/20 bg-[#173A5E]/65 py-3 pl-11 pr-4 text-sm text-white shadow-sm outline-none transition placeholder:text-blue-100/65 focus:border-blue-300/80 focus:ring-2 focus:ring-blue-300/20"
              />
            </div>

            <p className="text-sm font-medium text-blue-50/85 sm:text-right">
              {filteredOrganizations.length} of {organizations.length}{" "}
              {organizations.length === 1
                ? "organization"
                : "organizations"}
            </p>
          </section>

          {notice && (
            <div
              role="status"
              className={`mb-5 flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
                notice.type === "error"
                  ? "border-red-200/30 bg-red-400/15 text-red-50"
                  : notice.type === "info"
                    ? "border-blue-200/30 bg-blue-300/15 text-blue-50"
                    : "border-emerald-200/30 bg-emerald-300/15 text-emerald-50"
              }`}
            >
              <p>{notice.message}</p>

              <button
                type="button"
                onClick={dismissNotice}
                aria-label="Dismiss notification"
                className="shrink-0 rounded-md p-0.5 opacity-80 transition hover:opacity-100"
              >
                <FiX size={17} />
              </button>
            </div>
          )}

          {loading && (
            <div className="rounded-2xl border border-white/15 bg-white/[0.07] px-5 py-16 text-center">
              <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-2 border-white/25 border-t-blue-300" />

              <p className="text-sm text-blue-50/80">
                Loading your organizations...
              </p>
            </div>
          )}

          {!loading && loadError && (
            <div className="rounded-2xl border border-red-200/25 bg-red-300/10 px-5 py-12 text-center">
              <p className="text-sm text-red-50">{loadError}</p>

              <button
                type="button"
                onClick={fetchOrganizations}
                className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/20"
              >
                <FiRefreshCw size={16} />
                Try again
              </button>
            </div>
          )}

          {!loading && !loadError && (
            filteredOrganizations.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:gap-6">
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
                      className="group relative flex min-h-[215px] min-w-0 cursor-pointer flex-col gap-4 rounded-2xl border border-white/20 bg-[#7191B0]/30 p-4 shadow-lg shadow-[#082747]/10 backdrop-blur-md transition duration-200 hover:-translate-y-1 hover:border-blue-100/45 hover:bg-[#85A4C1]/35 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 sm:p-5 lg:p-6"
                    >
                      <div className="flex min-w-0 items-start gap-3 pr-8 sm:gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-blue-200/35 bg-[#173D65]/65 text-[#BDE0FF] shadow-sm sm:h-14 sm:w-14">
                          {org.logo ? (
                            <img
                              src={org.logo}
                              alt={`${org.name || "Organization"} logo`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <FiBriefcase size={24} />
                          )}
                        </div>

                        <div className="min-w-0 flex-1 pt-0.5">
                          <h2 className="break-words text-lg font-semibold text-white transition group-hover:text-[#D7EBFF] sm:text-xl">
                            {org.name || "Untitled organization"}
                          </h2>

                          {org.slug && (
                            <p className="mt-1 break-all text-sm text-blue-50/75">
                              {org.slug}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="min-h-7">
                        {org.role && (
                          <span className="inline-flex max-w-full items-center rounded-full border border-blue-200/35 bg-blue-300/15 px-3 py-1 text-xs font-semibold text-blue-50">
                            {getRoleLabel(org.role)}
                          </span>
                        )}
                      </div>

                      <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-white/20 pt-4">
                        <span className="inline-flex items-center gap-2 text-sm text-blue-50/90">
                          <FiUsers
                            size={16}
                            className="shrink-0 text-[#C1DFFF]"
                          />
                          <span className="font-semibold text-white">
                            {org.membersCount ??
                              org.memberCount ??
                              "—"}
                          </span>
                          <span>
                            {(org.membersCount ??
                              org.memberCount) === 1
                              ? "member"
                              : "members"}
                          </span>
                        </span>

                        <span className="inline-flex items-center gap-2 text-sm text-blue-50/90">
                          <FiGrid
                            size={16}
                            className="shrink-0 text-[#C1DFFF]"
                          />
                          <span className="font-semibold text-white">
                            {org.teamsCount ?? org.teamCount ?? "—"}
                          </span>
                          <span>
                            {(org.teamsCount ?? org.teamCount) === 1
                              ? "team"
                              : "teams"}
                          </span>
                        </span>
                      </div>

                      <div
                        className="absolute right-3 top-3 sm:right-4 sm:top-4"
                        ref={
                          activeMenu === organizationId
                            ? menuRef
                            : null
                        }
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) =>
                          event.stopPropagation()
                        }
                      >
                        <button
                          type="button"
                          aria-label={`Options for ${org.name || "organization"}`}
                          aria-expanded={
                            activeMenu === organizationId
                          }
                          onClick={() =>
                            setActiveMenu((current) =>
                              current === organizationId
                                ? null
                                : organizationId
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-blue-50/85 transition hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
                        >
                          <FiMoreVertical size={20} />
                        </button>

                        {activeMenu === organizationId && (
                          <div className="absolute right-0 top-10 z-30 w-48 overflow-hidden rounded-xl border border-white/20 bg-[#173B61] p-1.5 shadow-2xl shadow-black/25">
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
                              onClick={() =>
                                openDeleteConfirmation(org)
                              }
                              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-red-200 transition hover:bg-red-400/15"
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
              <div className="rounded-2xl border border-white/20 bg-white/[0.07] px-5 py-14 text-center sm:py-16">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-200/30 bg-blue-300/15 text-blue-100">
                  {search ? (
                    <FiSearch size={24} />
                  ) : (
                    <FiBriefcase size={24} />
                  )}
                </div>

                <h2 className="text-lg font-semibold text-white sm:text-xl">
                  {search
                    ? "No matching organizations"
                    : "No organizations yet"}
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-blue-50/80">
                  {search
                    ? "Try a different name or search term."
                    : "Create an organization or join one using an invitation to get started."}
                </p>

                {!search && (
                  <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() =>
                        navigate("/organization/create")
                      }
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1680FF] to-[#0758D8] px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
                    >
                      <FiPlus size={17} />
                      Create organization
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate("/organization/join")}
                      className="min-h-11 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
                    >
                      Join organization
                    </button>
                  </div>
                )}
              </div>
            )
          )}
        {/* </main> */}


        {editingOrg && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#07192B]/65 p-3 backdrop-blur-md sm:p-5"
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
              className="my-auto w-full max-w-md rounded-2xl border border-white/20 bg-[#21496F] p-5 shadow-2xl sm:p-6"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2
                    id="edit-organization-title"
                    className="text-xl font-semibold text-white"
                  >
                    Edit organization
                  </h2>

                  <p className="mt-1 text-sm text-blue-50/75">
                    Update the name of your organization.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={saving}
                  aria-label="Close edit dialog"
                  className="rounded-lg p-2 text-blue-50/80 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                >
                  <FiX size={19} />
                </button>
              </div>

              <form onSubmit={handleEditOrganization}>
                <label
                  htmlFor="organization-name"
                  className="mb-2 block text-sm font-medium text-blue-50"
                >
                  Organization name
                </label>

                <input
                  id="organization-name"
                  type="text"
                  value={editName}
                  onChange={(event) =>
                    setEditName(event.target.value)
                  }
                  maxLength={100}
                  autoFocus
                  required
                  className="w-full rounded-xl border border-white/20 bg-[#173654]/75 px-4 py-3 text-sm text-white outline-none placeholder:text-blue-100/50 focus:border-blue-300 focus:ring-2 focus:ring-blue-300/20"
                  placeholder="Enter organization name"
                />

                {modalError && (
                  <p
                    role="alert"
                    className="mt-3 text-sm text-red-200"
                  >
                    {modalError}
                  </p>
                )}

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    disabled={saving}
                    className="min-h-11 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/15 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1680FF] to-[#0758D8] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60"
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

        {confirmDeleteOrg && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#07192B]/65 p-3 backdrop-blur-md sm:p-5"
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
              className="my-auto w-full max-w-md rounded-2xl border border-white/20 bg-[#21496F] p-5 shadow-2xl sm:p-6"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-red-200/20 bg-red-300/10 text-red-200">
                <FiTrash2 size={22} />
              </div>

              <h2
                id="delete-organization-title"
                className="text-xl font-semibold text-white"
              >
                Delete organization?
              </h2>

              <p className="mt-2 text-sm leading-6 text-blue-50/80">
                The delete action is not connected because the
                backend delete endpoint has not been confirmed.
              </p>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteOrg(null)}
                  className="min-h-11 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/15"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleDeleteOrganization}
                  className="min-h-11 rounded-xl border border-red-200/25 bg-red-300/10 px-4 py-2.5 text-sm font-semibold text-red-100 transition hover:bg-red-300/20"
                >
                  Close
                </button>
              </div>
            </section>
          </div>
        )}
      {/* </div> */}
    </OnboardingLayout>
  );
}
