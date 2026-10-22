
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiPlus,
  FiUsers,
  FiSearch,
  FiRefreshCw,
  FiX,
  FiGlobe,
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

function Communities() {
  const navigate = useNavigate();

  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
  });

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
    <div className="min-h-screen bg-[#062C5F] text-white">

      <header className="border-b border-white/10 bg-[#062C5F]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-sm text-white/75 hover:text-white"
          >
            <FiArrowLeft size={18} />
            <span>Dashboard</span>
          </button>

          <span className="text-lg font-bold tracking-widest">QUORUM</span>

          <div className="w-20" />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        {/* Title and create action */}
        <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">
              Communities
            </h1>
            <p className="mt-2 text-sm text-blue-100/70 sm:text-base">
              Connect and collaborate with your communities.
            </p>
          </div>

          <button
            onClick={openCreateForm}
            className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-lg bg-blue-500 px-4 py-3 text-sm font-semibold hover:bg-blue-400"
          >
            <FiPlus size={18} />
            Create Community
          </button>
        </section>

        {/* Search */}
        <div className="mt-7 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.07] px-4 py-3 sm:max-w-md">
          <FiSearch className="shrink-0 text-blue-100/60" />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search communities"
            aria-label="Search communities"
            className="w-full bg-transparent text-sm outline-none placeholder:text-blue-100/50"
          />
        </div>

        {/* Community list */}
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Your communities</h2>

          {error && (
            <div
              role="alert"
              className="mt-4 flex flex-col gap-3 rounded-lg border border-red-300/20 bg-red-400/10 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="text-sm text-red-100">{error}</p>

              <button
                onClick={loadCommunities}
                disabled={loading}
                className="inline-flex items-center gap-2 self-start text-sm font-semibold hover:text-blue-200 disabled:opacity-50"
              >
                <FiRefreshCw />
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-28 animate-pulse rounded-xl border border-white/10 bg-white/5"
                />
              ))}
            </div>
          ) : filteredCommunities.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-white/15 bg-white/[0.03] px-5 py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-400/10 text-blue-200">
                <FiUsers size={24} />
              </div>

              <h3 className="mt-4 font-semibold">
                {search ? "No communities found" : "No communities yet"}
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-blue-100/60">
                {search
                  ? "Try another search term."
                  : "Create a community to bring your team together."}
              </p>

              {!search && (
                <button
                  onClick={openCreateForm}
                  className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold hover:bg-blue-400"
                >
                  <FiPlus />
                  Create your first community
                </button>
              )}
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCommunities.map((community, index) => (
                <article
                onClick={() =>
                  navigate(`/communities/${community._id || community.id}`)
              }
              role="button"
                  key={community._id || community.id || index}
                  className="flex min-h-28 items-center gap-4 rounded-xl border border-white/10 bg-white/[0.05] p-5 transition hover:border-blue-300/30 hover:bg-white/[0.08]"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-400/10 text-blue-200">
                    <FiGlobe size={25} />
                  </div>

                  <div className="min-w-0">
                    <h3 className="break-words text-base font-semibold">
                      {community.name || "Untitled community"}
                    </h3>

                    <p className="mt-1 line-clamp-2 break-words text-sm text-blue-100/60">
                      {community.description || "Community workspace"}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Create community modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4"
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
            className="my-auto w-full max-w-md rounded-2xl border border-white/10 bg-[#09264D] p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="create-community-title" className="text-xl font-bold">
                  Create a community
                </h2>
                <p className="mt-2 text-sm text-blue-100/60">
                  Add a name and description for your new space.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                disabled={creating}
                aria-label="Close"
                className="rounded-lg p-2 text-blue-100/60 hover:bg-white/10 hover:text-white disabled:opacity-50"
              >
                <FiX size={19} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-6">
              <label
                htmlFor="community-name"
                className="text-sm font-medium"
              >
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
                className="mt-2 w-full rounded-lg border border-white/10 bg-[#061B38] px-3 py-3 text-sm outline-none placeholder:text-blue-100/40 focus:border-blue-400"
              />

              <label
                htmlFor="community-description"
                className="mt-5 block text-sm font-medium"
              >
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
                className="mt-2 w-full resize-y max-h-40 overflow-y-auto rounded-lg border border-white/10 bg-[#061B38] px-3 py-3 text-sm outline-none placeholder:text-blue-100/40 focus:border-blue-400"
              />

              {formError && (
                <p role="alert" className="mt-3 text-sm text-red-300">
                  {formError}
                </p>
              )}

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  disabled={creating}
                  className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold text-blue-100/80 hover:bg-white/5 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating || !form.name.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating ? "Creating..." : (
                    <>
                      <FiPlus />
                      Create Community
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default Communities;
