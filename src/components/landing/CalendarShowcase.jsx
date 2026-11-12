
import menu from "../../assets/menu.svg";
import calendar from "../../assets/calender.svg";
import { wrap, Reveal, SectionHeading } from "./LandingShared";

export default function CalendarShowcase() {
  return (
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
            <img src={menu} alt="Calendar navigation menu" loading="lazy" decoding="async" className="mx-auto block h-auto w-full max-w-[320px] lg:max-w-[250px]" />
          </Reveal>
          <Reveal className="order-1 lg:order-2">
            <img src={calendar} alt="Quorum calendar interface" loading="lazy" decoding="async" className="block h-auto w-full drop-shadow-[0_24px_36px_rgba(0,0,0,0.25)]" />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
