import DashboardBackground from "./DashboardBackground";

function OnboardingLayout({ stepLabel, children }) {
  return (
    <div className="relative min-h-screen overflow-hidden" style={{ backgroundColor: "#062C5F" }}>
      <DashboardBackground />
      <div className="relative z-10 min-h-screen flex items-start justify-center pt-24 px-4">
      <div
        className="w-full max-w-[820px] rounded-xl p-5 sm:p-6 md:px-10 md:py-5"
        style={{
        backgroundColor: "rgba(215, 215, 215, 0.25)",
        border: "1px solid rgba(255, 255, 255, 0.14)",
        boxShadow: "0 24px 48px rgba(0, 0, 0, 0.5)",
        }}
        >
          <div className="w-16 h-1.5 rounded-full bg-white/40 mb-4" />
          {children}
          <p className="text-xs text-white/70 mt-3">{stepLabel}</p>
        </div>
      </div>
    </div>
  );
}

export default OnboardingLayout;