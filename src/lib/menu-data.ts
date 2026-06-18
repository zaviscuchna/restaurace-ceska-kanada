import { createPb } from "./pb";
import type { Category, Dish, DailyMenu, MenuGroup } from "./types";

export async function getMenuGroups(): Promise<MenuGroup[]> {
  const pb = createPb();
  try {
    const [categories, dishes] = await Promise.all([
      pb.collection("categories").getFullList<Category>(),
      pb.collection("dishes").getFullList<Dish>({
        filter: "is_active = true",
      }),
    ]);
    categories.sort((a, b) => a.order - b.order);
    return categories
      .map((cat) => ({ category: cat, dishes: dishes.filter((d) => d.category === cat.id) }))
      .filter((g) => g.dishes.length > 0);
  } catch {
    // Fallback na hardcoded data když PocketBase není dostupný
    return FALLBACK_MENU;
  }
}

export async function getTodayDailyMenu(): Promise<DailyMenu | null> {
  const pb = createPb();
  try {
    const today = new Date().toISOString().split("T")[0];
    return await pb.collection("daily_menu").getFirstListItem<DailyMenu>(
      `date = "${today}"`,
      { expand: "dishes" }
    );
  } catch {
    return null;
  }
}

export function getDishImageUrl(dish: Dish, thumb = "400x400"): string {
  const pb = createPb();
  if (!dish.photo) return "";
  return pb.files.getURL(dish, dish.photo, { thumb });
}

// Fallback kd PocketBase ještě není nastaven
const FALLBACK_MENU: MenuGroup[] = [
  {
    category: { id: "1", name: "Polévky", order: 1 },
    dishes: [
      { id: "1", collectionId: "", name: "Sváteční polévka s játrovým knedlíčkem", description: "domácí vývar, kořenová zelenina", price: "59 Kč", photo: "", allergens: [1, 3, 7], category: "1", is_active: true },
      { id: "2", collectionId: "", name: "Česnečka se sýrem a krutony", description: "poctivá, na zahřátí", price: "65 Kč", photo: "", allergens: [1, 7], category: "1", is_active: true },
    ],
  },
  {
    category: { id: "2", name: "Hlavní jídla", order: 2 },
    dishes: [
      { id: "3", collectionId: "", name: "Vepřová pečeně, knedlík, zelí", description: "domácí, jak od babičky", price: "189 Kč", photo: "", allergens: [1, 7], category: "2", is_active: true },
      { id: "4", collectionId: "", name: "Svíčková na smetaně", description: "houskový knedlík, brusinky, šlehačka", price: "215 Kč", photo: "", allergens: [1, 7], category: "2", is_active: true },
      { id: "5", collectionId: "", name: "Smažený řízek, bramborový salát", description: "vepřový, ručně řezaný", price: "199 Kč", photo: "", allergens: [1, 3], category: "2", is_active: true },
      { id: "6", collectionId: "", name: "Pstruh na másle", description: "petrželka, vařené brambory", price: "229 Kč", photo: "", allergens: [4, 7], category: "2", is_active: true },
    ],
  },
  {
    category: { id: "3", name: "K pivu", order: 3 },
    dishes: [
      { id: "7", collectionId: "", name: "Pečené koleno", description: "křen, hořčice, čerstvý chléb", price: "279 Kč", photo: "", allergens: [1, 10], category: "3", is_active: true },
      { id: "8", collectionId: "", name: "Nakládaný hermelín", description: "cibule, pečivo", price: "95 Kč", photo: "", allergens: [1, 7], category: "3", is_active: true },
    ],
  },
];
