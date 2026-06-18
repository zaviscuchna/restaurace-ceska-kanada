"use client";
import { useState } from "react";
import type { MenuGroup, Dish, Allergen } from "@/lib/types";
import { ALLERGEN_NAMES } from "@/lib/types";
import { getDishImageUrl } from "@/lib/menu-data";

type Tab = "daily" | "permanent";

type Props = {
  menuGroups: MenuGroup[];
  dailyDishes: Dish[];
  dailyNote: string;
};

function AllergenBadges({ allergens }: { allergens: Allergen[] }) {
  if (!allergens?.length) return null;
  return (
    <span className="mt-1.5 flex flex-wrap gap-1">
      {allergens.map((a) => (
        <span key={a} className="rounded px-1.5 py-0.5 text-[10px] text-primary/70 border border-primary/20">
          {a} {ALLERGEN_NAMES[a]}
        </span>
      ))}
    </span>
  );
}

function DishItem({ dish }: { dish: Dish }) {
  const imgUrl = getDishImageUrl(dish);
  return (
    <li>
      <div className="flex items-start gap-3">
        {imgUrl && (
          <img src={imgUrl} alt={dish.name} className="h-14 w-14 shrink-0 rounded object-cover opacity-80" />
        )}
        <div className="flex-1">
          <div className="flex items-baseline gap-3">
            <span className="font-medium text-cream">{dish.name}</span>
            <span className="mb-1 flex-1 border-b border-dotted border-line" />
            <span className="whitespace-nowrap font-display text-primary">{dish.price}</span>
          </div>
          {dish.description && <p className="mt-0.5 text-sm text-muted">{dish.description}</p>}
          <AllergenBadges allergens={dish.allergens} />
        </div>
      </div>
    </li>
  );
}

function MenuGrid({ groups }: { groups: MenuGroup[] }) {
  return (
    <div className="grid gap-x-16 gap-y-12 md:grid-cols-2">
      {groups.map((g) => (
        <div key={g.category.id}>
          <h3 className="mb-6 font-display text-2xl italic text-primary-soft">{g.category.name}</h3>
          <ul className="space-y-5">
            {g.dishes.map((dish) => <DishItem key={dish.id} dish={dish} />)}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function MenuTabs({ menuGroups, dailyDishes, dailyNote }: Props) {
  const [tab, setTab] = useState<Tab>(dailyDishes.length > 0 ? "daily" : "permanent");

  const today = new Date().toLocaleDateString("cs-CZ", { day: "numeric", month: "long", year: "numeric" });

  const dailyGroups: MenuGroup[] = dailyDishes.length > 0
    ? [{ category: { id: "daily", name: "Dnešní nabídka", order: 0 }, dishes: dailyDishes }]
    : [];

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
            <span className={`absolute bottom-0 left-0 right-0 h-[1.5px] bg-primary transition-opacity duration-300 ${tab === t ? "opacity-100" : "opacity-0"}`} />
          </button>
        ))}
      </div>

      {/* Denní nabídka */}
      {tab === "daily" && (
        <div>
          <div className="mb-10 flex items-center gap-4">
            <span className="h-px flex-1 bg-line" />
            <span className="text-xs uppercase tracking-[0.3em] text-primary">{today}</span>
            <span className="h-px flex-1 bg-line" />
          </div>

          {dailyGroups.length > 0 ? (
            <>
              <MenuGrid groups={dailyGroups} />
              {dailyNote && <p className="mt-10 text-center text-xs text-muted">{dailyNote}</p>}
            </>
          ) : (
            <p className="text-center text-muted">Dnešní nabídka ještě nebyla nastavena. Zavolejte nám.</p>
          )}
        </div>
      )}

      {/* Stálé menu */}
      {tab === "permanent" && <MenuGrid groups={menuGroups} />}
    </div>
  );
}
