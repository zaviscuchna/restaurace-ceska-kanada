import { nav, site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-line bg-bg">
      <div className="mx-auto max-w-7xl px-6 py-16 md:px-12">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <p className="text-[0.62rem] uppercase tracking-[0.34em] text-primary/90">
              Restaurace
            </p>
            <p className="font-display text-2xl text-cream">{site.shortName}</p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
              Poctivá česká kuchyně v autokempu u rybníka Zvůle, v srdci České
              Kanady.
            </p>
          </div>

          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.25em] text-primary/80">
              Sekce
            </p>
            <ul className="space-y-2 text-sm">
              {nav.map((item) => (
                <li key={item.href}>
                  <a className="text-cream/80 transition-colors hover:text-primary" href={item.href}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.25em] text-primary/80">
              Kontakt
            </p>
            <ul className="space-y-2 text-sm text-cream/80">
              <li>
                <a className="transition-colors hover:text-primary" href={`tel:${site.phoneHref}`}>
                  {site.phone}
                </a>
              </li>
              <li>
                <a className="transition-colors hover:text-primary" href={`mailto:${site.email}`}>
                  {site.email}
                </a>
              </li>
              <li className="pt-2 text-muted">{site.address.line1}</li>
              <li className="text-muted">{site.address.line2}</li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-2 border-t border-line pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 {site.name}</p>
          <p>
            Web: <span className="text-cream/70">KSH</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
