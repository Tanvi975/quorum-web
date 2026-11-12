
import { useState } from "react";
import { wrap, Reveal, timelineLabels, timelineSteps } from "./LandingShared";

export default function MeetingTimeline() {
  const [activeStep, setActiveStep] = useState(0);
  const progress = ((activeStep + 1) / timelineSteps.length) * 100;

  return (
    <section className="relative border-y border-transparent bg-transparent py-14 sm:py-16">
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
                className="absolute inset-y-0 left-0 rounded-full bg-[#388DF8] shadow-[0_0_14px_rgba(96,165,250,0.5)] transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mt-3 hidden justify-between text-[10px] text-[#A4A5AF] sm:flex">
              {timelineLabels.map(label => (
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
                  className={`min-h-[157px] rounded-xl border p-5 text-left transition duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#60A5FA] ${
                    active
                      ? "border-[#60A5FA] bg-[#153E70]/70 shadow-[0_18px_40px_-20px_rgba(56,141,248,0.5)]"
                      : "border-[#388DF8]/20 bg-[#0D2549]/70 hover:border-[#60A5FA]/40"
                  }`}
                >
                  <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8CA3BE]">
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${active ? "bg-[#0066FF] text-white" : "bg-[#388DF8]/20 text-[#60A5FA]"}`}>
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
  );
}
