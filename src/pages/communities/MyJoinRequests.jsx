
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiUsers, FiX, FiRefreshCw, FiGlobe } from "react-icons/fi";
import ProfileMenu from "../../components/ProfileMenu";
import {
  getMyJoinRequests,
  cancelCommunityJoinRequest,
} from "../../services/communityService";

function parseRequests(response) {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.requests)) return response.requests;
  if (Array.isArray(response?.data?.requests)) return response.data.requests;
  return [];
}

export default function MyJoinRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelLoading, setCancelLoading] = useState({});

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getMyJoinRequests();
      setRequests(parseRequests(response));
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Could not load your join requests. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  async function handleCancel(request) {
    const communityId =
      request.communityId ||
      request.community?.id ||
      request.community?._id;

    if (!communityId) {
      setError("Community information is missing for this request.");
      return;
    }

    setCancelLoading((current) => ({
      ...current,
      [communityId]: true,
    }));

    setError("");

    try {
      await cancelCommunityJoinRequest(communityId);
      await loadRequests();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Could not cancel the join request. Please try again."
      );
    } finally {
      setCancelLoading((current) => ({
        ...current,
        [communityId]: false,
      }));
    }
  }

  return (
    <div
      className="relative isolate flex h-dvh flex-col overflow-hidden text-white"
      style={{
        backgroundColor: "#062C5F",
        backgroundImage: "linear-gradient(to bottom, #213F70 0%, #315A8A 35%, #506D9A 65%, #7698C5 100%)",
        backgroundRepeat: "no-repeat",
        backgroundSize: "100% 100%",
      }}
    >
      <header className="relative z-20 flex h-16 min-h-16 shrink-0 items-center border-b border-white/15 bg-[#062C5F]/85 px-4 shadow-sm sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate("/communities")}
          aria-label="Back to communities"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 text-white/80 transition hover:bg-white/10"
        >
          <FiArrowLeft size={18} />
        </button>

        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="absolute left-1/2 -translate-x-1/2 font-sans text-xl font-extrabold tracking-[0.18em] text-white sm:text-2xl"
        >
          QUORUM
        </button>

        <div className="ml-auto">
          <ProfileMenu />
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-8 pt-6 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-[1000px]">
          <section className="rounded-2xl border border-white/15 bg-[#1F5A91]/75 p-5 shadow-lg backdrop-blur-md sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
              Community activity
            </p>
            <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
              My Join Requests
            </h1>
            <p className="mt-2 text-sm text-blue-100/75">
              Track your pending requests to join communities.
            </p>
          </section>

          <section className="mt-7">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-white">
                Pending Requests
              </h2>

              <button
                type="button"
                onClick={loadRequests}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
              >
                <FiRefreshCw size={15} />
                Refresh
              </button>
            </div>

            {error && (
              <div role="alert" className="mb-4 rounded-xl border border-red-200/30 bg-red-500/15 p-4 text-sm text-red-100">
                {error}
              </div>
            )}

            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {[1, 2].map((item) => (
                  <div key={item} className="h-36 animate-pulse rounded-2xl border border-white/20 bg-[#D9EAFE]/20" />
                ))}
              </div>
            ) : requests.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/30 bg-[#D9EAFE]/15 px-5 py-14 text-center">
                <FiUsers className="mx-auto text-blue-100" size={30} />
                <h3 className="mt-4 text-base font-semibold text-white">
                  No pending requests
                </h3>
                <p className="mt-2 text-sm text-blue-50/75">
                  Communities you request to join will appear here.
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/communities")}
                  className="mt-5 rounded-lg bg-[#0068FF] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0879F9]"
                >
                  Discover Communities
                </button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {requests.map((request, index) => {
                  const community = request.community || request;
                  const communityId =
                    request.communityId ||
                    community.id ||
                    community._id ||
                    index;

                  return (
                    <article
                      key={request.id || request._id || communityId}
                      className="rounded-2xl border border-white/25 bg-[#2A4F74]/90 p-5 shadow-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/30 bg-[#EAF4FF]/25 text-blue-50">
                          <FiGlobe size={23} />
                        </span>

                        <div className="min-w-0 flex-1">
                          <h3 className="break-words text-base font-semibold text-white">
                            {community.name || "Community"}
                          </h3>
                          <p className="mt-1 text-xs text-blue-100/75">
                            Pending approval
                          </p>
                        </div>
                      </div>

                      <p className="mt-3 line-clamp-3 text-sm leading-5 text-blue-50/85">
                        {community.description || "Community workspace"}
                      </p>

                      <button
                        type="button"
                        disabled={Boolean(cancelLoading[communityId])}
                        onClick={() => handleCancel(request)}
                        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500/20 disabled:opacity-50"
                      >
                        <FiX size={16} />
                        {cancelLoading[communityId] ? "Cancelling..." : "Cancel Request"}
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
