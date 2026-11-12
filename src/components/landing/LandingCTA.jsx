
import { wrap, Reveal, primaryButton } from "./LandingShared";

export default function LandingCTA() {
  return (
    <section id="get-started" className="relative scroll-mt-16 overflow-hidden bg-[#061429] py-24 sm:py-32">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_55%,rgba(1,91,225,0.22)_0%,transparent_68%)]" />

      <Reveal className={`${wrap} relative text-center`}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8CA3BE]">
          Your team, in sync
        </p>
        <h2 className="mt-5 text-[clamp(2.25rem,6vw,4.25rem)] font-semibold leading-[1.05] tracking-[-0.045em] text-white">
          Keep the whole thread.
        </h2>
        <p className="mx-auto mt-5 max-w-[480px] text-sm text-[#B6C8D9] sm:text-base">
          Meetings, conversations and resources. One shared workspace.
        </p>
        <div className="mt-9">
          <a href="/login" className={`${primaryButton} w-full max-w-[420px] py-3.5`}>
            Sign in to Quorum
          </a>
        </div>
        <p className="mt-6 text-xs text-[#A4A5AF]">
          No account yet?{" "}
          <a href="/signup" className="font-semibold text-white underline-offset-4 transition hover:text-[#60A5FA] hover:underline">
            Start now
          </a>
        </p>
      </Reveal>
    </section>
  );
}
