import { hours, site } from "@/lib/site";
import { Reveal } from "./reveal";

export function Contact() {
  return (
    <section id="kontakt" className="relative bg-bg py-[clamp(5rem,12vw,9rem)]">
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Rezervace + kontakt */}
          <Reveal id="rezervace">
            <p className="mb-6 flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-primary">
              <span className="h-px w-10 bg-primary/70" />
              Rezervace &amp; kontakt
            </p>
            <h2 className="font-display text-[clamp(2.1rem,5vw,3.6rem)] font-light leading-[1.05] tracking-[-0.02em] text-cream">
              Zamluvte si stůl <span className="italic text-primary-soft">u vody</span>
            </h2>
            <p className="mt-6 max-w-md leading-relaxed text-cream/80">
              Na větší skupiny, oslavy i víkendy doporučujeme rezervaci předem.
              Zavolejte nebo napište — rádi vám poradíme i s ubytováním v kempu.
            </p>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
              <a
                href={`tel:${site.phoneHref}`}
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 font-medium text-bg transition-[transform,background-color] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-0.5 hover:bg-primary-soft"
              >
                {site.phone}
              </a>
              <a
                href={`mailto:${site.email}`}
                className="inline-flex items-center justify-center rounded-full border border-cream/30 px-7 py-3.5 font-medium text-cream transition-colors duration-300 hover:border-cream/60 hover:bg-cream/5"
              >
                {site.email}
              </a>
            </div>

            <div className="mt-10 space-y-1 text-muted">
              <p className="text-xs uppercase tracking-[0.25em] text-primary/80">Kde nás najdete</p>
              <p className="text-cream">{site.name}</p>
              <p>{site.address.line1}</p>
              <p>{site.address.line2}</p>
            </div>
          </Reveal>

          {/* Otevírací doba */}
          <Reveal delay={120}>
            <div className="rounded-2xl border border-line bg-surface/40 p-8 md:p-10">
              <p className="mb-6 text-xs uppercase tracking-[0.25em] text-primary/80">
                Otevírací doba
              </p>
              <ul className="divide-y divide-line">
                {hours.map((h) => (
                  <li key={h.day} className="flex items-center justify-between py-3.5">
                    <span className="text-cream/90">{h.day}</span>
                    <span className="font-display text-primary-soft">{h.time}</span>
                  </li>
                ))}
              </ul>
              <a
                href={site.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-cream/70 transition-colors hover:text-primary"
              >
                Otevřít v mapách →
              </a>
            </div>
          </Reveal>
        </div>

        {/* Mapa — TODO: vložit reálný Google Maps embed (iframe) */}
        <Reveal delay={100} className="mt-12">
          <div className="flex h-72 items-center justify-center overflow-hidden rounded-2xl border border-line bg-surface md:h-96">
            <span className="text-xs uppercase tracking-[0.22em] text-muted">
              Mapa: zde přijde Google Maps embed (Autokemp Zvůle)
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
