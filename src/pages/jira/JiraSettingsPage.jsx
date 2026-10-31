import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiUsers, FiRefreshCw, FiCheckCircle, FiAlertCircle, FiLogIn } from "react-icons/fi";
import { getOrganizations } from "../../services/organizationService";
import { setupOrganizationJira } from "../../services/jiraService";
import { useAuth } from "../../context/AuthContext";
import OrgJiraSettings from "../../components/jira/OrgJiraSettings";

export default function JiraSettingsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState(searchParams.get("orgId") || "");
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [callbackNotice, setCallbackNotice] = useState({ type: "", message: "" });

  const getOrgId = (org) => org?._id || org?.id;

  useEffect(() => {
    const status = searchParams.get("status");
    const message = searchParams.get("message");

    if (status === "success") {
      setCallbackNotice({
        type: "success",
        message: "Jira connected successfully! Your personal Atlassian account has been authorized.",
      });
      const pendingKey = sessionStorage.getItem("pending_jira_project_key");
      if (pendingKey && selectedOrgId) {
        setupOrganizationJira(selectedOrgId, pendingKey)
          .then(() => {
            sessionStorage.removeItem("pending_jira_project_key");
          })
          .catch(() => {});
      }
    } else if (status === "error") {
      setCallbackNotice({
        type: "error",
        message: message || "Jira authorization failed. Please try again.",
      });
    }
  }, [searchParams, selectedOrgId]);

  useEffect(() => {
    getOrganizations()
      .then((res) => {
        const raw = res?.data?.data ?? res?.data ?? res;
        const orgList = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.organizations)
          ? raw.organizations
          : Array.isArray(res?.organizations)
          ? res.organizations
          : [];

        setOrganizations(orgList);
        if (!selectedOrgId && orgList.length > 0) {
          const firstId = getOrgId(orgList[0]);
          if (firstId) setSelectedOrgId(firstId);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch user organizations:", err);
      })
      .finally(() => {
        setLoadingOrgs(false);
      });
  }, [selectedOrgId]);

  return (
    <div
      className="relative isolate flex min-h-dvh flex-col overflow-hidden text-white"
      style={{
        backgroundColor: "#062C5F",
        backgroundImage: `linear-gradient(
          to bottom,
          #213F70 0%,
          #315A8A 35%,
          #506D9A 65%,
          #7698C5 100%
        )`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "100% 100%",
      }}
    >
      <header className="relative z-20 flex h-16 min-h-16 shrink-0 items-center border-b border-gray-200/20 bg-[#062C5F] px-4 shadow-sm sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          aria-label="Back to dashboard"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-[#213F70] transition hover:bg-gray-100"
        >
          <FiArrowLeft size={18} />
        </button>
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="absolute left-1/2 -translate-x-1/2 font-sans text-xl font-extrabold tracking-[0.18em] text-white transition hover:text-[#315A8A] sm:text-2xl"
        >
          QUORUM
        </button>
      </header>

  
      <div className="relative z-10 flex min-h-0 flex-1">
        <main className="min-w-0 flex-1 overflow-y-auto overscroll-y-contain px-4 pb-8 pt-5 sm:px-6 sm:pt-7 lg:px-8 lg:pt-8">
          <div className="mx-auto w-full max-w-[1180px] space-y-6">

            {callbackNotice.message && (
              <div
                className={`flex items-start gap-3 rounded-2xl border p-5 backdrop-blur-md text-sm ${
                  callbackNotice.type === "success"
                    ? "border-white/20 bg-[#1F5A91]/80 text-white shadow-md"
                    : "border-red-200/30 bg-red-500/20 text-red-100"
                }`}
              >
                {callbackNotice.type === "success" ? (
                  <FiCheckCircle className="h-5 w-5 shrink-0 text-blue-200" />
                ) : (
                  <FiAlertCircle className="h-5 w-5 shrink-0 text-red-200" />
                )}
                <span className="flex-1 font-medium">{callbackNotice.message}</span>
                <button
                  type="button"
                  onClick={() => setCallbackNotice({ type: "", message: "" })}
                  className="text-white/60 hover:text-white"
                >
                  ×
                </button>
              </div>
            )}

      
            <section className="flex flex-col justify-between gap-5 rounded-2xl border border-white/15 bg-[#1F5A91]/75 p-5 shadow-[0_8px_25px_rgba(0,0,0,0.08)] backdrop-blur-md sm:flex-row sm:items-center sm:p-7">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
                  Integration Settings
                </p>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Atlassian Jira
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100/75">
                  Connect your personal Atlassian account and configure organization Jira workspace syncing.
                </p>
              </div>

              {organizations.length > 0 && (
                <div className="flex items-center gap-2.5 rounded-xl border border-white/20 bg-[#0B2F58]/40 px-3.5 py-2.5 shadow-sm backdrop-blur-sm">
                  <FiUsers className="text-blue-200" size={16} />
                  <span className="text-xs text-blue-100/80 font-medium">Organization:</span>
                  <select
                    value={selectedOrgId}
                    onChange={(e) => setSelectedOrgId(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-white outline-none cursor-pointer"
                  >
                    {organizations.map((org) => {
                      const id = getOrgId(org);
                      return (
                        <option
                          key={id}
                          value={id}
                          className="bg-[#1F5A91] text-white"
                        >
                          {org.name || "My Organization"}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}
            </section>

            {loadingOrgs ? (
              <div className="flex h-48 items-center justify-center text-blue-100/70">
                <FiRefreshCw className="h-6 w-6 animate-spin text-blue-200" />
              </div>
            ) : organizations.length === 0 ? (

              <div className="rounded-2xl border border-dashed border-white/30 bg-[#D9EAFE]/15 p-8 text-center text-white backdrop-blur-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-blue-50">
                  <FiUsers size={24} />
                </div>
                <h3 className="mt-4 text-base font-semibold text-white">No Organization Selected</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-blue-50/75">
                  Jira connects to a specific Organization. You need to log in and select or create an Organization in Quorum first.
                </p>
                <div className="mt-5 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/20 px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/20 transition"
                  >
                    <FiLogIn size={14} />
                    <span>Log In to Quorum</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/organizations")}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0068FF] px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-[#0879F9] transition"
                  >
                    <span>View Organizations</span>
                  </button>
                </div>
              </div>
            ) : (
              <OrgJiraSettings
                orgId={selectedOrgId}
                isOrgAdmin={true}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
