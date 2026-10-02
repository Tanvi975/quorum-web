import authBg1 from "../assets/auth-bg-1.png";
import authBg2 from "../assets/auth-bg-2.png";
import authBg3 from "../assets/auth-bg-3.png";

function AuthLayout({ title, subtitle, leftTitle, leftSubtitle, leftImage, children }) {
  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ backgroundColor: "#0B2A5B" }}
    >

      <img src={authBg1} className="cloud-frame cloud-frame-1" alt="" />
      <img src={authBg2} className="cloud-frame cloud-frame-2" alt="" />
      <img src={authBg3} className="cloud-frame cloud-frame-3" alt="" />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">

        <div className="w-full max-w-5xl md:min-h-[80vh] flex flex-col md:flex-row items-center rounded-2xl border border-white/30 bg-white/25 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] p-6 md:p-10 gap-8">
        <div className="hidden md:flex flex-col items-center justify-center text-white flex-1 text-center">
  <h1 className="text-2xl lg:text-3xl font-bold mb-6">
    {leftTitle}
  </h1>
  <img
    src={leftImage}
    alt="Team collaboration"
    className="w-full max-w-[360px] object-contain mb-6"
  />
  <p className="text-sm lg:text-base font-medium max-w-md" style={{ color: "#07090D" }}>
    {leftSubtitle}
  </p>
</div>
          <div className="w-full max-w-sm rounded-xl border border-[#D7D7D7]/25 bg-[#F7F6F2] shadow-[0_8px_24px_-4px_rgba(37,99,235,0.15)] p-8">
          <h2
          className="text-2xl font-bold text-center mb-1"
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
  <p className="text-sm text-gray-500 text-center mt-2 mb-6">
    {subtitle}
  </p>
)}
            {children}

          </div>

        </div>
      </div>
    </div>
  );
}

export default AuthLayout;