import Image from "next/image";
import { camp } from "@/lib/site";
import { Reveal } from "./reveal";
import rybnikImg from "../../public/images/zvule/zvule-rybnik.jpg";

export function Camp() {
  return (
    <section id="kemp" className="relative bg-bg py-[clamp(5rem,12vw,9rem)]">
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <Reveal className="max-w-2xl">
          <p className="mb-6 flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-primary">
            <span className="h-px w-10 bg-primary/70" />
            Autokemp Zvůle &amp; okolí
          </p>
          <h2 className="font-display text-[clamp(2.1rem,5vw,3.6rem)] font-light leading-[1.05] tracking-[-0.02em] text-cream">
            Přijeďte na oběd, <span className="italic text-primary-soft">zůstaňte na víkend</span>
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-cream/80">
            Restaurace je součástí autokempu přímo u rybníka Zvůle, v srdci České
            Kanady. Voda, lesy a klid na dosah — a teplé jídlo, když se vrátíte z
            výletu.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-8 lg:grid-cols-2 lg:items-stretch lg:gap-12">
          <Reveal delay={100}>
            <div className="relative h-full min-h-[22rem] w-full overflow-hidden rounded-2xl border border-line">
              <Image
                src={rybnikImg}
                alt="Letecký pohled na autokemp Zvůle zasazený do borových lesů u rybníka"
                placeholder="blur"
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
                fill
              />
            </div>
          </Reveal>

          <ul className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
            {camp.map((c, i) => (
              <Reveal as="li" key={c.title} delay={150 + i * 80} className="bg-bg">
                <div className="flex h-full flex-col bg-surface/40 p-7">
                  <h3 className="font-display text-xl text-cream">{c.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{c.text}</p>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
