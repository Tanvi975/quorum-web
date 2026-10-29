
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";

import authBg1 from "../assets/auth-bg-1.png";
import authBg2 from "../assets/auth-bg-2.png";
import authBg3 from "../assets/auth-bg-3.png";

import illustration1 from "../assets/team-illustration-1.svg";
import illustration2 from "../assets/team-illustration-2.svg";
import illustration3 from "../assets/team-illustration-3.svg";

import "../styles/AuthLayout.css";

const illustrationSlides = [
  {
    image: illustration1,
    title: "Real-Time Collaboration for Modern Teams",
    subtitle:
      "High-fidelity video syncs integrated directly into your workspace.",
  },
  {
    image: illustration2,
    title: "Turn Complex Ideas into Direct Action",
    subtitle:
      "Interactive whiteboards and structured agendas build immediate alignment.",
  },
  {
    image: illustration3,
    title: "Secure Workspace\nContinuity",
    subtitle:
      "Enterprise-grade security helps protect your organizational data.",
  },
];

function AuthLayout({
  title,
  subtitle,
  leftTitle,
  leftSubtitle,
  leftImage,
  children,
  showBack = true,
}) {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState(1);
  const [transitionEnabled, setTransitionEnabled] = useState(true);

  const slides = useMemo(() => {
    const currentIndex = illustrationSlides.findIndex(
      (slide) => slide.image === leftImage
    );

    const startIndex = currentIndex >= 0 ? currentIndex : 0;

    return illustrationSlides.map((_, position) => {
      const slideIndex =
        (startIndex + position) % illustrationSlides.length;

      const slide = illustrationSlides[slideIndex];

      if (position === 0) {
        return {
          ...slide,
          title: leftTitle || slide.title,
          subtitle: leftSubtitle || slide.subtitle,
        };
      }

      return slide;
    });
  }, [leftImage, leftTitle, leftSubtitle]);

  useEffect(() => {
    setActiveIndex(0);
  }, [leftImage, leftTitle, leftSubtitle]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }
  
    const interval = window.setInterval(() => {
      setActiveIndex((current) => current + 1);
    }, 4000);
  
    return () => window.clearInterval(interval);
  }, [leftImage, leftTitle, leftSubtitle]);

  return (
    <div
      className="relative min-h-screen min-h-[100dvh] overflow-x-hidden"
      style={{ backgroundColor: "#0B2A5B" }}
    >
      <img
        src={authBg1}
        className="cloud-frame cloud-frame-1 pointer-events-none"
        alt=""
        aria-hidden="true"
      />
      <img
        src={authBg2}
        className="cloud-frame cloud-frame-2 pointer-events-none"
        alt=""
        aria-hidden="true"
      />
      <img
        src={authBg3}
        className="cloud-frame cloud-frame-3 pointer-events-none"
        alt=""
        aria-hidden="true"
      />

      <div className="relative z-10 flex min-h-screen min-h-[100dvh] w-full items-center justify-center p-3 py-6 sm:p-5 md:p-6 lg:p-8">
        <div className="flex w-full max-w-5xl min-w-0 flex-col items-center gap-6 rounded-2xl border border-white/30 bg-white/25 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.15)] backdrop-blur-xl sm:p-6 md:min-h-[80vh] md:flex-row md:gap-8 md:p-8 lg:gap-10 lg:p-10">

          {/* Transparent illustration carousel */}
          <div
            className="hidden min-w-0 flex-1 md:block"
            aria-label="Quorum features"
          >
            <div className="auth-carousel">
            <div
  className="auth-carousel-track"
  style={{
    transform: `translateX(-${activeIndex * 100}%)`,
    transition: transitionEnabled
      ? "transform 800ms cubic-bezier(0.22, 1, 0.36, 1)"
      : "none",
  }}
  onTransitionEnd={(event) => {
    if (
      event.target !== event.currentTarget ||
      activeIndex !== slides.length
    ) {
      return;
    }

    // Reset invisibly from duplicate first slide to original first.
    setTransitionEnabled(false);
    setActiveIndex(0);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTransitionEnabled(true);
      });
    });
  }}
>
  {[...slides, slides[0]].map((slide, index) => (
    <section
      key={`${slide.image}-${index}`}
      className="auth-carousel-slide"
      aria-hidden={activeIndex !== index}
    >
      <div className="auth-slide-heading">
        <h1 className="auth-slide-title">{slide.title}</h1>
      </div>

      <div className="auth-slide-image-stage">
        <img
          src={slide.image}
          alt="Team collaboration"
          className="auth-slide-image"
          draggable="false"
        />
      </div>

      <div className="auth-slide-subtitle">
        <p>{slide.subtitle}</p>
      </div>
    </section>
  ))}
</div>
 </div>
 </div>
          <div className="relative w-full min-w-0 max-w-sm rounded-xl border border-[#D7D7D7]/25 bg-[#F7F6F2] p-5 shadow-[0_8px_24px_-4px_rgba(37,99,235,0.15)] sm:p-7 md:flex-none md:p-8">

            {showBack && (
              <button
                type="button"
                onClick={() => navigate("/landing", { replace: true })}
                aria-label="Go back"
                className="absolute left-4 top-4 rounded-lg p-1 text-gray-500 transition hover:text-[#2563EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:left-5 sm:top-5 md:left-6 md:top-6"
              >
                <FiArrowLeft size={20} />
              </button>
            )}

            <h2
              className={`mb-5 text-center text-xl font-bold leading-snug sm:mb-6 sm:text-2xl ${
                showBack ? "px-5" : ""
              }`}
              style={{
                backgroundImage: "linear-gradient(to bottom, #0F172A, #2563EB)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                color: "transparent",
              }}
            >
              {title}
            </h2>

            {subtitle && (
              <p className="mb-5 text-center text-sm leading-relaxed text-gray-600">
                {subtitle}
              </p>
            )}

            <div className="w-full min-w-0">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
