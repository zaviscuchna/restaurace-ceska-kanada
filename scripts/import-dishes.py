#!/usr/bin/env python3
"""
Import jídel z Excelu do PocketBase.
Spuštění:
  python3 scripts/import-dishes.py \
    --pb  https://pb-ceska-kanada.coolify.cz \
    --email admin@example.com \
    --password tajneheslo \
    --excel "seznam jídel - doplněno.xlsx"
"""

import argparse, json, re, sys
import urllib.request, urllib.parse
import openpyxl

# ── Alergeny ────────────────────────────────────────────────────────────────
def parse_allergens(raw) -> list[int]:
    """Zvládne: '1,3,7', 1.7 (float), 9 (int), '1,3,7, ' (trailing space)."""
    if raw is None:
        return []
    # Float jako 1.7 → [1, 7], 1.9 → [1, 9]
    if isinstance(raw, float):
        s = f"{raw:.10g}"          # bez zbytečných nul
        parts = s.replace(".", ",").split(",")
    elif isinstance(raw, int):
        parts = [str(raw)]
    else:
        parts = str(raw).split(",")

    result = []
    for p in parts:
        p = p.strip()
        if p and p.isdigit():
            n = int(p)
            if 1 <= n <= 14:
                result.append(n)
    return sorted(set(result))

def clean_price(raw) -> str:
    """'190,-' nebo '190,- ' → '190 Kč'"""
    if raw is None:
        return ""
    s = str(raw).strip()
    s = re.sub(r"[,\-\s]+$", "", s)   # odstraní ,- a mezery na konci
    s = s.replace(",", ".")
    try:
        n = int(float(s))
        return f"{n} Kč"
    except Exception:
        return s

def clean_name(raw) -> str:
    if raw is None:
        return ""
    return str(raw).strip().rstrip(",").strip()

# ── PocketBase API helpers ───────────────────────────────────────────────────
class PBClient:
    def __init__(self, base_url: str):
        self.base = base_url.rstrip("/")
        self.token = None

    def _req(self, method: str, path: str, data=None) -> dict:
        url = f"{self.base}{path}"
        body = json.dumps(data).encode() if data else None
        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["Authorization"] = self.token
        req = urllib.request.Request(url, data=body, headers=headers, method=method)
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())

    def admin_auth(self, email: str, password: str):
        resp = self._req("POST", "/api/admins/auth-with-password",
                         {"identity": email, "password": password})
        self.token = resp["token"]
        print("✓ PocketBase admin přihlášen")

    def get_collection_items(self, col: str, filter_: str = "") -> list[dict]:
        path = f"/api/collections/{col}/records?perPage=500"
        if filter_:
            path += "&filter=" + urllib.parse.quote(filter_)
        try:
            return self._req("GET", path)["items"]
        except Exception:
            return []

    def create_record(self, col: str, data: dict) -> dict:
        return self._req("POST", f"/api/collections/{col}/records", data)

# ── Hlavní import ────────────────────────────────────────────────────────────
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pb",       required=True, help="PocketBase URL")
    ap.add_argument("--email",    required=True, help="Admin email")
    ap.add_argument("--password", required=True, help="Admin heslo")
    ap.add_argument("--excel",    required=True, help="Cesta k .xlsx souboru")
    ap.add_argument("--dry-run",  action="store_true", help="Jen ukáže, neimportuje")
    args = ap.parse_args()

    wb = openpyxl.load_workbook(args.excel)
    ws = wb["List1"]
    rows = list(ws.iter_rows(min_row=2, values_only=True))  # přeskočí záhlaví

    # Rozdělení na polévky (F-H) a hlavní jídla (A-D)
    soups, mains = [], []

    for row in rows:
        gramaz, name, allergens, price, _, s_name, s_allergens, s_price = \
            (row + (None,) * 8)[:8]

        if name and str(name).strip():
            mains.append({
                "name": clean_name(name),
                "description": clean_name(gramaz),
                "price": clean_price(price),
                "allergens": parse_allergens(allergens),
            })

        if s_name and str(s_name).strip() and str(s_name).strip() not in ("úpravy: ",):
            soups.append({
                "name": clean_name(s_name),
                "description": "",
                "price": clean_price(s_price),
                "allergens": parse_allergens(s_allergens),
            })

    print(f"Načteno: {len(mains)} hlavních jídel, {len(soups)} polévek")

    if args.dry_run:
        print("\n── Ukázka hlavních jídel ──")
        for d in mains[:5]:
            print(f"  {d['name']} | {d['price']} | alergeny {d['allergens']}")
        print("\n── Ukázka polévek ──")
        for d in soups[:5]:
            print(f"  {d['name']} | {d['price']} | alergeny {d['allergens']}")
        print("\nDry-run dokončen. Spusť bez --dry-run pro import.")
        return

    pb = PBClient(args.pb)
    pb.admin_auth(args.email, args.password)

    # Načti kategorie
    cats = {c["name"]: c["id"] for c in pb.get_collection_items("categories")}
    if not cats:
        print("⚠ Žádné kategorie v DB. Spusť nejdřív node scripts/setup-pb.mjs")
        sys.exit(1)

    cat_polevky  = cats.get("Polévky")
    cat_hlavni   = cats.get("Hlavní jídla")

    if not cat_polevky or not cat_hlavni:
        print(f"⚠ Kategorie nenalezeny. Dostupné: {list(cats.keys())}")
        sys.exit(1)

    # Zkontroluj duplicity
    existing = {d["name"] for d in pb.get_collection_items("dishes")}
    print(f"V DB je už {len(existing)} jídel")

    imported = skipped = 0

    def import_list(items: list[dict], category_id: str, label: str):
        nonlocal imported, skipped
        for dish in items:
            if not dish["name"]:
                continue
            if dish["name"] in existing:
                skipped += 1
                continue
            pb.create_record("dishes", {
                "name": dish["name"],
                "description": dish["description"],
                "price": dish["price"],
                "allergens": json.dumps(dish["allergens"]),
                "category": category_id,
                "is_active": True,
            })
            existing.add(dish["name"])
            imported += 1
            print(f"  ✓ [{label}] {dish['name']}")

    print("\nImportuji polévky…")
    import_list(soups, cat_polevky, "Polévka")

    print("\nImportuji hlavní jídla…")
    import_list(mains, cat_hlavni, "Hlavní")

    print(f"\n🎉 Hotovo — importováno: {imported}, přeskočeno (duplicity): {skipped}")

if __name__ == "__main__":
    main()
