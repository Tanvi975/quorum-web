
function OnboardingLayout({
  stepLabel,
  children,
  wide = false,
  fullWidth = false,
}) {
  return (
    <div
      className="relative isolate min-h-screen w-full min-w-0 overflow-x-hidden"
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
        className={`relative z-10 flex min-h-screen w-full min-w-0 ${
          fullWidth
            ? "items-stretch justify-start p-0"
            : "items-start justify-center px-3 py-5 sm:px-5 sm:py-8 lg:px-8"
        }`}
      >
        <div
          className={`w-full min-w-0 ${
            fullWidth
              ? "max-w-none flex-1 rounded-none p-0"
              : `rounded-2xl p-4 sm:p-6 md:px-8 md:py-7 ${
                  wide ? "max-w-[1400px]" : "max-w-[900px] lg:px-10"
                }`
          }`}
          style={
            fullWidth
              ? undefined
              : {
                  backgroundColor: "rgba(220, 232, 246, 0.10)",
                  border: "1px solid rgba(255, 255, 255, 0.22)",
                  boxShadow: "0 20px 40px rgba(10, 35, 65, 0.22)",
                  backdropFilter: "blur(5px)",
                  WebkitBackdropFilter: "blur(5px)",
                }
          }
        >
          {children}

          {stepLabel && (
            <p className="mt-4 px-4 text-xs text-white/70">
              {stepLabel}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default OnboardingLayout;
