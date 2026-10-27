
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiPlus, FiGlobe } from "react-icons/fi";
import Sidebar from "../../components/Sidebar";
import { createCommunity } from "../../services/communityService";

function CreateCommunity() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    const communityName = name.trim();
    const communityDescription = description.trim();

    if (!communityName) {
      setError("Please enter a community name.");
      return;
    }

    setCreating(true);
    setError("");

    try {
      await createCommunity({
        name: communityName,
        description: communityDescription,
      });

      navigate("/communities");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to create community. Please try again."
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div
      className="relative isolate flex h-dvh min-h-[600px] overflow-hidden text-white"
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
      <div className="relative z-20 shrink-0">
        <Sidebar />
      </div>

      <main className="relative z-10 flex min-w-0 flex-1 flex-col overflow-y-auto">
        <header className="flex h-16 min-h-16 shrink-0 items-center justify-center border-b border-white/10 bg-[#062C5F]/35 px-4 backdrop-blur-xl">
          <span className="text-base font-bold tracking-[0.22em] text-white sm:text-lg">
            QUORUM
          </span>
        </header>

        <div className="flex flex-1 items-center justify-center p-4 sm:p-7 lg:p-10">
        <section
  className="box-border flex w-full max-w-[846px] flex-col rounded-2xl border border-[#38BDF8]/45 bg-[rgba(220,232,246,0.16)] p-5 shadow-[0_20px_40px_rgba(10,35,65,0.22)] backdrop-blur-[5px] sm:p-7 md:p-8"
  style={{
    minHeight: "460px",
  }}
>
            <button
              type="button"
              onClick={() => navigate("/communities")}
              aria-label="Back to communities"
              className="mb-5 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/[0.08] text-blue-50/80 transition hover:bg-white/15 hover:text-white"
            >
              <FiArrowLeft size={18} />
            </button>

            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-blue-100">
                <FiGlobe size={20} />
              </span>

              <div className="min-w-0">
                <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                  Create a community
                </h1>
                <p className="mt-2 text-sm leading-6 text-blue-50/75">
                  Add a name and description for your new space.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-7">
              <label
                htmlFor="community-name"
                className="block text-sm font-medium text-white"
              >
                Community Name<span className="text-sky-300">*</span>
              </label>

              <input
                id="community-name"
                type="text"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setError("");
                }}
                placeholder="e.g. Growth Architecture"
                maxLength={100}
                required
                autoFocus
                className="mt-2 w-full rounded-xl border border-white/15 bg-[#0B0F19]/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-blue-100/45 focus:border-[#38BDF8]/70 focus:ring-2 focus:ring-[#38BDF8]/15"
              />

              <div className="mt-5 flex items-center justify-between gap-3">
                <label
                  htmlFor="community-description"
                  className="text-sm font-medium text-white"
                >
                  Description
                </label>
                <span className="text-xs text-blue-100/55">
                  {description.length}/500
                </span>
              </div>

              <textarea
                id="community-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Describe what your community is about..."
                rows={4}
                maxLength={500}
                className="mt-2 w-full resize-y rounded-xl border border-white/15 bg-[#0B0F19]/60 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-blue-100/45 focus:border-[#38BDF8]/70 focus:ring-2 focus:ring-[#38BDF8]/15"
              />

              {error && (
                <p
                  role="alert"
                  className="mt-4 rounded-lg border border-red-200/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-100"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={creating || !name.trim()}
                className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#0066FF] to-[#0148B3] px-5 py-3 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(0,75,200,0.25)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creating ? (
                  "Creating..."
                ) : (
                  <>
                    <FiPlus size={17} />
                    Create
                  </>
                )}
              </button>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}

export default CreateCommunity;
