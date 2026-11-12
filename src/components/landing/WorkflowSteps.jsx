
import { wrap, Reveal, flowSteps, Icon } from "./LandingShared";

export default function WorkflowSteps() {
  return (
    <section id="flow" className="relative scroll-mt-16 bg-transparent pb-16 pt-12 sm:pb-20 sm:pt-16">
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
          </div>
        </Reveal>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {flowSteps.map((step, index) => (
            <Reveal key={step.title} delay={index * 100}>
              <article className="group flex min-h-[250px] flex-col rounded-2xl border border-[#388DF8]/20 bg-[#142C49]/90 p-6 transition duration-300 hover:-translate-y-1.5 hover:border-[#60A5FA]/50 hover:bg-[#153E70] hover:shadow-[0_24px_50px_-24px_rgba(56,141,248,0.4)]">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#388DF8]/20 text-xs font-semibold text-[#60A5FA]">
                  {index + 1}
                </span>
                <h3 className="mt-10 text-lg font-semibold text-[#EDEFF7]">
                  {step.title}
                </h3>
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
  );
}
