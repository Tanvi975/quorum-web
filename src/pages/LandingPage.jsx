import { useEffect, useRef, useState } from "react";

import cloud1 from "../assets/dashboard-cloud-1.svg";
import cloud2 from "../assets/dashboard-cloud-2.svg";

import organization from "../assets/organization.svg";
import videoCall from "../assets/videocall.svg";
import videoCallCalendar from "../assets/videocallcal.svg";
import sidePanel from "../assets/sidepanal.svg";
import unity from "../assets/unity.svg";
import teamChat from "../assets/teamchat.svg";
import whiteboard from "../assets/whiteboard.svg";
import calendar from "../assets/calender.svg";
import menu from "../assets/menu.svg";

const wrap = "mx-auto w-full max-w-[1120px] px-5 sm:px-8";

const primaryButton =
  "inline-flex items-center justify-center rounded-lg bg-[linear-gradient(180deg,#0066FF_0%,#0148B3_100%)] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(0,102,255,0.8)] transition duration-200 hover:-translate-y-px hover:brightness-110 hover:shadow-[0_14px_36px_-10px_rgba(0,102,255,0.95)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#60A5FA]";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Workspace", href: "#calendar" },
  { label: "How it works", href: "#flow" },
  { label: "FAQ", href: "#faq" },
];

const flowSteps = [
  {
    title: "Prepare",
    text: "Schedule the meeting. See who's attending and what's on the agenda.",
    icon: "calendar",
  },
  {
    title: "Work through it",
    text: "Screen share, chat, transcript — everything visible during the meeting.",
    icon: "video",
  },
  {
    title: "Follow through",
    text: "Decisions captured. Owners named. Action items linked to the transcript.",
    icon: "doc",
  },
];

const timelineLabels = ["Schedule", "Meet", "Transcript", "Summary", "Action items"];

const timelineSteps = [
  { tag: "Schedule", title: "Calendar", text: "Set the time, invite the team." },
  { tag: "Meet", title: "Video meeting", text: "Screen share, chat and live transcript." },
  { tag: "Review", title: "Summary", text: "Decisions and action items captured." },
  { tag: "Ship", title: "Done", text: "The team delivers on what was decided." },
];

const faqs = [
  {
    q: "What is Quorum?",
    a: "Quorum is one workspace for video meetings, team chat, whiteboards and documentation, so your team stops switching between tools.",
  },
  {
    q: "What can a team do in a meeting?",
    a: "Share screens, chat, use the whiteboard and read a live transcript. Decisions and action items are captured as the meeting runs.",
  },
  {
    q: "How do organizations and communities differ?",
    a: "An organization is your own team with members, roles and private spaces. A community is an open space where people from different teams or outside guests can join.",
  },
  {
    q: "What happens after a meeting ends?",
    a: "Quorum saves the transcript and a summary, lists the decisions, and links each action item to its owner so follow-up starts right away.",
  },
];

const iconPaths = {
  calendar:
    "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z",
  video: "M15 10l5-3v10l-5-3M4 6h9a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z",
  doc: "M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8zM14 3v5h5M9 13h6M9 17h6",
  chevron: "M6 9l6 6 6-6",
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "M6 6l12 12M18 6L6 18",
};

function Icon({ name, className = "h-4 w-4" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={iconPaths[name]} />
    </svg>
  );
}

function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out motion-reduce:transition-none ${
        shown ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}

function Logo({ href = "#home" }) {
  return (
    <a
      href={href}
      className="flex items-center gap-2.5 text-xs font-bold tracking-[0.08em] text-[#F9FCFF]"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/15 bg-[#1D2A3D] text-sm">
        Q
      </span>
      QUORUM
    </a>
  );
}

function SectionHeading({ tag, children, text, align = "center" }) {
  const centered = align === "center";
  return (
    <div className={centered ? "mx-auto max-w-[780px] text-center" : "max-w-[780px] text-left"}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#B6C8D9]">
        {tag}
      </p>
      <h2 className="mt-4 text-[clamp(1.875rem,3.4vw,2.875rem)] font-semibold leading-[1.12] tracking-[-0.045em] text-[#F9FCFF]">
        {children}
      </h2>
      {text && (
        <p className="mx-auto mt-5 max-w-[620px] text-sm leading-relaxed text-[#EDEFF7]/80 sm:text-base">
          {text}
        </p>
      )}
    </div>
  );
}

function FeatureImage({ src, alt }) {
  return (
    <img
      src={src}
      alt={alt}
      className="block h-auto w-full drop-shadow-[0_18px_36px_rgba(1,10,30,0.28)] transition duration-300 ease-out hover:-translate-y-1 hover:drop-shadow-[0_26px_44px_rgba(1,10,30,0.4)] motion-reduce:transition-none"
    />
  );
}

function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    const root = document.documentElement;
    const previous = root.style.scrollBehavior;
    root.style.scrollBehavior = "smooth";
    return () => {
      root.style.scrollBehavior = previous;
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const progress = ((activeStep + 1) / timelineSteps.length) * 100;

  return (
    <main className="relative overflow-x-clip bg-[#061429] font-['Inter','Segoe_UI',system-ui,sans-serif] text-[#F9FCFF] antialiased selection:bg-[#388DF8]/40">
      <style>{`
        @keyframes q-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @media (prefers-reduced-motion: reduce){.q-anim{animation:none!important}}
      `}</style>

      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled || menuOpen
            ? "border-b border-white/10 bg-[#061429]/80 backdrop-blur-xl"
            : "border-b border-white/[0.08]"
        }`}
      >
        <div className={`${wrap} flex h-[72px] items-center justify-between gap-6`}>
          <Logo />

          <nav aria-label="Main navigation" className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-[13px] text-[#B6C8D9] transition hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <a
              href="/login"
              className="rounded-lg border border-white/[0.22] bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
            >
              Sign in
            </a>
            <a href="/signup" className={`${primaryButton} !px-4 !py-2 !text-xs`}>
              Get Started
            </a>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-white md:hidden"
          >
            <Icon name={menuOpen ? "close" : "menu"} className="h-5 w-5" />
          </button>
        </div>

        <div
          className={`grid transition-all duration-300 md:hidden ${
            menuOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden">
            <div className={`${wrap} flex flex-col gap-1 pb-5`}>
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-3 text-sm text-[#E2E8F0] hover:bg-white/5"
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-3 grid grid-cols-2 gap-3">
                <a
                  href="/login"
                  className="rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-center text-sm font-semibold"
                >
                  Sign in
                </a>
                <a href="/signup" className={primaryButton}>
                  Get Started
                </a>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="relative isolate overflow-hidden bg-[linear-gradient(180deg,#061429_0%,#0D3266_13%,#305485_29%,#4C698E_41%,#305485_56%,#153E70_78%,#0D2549_100%)]">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_6%,rgba(1,91,225,0.22)_0%,transparent_48%)]" />
          <img
            src={cloud1}
            alt=""
            className="absolute left-1/2 top-[250px] w-[min(145%,1500px)] max-w-none -translate-x-1/2 opacity-60 blur-[5px] sm:opacity-[0.68]"
          />
          <img
            src={cloud2}
            alt=""
            className="absolute left-1/2 top-[420px] w-[min(125%,1250px)] max-w-none -translate-x-1/2 opacity-[0.48] blur-[5px] sm:opacity-55"
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
              Consolidate video calls, team chat, documentation, and project tracking into
              one high-performance platform.
            </p>
            <div className="mt-7">
              <a href="/login" className={`${primaryButton} min-h-[44px]`}>
                Sign in to Quorum
              </a>
            </div>
          </Reveal>

          <Reveal delay={150}>
            <div className="relative mx-auto mb-[6%] mt-12 w-full max-w-[1020px] sm:mt-[70px]">
              <img
                src={videoCall}
                alt="Quorum video meeting interface"
                className="relative z-10 ml-[5%] block h-auto w-[83%] drop-shadow-[0_24px_42px_rgba(0,0,0,0.22)] sm:w-[76%]"
              />
              <img
                src={unity}
                alt="Quorum collaboration panel"
                className="q-anim absolute left-0 top-[34%] z-20 h-auto w-[29%] animate-[q-float_7s_ease-in-out_infinite] drop-shadow-[0_18px_32px_rgba(0,0,0,0.3)] sm:-left-[1%] sm:top-[18%] sm:w-[25%]"
              />
              <img
                src={videoCallCalendar}
                alt="Video meeting calendar"
                className="absolute -bottom-[4%] right-[1%] z-30 h-auto w-[45%] drop-shadow-[0_24px_42px_rgba(0,0,0,0.3)] sm:-bottom-[8%] sm:w-[46%]"
              />
              <img
                src={sidePanel}
                alt="Meeting side panel"
                className="q-anim absolute right-0 top-[1%] z-40 h-auto w-[20%] animate-[q-float_9s_ease-in-out_infinite_1s] drop-shadow-[0_20px_36px_rgba(0,0,0,0.3)] sm:-right-[2%] sm:top-[2%] sm:w-[19%]"
              />
            </div>
          </Reveal>
        </section>

        <section id="features" className="relative scroll-mt-16 px-0 pb-24 pt-16 sm:pt-24">
          <div className={wrap}>
            <Reveal>
              <SectionHeading
                tag="Work better together"
                text="Centralize critical communications, task management, and documentation without workflow overhead."
              >
                Purpose-built collaboration for
                <br className="hidden sm:block" /> modern engineering and
                <br className="hidden sm:block" /> operations.
              </SectionHeading>
            </Reveal>

            <div className="mt-12 grid gap-4 lg:grid-cols-[1.03fr_1fr]">
              <Reveal>
                <FeatureImage src={organization} alt="Organization workspace interface" />
              </Reveal>

              <div className="flex flex-col justify-between gap-4">
                <Reveal delay={100}>
                  <FeatureImage src={teamChat} alt="Team chat interface" />
                </Reveal>
                <Reveal delay={200}>
                  <FeatureImage src={whiteboard} alt="Collaborative whiteboard interface" />
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        <section id="calendar" className="relative scroll-mt-16 pb-24 pt-12 sm:pb-28 sm:pt-16">
          <div className={wrap}>
            <Reveal>
              <SectionHeading tag="One workspace, every flow" align="left">
                End-to-end lifecycle visibility across
                <br className="hidden sm:block" /> meetings, chat, and deliverables.
              </SectionHeading>
            </Reveal>

            <div className="mt-12 grid items-center gap-8 lg:grid-cols-[minmax(0,0.28fr)_minmax(0,1fr)] lg:gap-12">
              <Reveal delay={100} className="order-2 lg:order-1">
                <img
                  src={menu}
                  alt="Calendar navigation menu"
                  className="mx-auto block h-auto w-full max-w-[320px] lg:max-w-[250px]"
                />
              </Reveal>
              <Reveal className="order-1 lg:order-2">
                <img
                  src={calendar}
                  alt="Quorum calendar interface"
                  className="block h-auto w-full drop-shadow-[0_24px_36px_rgba(0,0,0,0.25)]"
                />
              </Reveal>
            </div>
          </div>
        </section>
      </div>

      <div className="bg-[linear-gradient(180deg,#0D2549_0%,#0A1B35_28%,#061429_60%)]">
        <section id="flow" className="relative scroll-mt-16 pb-16 pt-12 sm:pb-20 sm:pt-16">
          <div className={wrap}>
            <Reveal>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8CA3BE]">
                    How it works
                  </p>
                  <h2 className="mt-3 text-[clamp(1.75rem,3.2vw,2.5rem)] font-semibold tracking-[-0.04em] text-white">
                    One flow, start to finish.
                  </h2>
                </div>
                <p className="text-xs text-[#A4A5AF]">Hover to reveal</p>
              </div>
            </Reveal>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {flowSteps.map((step, index) => (
                <Reveal key={step.title} delay={index * 100}>
                  <article className="group flex min-h-[250px] flex-col rounded-2xl border border-[#388DF8]/[0.0784] bg-[#142C49]/80 p-6 transition duration-300 hover:-translate-y-1.5 hover:border-[#60A5FA]/50 hover:bg-[#153E70]/70 hover:shadow-[0_24px_50px_-24px_rgba(56,141,248,0.55)]">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#388DF8]/20 text-xs font-semibold text-[#60A5FA]">
                      {index + 1}
                    </span>
                    <h3 className="mt-10 text-lg font-semibold text-[#EDEFF7]">{step.title}</h3>
                    <p className="mt-2 max-w-[260px] text-sm leading-relaxed text-[#8CA3BE] transition group-hover:text-[#C6EAFF]">
                      {step.text}
                    </p>
                    <span className="mt-auto pt-6 text-[#60A5FA]">
                      <Icon name={step.icon} className="h-5 w-5" />
                    </span>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="relative py-14 sm:py-16">
          <div className={wrap}>
            <Reveal>
              <h2 className="text-[clamp(1.75rem,3.2vw,2.5rem)] font-semibold tracking-[-0.04em] text-white">
                From conversation to action.
              </h2>
            </Reveal>

            <Reveal delay={100}>
              <div className="mt-10">
                <div className="relative h-[2px] w-full rounded-full bg-white/15">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-[linear-gradient(90deg,#0066FF_0%,#60A5FA_100%)] shadow-[0_0_14px_rgba(96,165,250,0.7)] transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="mt-3 hidden justify-between text-[10px] text-[#A4A5AF] sm:flex">
                  {timelineLabels.map((label) => (
                    <span key={label}>{label}</span>
                  ))}
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {timelineSteps.map((step, index) => {
                  const active = activeStep === index;
                  return (
                    <button
                      key={step.title}
                      type="button"
                      onClick={() => setActiveStep(index)}
                      onMouseEnter={() => setActiveStep(index)}
                      onFocus={() => setActiveStep(index)}
                      aria-pressed={active}
                      className={`rounded-xl border p-5 text-left transition duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#60A5FA] ${
                        active
                          ? "border-[#60A5FA]/80 bg-[#153E70]/60 shadow-[0_18px_40px_-20px_rgba(56,141,248,0.7)]"
                          : "border-[#388DF8]/20 bg-[#0D2549]/70 hover:border-[#60A5FA]/40"
                      }`}
                    >
                      <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8CA3BE]">
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] transition ${
                            active
                              ? "bg-[#0066FF] text-white"
                              : "bg-[#388DF8]/20 text-[#60A5FA]"
                          }`}
                        >
                          {index + 1}
                        </span>
                        {step.tag}
                      </span>
                      <span className="mt-4 block text-base font-semibold text-[#EDEFF7]">
                        {step.title}
                      </span>
                      <span className="mt-1.5 block text-xs leading-relaxed text-[#8CA3BE]">
                        {step.text}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Reveal>
          </div>
        </section>

        <section id="faq" className="relative scroll-mt-16 py-14 sm:py-16">
          <div className={`${wrap} max-w-[960px]`}>
            <Reveal>
              <h2 className="text-[clamp(1.75rem,3.2vw,2.5rem)] font-semibold tracking-[-0.04em] text-white">
                Frequently Asked Questions
              </h2>
            </Reveal>

            <Reveal delay={100}>
              <div className="mt-8 flex flex-col gap-3">
                {faqs.map((item, index) => {
                  const open = openFaq === index;
                  return (
                    <div
                      key={item.q}
                      className={`rounded-lg border transition duration-300 ${
                        open
                          ? "border-[#60A5FA]/60 bg-[#0D2549]/70"
                          : "border-[#B4BEDD]/30 bg-[#0A1B35]/60 hover:border-[#B4BEDD]/60"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaq(open ? -1 : index)}
                        aria-expanded={open}
                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium text-[#EDEFF7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#60A5FA]"
                      >
                        {item.q}
                        <Icon
                          name="chevron"
                          className={`h-4 w-4 shrink-0 text-[#8CA3BE] transition-transform duration-300 ${
                            open ? "rotate-180 text-[#60A5FA]" : ""
                          }`}
                        />
                      </button>
                      <div
                        className={`grid transition-all duration-300 ease-out ${
                          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                        }`}
                      >
                        <div className="overflow-hidden">
                          <p className="max-w-[720px] px-5 pb-5 text-sm leading-relaxed text-[#8CA3BE]">
                            {item.a}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Reveal>
          </div>
        </section>

        <section
          id="get-started"
          className="relative scroll-mt-16 overflow-hidden py-24 sm:py-32"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_55%,#015BE1_0%,#01327B_28%,#01327B00_68%)] opacity-35"
          />
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
              <a
                href="/signup"
                className="font-semibold text-white underline-offset-4 transition hover:text-[#60A5FA] hover:underline"
              >
                Start now
              </a>
            </p>
          </Reveal>
        </section>

        <footer className="border-t border-white/10">
          <div
            className={`${wrap} flex flex-col gap-6 py-8 sm:flex-row sm:items-center sm:justify-between`}
          >
            <Logo />
            <div className="flex items-center gap-7 text-xs text-[#B6C8D9]">
              <a href="#home" className="transition hover:text-white">
                About
              </a>
              <a href="#get-started" className="transition hover:text-white">
                Contact
              </a>
            </div>
          </div>
          <div className="border-t border-white/5">
            <div
              className={`${wrap} flex items-center justify-between py-5 text-[10px] uppercase tracking-[0.14em] text-[#A4A5AF]`}
            >
              <span>Quorum / Work, in context</span>
              <a href="#home" className="transition hover:text-white">
                Top
              </a>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}

export default LandingPage;