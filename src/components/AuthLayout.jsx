
import authBg1 from "../assets/auth-bg-1.png";
import authBg2 from "../assets/auth-bg-2.png";
import authBg3 from "../assets/auth-bg-3.png";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";

function AuthLayout({
  title,
  subtitle,
  leftTitle,
  leftSubtitle,
  leftImage,
  children,
  showBack = true,
}) {
  const navigate = useNavigate();

  return (
    <div
      className="relative min-h-screen min-h-[100dvh] overflow-x-hidden"
      style={{ backgroundColor: "#0B2A5B" }}
    >
      {/* Background decorations */}
      <img
        src={authBg1}
        className="cloud-frame cloud-frame-1 pointer-events-none"
        alt=""
        aria-hidden="true"
      />
      <img
        src={authBg2}
        className="cloud-frame cloud-frame-2 pointer-events-none"
        alt=""
        aria-hidden="true"
      />
      <img
        src={authBg3}
        className="cloud-frame cloud-frame-3 pointer-events-none"
        alt=""
        aria-hidden="true"
      />

      {/* Main responsive wrapper */}
      <div className="relative z-10 flex min-h-screen min-h-[100dvh] w-full items-center justify-center p-3 py-6 sm:p-5 md:p-6 lg:p-8">
        <div className="flex w-full max-w-5xl min-w-0 flex-col items-center gap-6 rounded-2xl border border-white/30 bg-white/25 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.15)] backdrop-blur-xl sm:p-6 md:min-h-[80vh] md:flex-row md:gap-8 md:p-8 lg:gap-10 lg:p-10">

          {/* Left illustration: tablet and desktop */}
          <div className="hidden min-w-0 flex-1 flex-col items-center justify-center text-center text-white md:flex">
            <h1 className="mb-5 text-xl font-bold leading-snug lg:mb-6 lg:text-3xl">
              {leftTitle}
            </h1>

            <img
              src={leftImage}
              alt="Team collaboration"
              className="mb-5 w-full max-w-[280px] object-contain lg:mb-6 lg:max-w-[360px]"
            />

            <p className="max-w-md text-sm font-medium leading-relaxed text-white lg:text-base">
              {leftSubtitle}
            </p>
          </div>

          {/* Form card */}
          <div className="relative w-full min-w-0 max-w-sm rounded-xl border border-[#D7D7D7]/25 bg-[#F7F6F2] p-5 shadow-[0_8px_24px_-4px_rgba(37,99,235,0.15)] sm:p-7 md:flex-none md:p-8">

            {showBack && (
              <button
                type="button"
                onClick={() => navigate(-1)}
                aria-label="Go back"
                className="absolute left-4 top-4 rounded-lg p-1 text-gray-500 transition hover:text-[#2563EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:left-5 sm:top-5 md:left-6 md:top-6"
              >
                <FiArrowLeft size={20} />
              </button>
            )}

            <h2
              className={`mb-5 text-center text-xl font-bold leading-snug sm:mb-6 sm:text-2xl ${
                showBack ? "px-5" : ""
              }`}
              style={{
                backgroundImage: "linear-gradient(to bottom, #0F172A, #2563EB)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                color: "transparent",
              }}
            >
              {title}
            </h2>

            {subtitle && (
              <p className="mb-5 text-center text-sm leading-relaxed text-gray-600">
                {subtitle}
              </p>
            )}

            <div className="w-full min-w-0">
              {children}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
