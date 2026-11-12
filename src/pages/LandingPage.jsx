
import { useEffect, useState } from "react";
import LandingNavbar from "../components/landing/LandingNavbar";
import LandingHero from "../components/landing/LandingHero";
import WorkspaceFeatures from "../components/landing/WorkspaceFeatures";
import CalendarShowcase from "../components/landing/CalendarShowcase";
import WorkflowSteps from "../components/landing/WorkflowSteps";
import MeetingTimeline from "../components/landing/MeetingTimeline";
import LandingFAQ from "../components/landing/LandingFAQ";
import ContactSection from "../components/landing/ContactSection";
import LandingCTA from "../components/landing/LandingCTA";
import LandingFooter from "../components/landing/LandingFooter";
import BackToTop from "../components/landing/BackToTop";

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const previous = root.style.scrollBehavior;
    root.style.scrollBehavior = "smooth";

    return () => {
      root.style.scrollBehavior = previous;
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main
      className="relative overflow-x-clip font-['Inter','Segoe_UI',system-ui,sans-serif] text-[#F9FCFF] antialiased selection:bg-[#388DF8]/40"
      style={{
        background: `
          linear-gradient(
            180deg,
            #061429 0%,
            #0D3266 10%,
            #305485 24%,
            #4C698E 34%,
            #305485 46%,
            #062C5F 60%,
            #0D2549 76%,
            #061429 100%
          )
        `
      }}
    >
      <style>{`
        @keyframes q-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        html,
        body {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        html::-webkit-scrollbar,
        body::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }

        @media (prefers-reduced-motion: reduce) {
          .q-anim {
            animation: none !important;
          }

          html {
            scroll-behavior: auto !important;
          }
        }
      `}</style>

      <LandingNavbar scrolled={scrolled} />

      <div className="relative">
        <LandingHero />
        <WorkspaceFeatures />
        <CalendarShowcase />
      </div>

      <WorkflowSteps />
      <MeetingTimeline />
      <LandingFAQ />
      <ContactSection />
      <LandingCTA />
      <LandingFooter />

      <BackToTop visible={scrolled} />
    </main>
  );
}
