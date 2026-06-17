"use client";
import { useState } from "react";
import { dailyMenu, menu } from "@/lib/site";

type Tab = "daily" | "permanent";

type MenuEntry = { readonly name: string; readonly desc: string; readonly price: string };
type MenuCat = { readonly category: string; readonly items: readonly MenuEntry[] };

function MenuGrid({ categories }: { categories: readonly MenuCat[] }) {
  return (
    <div className="grid gap-x-16 gap-y-12 md:grid-cols-2">
      {categories.map((cat) => (
        <div key={cat.category}>
          <h3 className="mb-6 font-display text-2xl italic text-primary-soft">
            {cat.category}
          </h3>
          <ul className="space-y-5">
            {cat.items.map((item) => (
              <li key={item.name}>
                <div className="flex items-baseline gap-3">
                  <span className="font-medium text-cream">{item.name}</span>
                  <span className="mb-1 flex-1 border-b border-dotted border-line" />
                  <span className="whitespace-nowrap font-display text-primary">
                    {item.price}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted">{item.desc}</p>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function MenuTabs() {
  const [tab, setTab] = useState<Tab>("daily");

  return (
    <div>
      {/* Tab switcher */}
      <div className="mb-14 flex justify-center border-b border-line">
        {(["daily", "permanent"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative px-8 pb-4 text-xs uppercase tracking-[0.25em] transition-colors duration-200 ${
              tab === t ? "text-cream" : "text-muted hover:text-cream/70"
            }`}
          >
            {t === "daily" ? "Denní nabídka" : "Stálé menu"}
            <span
              className={`absolute bottom-0 left-0 right-0 h-[1.5px] bg-primary transition-opacity duration-300 ${
                tab === t ? "opacity-100" : "opacity-0"
              }`}
            />
          </button>
        ))}
      </div>

      {/* Denní nabídka */}
      {tab === "daily" && (
        <div>
          <div className="mb-10 flex items-center gap-4">
            <span className="h-px flex-1 bg-line" />
            <span className="text-xs uppercase tracking-[0.3em] text-primary">
              {dailyMenu.date}
            </span>
            <span className="h-px flex-1 bg-line" />
          </div>
          <MenuGrid categories={dailyMenu.categories} />
          <p className="mt-10 text-center text-xs text-muted">{dailyMenu.note}</p>
        </div>
      )}

      {/* Stálé menu */}
      {tab === "permanent" && <MenuGrid categories={menu} />}
    </div>
  );
}
