
import { useState } from "react";
import { wrap, Reveal, primaryButton } from "./LandingShared";

export default function ContactSection() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: ""
  });

  const [status, setStatus] = useState("");

  function handleChange(event) {
    setForm(current => ({
      ...current,
      [event.target.name]: event.target.value
    }));
    setStatus("");
  }

  function handleSubmit(event) {
    event.preventDefault();
    setStatus("Your form is ready. Contact form submission will be enabled when the Quorum contact API is connected.");
  }

  return (
<section id="contact" className="relative scroll-mt-20 border-t border-white/10 bg-transparent py-20 sm:py-24">
      <div className={wrap}>
        <Reveal>
          <p className="inline-flex rounded-full border border-[#60A5FA]/30 bg-[#0866E8]/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#B6D9FF]">
            Contact
          </p>
          <h2 className="mt-6 max-w-[700px] text-[clamp(2.2rem,5vw,3.5rem)] font-semibold leading-[1.08] tracking-[-0.045em] text-white">
            Start with a conversation.
          </h2>
          <p className="mt-5 max-w-[560px] text-sm leading-relaxed text-[#B6C8D9]">
            Tell us what you need. We'll help you understand how Quorum fits your team.
          </p>
        </Reveal>

        <div className="mt-12 grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <Reveal>
            <h3 className="max-w-[360px] text-[clamp(1.8rem,3.5vw,2.5rem)] font-semibold leading-[1.12] tracking-[-0.04em] text-white">
              What would you like to work through?
            </h3>
            <p className="mt-5 max-w-[360px] text-sm leading-relaxed text-[#B6C8D9]">
              Tell us about your team, your workflow, and what you want to improve.
            </p>
          </Reveal>

          <Reveal delay={120}>
            <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-[#142C49] p-5 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.55)] sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-base font-semibold text-white">Your message</h3>
                <span className="text-[10px] text-[#8CA3BE]">* Required</span>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <label className="block text-xs font-medium text-[#EDEFF7]">
                  Name *
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    autoComplete="name"
                    placeholder="Your full name"
                    className="mt-2 w-full rounded-lg border border-white/10 bg-[#0D2549] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#7187A3] focus:border-[#60A5FA]"
                  />
                </label>

                <label className="block text-xs font-medium text-[#EDEFF7]">
                  Work email *
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="mt-2 w-full rounded-lg border border-white/10 bg-[#0D2549] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#7187A3] focus:border-[#60A5FA]"
                  />
                </label>
              </div>

              <label className="mt-5 block text-xs font-medium text-[#EDEFF7]">
                Message *
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  placeholder="How can we help?"
                  className="mt-2 w-full resize-y rounded-lg border border-white/10 bg-[#0D2549] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#7187A3] focus:border-[#60A5FA]"
                />
              </label>

              <p className="mt-3 text-[11px] text-[#8CA3BE]">
                Please don't include sensitive confidential information.
              </p>

              {status && (
                <p role="status" className="mt-4 rounded-lg border border-[#60A5FA]/30 bg-[#0866E8]/10 p-3 text-xs leading-relaxed text-[#C6EAFF]">
                  {status}
                </p>
              )}

              <button type="submit" className={`${primaryButton} mt-6`}>
                Send message
              </button>
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
