
import { useState } from "react";
import { wrap, Reveal, faqs, Icon } from "./LandingShared";

export default function LandingFAQ() {
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <section id="faq" className="relative scroll-mt-16 bg-transparent py-14 sm:py-16">
      <div className={`${wrap} max-w-[960px]`}>
        <Reveal>
          <h2 className="text-[clamp(1.75rem,3.2vw,2.5rem)] font-semibold tracking-[-0.04em] text-white">
            Frequently Asked Questions
          </h2>
        </Reveal>

        <Reveal delay={100}>
          <div className="mt-8 flex flex-col gap-3">
            {faqs.map((item, index) => {
              const open = openFaq === index;

              return (
                <div key={item.q} className={`rounded-lg border transition duration-300 ${open ? "border-[#60A5FA]/60 bg-[#0D2549]/70" : "border-[#B4BEDD]/30 bg-[#0A1B35]/60 hover:border-[#B4BEDD]/60"}`}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? -1 : index)}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium text-[#EDEFF7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#60A5FA]"
                  >
                    {item.q}
                    <Icon name="chevron" className={`h-4 w-4 shrink-0 text-[#8CA3BE] transition-transform duration-300 ${open ? "rotate-180 text-[#60A5FA]" : ""}`} />
                  </button>

                  <div className={`grid transition-all duration-300 ease-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                    <div className="overflow-hidden">
                      <p className="max-w-[720px] px-5 pb-5 text-sm leading-relaxed text-[#8CA3BE]">
                        {item.a}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
