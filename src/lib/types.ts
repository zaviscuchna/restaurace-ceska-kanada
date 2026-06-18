export type Allergen = 1|2|3|4|5|6|7|8|9|10|11|12|13|14;

export const ALLERGEN_NAMES: Record<Allergen, string> = {
  1: "Lepek", 2: "Korýši", 3: "Vejce", 4: "Ryby", 5: "Arašídy",
  6: "Sója", 7: "Mléko", 8: "Ořechy", 9: "Celer", 10: "Hořčice",
  11: "Sezam", 12: "Siřičitany", 13: "Vlčí bob", 14: "Měkkýši",
};

export type Category = {
  id: string;
  name: string;
  order: number;
};

export type Dish = {
  id: string;
  collectionId: string;
  name: string;
  description: string;
  price: string;
  photo: string;
  allergens: Allergen[];
  category: string;
  is_active: boolean;
};

export type MenuGroup = {
  category: Category;
  dishes: Dish[];
};

export type DailyMenu = {
  id: string;
  date: string;
  note: string;
  dishes: string[];
  expand?: { dishes: Dish[] };
};
