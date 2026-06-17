import { Reveal } from "./reveal";

const reviews = [
  {
    text: "Jídlo bylo jako vždy perfektní a za rozumnou cenu. Vrátíme se!",
    author: "Petruška",
    source: "camp.cz",
    stars: 5,
  },
  {
    text: "Pěkné ubytování, super sociální zázemí, dobrá kuchyně. Borůvkové knedlíky byly výborné.",
    author: "Hanka",
    source: "eKempy.cz",
    stars: 5,
  },
  {
    text: "Příjemné prostředí, příznivé ceny, ochotná obsluha. Místo s krásnou retro atmosférou.",
    author: "Laďka",
    source: "eKempy.cz · 2023",
    stars: 5,
  },
];

function Stars({ count }: { count: number }) {
  return (
    <span aria-label={`${count} hvězdiček z 5`} className="text-primary text-sm tracking-wider">
      {"★".repeat(count)}
    </span>
  );
}

export function Reviews() {
  return (
    <section className="relative py-[clamp(4rem,10vw,7rem)]">
      <div className="mx-auto max-w-6xl px-6 md:px-12">
        <Reveal className="mb-12 text-center">
          <p className="mb-5 flex items-center justify-center gap-3 text-xs uppercase tracking-[0.3em] text-primary">
            <span className="h-px w-10 bg-primary/50" />
            Hosté říkají
            <span className="h-px w-10 bg-primary/50" />
          </p>
          <h2 className="font-display text-[clamp(2rem,4vw,3.2rem)] font-light leading-[1.05] tracking-[-0.02em] text-white">
            Co říkají{" "}
            <span className="italic text-primary">hosté</span>
          </h2>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-3">
          {reviews.map((r, i) => (
            <Reveal key={r.author} delay={i * 100}>
              <figure className="flex h-full flex-col rounded-2xl border border-primary/12 bg-black/55 p-7 backdrop-blur-sm">
                <Stars count={r.stars} />
                <blockquote className="mt-4 flex-1 font-display text-[1.05rem] font-light italic leading-relaxed text-cream">
                  „{r.text}"
                </blockquote>
                <figcaption className="mt-6 border-t border-primary/10 pt-5">
                  <span className="block text-sm font-medium text-white">
                    {r.author}
                  </span>
                  <span className="mt-0.5 block text-xs uppercase tracking-[0.16em] text-muted/70">
                    {r.source}
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-10 text-center">
          <a
            href="https://www.ekempy.cz/diskuze-recenze/186-autokemp-zvule-kunzak"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-muted/70 underline-offset-4 transition-colors hover:text-primary hover:underline"
          >
            Více recenzí na eKempy.cz →
          </a>
        </Reveal>
      </div>
    </section>
  );
}
