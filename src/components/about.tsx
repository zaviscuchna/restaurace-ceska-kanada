import Image from "next/image";
import { features } from "@/lib/site";
import { Reveal } from "./reveal";
import arealImg from "../../public/images/zvule/zvule-areal.jpg";

export function About() {
  return (
    <section id="o-nas" className="relative bg-black/80 py-[clamp(5rem,12vw,9rem)]">
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
          <Reveal>
            <p className="mb-6 flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-primary">
              <span className="h-px w-10 bg-primary/70" />
              Místo u vody
            </p>
            <h2 className="font-display text-[clamp(2.1rem,5vw,3.6rem)] font-light leading-[1.05] tracking-[-0.02em] text-cream">
              Hospoda, kam se chodí{" "}
              <span className="italic text-primary-soft">pro chuť i pro klid</span>
            </h2>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-cream/80">
              Sedíte uprostřed borových lesů České Kanady, pár kroků od hladiny
              rybníka Zvůle. Na stole talíř poctivého českého jídla, ve sklenici
              vychlazený ležák. Žádné zbytečnosti — jen to, co tu vždycky
              fungovalo.
            </p>
            <p className="mt-4 max-w-xl leading-relaxed text-muted">
              Restaurace je srdcem autokempu Zvůle. Zastavíte se na oběd z výletu,
              přijdete na pivo k vodě, nebo zůstanete na pár dní pod stany a v
              chatkách. Vítáni jsou výletníci, cyklisté i celé rodiny.
            </p>
          </Reveal>

          <Reveal delay={120}>
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-line">
              <Image
                src={arealImg}
                alt="Letecký pohled na rybník Zvůle a autokemp uprostřed borových lesů České Kanady"
                placeholder="blur"
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="object-cover"
                fill
              />
            </div>
          </Reveal>
        </div>

        <ul className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:mt-24 lg:grid-cols-4">
          {features.map((f, i) => (
            <Reveal as="li" key={f.title} delay={i * 90} className="bg-bg">
              <div className="h-full bg-surface/40 p-7">
                <span className="font-display text-3xl text-primary/80">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 font-display text-xl text-cream">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{f.text}</p>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
