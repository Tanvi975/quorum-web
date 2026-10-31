
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

import testimonial1 from "../assets/Testimonial.svg";
import testimonial2 from "../assets/Testimonial1.svg";
import testimonial3 from "../assets/Testimonial2.svg";

import "../styles/LandingPage.css";

const features = [
  {
    title: "Create or Join Organizations, build teams seamlessly.",
    description:
      "Keep every decision connected to the people who made it.",
  },
  {
    title: "Team chat & conversations",
    description:
      "Move from DMs to focused team spaces without losing context.",
  },
  {
    title: "Workspace utilities",
    description:
      "Whiteboards, docs, and workflows — everything in one place.",
  },
];

function LandingPage() {
  return (
    <main className="landing-page">
      <div className="landing-background" aria-hidden="true">
        <img
          src={cloud1}
          alt=""
          className="landing-cloud landing-cloud--one"
        />
        <img
          src={cloud2}
          alt=""
          className="landing-cloud landing-cloud--two"
        />
      </div>

      <div className="landing-content">
        <header className="landing-header">
          <a href="#home" className="landing-logo">
            <span className="landing-logo__mark">Q</span>
            <span>QUORUM</span>
          </a>

          <nav className="landing-nav" aria-label="Main navigation">
            <a href="#features">Features</a>
            <a href="#calendar">Workspace</a>
            <a href="#testimonials">About</a>
          </nav>

          <div className="landing-header__actions">
            <a
              href="/login"
              className="landing-button landing-button--small landing-button--outline"
            >
              Sign in
            </a>

            <a
              href="/signup"
              className="landing-button landing-button--small"
            >
              Get Started
            </a>
          </div>
        </header>

        <section className="landing-hero" id="home">
          <div className="landing-hero__copy">
            <p className="landing-eyebrow">
              THE TEAM WORKSPACE, SIMPLIFIED
            </p>

            <h1>
              Unified workspace for
              <br className="desktop-break" /> cross-functional
              <br className="desktop-break" /> execution.
            </h1>

            <p className="landing-hero__description">
              Consolidate video calls, team chat, documentation, and project
              tracking into one high-performance platform.
            </p>

            <a href="/login" className="landing-button">
              Sign in to Quorum
            </a>
          </div>

          <div className="landing-hero__showcase">
            <img
              src={videoCall}
              alt="Quorum video meeting interface"
              className="hero-visual hero-visual--video"
            />

            <img
              src={unity}
              alt="Quorum collaboration panel"
              className="hero-visual hero-visual--unity"
            />

            <img
              src={sidePanel}
              alt="Meeting side panel"
              className="hero-visual hero-visual--side"
            />

            <img
              src={videoCallCalendar}
              alt="Video meeting calendar"
              className="hero-visual hero-visual--calendar"
            />
          </div>
        </section>

        <section className="landing-section features-section" id="features">
          <div className="landing-section__heading">
            <p className="landing-eyebrow">WORK BETTER TOGETHER</p>
            <h2>
              Purpose-built collaboration for
              <br className="desktop-break" /> modern engineering and
              <br className="desktop-break" /> operations.
            </h2>
            <p>
              Centralize critical communications, task management, and
              documentation without workflow overhead.
            </p>
          </div>

          <div className="features-layout">
            <article className="feature-card feature-card--organization">
              <img
                src={organization}
                alt="Organization workspace interface"
                className="feature-visual feature-visual--organization"
              />

              <div className="feature-card__copy">
                <h3>{features[0].title}</h3>
                <p>{features[0].description}</p>
              </div>
            </article>

            <div className="features-layout__right">
              <article className="feature-card feature-card--chat">
                <img
                  src={teamChat}
                  alt="Team chat interface"
                  className="feature-visual feature-visual--chat"
                />
                <div className="feature-card__copy">
                  <h3>{features[1].title}</h3>
                  <p>{features[1].description}</p>
                </div>
              </article>

              <article className="feature-card feature-card--whiteboard">
                <img
                  src={whiteboard}
                  alt="Collaborative whiteboard interface"
                  className="feature-visual feature-visual--whiteboard"
                />
                <div className="feature-card__copy">
                  <h3>{features[2].title}</h3>
                  <p>{features[2].description}</p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="landing-section calendar-section" id="calendar">
          <div className="calendar-section__heading">
            <p className="landing-eyebrow">ONE WORKSPACE, EVERY FLOW</p>
            <h2>
              End-to-end lifecycle visibility across
              <br className="desktop-break" /> meetings, chat, and deliverables.
            </h2>
          </div>

          <div className="calendar-layout">
            <img
              src={menu}
              alt="Calendar navigation menu"
              className="calendar-menu"
            />

            <img
              src={calendar}
              alt="Quorum calendar interface"
              className="calendar-main"
            />
          </div>
        </section>

        <section
          className="landing-section testimonials-section"
          id="testimonials"
        >
          <div className="landing-section__heading">
            <p className="landing-eyebrow">BUILT FOR REAL TEAMS</p>
            <h2>
              Trusted by decision-makers to
              <br className="desktop-break" /> drive execution.
            </h2>
          </div>

          <div className="testimonials-grid">
            <img src={testimonial1} alt="Customer testimonial one" />
            <img src={testimonial2} alt="Customer testimonial two" />
            <img src={testimonial3} alt="Customer testimonial three" />
          </div>
        </section>

        <section className="landing-cta" id="get-started">
          <div className="landing-cta__copy">
            <p className="landing-eyebrow">YOUR TEAM, IN SYNC</p>
            <h2>
              Transform how your organization
              <br className="desktop-break" /> collaborates.
            </h2>
            <p>
              Bring your meetings, conversations, and resources into one
              clear workspace.
            </p>
          </div>

          <div className="landing-cta__actions">
            <a href="/signup" className="landing-button">
              Create account
            </a>
            <p>No account yet? Start free — no card needed.</p>
          </div>
        </section>

        <footer className="landing-footer">
          <a href="#home" className="landing-logo">
            <span className="landing-logo__mark">Q</span>
            <span>QUORUM</span>
          </a>
          <span>One clear place to move work forward.</span>
        </footer>
      </div>
    </main>
  );
}

export default LandingPage;
