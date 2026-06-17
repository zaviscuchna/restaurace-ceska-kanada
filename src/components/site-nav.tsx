"use client";

import { useEffect, useState } from "react";
import { nav, site } from "@/lib/site";

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
        scrolled
          ? "border-b border-line bg-bg/85 backdrop-blur-md"
          : "border-b border-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-12">
        <a href="#" className="flex flex-col leading-none" aria-label={site.name}>
          <span className="text-[0.62rem] uppercase tracking-[0.34em] text-primary/90">
            Restaurace
          </span>
          <span className="font-display text-xl text-cream md:text-2xl">
            {site.shortName}
          </span>
        </a>

        <ul className="hidden items-center gap-8 text-sm tracking-wide text-cream/85 lg:flex">
          {nav.map((item) => (
            <li key={item.href}>
              <a className="transition-colors hover:text-primary" href={item.href}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <a
            href={`tel:${site.phoneHref}`}
            className="hidden rounded-full border border-line px-5 py-2 text-sm text-cream transition-colors duration-300 hover:border-primary hover:text-primary sm:inline-block"
          >
            Rezervovat
          </a>

          <button
            type="button"
            aria-label={open ? "Zavřít menu" : "Otevřít menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 lg:hidden"
          >
            <span
              className={`h-px w-6 bg-cream transition-transform duration-300 ${
                open ? "translate-y-[3.5px] rotate-45" : ""
              }`}
            />
            <span
              className={`h-px w-6 bg-cream transition-transform duration-300 ${
                open ? "-translate-y-[3.5px] -rotate-45" : ""
              }`}
            />
          </button>
        </div>
      </nav>

      {/* Mobilní menu */}
      <div
        className={`overflow-hidden border-t border-line bg-bg/95 backdrop-blur-md transition-[max-height,opacity] duration-500 lg:hidden ${
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <ul className="flex flex-col gap-1 px-6 py-4">
          {nav.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                onClick={() => setOpen(false)}
                className="block py-3 font-display text-2xl text-cream transition-colors hover:text-primary"
              >
                {item.label}
              </a>
            </li>
          ))}
          <li>
            <a
              href={`tel:${site.phoneHref}`}
              onClick={() => setOpen(false)}
              className="mt-2 inline-block rounded-full bg-primary px-6 py-3 font-medium text-bg"
            >
              Zavolat & rezervovat
            </a>
          </li>
        </ul>
      </div>
    </header>
  );
}
