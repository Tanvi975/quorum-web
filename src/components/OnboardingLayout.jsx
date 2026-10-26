import DashboardBackground from "./DashboardBackground";

function OnboardingLayout({ stepLabel, children }) {
  return (
    <div className="relative isolate min-h-screen overflow-x-hidden" style={{ backgroundColor: "#062C5F" }}>
      <DashboardBackground />
      <div className="relative z-10 flex min-h-screen items-start justify-center px-3 py-8 sm:px-5 sm:py-12 md:py-16 lg:py-20">
      <div
       className="w-full max-w-[900px] min-w-0 rounded-xl p-4 sm:p-6 md:px-10 md:py-6"
        style={{
        backgroundColor: "rgba(247, 246, 242, 0.18)",
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