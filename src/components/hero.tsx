import type React from "react";
import Image from "next/image";
import heroFood from "../../public/images/hero-food.png";

export function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-[100dvh] w-full flex-col items-center justify-center overflow-hidden"
    >
      {/* ── Flatlay food fotka (1.png) ── */}
      <div className="absolute inset-0 z-0">
        <Image
          src={heroFood}
          alt="Poctivá česká kuchyně – svíčková, vepřová pečeně, smažák, knedlíky"
          placeholder="blur"
          priority
          quality={90}
          sizes="100vw"
          className="object-cover object-center"
          fill
        />
        {/* Vignette — tmavší střed pro čitelnost textu, okraje nechány žít */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background: [
              "radial-gradient(ellipse 55% 55% at 50% 50%, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.38) 55%, rgba(0,0,0,0.05) 80%)",
              "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 20%, transparent 65%, rgba(0,0,0,1) 100%)",
            ].join(", "),
          }}
        />
      </div>

      {/* ── Text centrovaný do tmavého středu fotky ── */}
      <div className="relative z-10 flex max-w-3xl flex-col items-center px-6 py-28 text-center">
        <p
          className="reveal mb-7 flex flex-wrap items-center justify-center gap-3 text-[0.68rem] uppercase tracking-[0.28em] text-primary sm:tracking-[0.36em]"
          style={{ animationDelay: "0.1s" }}
        >
          <span className="h-px w-8 bg-primary/50" />
          Autokemp Zvůle · Česká Kanada
          <span className="h-px w-8 bg-primary/50" />
        </p>

        <h1 className="font-display" style={{ textWrap: "balance" } as React.CSSProperties}>
          <span
            className="reveal block text-[clamp(3rem,8vw,7rem)] font-light leading-[0.92] tracking-[-0.02em] text-white"
            style={{ animationDelay: "0.22s" }}
          >
            Tady chutná
          </span>
          <span
            className="reveal block text-[clamp(3rem,8vw,7rem)] font-light italic leading-[0.92] tracking-[-0.02em] text-primary"
            style={{ animationDelay: "0.36s" }}
          >
            Česká Kanada.
          </span>
        </h1>

        <p
          className="reveal mt-8 max-w-[44ch] text-[1rem] leading-relaxed text-cream/80 md:text-[1.08rem]"
          style={{ animationDelay: "0.52s" }}
        >
          Poctivá česká kuchyně v klidu borových lesů. Svíčková, rožněné sele,
          vychlazený ležák — u rybníka Zvůle v srdci České Kanady.
        </p>

        <div
          className="reveal mt-10 flex flex-col gap-3 sm:flex-row sm:items-center"
          style={{ animationDelay: "0.68s" }}
        >
          <a
            href="#jidelnicek"
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-3.5 font-medium text-bg shadow-[0_8px_32px_rgba(200,146,74,0.3)] transition-[transform,background-color,box-shadow] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-0.5 hover:bg-primary-soft hover:shadow-[0_14px_44px_rgba(200,146,74,0.4)]"
          >
            Jídelníček
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </a>
          <a
            href="#kontakt"
            className="inline-flex items-center justify-center rounded-full border border-cream/20 px-8 py-3.5 font-medium text-cream transition-colors duration-300 hover:border-primary/50 hover:text-primary"
          >
            Rezervovat stůl
          </a>
        </div>

        <p
          className="reveal mt-11 text-[0.66rem] uppercase tracking-[0.24em] text-muted/65"
          style={{ animationDelay: "0.85s" }}
        >
          Otevřeno denně 11–22 · Sportovní 197, Kunžak
        </p>
      </div>

      {/* Scroll indikátor */}
      <a
        href="#o-nas"
        aria-label="Posunout dolů"
        className="reveal absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-muted"
        style={{ animationDelay: "1.05s" }}
      >
        <span className="text-[0.6rem] uppercase tracking-[0.32em]">Níž</span>
        <span className="h-10 w-px animate-pulse bg-gradient-to-b from-primary/50 to-transparent" />
      </a>
    </section>
  );
}
