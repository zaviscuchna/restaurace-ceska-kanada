import Image, { type StaticImageData } from "next/image";
import piva from "../../public/images/detail-piva.jpg";
import polevka from "../../public/images/detail-polevka.jpg";
import pecene from "../../public/images/detail-pecene.jpg";
import svickova from "../../public/images/zvule/zvule-jidlo.jpg";
import chatky from "../../public/images/zvule/zvule-chatky.jpg";
import landstejn from "../../public/images/zvule/zvule-landstejn.jpg";
import { Reveal } from "./reveal";

const photos: { src: StaticImageData; alt: string }[] = [
  { src: piva, alt: "Dvě vychlazená točená piva s pěnou" },
  { src: polevka, alt: "Sváteční polévka s plátky houskového knedlíku" },
  { src: pecene, alt: "Pečené vepřové maso na prkénku s křenem" },
  { src: svickova, alt: "Svíčková na smetaně s knedlíkem a brusinkami" },
  { src: chatky, alt: "Areál autokempu Zvůle s chatkami u lesa" },
  { src: landstejn, alt: "Hrad Landštejn nad lesy České Kanady" },
];

export function Gallery() {
  return (
    <section id="galerie" className="relative bg-surface/30 py-[clamp(5rem,12vw,9rem)]">
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <Reveal className="mb-12 max-w-2xl">
          <p className="mb-6 flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-primary">
            <span className="h-px w-10 bg-primary/70" />
            Atmosféra
          </p>
          <h2 className="font-display text-[clamp(2.1rem,5vw,3.6rem)] font-light leading-[1.05] tracking-[-0.02em] text-cream">
            Pár soust napřed
          </h2>
        </Reveal>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          {photos.map((p, i) => (
            <Reveal key={i} delay={(i % 3) * 80}>
              <figure className="group relative aspect-[4/5] overflow-hidden rounded-2xl border border-line">
                <Image
                  src={p.src}
                  alt={p.alt}
                  placeholder="blur"
                  sizes="(min-width: 768px) 33vw, 50vw"
                  className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                  fill
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-bg/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                />
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
