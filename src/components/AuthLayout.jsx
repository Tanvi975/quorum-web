import authBg1 from "../assets/auth-bg-1.png";
import authBg2 from "../assets/auth-bg-2.png";
import authBg3 from "../assets/auth-bg-3.png";

function AuthLayout({ title, subtitle, children }) {
  return (
    <div
    className="relative min-h-screen overflow-hidden"
    style={{ backgroundColor: "#0B2A5B" }}
  >
      <img src={authBg1} className="cloud-frame cloud-frame-1" alt="" />
      <img src={authBg2} className="cloud-frame cloud-frame-2" alt="" />
      <img src={authBg3} className="cloud-frame cloud-frame-3" alt="" />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-4xl md:min-h-[80vh] flex flex-col md:flex-row items-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-6 md:p-10 gap-8">
          <div className="hidden md:flex flex-col justify-between text-white h-full flex-1 py-4">
            <h1 className="text-2xl lg:text-3xl font-bold">
              Seamless Meetings for Modern Teams
            </h1>
            <p className="text-lg font-medium text-center">Active Meetings</p>
          </div>

          <div className="w-full max-w-sm rounded-2xl bg-[#F7F6F2] shadow-xl p-8">
            <h2 className="text-xl font-bold text-center text-[#0B2A5B]">{title}</h2>
            <p className="text-sm text-gray-500 text-center mt-1 mb-6">{subtitle}</p>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;