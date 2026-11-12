
import organization from "../../assets/organization.svg";
import teamChat from "../../assets/teamchat.svg";
import whiteboard from "../../assets/whiteboard.svg";
import { wrap, Reveal, SectionHeading, FeatureImage } from "./LandingShared";

export default function WorkspaceFeatures() {
  return (
    <section
      id="features"
      className="relative isolate scroll-mt-16 overflow-hidden bg-transparent pb-24 pt-16 sm:pb-28 sm:pt-24"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(ellipse_at_50%_0%,rgba(118,152,197,0.22)_0%,rgba(76,105,142,0.12)_42%,transparent_100%)]"
      />

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
            <FeatureImage
              src={organization}
              alt="Organization workspace interface"
            />
          </Reveal>

          <div className="flex flex-col justify-between gap-4">
            <Reveal delay={100}>
              <FeatureImage
                src={teamChat}
                alt="Team chat interface"
              />
            </Reveal>

            <Reveal delay={200}>
              <FeatureImage
                src={whiteboard}
                alt="Collaborative whiteboard interface"
              />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
