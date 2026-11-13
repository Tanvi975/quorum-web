
import { Link, useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div
      className="relative isolate flex min-h-screen w-full items-center justify-center overflow-x-hidden px-5 py-10"
      style={{
        backgroundColor: "#062C5F",
        backgroundImage: `
          linear-gradient(
            to bottom,
            #213F70 0%,
            #315A8A 35%,
            #506D9A 65%,
            #7698C5 100%
          )
        `,
        backgroundRepeat: "no-repeat",
        backgroundSize: "100% 100%",
      }}
    >
      <div
        className="relative z-10 w-full max-w-lg rounded-2xl p-6 text-center sm:p-8"
        style={{
          backgroundColor: "rgba(220, 232, 246, 0.10)",
          border: "1px solid rgba(255, 255, 255, 0.22)",
          boxShadow: "0 20px 40px rgba(10, 35, 65, 0.22)",
          backdropFilter: "blur(5px)",
          WebkitBackdropFilter: "blur(5px)",
        }}
      >
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-sky-200">
          Quorum
        </p>

        <h1 className="text-8xl font-bold tracking-tight text-white sm:text-9xl">
          404
        </h1>

        <h2 className="mt-5 text-2xl font-semibold text-white sm:text-3xl">
          Page not found
        </h2>

        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/80 sm:text-base">
          The page you're looking for doesn't exist, may have been moved,
          or the URL might be incorrect.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg border border-white/30 px-5 py-3 text-sm font-semibold text-white transition duration-300 hover:bg-white/15"
          >
            Go Back
          </button>

          <Link
            to="/"
            className="rounded-lg bg-[#0066FF] px-5 py-3 text-sm font-semibold text-white transition duration-300 hover:bg-[#0057DB]"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
