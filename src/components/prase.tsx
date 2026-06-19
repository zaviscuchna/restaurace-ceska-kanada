import Image from "next/image";
import praseImg from "../../public/images/prase-na-roznii.jpg";
import { Reveal } from "./reveal";

export function Prase() {
  return (
    <section id="prase" className="relative bg-bg py-[clamp(5rem,12vw,9rem)]">
      <div className="mx-auto max-w-7xl px-6 md:px-12">

        <Reveal className="mb-12 lg:mb-16">
          <p className="mb-5 flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-primary">
            <span className="h-px w-10 bg-primary/70" />
            Specialita domu
          </p>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="font-display text-[clamp(2.4rem,6vw,4.2rem)] font-light leading-[1.02] tracking-[-0.03em] text-cream">
              Celé prase{" "}
              <span className="italic text-primary-soft">na rožni</span>
            </h2>
            <p className="max-w-md text-base leading-relaxed text-muted lg:text-right">
              Pomalu pečené celé prase nad živým ohněm — zlatavá kůrka,
              šťavnaté maso. Tradice, která voní po celém kempu.
            </p>
          </div>
        </Reveal>

        {/* Fotka — celá šířka, panoramatická */}
        <Reveal>
          <div className="relative w-full overflow-hidden rounded-2xl border border-line" style={{ aspectRatio: "21/9" }}>
            <Image
              src={praseImg}
              alt="Celé prase pečené na rožni v restauraci Česká Kanada"
              fill
              sizes="(min-width: 1280px) 1200px, 100vw"
              className="object-cover object-center"
              placeholder="blur"
            />
            {/* Overlay s dny */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 flex flex-col items-start gap-4 p-8 sm:flex-row sm:items-end sm:justify-between md:p-12">
              <div>
                <p className="font-display text-[clamp(1rem,2.5vw,1.4rem)] font-light italic text-cream/70">
                  Každý
                </p>
                <p className="font-display text-[clamp(2rem,5vw,3.2rem)] leading-none tracking-[-0.02em] text-cream">
                  čtvrtek & sobotu
                </p>
              </div>
              <p className="text-sm uppercase tracking-[0.25em] text-primary">
                od doby otevření
              </p>
            </div>
          </div>
        </Reveal>

        {/* Tři detaily pod fotkou */}
        <ul className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
          {[
            { n: "01", title: "Živý oheň", text: "Pečeme tradičně nad dřevem — žádné zkratky, žádné pece." },
            { n: "02", title: "Celé prase", text: "Od rána na rožni, ke stolu přichází až je hotové — ne dřív." },
            { n: "03", title: "Čt & So", text: "Pravidelně dvakrát týdně, dokud není prase. Nedá se rezervovat." },
          ].map((item, i) => (
            <Reveal as="li" key={item.n} delay={i * 80} className="bg-bg">
              <div className="h-full bg-surface/40 p-7">
                <span className="font-display text-3xl text-primary/70">{item.n}</span>
                <h3 className="mt-4 font-display text-xl text-cream">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.text}</p>
              </div>
            </Reveal>
          ))}
        </ul>

      </div>
    </section>
  );
}
