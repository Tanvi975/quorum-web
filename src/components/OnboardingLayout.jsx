
import DashboardBackground from "./DashboardBackground";

function OnboardingLayout({ stepLabel, children }) {
  return (
    <div
      className="relative isolate min-h-screen overflow-x-hidden"
      style={{ backgroundColor: "#062C5F" }}
    >
      {/* Existing cloud background */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <DashboardBackground />
      </div>

      {/* Responsive page content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-3 py-6 sm:px-5 sm:py-10">
        <div
          className="w-full min-w-0 max-w-[900px] rounded-2xl p-4 sm:p-6 md:px-8 md:py-7 lg:px-10"
          style={{
            backgroundColor: "rgba(220, 232, 246, 0.10)",
            border: "1px solid rgba(255, 255, 255, 0.22)",
            boxShadow: "0 20px 40px rgba(10, 35, 65, 0.22)",
            backdropFilter: "blur(5px)",
            WebkitBackdropFilter: "blur(5px)",
          }}
        >
          <div
      
          />

          {children}

          {stepLabel && (
            <p className="mt-4 text-xs text-white/70">
              {stepLabel}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default OnboardingLayout;
