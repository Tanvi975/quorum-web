
import { wrap, Logo } from "./LandingShared";

export default function LandingFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#061429]">
      <div className={`${wrap} flex flex-col gap-6 py-8 sm:flex-row sm:items-center sm:justify-between`}>
        <Logo />
        <div className="flex flex-wrap items-center gap-7 text-xs text-[#B6C8D9]">
          <a href="#home" className="transition hover:text-white">About</a>
          <a href="#contact" className="transition hover:text-white">Contact</a>
          <a href="#faq" className="transition hover:text-white">FAQ</a>
        </div>
      </div>
      <div className="border-t border-white/5">
        <div className={`${wrap} py-5 text-[10px] uppercase tracking-[0.14em] text-[#A4A5AF]`}>
          Quorum / Work, in context
        </div>
      </div>
    </footer>
  );
}
