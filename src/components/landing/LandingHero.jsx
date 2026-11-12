
import cloud1 from "../../assets/dashboard-cloud-1.svg";
import cloud2 from "../../assets/dashboard-cloud-2.svg";
import videoCall from "../../assets/videocall.svg";
import unity from "../../assets/unity.svg";
import videoCallCalendar from "../../assets/videocallcal.svg";
import sidePanel from "../../assets/sidepanal.svg";
import { Reveal, primaryButton } from "./LandingShared";

export default function LandingHero() {
  return (
    <div className="relative isolate bg-transparent">
<div
  aria-hidden="true"
  className="pointer-events-none absolute inset-x-0 top-0 bottom-[-360px] -z-10 overflow-hidden"
>
  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_12%,rgba(1,91,225,0.18)_0%,transparent_48%)]" />

  <div className="absolute inset-x-0 bottom-0 h-[45%] bg-[linear-gradient(180deg,transparent_0%,rgba(76,105,142,0.12)_40%,rgba(48,84,133,0.16)_70%,transparent_100%)]" />

  <img
    src={cloud1}
    alt=""
    className="absolute left-1/2 top-[250px] w-[min(145%,1500px)] max-w-none -translate-x-1/2 opacity-60 blur-[5px]"
  />

  <img
    src={cloud2}
    alt=""
    className="absolute left-1/2 top-[420px] w-[min(125%,1250px)] max-w-none -translate-x-1/2 opacity-50 blur-[5px]"
  />
</div>

      <section id="home" className="relative scroll-mt-20 px-4 pb-24 pt-32 sm:px-6 sm:pt-40 lg:pb-28">
        <Reveal className="mx-auto max-w-[760px] text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#B6C8D9]">
            The team workspace, simplified
          </p>
          <h1 className="mt-5 text-[clamp(2.125rem,5vw,4rem)] font-semibold leading-[1.06] tracking-[-0.05em] text-[#F9FCFF]">
            Unified workspace for
            <br className="hidden sm:block" /> cross-functional
            <br className="hidden sm:block" /> execution.
          </h1>
          <p className="mx-auto mt-5 max-w-[520px] text-[13px] leading-[1.75] text-[#B6C8D9] sm:text-sm">
            Consolidate video calls, team chat, documentation, and project tracking into one high-performance platform.
          </p>
          <div className="mt-7">
            <a href="/login" className={`${primaryButton} min-h-[44px]`}>
              Sign in to Quorum
            </a>
          </div>
        </Reveal>

        <Reveal delay={150}>
          <div className="relative mx-auto mb-[6%] mt-12 w-full max-w-[1020px] sm:mt-[70px]">
            <img src={videoCall} alt="Quorum video meeting interface" fetchPriority="high" decoding="async" className="relative z-10 ml-[5%] block h-auto w-[83%] drop-shadow-[0_24px_42px_rgba(0,0,0,0.22)] sm:w-[76%]" />
            <img src={unity} alt="Quorum collaboration panel" loading="lazy" decoding="async" className="q-anim absolute left-0 top-[34%] z-20 h-auto w-[29%] animate-[q-float_7s_ease-in-out_infinite] drop-shadow-[0_18px_32px_rgba(0,0,0,0.3)] sm:-left-[1%] sm:top-[18%] sm:w-[25%]" />
            <img src={videoCallCalendar} alt="Video meeting calendar" loading="lazy" decoding="async" className="absolute -bottom-[4%] right-[1%] z-30 h-auto w-[45%] drop-shadow-[0_24px_42px_rgba(0,0,0,0.3)] sm:-bottom-[8%] sm:w-[46%]" />
            <img src={sidePanel} alt="Meeting side panel" loading="lazy" decoding="async" className="q-anim absolute right-0 top-[1%] z-40 h-auto w-[20%] animate-[q-float_9s_ease-in-out_infinite_1s] drop-shadow-[0_20px_36px_rgba(0,0,0,0.3)] sm:-right-[2%] sm:top-[2%] sm:w-[19%]" />
          </div>
        </Reveal>
      </section>
    </div>
  );
}
