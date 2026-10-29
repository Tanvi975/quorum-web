
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
    title: "Create or join Organizations, build teams seamlessly.",
    description:
      "Bring people, conversations and work together in one connected workspace.",
  },
  {
    title: "Team chat & conversations",
    description:
      "Keep conversations connected to the work your team is doing.",
  },
  {
    title: "Workspace & whiteboards",
    description:
      "Turn ideas into shared plans and keep everyone moving forward.",
  },
];

function LandingPage() {
  return (
    <main className="landing-page">
      {/* Keep the existing cloud background */}
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
        {/* Header */}
        <header className="landing-header">
          <a href="#home" className="landing-logo">
            <span className="landing-logo__mark">Q</span>
            <span>QUORUM</span>
          </a>

          <nav className="landing-nav" aria-label="Main navigation">
            <a href="#features">Features</a>
            <a href="#calendar">Calendar</a>
            <a href="#testimonials">About</a>
          </nav>

          <div className="landing-header__actions">
            <a className="landing-shine" href="#features" aria-label="Explore features">
              ✦
            </a>
            <a className="landing-button landing-button--small" href="/login">
              Get Started
            </a>
          </div>
        </header>

        {/* Hero */}
        <section className="landing-hero" id="home">
          <div className="landing-hero__copy">
            <p className="landing-eyebrow">YOUR WORKSPACE, CONNECTED</p>

            <h1>
              One clear place for your
              <br className="desktop-break" /> team to move work
              <br className="desktop-break" /> forward.
            </h1>

            <p className="landing-hero__description">
              Bring your team, meetings and everyday work together
              in one clear, connected workspace.
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

        {/* Features */}
        <section className="landing-section features-section" id="features">
          <div className="landing-section__heading">
            <p className="landing-eyebrow">ONE CONNECTED WORKSPACE</p>
            <h2>
              Everything your team
              <br className="desktop-break" /> needs. Nothing it doesn’t.
            </h2>
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

        {/* Calendar */}
        <section className="landing-section calendar-section" id="calendar">
          <div className="calendar-section__heading">
            <p className="landing-eyebrow">PLANNING WITHOUT THE CHAOS</p>
            <h2>
              Stay in rhythm from the first
              <br className="desktop-break" /> meeting to the final handoff.
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

        {/* Testimonials */}
        <section className="landing-section testimonials-section" id="testimonials">
          <div className="landing-section__heading">
            <p className="landing-eyebrow">BUILT FOR BETTER TEAMWORK</p>
            <h2>
              More focus. Fewer
              <br className="desktop-break" /> handoffs.
            </h2>
          </div>

          <div className="testimonials-grid">
            <img src={testimonial1} alt="Customer testimonial one" />
            <img src={testimonial2} alt="Customer testimonial two" />
            <img src={testimonial3} alt="Customer testimonial three" />
          </div>
        </section>

        {/* Final CTA */}
        <section className="landing-cta" id="get-started">
          <div className="landing-cta__copy">
            <p className="landing-eyebrow">MAKE WORK FLOW</p>
            <h2>
              Make space for the work that
              <br className="desktop-break" /> matters.
            </h2>
            <p>
              Give your team one connected place to plan, meet and move
              meaningful work forward.
            </p>
          </div>

          <div className="landing-cta__actions">
            <a href="/login" className="landing-button">
              Sign in to Quorum
            </a>
            <a href="/login" className="landing-button landing-button--outline">
              Get Started
            </a>
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
