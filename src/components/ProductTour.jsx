
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const tourSteps = [
  {
    target: '[data-tour="welcome"]',
    title: "Welcome to Quorum",
    description:
      "Your workspace starts here. Get an overview of your activity and access your important actions from one place.",
    label: "Overview",
    next: "Sidebar",
  },
  {
    target: '[data-tour="sidebar-home"]',
    title: "Your Navigation",
    description:
      "Use the sidebar to access your dashboard, calendar, organizations, projects, AI assistant and other workspace tools.",
    label: "Sidebar",
    next: "Meetings",
  },
  {
    target: '[data-tour="upcoming-meetings"]',
    title: "Know where to go next",
    description:
      "Meetings, chat, and your calendar each have a home. Start with a quick meeting preview.",
    label: "Meetings",
    next: "Team",
  },
  {
    target: '[data-tour="my-calendar"]',
    title: "Your Calendar",
    description:
      "Get a monthly overview of your schedule and see which days have meetings planned.",
    label: "Calendar",
    next: "Organizations",
  },
  {
    target: '[data-tour="organizations"]',
    title: "Organizations",
    description:
      "Manage your organization, workspace and team collaboration from here.",
    label: "Organizations",
    next: "Community",
  },
  {
    target: '[data-tour="communities"]',
    title: "Communities",
    description:
      "Discover communities, join conversations and share ideas with other members.",
    label: "Community",
    next: "Quick Actions",
  },
  {
    target: '[data-tour="quick-actions"]',
    title: "Your workspace, your way",
    description:
      "Jump directly into common tasks like scheduling meetings, opening team chat, using Quorum AI and viewing saved items.",
    label: "Quick Actions",
    next: "Finish",
  },
];

export default function ProductTour() {
  const { user, loading } = useAuth();
  const location = useLocation();

  const userId = user?._id || user?.id || user?.email || "guest";
  const storageKey = `quorum-product-tour-completed-${userId}`;

  const [showWelcome, setShowWelcome] = useState(false);
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);

  useEffect(() => {
    if (loading || !user || location.pathname !== "/dashboard") return;

    if (!localStorage.getItem(storageKey)) {
      setShowWelcome(true);
    }
  }, [loading, user, location.pathname, storageKey]);

  useEffect(() => {
    if (!active || location.pathname !== "/dashboard") {
      setTargetRect(null);
      return;
    }

    let timeoutId;

    const updatePosition = () => {
      const target = document.querySelector(tourSteps[stepIndex].target);

      if (!target) {
        setTargetRect(null);
        return;
      }

      const rect = target.getBoundingClientRect();

      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    };

    const target = document.querySelector(tourSteps[stepIndex].target);

    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
    }

    timeoutId = window.setTimeout(updatePosition, 400);

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [active, stepIndex, location.pathname]);

  useEffect(() => {
    if (active && location.pathname !== "/dashboard") {
      setActive(false);
      setTargetRect(null);
    }
  }, [active, location.pathname]);

  const finishTour = () => {
    localStorage.setItem(storageKey, "true");
    setActive(false);
    setShowWelcome(false);
    setTargetRect(null);
    setStepIndex(0);
  };

  const startTour = () => {
    setShowWelcome(false);
    setStepIndex(0);
    setActive(true);
  };

  const nextStep = () => {
    if (stepIndex === tourSteps.length - 1) {
      finishTour();
      return;
    }

    setStepIndex((current) => current + 1);
  };

  const previousStep = () => {
    setStepIndex((current) => Math.max(0, current - 1));
  };

  if (loading || !user || location.pathname !== "/dashboard") {
    return null;
  }

  const currentStep = tourSteps[stepIndex];

  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  const padding = 8;

  const spotlight = targetRect
    ? {
        top: Math.max(0, targetRect.top - padding),
        left: Math.max(0, targetRect.left - padding),
        right: Math.min(
          screenWidth,
          targetRect.left + targetRect.width + padding
        ),
        bottom: Math.min(
          screenHeight,
          targetRect.top + targetRect.height + padding
        ),
      }
    : null;

  const cardWidth = Math.min(390, screenWidth - 32);

  const cardLeft = targetRect
    ? Math.max(
        16,
        Math.min(
          targetRect.left + targetRect.width / 2 - cardWidth / 2,
          screenWidth - cardWidth - 16
        )
      )
    : Math.max(16, (screenWidth - cardWidth) / 2);

  const cardHeight = 250;

  const cardTop = targetRect
    ? targetRect.top + targetRect.height + 20 + cardHeight < screenHeight - 75
      ? targetRect.top + targetRect.height + 20
      : Math.max(16, targetRect.top - cardHeight - 20)
    : screenHeight / 2 - cardHeight / 2;

  return (
    <>
      {/* WELCOME SCREEN */}
      {showWelcome && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#020817]/80 px-4 backdrop-blur-[2px]">
          <div className="flex w-full max-w-[570px] overflow-hidden rounded-xl bg-white shadow-2xl">
            {/* Blue left panel */}
            <div className="hidden w-[105px] shrink-0 flex-col items-center justify-between bg-[#087BFF] py-7 text-white sm:flex">
              <span className="text-[10px] font-bold tracking-widest">
                START HERE
              </span>

              <div className="flex flex-1 flex-col items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-white" />
                <div className="h-20 w-px bg-white/70" />
                <div className="h-2 w-2 rounded-full bg-white" />
              </div>

              <span className="text-[10px] font-bold tracking-widest">
                QUORUM
              </span>
            </div>

            {/* Welcome content */}
            <div className="flex-1 p-6 sm:p-7">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#087BFF]">
                Welcome to Quorum
              </p>

              <h2 className="mt-2 text-xl font-bold text-[#172338] sm:text-2xl">
                A quick look around?
              </h2>

              <p className="mt-2 text-xs leading-5 text-[#64748B]">
                Meetings, team updates, and your calendar — try a short guided
                preview before you get to work.
              </p>

              {/* Feature indicators */}
              <div className="mt-5 grid grid-cols-4 gap-2">
                {[
                  ["01", "Sidebar"],
                  ["02", "Meetings"],
                  ["03", "Team"],
                  ["04", "Calendar"],
                ].map(([number, label]) => (
                  <div key={number} className="text-center">
                    <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-md bg-[#E8F2FF] text-[11px] font-bold text-[#087BFF]">
                      {number}
                    </div>
                    <p className="mt-1 text-[10px] font-semibold text-[#26364D]">
                      {label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={startTour}
                  className="rounded-md bg-[#087BFF] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#0069DF]"
                >
                  Show me around →
                </button>

                <button
                  type="button"
                  onClick={finishTour}
                  className="px-3 py-2 text-xs font-semibold text-[#64748B] hover:text-[#172338]"
                >
                  Not now
                </button>
              </div>

              <p className="mt-4 text-[10px] text-[#94A3B8]">
                Learn where to find your messages and key features.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE TOUR */}
      {active && (
        <>
          {/* Dark overlay with spotlight */}
          <svg
            className="pointer-events-none fixed inset-0 z-[9998] h-full w-full"
            viewBox={`0 0 ${screenWidth} ${screenHeight}`}
            preserveAspectRatio="none"
          >
            <path
              d={
                spotlight
                  ? `M0 0 H${screenWidth} V${screenHeight} H0 Z
                     M${spotlight.left} ${spotlight.top}
                     H${spotlight.right}
                     V${spotlight.bottom}
                     H${spotlight.left} Z`
                  : `M0 0 H${screenWidth} V${screenHeight} H0 Z`
              }
              fill="rgba(2, 8, 23, 0.78)"
              fillRule="evenodd"
            />

            {spotlight && (
              <rect
                x={spotlight.left}
                y={spotlight.top}
                width={spotlight.right - spotlight.left}
                height={spotlight.bottom - spotlight.top}
                rx="10"
                fill="none"
                stroke="#168BFF"
                strokeWidth="2"
              />
            )}
          </svg>

          {/* Number marker */}
          {targetRect && (
            <div
              className="pointer-events-none fixed z-[9999] flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-white bg-[#087BFF] text-sm font-bold text-white shadow-[0_0_0_4px_rgba(8,123,255,0.3)]"
              style={{
                top: Math.max(8, targetRect.top - 20),
                left: Math.max(8, targetRect.left - 20),
              }}
            >
              {String(stepIndex + 1).padStart(2, "0")}
            </div>
          )}

          {/* White information card */}
          <div
            className="fixed z-[10000] flex overflow-hidden rounded-xl bg-white shadow-2xl"
            style={{
              top: cardTop,
              left: cardLeft,
              width: cardWidth,
              minHeight: 205,
            }}
          >
            {/* Blue accent panel */}
            <div className="flex w-[58px] shrink-0 flex-col items-center justify-between bg-[#087BFF] py-4 text-white sm:w-[68px]">
              <span className="text-sm font-bold">
                {String(stepIndex + 1).padStart(2, "0")}
              </span>

              <div className="flex flex-col gap-1">
                <span className="h-[2px] w-4 rounded-full bg-white" />
                <span className="h-[2px] w-4 rounded-full bg-white" />
                <span className="h-[2px] w-4 rounded-full bg-white" />
              </div>

              <span className="text-[8px] font-bold tracking-widest [writing-mode:vertical-rl]">
                QUORUM
              </span>
            </div>

            {/* Card content */}
            <div className="min-w-0 flex-1 p-5 sm:p-6">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#087BFF]">
                The essentials
              </p>

              <h3 className="mt-2 text-lg font-bold leading-tight text-[#172338] sm:text-xl">
                {currentStep.title}
              </h3>

              <p className="mt-2 text-xs leading-5 text-[#64748B] sm:text-[13px]">
                {currentStep.description}
              </p>

              <p className="mt-4 text-[10px] font-semibold text-[#087BFF]">
                Next: {currentStep.next} →
              </p>
            </div>
          </div>

          {/* Bottom navigation */}
          <div className="fixed bottom-0 left-0 z-[10001] w-full border-t border-white/10 bg-[#071A32]/95 px-3 py-3 backdrop-blur-md sm:px-6">
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
                {tourSteps.map((step, index) => (
                  <button
                    key={step.label}
                    type="button"
                    onClick={() => setStepIndex(index)}
                    className={`shrink-0 rounded-md px-2 py-2 text-[9px] font-bold transition sm:px-3 sm:text-[10px] ${
                      index === stepIndex
                        ? "bg-[#087BFF] text-white"
                        : "text-white/70 hover:bg-white/10"
                    }`}
                  >
                    {String(index + 1).padStart(2, "0")} {step.label}
                  </button>
                ))}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={finishTour}
                  className="hidden px-2 py-2 text-xs font-semibold text-white/70 hover:text-white sm:block"
                >
                  Skip
                </button>

                <button
                  type="button"
                  onClick={previousStep}
                  disabled={stepIndex === 0}
                  className="rounded-md border border-white/30 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10 disabled:opacity-40"
                >
                  Back
                </button>

                <button
                  type="button"
                  onClick={nextStep}
                  className="rounded-md bg-[#087BFF] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#0069DF]"
                >
                  {stepIndex === tourSteps.length - 1 ? "Finish" : "Next"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
