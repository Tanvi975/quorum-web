import { useAuth } from "../context/AuthContext";
import DashboardBackground from "../components/DashboardBackground";

function Dashboard() {
  const { user } = useAuth();

  const userName = user?.name || "Karan";

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#062C5F]">
      <DashboardBackground />

      <div className="relative z-10 min-h-screen">
        <header className="h-[64px] bg-white border-b border-[#E5E7EB] flex items-center justify-between px-6 lg:px-10">
          <div className="text-[#062C5F] font-bold text-[18px] tracking-wide">
            QUORUM
          </div>
          <div className="hidden md:flex items-center w-[280px] lg:w-[360px] h-[38px] bg-[#F7F9FC] border border-[#E5E7EB] rounded-lg px-4">
            <svg
              className="w-4 h-4 text-[#64748B] mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z"
              />
            </svg>

            <input
              type="text"
              placeholder="Search"
              className="w-full bg-transparent outline-none text-sm text-[#334155] placeholder-[#94A3B8]"
            />
          </div>

          <div className="flex items-center gap-4">

            <button
              className="
                hidden sm:block
                bg-[#0068FF]
                hover:bg-[#005BE0]
                text-white
                text-sm
                font-medium
                px-4
                py-2
                rounded-lg
                transition
              "
            >
              + New Meeting
            </button>

            <div className="w-[36px] h-[36px] rounded-full bg-[#0068FF] text-white flex items-center justify-center font-semibold text-sm">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="flex">
          <aside
            className="
              hidden md:block
              w-[76px]
              lg:w-[88px]
              min-h-[calc(100vh-64px)]
              bg-[#062C5F]/90
              border-r border-white/10
            "
          >
            <div className="flex flex-col items-center pt-7 gap-6">

              <button
                className="
                  w-[42px]
                  h-[42px]
                  rounded-xl
                  bg-white/15
                  text-white
                  flex
                  items-center
                  justify-center
                "
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z"
                  />
                </svg>
              </button>
              <button
                className="
                  w-[42px]
                  h-[42px]
                  rounded-xl
                  text-white/60
                  hover:bg-white/10
                  flex
                  items-center
                  justify-center
                "
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <rect
                    x="3"
                    y="5"
                    width="18"
                    height="16"
                    rx="2"
                    strokeWidth="2"
                  />
                  <path
                    d="M16 3v4M8 3v4M3 10h18"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>

              <button
                className="
                  w-[42px]
                  h-[42px]
                  rounded-xl
                  text-white/60
                  hover:bg-white/10
                  flex
                  items-center
                  justify-center
                "
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M6 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18l-6-4-6 4V4Z"
                    strokeWidth="2"
                  />
                </svg>
              </button>

            </div>
          </aside>
          <main className="flex-1 px-5 sm:px-8 lg:px-12 py-8">

            <div className="max-w-[1180px] mx-auto">
              <section
                className="
                  h-[105px]
                  rounded-[10px]
                  bg-[#1F5A91]/80
                  border border-white/10
                  shadow-[0_8px_25px_rgba(0,0,0,0.08)]
                  px-7
                  flex
                  items-center
                  justify-between
                "
              >
                <div>
                  <h1 className="text-white text-[18px] sm:text-[20px] font-semibold">
                    Welcome back, {userName}
                  </h1>

                  <p className="text-white/60 text-[12px] sm:text-[13px] mt-2">
                    Here's what's happening with your workspace today.
                  </p>
                </div>

                <div className="hidden sm:block text-white/50 text-xs">
                  2 upcoming syncs today
                </div>
              </section>
              <section className="grid grid-cols-1 lg:grid-cols-[1fr_330px] gap-5 mt-5">
                <div
                  className="
                    min-h-[360px]
                    bg-white/90
                    backdrop-blur-sm
                    rounded-[8px]
                    border border-white/60
                    shadow-[0_10px_35px_rgba(0,0,0,0.08)]
                    p-6
                  "
                >
                  <div className="flex items-center justify-between mb-5">

                    <h2 className="text-[#062C5F] font-semibold text-[16px]">
                      Upcoming Meetings
                    </h2>

                    <button className="text-[#0068FF] text-xs font-medium">
                      View all
                    </button>

                  </div>
                  <div className="h-[275px] rounded-lg border border-[#EEF2F7] flex items-center justify-center">
                    <p className="text-[#94A3B8] text-sm">
                      No upcoming meetings
                    </p>
                  </div>
                </div>
                <div
                  className="
                    min-h-[360px]
                    bg-white/90
                    backdrop-blur-sm
                    rounded-[8px]
                    border border-white/60
                    shadow-[0_10px_35px_rgba(0,0,0,0.08)]
                    p-6
                  "
                >
                  <div className="flex items-center justify-between mb-5">

                    <h2 className="text-[#062C5F] font-semibold text-[16px]">
                      AI Meeting Summaries
                    </h2>

                  </div>

                  <div className="h-[275px] rounded-lg border border-[#EEF2F7] flex items-center justify-center">
                    <p className="text-[#94A3B8] text-sm text-center">
                      No summaries available
                    </p>
                  </div>
                </div>

              </section>

            </div>
          </main>

        </div>
      </div>
    </div>
  );
}

export default Dashboard;