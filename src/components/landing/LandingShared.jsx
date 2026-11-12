
import { useEffect, useRef, useState } from "react";

export const wrap = "mx-auto w-full max-w-[1120px] px-5 sm:px-8";

export const primaryButton =
  "inline-flex items-center justify-center rounded-lg bg-[#0866E8] px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_-10px_rgba(0,102,255,0.65)] transition duration-300 hover:-translate-y-1 hover:bg-[#0759CC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#60A5FA]";

export const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Workspace", href: "#calendar" },
  { label: "How it works", href: "#flow" },
  { label: "FAQ", href: "#faq" },
  { label: "Contact", href: "#contact" }
];

export const flowSteps = [
  {
    title: "Prepare",
    text: "Schedule the meeting. See who's attending and what's on the agenda.",
    icon: "calendar"
  },
  {
    title: "Work through it",
    text: "Screen share, chat, transcript — everything visible during the meeting.",
    icon: "video"
  },
  {
    title: "Follow through",
    text: "Decisions captured. Owners named. Action items linked to the transcript.",
    icon: "doc"
  }
];

export const timelineLabels = [
  "Schedule",
  "Meet",
  "Transcript",
  "Summary",
  "Action items"
];

export const timelineSteps = [
  { tag: "Schedule", title: "Calendar", text: "Set the time, invite the team." },
  { tag: "Meet", title: "Video meeting", text: "Screen share, chat and live transcript." },
  { tag: "Review", title: "Summary", text: "Decisions and action items captured." },
  { tag: "Ship", title: "Done", text: "The team delivers on what was decided." }
];

export const faqs = [
  {
    q: "What is Quorum?",
    a: "Quorum is one workspace for video meetings, team chat, whiteboards and documentation, so your team stops switching between tools."
  },
  {
    q: "What can a team do in a meeting?",
    a: "Share screens, chat, use the whiteboard and read a live transcript. Decisions and action items are captured as the meeting runs."
  },
  {
    q: "How do organizations and communities differ?",
    a: "An organization is your own team with members, roles and private spaces. A community is an open space where people from different teams or outside guests can join."
  },
  {
    q: "What happens after a meeting ends?",
    a: "Quorum saves the transcript and a summary, lists the decisions, and links each action item to its owner so follow-up starts right away."
  }
];

const iconPaths = {
  calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z",
  video: "M15 10l5-3v10l-5-3M4 6h9a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z",
  doc: "M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8zM14 3v5h5M9 13h6M9 17h6",
  chevron: "M6 9l6 6 6-6",
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "M6 6l12 12M18 6L6 18",
  arrow: "M12 19V5M5 12l7-7 7 7"
};

export function Icon({ name, className = "h-4 w-4" }) {
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

export function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${
        shown ? "translate-y-0 opacity-100" : "translate-y-7 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function Logo({ href = "#home" }) {
  return (
    <a href={href} className="flex items-center gap-2.5 text-xs font-bold tracking-[0.08em] text-[#F9FCFF]">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/15 bg-[#1D2A3D] text-sm">
        Q
      </span>
      QUORUM
    </a>
  );
}

export function SectionHeading({ tag, children, text, align = "center" }) {
  return (
    <div className={align === "center" ? "mx-auto max-w-[780px] text-center" : "max-w-[780px] text-left"}>
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

export function FeatureImage({ src, alt }) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className="block h-auto w-full drop-shadow-[0_18px_36px_rgba(1,10,30,0.28)] transition duration-300 ease-out hover:-translate-y-1 hover:drop-shadow-[0_26px_44px_rgba(1,10,30,0.4)]"
    />
  );
}
