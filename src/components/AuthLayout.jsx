import authBg from "../assets/auth-bg.png";

function AuthLayout({ title, subtitle, children }) {
  return (
    <div
      className="min-h-screen bg-cover bg-bottom bg-no-repeat"
      style={{ backgroundImage: `url(${authBg})` }}
    >
      <div className="min-h-screen flex items-center justify-center md:justify-end p-4 md:pr-16">
        <div className="w-full max-w-md md:max-w-lg md:min-h-[80vh] flex items-center justify-center rounded-3xl border border-white/20 bg-white/10 backdrop-blur-md p-4 md:p-8">
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