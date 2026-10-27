import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import {
  FiPlus,
  FiUsers,
  FiSearch,
  FiRefreshCw,
  FiX,
  FiGlobe,
  FiArrowUpRight,
} from "react-icons/fi";
import {
  getCommunities,
  createCommunity,
} from "../../services/communityService";

function parseCommunities(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.communities)) return response.communities;
  if (Array.isArray(response?.data?.communities)) {
    return response.data.communities;
  }
  if (Array.isArray(response?.data)) return response.data;
  throw new Error("Unexpected communities API response.");
}

export default function Communities() {
  const navigate = useNavigate();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const [form, setForm] = useState({ name: "", description: "" });

  const loadCommunities = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getCommunities();
      setCommunities(parseCommunities(response));
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (err.response?.status === 404
            ? "Communities API was not found. Please verify the backend route."
            : "Could not load communities. Please try again.")
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCommunities();
  }, [loadCommunities]);

  function openCreateForm() {
    setForm({ name: "", description: "" });
    setFormError("");
    setShowForm(true);
  }

  async function handleCreate(event) {
    event.preventDefault();

    const name = form.name.trim();
    const description = form.description.trim();

    if (!name) {
      setFormError("Please enter a community name.");
      return;
    }

    setCreating(true);
    setFormError("");

    try {
      await createCommunity({ name, description });
      setShowForm(false);
      setForm({ name: "", description: "" });
      await loadCommunities();
    } catch (err) {
      setFormError(
        err.response?.data?.message ||
          (err.response?.status === 404
            ? "Create community API was not found. Please check with the backend team."
            : "Could not create community. Please try again.")
      );
    } finally {
      setCreating(false);
    }
  }

  const filteredCommunities = communities.filter((community) => {
    const query = search.trim().toLowerCase();

    return (
      (community.name || "").toLowerCase().includes(query) ||
      (community.description || "").toLowerCase().includes(query)
    );
  });

  return (

<div
  className="relative isolate flex h-dvh flex-col overflow-hidden text-white"
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
<header className="relative z-20 flex h-16 min-h-16 shrink-0 items-center border-b border-gray-200 bg-[#062C5F] px-4 shadow-sm sm:px-6 lg:px-8">
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
          <div className="mx-auto w-full max-w-[1180px]">
            <section className="flex flex-col justify-between gap-5 rounded-2xl border border-white/15 bg-[#1F5A91]/75 p-5 shadow-[0_8px_25px_rgba(0,0,0,0.08)] backdrop-blur-md sm:flex-row sm:items-center sm:p-7">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
                  Discover your network
                </p>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Communities
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100/75">
                  Discover and participate in public and private interest groups.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/communities/create")}
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0068FF] px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#0879F9]"
              >
                <FiPlus size={18} />
                Create Community
              </button>
            </section>

            <div className="mt-6 flex items-center gap-3 rounded-xl border border-white/20 bg-[#0B2F58]/30 px-4 py-3 shadow-sm backdrop-blur-sm sm:max-w-lg">
              <FiSearch className="shrink-0 text-blue-100/70" size={18} />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search communities..."
                aria-label="Search communities"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-blue-100/60"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="rounded-md p-1 text-blue-100/70 transition hover:bg-white/10 hover:text-white"
                >
                  <FiX size={16} />
                </button>
              )}
            </div>

            <section className="mt-8">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Your communities
                  </h2>
                  <p className="mt-1 text-xs text-blue-100/75">
                    Your spaces for collaboration and ideas
                  </p>
                </div>
                {!loading && (
                  <span className="rounded-full border border-white/20 bg-[#0B2F58]/25 px-3 py-1 text-xs text-blue-50">
                    {filteredCommunities.length} found
                  </span>
                )}
              </div>

              {error && (
                <div
                  role="alert"
                  className="flex flex-col gap-3 rounded-xl border border-red-200/30 bg-red-500/15 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <p className="text-sm text-red-100">{error}</p>
                  <button
                    type="button"
                    onClick={loadCommunities}
                    disabled={loading}
                    className="inline-flex items-center gap-2 self-start rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
                  >
                    <FiRefreshCw size={15} />
                    Retry
                  </button>
                </div>
              )}

              {loading ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="h-32 animate-pulse rounded-2xl border border-white/20 bg-[#D9EAFE]/20"
                    />
                  ))}
                </div>
              ) : filteredCommunities.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/30 bg-[#D9EAFE]/15 px-5 py-14 text-center backdrop-blur-sm">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-blue-50">
                    {search ? <FiSearch size={25} /> : <FiUsers size={25} />}
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-white">
                    {search ? "No communities found" : "Find Your People & Community"}
                  </h3>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-blue-50/75">
                    {search
                      ? "Try another search term."
                      : "Create your first community and bring people together around shared interests."}
                  </p>
                  {!search && (
                    <button
                      type="button"
                      onClick={openCreateForm}
                      className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#0068FF] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0879F9]"
                    >
                      <FiPlus size={16} />
                      Create your first community
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredCommunities.map((community, index) => {
                    const id = community._id || community.id || index;
                    const description =
                      community.description || "Community workspace";
                    const expanded = Boolean(expandedDescriptions[id]);
                    const longDescription = description.length > 100;

                    return (
                      <article
                      key={id}
                      role="link"
                      tabIndex={0}
                      onClick={() => {
                        const communityId = community._id || community.id;
                    
                        if (communityId) {
                          navigate(`/communities/${communityId}`);
                        }
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          const communityId = community._id || community.id;
                    
                          if (communityId) {
                            navigate(`/communities/${communityId}`);
                          }
                        }
                      }}
                      className="flex min-h-[150px] min-w-0 cursor-pointer flex-col rounded-2xl border border-white/30 bg-[#DCEBFA]/25 p-5 shadow-[0_5px_18px_rgba(5,35,75,0.08)] backdrop-blur-[3px] transition duration-200 hover:border-white/45 hover:bg-[#E7F2FF]/35 focus:outline-none focus:ring-2 focus:ring-sky-300"
                    >
                      <div className="flex w-full min-w-0 items-center gap-3 text-left">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/30 bg-[#EAF4FF]/25 text-blue-50">
                          <FiGlobe size={23} />
                        </span>
                    
                        <span className="min-w-0 flex-1">
                          <span className="block break-words text-base font-semibold text-white">
                            {community.name || "Untitled community"}
                          </span>
                          <span className="mt-1 block text-xs text-blue-50/75">
                            Community workspace
                          </span>
                        </span>
                    
                        <FiArrowUpRight
                          size={18}
                          className="shrink-0 text-blue-50/70"
                        />
                      </div>
                    
                      <div className="mt-3 min-w-0">
                        <p
                          className={`break-words text-sm leading-5 text-blue-50/85 ${
                            expanded ? "whitespace-pre-wrap" : "line-clamp-2"
                          }`}
                        >
                          {description}
                        </p>
                    
                        {longDescription && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setExpandedDescriptions((current) => ({
                                ...current,
                                [id]: !current[id],
                              }));
                            }}
                            className="mt-2 text-xs font-semibold text-white underline underline-offset-4"
                          >
                            {expanded ? "Show less" : "Read more"}
                          </button>
                        )}
                      </div>
                    </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#020B18]/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !creating) {
              setShowForm(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-community-title"
            className="my-auto w-full max-w-md rounded-2xl border border-white/25 bg-[#123B6A]/95 p-6 text-white shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-blue-100">
                  <FiGlobe size={20} />
                </span>
                <h2 id="create-community-title" className="mt-4 text-xl font-bold">
                  Create a community
                </h2>
                <p className="mt-2 text-sm leading-6 text-blue-100/75">
                  Add a name and description for your new space.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                disabled={creating}
                aria-label="Close"
                className="rounded-lg p-2 text-blue-100/70 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
              >
                <FiX size={19} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-6">
              <label htmlFor="community-name" className="text-sm font-medium text-blue-50">
                Community name *
              </label>
              <input
                id="community-name"
                type="text"
                value={form.name}
                onChange={(event) => {
                  setForm({ ...form, name: event.target.value });
                  setFormError("");
                }}
                placeholder="e.g. AKGEC Developers"
                maxLength={100}
                required
                autoFocus
                className="mt-2 w-full rounded-xl border border-white/20 bg-[#061B38]/60 px-3 py-3 text-sm text-white outline-none placeholder:text-blue-100/45 focus:border-blue-300"
              />

              <label htmlFor="community-description" className="mt-5 block text-sm font-medium text-blue-50">
                Description
              </label>
              <textarea
                id="community-description"
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
                placeholder="What is this community about?"
                rows={3}
                maxLength={500}
                className="mt-2 max-h-40 w-full resize-y overflow-y-auto rounded-xl border border-white/20 bg-[#061B38]/60 px-3 py-3 text-sm text-white outline-none placeholder:text-blue-100/45 focus:border-blue-300"
              />

              {formError && (
                <p role="alert" className="mt-3 text-sm text-red-200">
                  {formError}
                </p>
              )}

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  disabled={creating}
                  className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-blue-100/90 transition hover:bg-white/10 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !form.name.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0068FF] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0879F9] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating ? "Creating..." : <><FiPlus size={16} /> Create Community</>}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}