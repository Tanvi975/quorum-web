
import { useState } from "react";
import { wrap, primaryButton, navLinks, Icon, Logo } from "./LandingShared";

export default function LandingNavbar({ scrolled }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className={`fixed inset-x-0 top-0 z-50 border-b border-white/10 transition-all duration-300 ${scrolled || menuOpen ? "bg-[#061429]/90 shadow-lg shadow-black/10 backdrop-blur-xl" : "bg-transparent"}`}>
      <div className={`${wrap} flex h-[72px] items-center justify-between gap-6`}>
        <Logo />

        <nav aria-label="Main navigation" className="hidden items-center gap-8 md:flex">
          {navLinks.map(link => (
            <a key={link.href} href={link.href} className="text-[13px] text-[#B6C8D9] transition hover:text-white">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <a href="/login" className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10">
            Sign in
          </a>
          <a href="/signup" className={`${primaryButton} !px-4 !py-2 !text-xs`}>
            Get Started
          </a>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen(open => !open)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-white md:hidden"
        >
          <Icon name={menuOpen ? "close" : "menu"} className="h-5 w-5" />
        </button>
      </div>

      <div className={`grid transition-all duration-300 md:hidden ${menuOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <div className={`${wrap} flex flex-col gap-1 pb-5`}>
            {navLinks.map(link => (
              <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-3 text-sm text-[#E2E8F0] hover:bg-white/5">
                {link.label}
              </a>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-3">
              <a href="/login" className="rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-center text-sm font-semibold">
                Sign in
              </a>
              <a href="/signup" className={primaryButton}>
                Get Started
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
