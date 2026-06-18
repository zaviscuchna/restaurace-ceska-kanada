import { site } from "@/lib/site";
import { getMenuGroups, getTodayDailyMenu } from "@/lib/menu-data";
import { Reveal } from "./reveal";
import { MenuTabs } from "./menu-tabs";

export async function Menu() {
  const [menuGroups, dailyMenu] = await Promise.all([
    getMenuGroups(),
    getTodayDailyMenu(),
  ]);

  const dailyDishes = dailyMenu?.expand?.dishes ?? [];
  const dailyNote = dailyMenu?.note ?? "";

  return (
    <section id="jidelnicek" className="relative bg-surface/30 py-[clamp(5rem,12vw,9rem)]">
      <div className="mx-auto max-w-6xl px-6 md:px-12">
        <Reveal className="mb-14 text-center">
          <p className="mb-5 flex items-center justify-center gap-3 text-xs uppercase tracking-[0.3em] text-primary">
            <span className="h-px w-10 bg-primary/70" />
            Z naší kuchyně
            <span className="h-px w-10 bg-primary/70" />
          </p>
          <h2 className="font-display text-[clamp(2.1rem,5vw,3.6rem)] font-light leading-[1.05] tracking-[-0.02em] text-cream">
            Jídelníček
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-muted">
            Denní nabídka se mění každý den, stálé menu zůstává celou sezónu. Letní specialitou je{" "}
            <span className="text-cream/90">rožněné sele</span> — pravidelně v
            úterý, čtvrtek a sobotu.
          </p>
        </Reveal>

        <MenuTabs menuGroups={menuGroups} dailyDishes={dailyDishes} dailyNote={dailyNote} />

        <Reveal className="mt-16 text-center">
          <a
            href={`tel:${site.phoneHref}`}
            className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-cream/70 transition-colors hover:text-primary"
          >
            Alergeny &amp; informace na vyžádání — {site.phone}
          </a>
        </Reveal>
      </div>
    </section>
  );
}
