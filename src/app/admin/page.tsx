"use client";
import { useState, useEffect, useRef, useCallback, Fragment } from "react";
import * as XLSX from "xlsx";
import { getClientPb } from "@/lib/pb";
import type { Dish, MenuGroup, Category, DailyMenu } from "@/lib/types";
import { ALLERGEN_NAMES } from "@/lib/types";

// ── Auth (server-side via httpOnly cookie) ────────────────────────────────
async function checkSession(): Promise<boolean> {
  try {
    const r = await fetch("/api/admin/check", { credentials: "include" });
    return r.ok;
  } catch { return false; }
}

async function loginWithPin(pin: string): Promise<boolean> {
  try {
    const r = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
      credentials: "include",
    });
    return r.ok;
  } catch { return false; }
}

async function logoutSession(): Promise<void> {
  await fetch("/api/admin/logout", { method: "POST", credentials: "include" }).catch(() => {});
}

// ── Helpers ───────────────────────────────────────────────────────────────
const today = new Date().toISOString().split("T")[0];
const todayLabel = new Date().toLocaleDateString("cs-CZ", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

// ── Types ─────────────────────────────────────────────────────────────────
type Section = { id: string; title: string; items: SectionItem[] };
type SectionItem = { id: string; dish: Dish | null; customName: string; price: string };

function mkId() { return Math.random().toString(36).slice(2); }
function newSection(title = ""): Section {
  return { id: mkId(), title, items: [newItem()] };
}
function newItem(): SectionItem {
  return { id: mkId(), dish: null, customName: "", price: "" };
}

// ════════════════════════════════════════════════════════════════════════════
//  PIN SCREEN
// ════════════════════════════════════════════════════════════════════════════
function PinScreen({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleChange = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 4);
    setPin(digits);
    setError(false);
    if (digits.length === 4) {
      loginWithPin(digits).then(ok => {
        if (ok) {
          onUnlock();
        } else {
          setError(true);
          setTimeout(() => { setPin(""); setError(false); inputRef.current?.focus(); }, 600);
        }
      });
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #f0f8f7 0%, #f6f2eb 100%)", zIndex: 100, padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: "44px 36px", maxWidth: 400, width: "100%", textAlign: "center", boxShadow: "0 4px 40px rgba(44,126,125,.12)" }}>
        <svg width="64" height="64" viewBox="0 0 64 64" style={{ margin: "0 auto 20px" }}>
          <circle cx="32" cy="32" r="28" stroke="#4CAAA8" strokeWidth="1.5" fill="none"/>
          <text fontFamily="Georgia,serif" fontSize="11" fill="#2D7E7D" textAnchor="middle" x="32" y="36" fontStyle="italic">ČK</text>
        </svg>
        <div style={{ fontFamily: "Georgia,serif", fontSize: 22, fontWeight: 500, marginBottom: 6 }}>Správa webu</div>
        <div style={{ fontSize: 13, color: "#7A6858", marginBottom: 28 }}>Restaurace Česká Kanada</div>
        <input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          value={pin}
          onChange={e => handleChange(e.target.value)}
          placeholder="••••"
          style={{ width: "100%", padding: 18, fontSize: 28, letterSpacing: "0.6em", textAlign: "center", border: `2px solid ${error ? "#c53b3b" : "#EDE6D8"}`, borderRadius: 12, outline: "none", fontWeight: 600, color: error ? "#c53b3b" : "#2D7E7D", background: "#F6F2EB", transition: "border-color .2s", animation: error ? "shake .35s" : "none" }}
        />
        {error && <div style={{ marginTop: 10, fontSize: 13, color: "#c53b3b" }}>Chybný PIN</div>}
        <div style={{ marginTop: 24, fontSize: 12, color: "#7A6858" }}>Zadejte 4-místný PIN</div>
      </div>
      <style>{`@keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 75%{transform:translateX(8px)} }`}</style>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  AUTOCOMPLETE INPUT (pro položky denního menu)
// ════════════════════════════════════════════════════════════════════════════
function AutocompleteInput({ dishes, value, onChange, onSelect, placeholder }: {
  dishes: Dish[]; value: string;
  onChange: (v: string) => void;
  onSelect: (d: Dish) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);

  const filtered = value.length >= 1
    ? dishes.filter(d => d.name.toLowerCase().includes(value.toLowerCase())).slice(0, 8)
    : [];

  const select = (d: Dish) => { onSelect(d); setOpen(false); };

  return (
    <div style={{ position: "relative", flex: 1 }}>
      <input
        type="text"
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); setIdx(0); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={e => {
          if (!open || !filtered.length) return;
          if (e.key === "ArrowDown") { e.preventDefault(); setIdx(i => Math.min(i + 1, filtered.length - 1)); }
          if (e.key === "ArrowUp") { e.preventDefault(); setIdx(i => Math.max(i - 1, 0)); }
          if (e.key === "Enter") { e.preventDefault(); select(filtered[idx]); }
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder={placeholder ?? "Začněte psát název jídla…"}
        style={{ width: "100%", padding: "9px 12px", fontSize: 14, border: `1.5px solid ${value ? "#b8e8e7" : "#EDE6D8"}`, borderRadius: 8, outline: "none", background: value ? "#EAF6F5" : "#fff", transition: "border-color .15s, background .15s" }}
      />
      {open && filtered.length > 0 && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", border: "1px solid #EDE6D8", borderRadius: 10, boxShadow: "0 10px 30px rgba(0,0,0,.10)", zIndex: 100, maxHeight: 300, overflowY: "auto" }}>
          {filtered.map((d, i) => (
            <div key={d.id} onMouseDown={() => select(d)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", cursor: "pointer", fontSize: 13.5, background: i === idx ? "#EAF6F5" : undefined, borderBottom: "1px solid #f6f2eb" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, color: "#1C1510" }}>{d.name}</div>
                {d.description && <div style={{ fontSize: 12, color: "#7A6858", marginTop: 1 }}>{d.description}</div>}
              </div>
              {d.allergens?.length > 0 && (
                <span style={{ fontSize: 11, color: "#4CAAA8", background: "#EAF6F5", border: "1px solid #b8e8e7", borderRadius: 999, padding: "1px 8px", fontWeight: 600, whiteSpace: "nowrap" }}>
                  {d.allergens.join(",")}
                </span>
              )}
              <span style={{ color: "#2D7E7D", fontWeight: 600, fontSize: 13, minWidth: 60, textAlign: "right" }}>{d.price}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  DENNÍ MENU TAB
// ════════════════════════════════════════════════════════════════════════════
const SOUP_CATEGORY_ID = "8mbaj7liym9le4i";

function DailyMenuTab({ allDishes }: { allDishes: Dish[] }) {
  const permanentDishes = allDishes.filter(d => d.is_permanent);
  const [soups, setSoups] = useState<SectionItem[]>([]);
  const [additions, setAdditions] = useState<SectionItem[]>([]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  // Načti dnešní polévky + přídavky z PB
  useEffect(() => {
    const pb = getClientPb();
    pb.collection("daily_menu").getFirstListItem<DailyMenu & { expand: { dishes: Dish[] } }>(
      `date = "${today}"`,
      { expand: "dishes" }
    ).then(dm => {
      setNote(dm.note ?? "");
      const dishes = dm.expand?.dishes ?? [];
      const permIds = new Set(allDishes.filter(d => d.is_permanent).map(d => d.id));
      const nonPermDishes = dishes.filter(d => !permIds.has(d.id));
      const soupDishes = nonPermDishes.filter(d => d.category === SOUP_CATEGORY_ID);
      const mainDishes = nonPermDishes.filter(d => d.category !== SOUP_CATEGORY_ID);
      setSoups(soupDishes.map(d => ({ id: mkId(), dish: d, customName: d.name, price: d.price })));
      setAdditions(mainDishes.map(d => ({ id: mkId(), dish: d, customName: d.name, price: d.price })));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [allDishes]);

  const addSoup = () => setSoups(s => [...s, newItem()]);
  const removeSoup = (iid: string) => setSoups(s => s.filter(x => x.id !== iid));
  const updateSoup = (iid: string, patch: Partial<SectionItem>) =>
    setSoups(s => s.map(x => x.id === iid ? { ...x, ...patch } : x));

  const addAddition = () => setAdditions(a => [...a, newItem()]);
  const removeAddition = (iid: string) => setAdditions(a => a.filter(x => x.id !== iid));
  const updateAddition = (iid: string, patch: Partial<SectionItem>) =>
    setAdditions(a => a.map(x => x.id === iid ? { ...x, ...patch } : x));

  const getSectionsForPrint = () => {
    const soupItems = soups.filter(i => i.customName.trim());
    const mainItems = [
      ...permanentDishes.map(d => ({ id: d.id, dish: d, customName: d.name, price: d.price })),
      ...additions.filter(i => i.customName.trim()),
    ];
    const sections: Section[] = [];
    if (soupItems.length) sections.push({ id: "soups", title: "Polévky", items: soupItems });
    if (mainItems.length) sections.push({ id: "mains", title: "Hlavní chod", items: mainItems });
    return sections;
  };

  const allDishIds = [
    ...permanentDishes.map(d => d.id),
    ...soups.map(i => i.dish?.id).filter(Boolean) as string[],
    ...additions.map(i => i.dish?.id).filter(Boolean) as string[],
  ];

  type PrintSection = { title: string; items: { fullName: string; allergens: string; price: string }[] };
  type PrintData = { dateStr: string; sections: PrintSection[] };
  const [printData, setPrintData] = useState<PrintData | null>(null);

  const printMenu = () => {
    const d = new Date();
    const dateStr = `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}`;
    const sections: PrintSection[] = getSectionsForPrint().map(sec => ({
      title: sec.title.toUpperCase(),
      items: sec.items.filter(i => i.customName.trim()).map(item => {
        const num = item.price.replace(/[^0-9]/g, "");
        const desc = item.dish?.description?.trim();
        return {
          fullName: desc ? `${desc} ${item.customName}` : item.customName,
          allergens: item.dish?.allergens?.length ? `(${item.dish.allergens.join(",")})` : "",
          price: num ? `${num},- Kč` : item.price,
        };
      }),
    }));
    setPrintData({ dateStr, sections });
  };

  const publish = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/daily-menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: today, note, dishes: allDishIds }),
        credentials: "include",
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Chyba");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) { console.error(e); alert("Chyba při ukládání!"); }
    finally { setSaving(false); }
  };

  if (loading) return <p style={{ color: "#7A6858", padding: 20 }}>Načítám…</p>;

  const soupDishesForAutocomplete = allDishes.filter(d => !d.is_permanent && d.category === SOUP_CATEGORY_ID);
  const mainDishesForAutocomplete = allDishes.filter(d => !d.is_permanent && d.category !== SOUP_CATEGORY_ID);

  return (
    <div>
{printData && (
        <div id="po-root" style={{ position: "fixed", inset: 0, background: "#555", zIndex: 9999, overflowY: "auto", padding: "20px 0 40px" }}>
          <style>{`
            /* ── Screen: plný A4 náhled ── */
            @media screen {
              #po-paper {
                width: 210mm; height: 297mm; background: #fff; margin: 0 auto;
                padding: 22mm 28mm 18mm 28mm;
                box-shadow: 0 6px 40px rgba(0,0,0,.5);
                font-family: "Times New Roman", Times, serif;
                color: #000; box-sizing: border-box;
                display: flex; flex-direction: column;
              }
            }
            /* ── Print ── */
            @media print {
              @page { size: A4 portrait; margin: 22mm 28mm 18mm 28mm; }
              body * { visibility: hidden; }
              #po-paper, #po-paper * { visibility: visible; }
              #po-paper { position: fixed; top: 0; left: 0; width: 100%; height: 100vh; padding: 0 !important; box-shadow: none !important; display: flex; flex-direction: column; }
              #po-toolbar { display: none !important; }
            }
            /* ── Obsah (stejný screen i print) ── */
            #po-paper .po-header { text-align: center; margin-bottom: 28pt; flex-shrink: 0; }
            #po-paper .po-title  { font-size: 36pt; font-weight: bold; letter-spacing: 0.1em; line-height: 1.15; }
            #po-paper .po-date   { font-size: 14pt; margin-top: 6pt; }
            #po-paper table      { width: 100%; border-collapse: collapse; flex: 1; }
            #po-paper .po-sh td  { font-size: 13pt; font-weight: bold; text-decoration: underline;
                                   padding-top: 22pt; padding-bottom: 7pt; }
            #po-paper .po-row td { font-size: 13pt; padding: 9pt 0; vertical-align: baseline; }
            #po-paper .po-name   { padding-right: 8pt; }
            #po-paper .po-price  { font-weight: bold; white-space: nowrap; text-align: right; min-width: 62pt; }
            #po-paper .po-footer { margin-top: 32pt; text-align: center; flex-shrink: 0; }
            #po-paper .po-footer p { font-size: 12pt; margin-bottom: 5pt; }
            #po-paper .po-fi    { font-style: italic; font-weight: bold; }
            #po-paper .po-fc    { font-weight: bold; text-transform: uppercase; letter-spacing: 0.04em; }
            #po-paper .po-fs    { font-style: italic; }
            #po-paper .po-gap   { margin-top: 14pt !important; }
          `}</style>

          <div id="po-toolbar" style={{ width: "210mm", margin: "0 auto 14px", display: "flex", gap: 10 }}>
            <button onClick={() => window.print()}
              style={{ flex: 1, padding: "11px 0", background: "#1C1510", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
              🖨 Tisknout / Uložit jako PDF
            </button>
            <button onClick={() => setPrintData(null)}
              style={{ padding: "11px 18px", background: "rgba(255,255,255,.15)", color: "#fff", border: "1px solid rgba(255,255,255,.3)", borderRadius: 8, fontSize: 14, cursor: "pointer" }}>
              Zavřít
            </button>
          </div>

          <div id="po-paper">
            <div className="po-header">
              <div className="po-title">JÍDELNÍ LÍSTEK</div>
              <div className="po-date">{printData.dateStr}</div>
            </div>

            <table>
              <tbody>
                {printData.sections.map(sec => (
                  <Fragment key={sec.title}>
                    <tr className="po-sh">
                      <td colSpan={2}>{sec.title}</td>
                    </tr>
                    {sec.items.map((item, i) => (
                      <tr key={i} className="po-row">
                        <td className="po-name">{item.fullName}{item.allergens ? ` ${item.allergens}` : ""}</td>
                        <td className="po-price">{item.price}</td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>

            <div className="po-footer">
              <p className="po-fi">Poloviční porce = 70 % z ceny</p>
              <p className="po-fc">Váha masa je uvedena v syrovém stavu</p>
              <p className="po-fc">Přejeme dobrou chuť</p>
              <p className="po-fs po-gap">Jídlo pro vás s láskou připravuje David &quot;Večerníček Jr.&quot; Račák</p>
              <p className="po-fs">Odpovědná osoba Smejkal Rostislav</p>
            </div>
          </div>
        </div>
      )}

      {/* Hlavička */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: "Georgia,serif", fontSize: 28, fontWeight: 500, letterSpacing: "-0.01em" }}>Dnešní menu</h1>
          <p style={{ fontSize: 13, color: "#7A6858", marginTop: 4, textTransform: "capitalize" }}>{todayLabel}</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a href="/" target="_blank" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 16px", fontSize: 13.5, fontWeight: 600, border: "1px solid #EDE6D8", borderRadius: 9, color: "#4A3828", textDecoration: "none" }}>
            Otevřít web →
          </a>
          <button onClick={printMenu}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px", fontSize: 14, fontWeight: 700, border: "2px solid #1C1510", borderRadius: 9, color: "#1C1510", background: "#fff", cursor: "pointer" }}>
            🖨 Tisknout lístek
          </button>
          <button onClick={publish} disabled={saving}
            style={{ padding: "10px 22px", fontSize: 14, fontWeight: 600, background: saved ? "#2D7E7D" : "#4CAAA8", color: "#fff", border: "none", borderRadius: 9, cursor: saving ? "default" : "pointer", opacity: saving ? 0.6 : 1, transition: "background .2s" }}>
            {saving ? "Ukládám…" : saved ? "✓ Publikováno" : "Publikovat na web"}
          </button>
        </div>
      </div>

      {/* Dnešní polévky */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <span style={{ fontFamily: "Georgia,serif", fontSize: 17, fontWeight: 500 }}>Dnešní polévky</span>
          <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 999, background: "#FFF8EE", color: "#B8722A", border: "1px solid #F0D4A0" }}>MĚNÍ SE DENNĚ</span>
        </div>
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #EDE6D8", overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
            {soups.length === 0 && (
              <p style={{ fontSize: 13, color: "#7A6858", padding: "8px 0" }}>Dnes žádná polévka.</p>
            )}
            {soups.map(item => (
              <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1fr 100px auto", gap: 8, alignItems: "center" }}>
                <AutocompleteInput
                  dishes={soupDishesForAutocomplete}
                  value={item.customName}
                  onChange={v => updateSoup(item.id, { customName: v, dish: null })}
                  onSelect={d => updateSoup(item.id, { dish: d, customName: d.name, price: d.price })}
                  placeholder="Název polévky z databáze…"
                />
                <input
                  type="text"
                  value={item.price}
                  onChange={e => updateSoup(item.id, { price: e.target.value })}
                  placeholder="cena"
                  style={{ padding: "9px 10px", fontSize: 13, border: "1px solid #EDE6D8", borderRadius: 8, outline: "none", textAlign: "right", fontWeight: 600, color: "#B8722A", background: "#fff" }}
                />
                <button onClick={() => removeSoup(item.id)}
                  style={{ padding: "7px 10px", fontSize: 14, color: "#7A6858", border: "none", background: "none", borderRadius: 6, cursor: "pointer" }}>✕</button>
              </div>
            ))}
            {soups.filter(i => i.dish?.allergens?.length).map(item => (
              <div key={`al-soup-${item.id}`} style={{ fontSize: 11, color: "#7A6858", paddingLeft: 4 }}>
                {item.dish?.name}: {item.dish?.allergens?.map(a => `${a} ${ALLERGEN_NAMES[a as keyof typeof ALLERGEN_NAMES]}`).join(", ")}
              </div>
            ))}
            <button onClick={addSoup}
              style={{ alignSelf: "flex-start", marginTop: 4, fontSize: 13.5, color: "#B8722A", fontWeight: 700, padding: "8px 14px", borderRadius: 8, border: "1.5px dashed #F0D4A0", background: "#FFF8EE", cursor: "pointer" }}>
              + Přidat polévku
            </button>
          </div>
        </div>
      </div>

      {/* Stálá nabídka — auto, jen pro přehled */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <span style={{ fontFamily: "Georgia,serif", fontSize: 17, fontWeight: 500 }}>Stálá nabídka</span>
          <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 999, background: "#EAF6F5", color: "#2D7E7D", border: "1px solid #b8e8e7" }}>AUTO · {permanentDishes.length} jídel</span>
        </div>
        {permanentDishes.length === 0 ? (
          <div style={{ padding: "20px 22px", background: "#F6F2EB", borderRadius: 12, border: "1.5px dashed #EDE6D8", color: "#7A6858", fontSize: 13 }}>
            Žádná stálá jídla — nastav je v <strong>Databázi jídel</strong> přepnutím &quot;Stálé menu&quot;.
          </div>
        ) : (
          <div style={{ background: "#F6F2EB", borderRadius: 12, border: "1px solid #EDE6D8", overflow: "hidden" }}>
            {permanentDishes.map((d, i) => (
              <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: i < permanentDishes.length - 1 ? "1px solid #EDE6D8" : "none", opacity: 0.75 }}>
                <span style={{ flex: 1, fontSize: 13.5, color: "#1C1510" }}>{d.name}{d.description ? ` — ${d.description}` : ""}</span>
                {d.allergens?.length > 0 && <span style={{ fontSize: 11, color: "#7A6858" }}>({d.allergens.join(",")})</span>}
                <span style={{ fontWeight: 700, color: "#2D7E7D", fontSize: 13, minWidth: 60, textAlign: "right" }}>{d.price}</span>
                <span style={{ fontSize: 11, color: "#b8e8e7", fontWeight: 600 }}>🔒</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dnešní přídavky — brigádník edituje jen toto */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <span style={{ fontFamily: "Georgia,serif", fontSize: 17, fontWeight: 500 }}>Dnešní přídavky</span>
          <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 999, background: "#FFF8EE", color: "#B8722A", border: "1px solid #F0D4A0" }}>MĚNÍ SE DENNĚ</span>
        </div>
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #EDE6D8", overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
            {additions.length === 0 && (
              <p style={{ fontSize: 13, color: "#7A6858", padding: "8px 0" }}>Dnes žádné přídavky — stálá nabídka bude na lístku bez přídavků.</p>
            )}
            {additions.map(item => (
              <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1fr 100px auto", gap: 8, alignItems: "center" }}>
                <AutocompleteInput
                  dishes={mainDishesForAutocomplete}
                  value={item.customName}
                  onChange={v => updateAddition(item.id, { customName: v, dish: null })}
                  onSelect={d => updateAddition(item.id, { dish: d, customName: d.name, price: d.price })}
                  placeholder="Název jídla z databáze…"
                />
                <input
                  type="text"
                  value={item.price}
                  onChange={e => updateAddition(item.id, { price: e.target.value })}
                  placeholder="cena"
                  style={{ padding: "9px 10px", fontSize: 13, border: "1px solid #EDE6D8", borderRadius: 8, outline: "none", textAlign: "right", fontWeight: 600, color: "#2D7E7D", background: "#fff" }}
                />
                <button onClick={() => removeAddition(item.id)}
                  style={{ padding: "7px 10px", fontSize: 14, color: "#7A6858", border: "none", background: "none", borderRadius: 6, cursor: "pointer" }}>✕</button>
              </div>
            ))}
            {additions.filter(i => i.dish?.allergens?.length).map(item => (
              <div key={`al-${item.id}`} style={{ fontSize: 11, color: "#7A6858", paddingLeft: 4 }}>
                {item.dish?.name}: {item.dish?.allergens?.map(a => `${a} ${ALLERGEN_NAMES[a as keyof typeof ALLERGEN_NAMES]}`).join(", ")}
              </div>
            ))}
            <button onClick={addAddition}
              style={{ alignSelf: "flex-start", marginTop: 4, fontSize: 13.5, color: "#2D7E7D", fontWeight: 700, padding: "8px 14px", borderRadius: 8, border: "1.5px dashed #b8e8e7", background: "#EAF6F5", cursor: "pointer" }}>
              + Přidat dnešní jídlo
            </button>
          </div>
        </div>
      </div>

      {/* Poznámka */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #EDE6D8", overflow: "hidden" }}>
        <div style={{ padding: "16px 22px", borderBottom: "1px solid #EDE6D8", fontFamily: "Georgia,serif", fontSize: 16, fontWeight: 500 }}>Poznámka pod menu</div>
        <div style={{ padding: 22 }}>
          <input type="text" value={note} onChange={e => setNote(e.target.value)} maxLength={200}
            placeholder="např. Menu se podává do 14:00"
            style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #EDE6D8", borderRadius: 10, outline: "none", fontSize: 14, color: "#1C1510" }} />
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  DATABÁZE JÍDEL TAB
// ════════════════════════════════════════════════════════════════════════════
function DishesDbTab({ dishes, onRefresh }: { dishes: Dish[]; onRefresh: () => void }) {
  const [search, setSearch] = useState("");
  const [editDish, setEditDish] = useState<Dish | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getClientPb().collection("categories").getFullList<Category>({ sort: "order" })
      .then(setCategories).catch(() => {});
  }, []);

  const filtered = dishes.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (d: Dish) => { setEditDish({ ...d }); setShowModal(true); };
  const openNew = () => {
    setEditDish({ id: "", collectionId: "", name: "", description: "", price: "", photo: "", allergens: [], category: categories[0]?.id ?? "", is_active: true, is_permanent: false });
    setShowModal(true);
  };

  const save = async () => {
    if (!editDish) return;
    setSaving(true);
    try {
      const body = {
        id: editDish.id || undefined,
        name: editDish.name, description: editDish.description,
        price: editDish.price, allergens: editDish.allergens,
        category: editDish.category, is_active: editDish.is_active,
        is_permanent: editDish.is_permanent,
      };
      const res = await fetch("/api/admin/dish", {
        method: editDish.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Chyba");
      setShowModal(false);
      onRefresh();
    } catch (e) { console.error(e); alert("Chyba při ukládání: " + (e instanceof Error ? e.message : e)); }
    finally { setSaving(false); }
  };

  const deleteDish = async () => {
    if (!editDish?.id || !confirm("Smazat jídlo?")) return;
    const res = await fetch("/api/admin/dish", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editDish.id }),
      credentials: "include",
    });
    if (!res.ok) { alert("Smazání selhalo"); return; }
    setShowModal(false);
    onRefresh();
  };

  const quickToggle = async (d: Dish) => {
    await fetch("/api/admin/dish", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: d.id, is_active: !d.is_active }),
      credentials: "include",
    });
    onRefresh();
  };

  const toggleAllergen = (n: number) => {
    if (!editDish) return;
    const a = editDish.allergens ?? [];
    setEditDish({ ...editDish, allergens: a.includes(n as any) ? a.filter(x => x !== n) : [...a, n as any].sort((a, b) => a - b) });
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "Georgia,serif", fontSize: 28, fontWeight: 500 }}>Databáze jídel</h1>
          <p style={{ fontSize: 13, color: "#7A6858", marginTop: 4 }}>{dishes.filter(d => d.is_active).length} aktivních z {dishes.length} celkem</p>
        </div>
        <button onClick={openNew}
          style={{ padding: "10px 18px", fontSize: 14, fontWeight: 600, background: "#4CAAA8", color: "#fff", border: "none", borderRadius: 9, cursor: "pointer" }}>
          + Přidat jídlo
        </button>
      </div>

      <input type="text" value={search} onChange={e => setSearch(e.target.value)}
        placeholder="🔍 Hledat v jídlech…"
        style={{ marginBottom: 14, padding: "10px 14px", border: "1.5px solid #EDE6D8", borderRadius: 8, width: "100%", maxWidth: 360, outline: "none", fontSize: 14, background: "#fff" }} />

      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #EDE6D8", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#F6F2EB" }}>
                {["Název", "Popis", "Cena", "Alergeny", "Aktivní", ""].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 12px", fontWeight: 600, fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.5px", color: "#7A6858", borderBottom: "2px solid #EDE6D8" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d.id} style={{ borderBottom: "1px solid #F6F2EB", opacity: d.is_active ? 1 : 0.5 }}>
                  <td style={{ padding: "10px 12px", fontWeight: 500, color: "#1C1510" }}>
                    {d.name}
                  </td>
                  <td style={{ padding: "10px 12px", color: "#7A6858", fontSize: 12 }}>{d.description}</td>
                  <td style={{ padding: "10px 12px", color: "#2D7E7D", fontWeight: 600, whiteSpace: "nowrap" }}>{d.price}</td>
                  <td style={{ padding: "10px 12px", color: "#7A6858", fontSize: 12 }}>
                    {d.allergens?.join(", ") || "—"}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <button
                      onClick={() => quickToggle(d)}
                      title={d.is_active ? "Skrýt z webu" : "Zobrazit na webu"}
                      style={{ padding: "4px 10px", fontSize: 11.5, fontWeight: 600, border: `1.5px solid ${d.is_active ? "#4CAAA8" : "#EDE6D8"}`, borderRadius: 999, background: d.is_active ? "#EAF6F5" : "transparent", color: d.is_active ? "#2D7E7D" : "#7A6858", cursor: "pointer", whiteSpace: "nowrap", transition: "all .15s" }}>
                      {d.is_active ? "✓ Web" : "Skryto"}
                    </button>
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "right" }}>
                    <button onClick={() => openEdit(d)}
                      style={{ padding: "5px 10px", fontSize: 12, border: "1px solid #EDE6D8", borderRadius: 6, background: "none", cursor: "pointer", color: "#4A3828" }}>
                      Upravit
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} style={{ padding: "32px 12px", textAlign: "center", color: "#7A6858" }}>
                  {dishes.length === 0 ? "Žádná jídla — spusť import z Excelu." : "Nic nenalezeno."}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal pro editaci jídla */}
      {showModal && editDish && (
        <div onClick={() => setShowModal(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(28,21,16,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 14, maxWidth: 560, width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 50px rgba(0,0,0,.25)" }}>
            <div style={{ padding: "18px 22px", borderBottom: "1px solid #EDE6D8", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontFamily: "Georgia,serif", fontSize: 18, fontWeight: 500 }}>{editDish.id ? "Upravit jídlo" : "Přidat jídlo"}</h3>
              <button onClick={() => setShowModal(false)} style={{ padding: "6px 10px", fontSize: 18, color: "#7A6858", border: "none", background: "none", cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
              <label style={{ display: "block" }}>
                <span style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: "#7A6858", marginBottom: 7 }}>Název *</span>
                <input value={editDish.name} onChange={e => setEditDish({ ...editDish, name: e.target.value })}
                  style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #EDE6D8", borderRadius: 10, outline: "none", fontSize: 14 }} />
              </label>
              <label style={{ display: "block" }}>
                <span style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: "#7A6858", marginBottom: 7 }}>Popis / příloha</span>
                <input value={editDish.description} onChange={e => setEditDish({ ...editDish, description: e.target.value })}
                  style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #EDE6D8", borderRadius: 10, outline: "none", fontSize: 14 }} />
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <label style={{ display: "block" }}>
                  <span style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: "#7A6858", marginBottom: 7 }}>Cena *</span>
                  <input value={editDish.price} onChange={e => setEditDish({ ...editDish, price: e.target.value })}
                    placeholder="190 Kč"
                    style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #EDE6D8", borderRadius: 10, outline: "none", fontSize: 14 }} />
                </label>
                <label style={{ display: "block" }}>
                  <span style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: "#7A6858", marginBottom: 7 }}>Kategorie</span>
                  <select value={editDish.category} onChange={e => setEditDish({ ...editDish, category: e.target.value })}
                    style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #EDE6D8", borderRadius: 10, outline: "none", fontSize: 14 }}>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </label>
              </div>
              <div>
                <span style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: "#7A6858", marginBottom: 8 }}>Alergeny</span>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 6 }}>
                  {(Object.entries(ALLERGEN_NAMES) as [string, string][]).map(([n, name]) => {
                    const num = parseInt(n);
                    const checked = editDish.allergens?.includes(num as any);
                    return (
                      <label key={n} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 7, border: `1.5px solid ${checked ? "#4CAAA8" : "#EDE6D8"}`, background: checked ? "#EAF6F5" : "#fff", cursor: "pointer", fontSize: 12.5, color: checked ? "#2D7E7D" : "#4A3828", fontWeight: checked ? 600 : 400, transition: "all .15s" }}>
                        <input type="checkbox" checked={!!checked} onChange={() => toggleAllergen(num)} style={{ display: "none" }} />
                        <span style={{ background: checked ? "#4CAAA8" : "#F6F2EB", color: checked ? "#fff" : "#7A6858", width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 11, flexShrink: 0 }}>{n}</span>
                        {name}
                      </label>
                    );
                  })}
                </div>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 10, border: `1.5px solid ${editDish.is_active ? "#4CAAA8" : "#EDE6D8"}`, background: editDish.is_active ? "#EAF6F5" : "#F6F2EB", cursor: "pointer", transition: "all .15s" }}>
                <input type="checkbox" checked={!!editDish.is_active} onChange={e => setEditDish({ ...editDish, is_active: e.target.checked })} style={{ width: 18, height: 18, accentColor: "#4CAAA8", cursor: "pointer" }} />
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: editDish.is_active ? "#2D7E7D" : "#4A3828" }}>Zobrazit na webu</div>
                  <div style={{ fontSize: 11, color: "#7A6858", marginTop: 2 }}>Aktivní jídla se zobrazují ve stálém jídelníčku</div>
                </div>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 10, border: `1.5px solid ${editDish.is_permanent ? "#B8722A" : "#EDE6D8"}`, background: editDish.is_permanent ? "#FFF8EE" : "#F6F2EB", cursor: "pointer", transition: "all .15s" }}>
                <input type="checkbox" checked={!!editDish.is_permanent} onChange={e => setEditDish({ ...editDish, is_permanent: e.target.checked })} style={{ width: 18, height: 18, accentColor: "#B8722A", cursor: "pointer" }} />
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: editDish.is_permanent ? "#B8722A" : "#4A3828" }}>Stálé menu 🔒</div>
                  <div style={{ fontSize: 11, color: "#7A6858", marginTop: 2 }}>Automaticky se zobrazí v každém denním menu bez přidávání</div>
                </div>
              </label>
            </div>

            <div style={{ padding: "16px 22px", borderTop: "1px solid #EDE6D8", display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
              {editDish.id && (
                <button onClick={deleteDish} style={{ marginRight: "auto", padding: "10px 16px", fontSize: 13.5, fontWeight: 600, border: "1px solid rgba(197,59,59,.25)", borderRadius: 9, color: "#c53b3b", background: "transparent", cursor: "pointer" }}>
                  Smazat
                </button>
              )}
              <button onClick={() => setShowModal(false)} style={{ padding: "10px 16px", fontSize: 13.5, fontWeight: 600, border: "1px solid #EDE6D8", borderRadius: 9, background: "transparent", cursor: "pointer", color: "#4A3828" }}>
                Zrušit
              </button>
              <button onClick={save} disabled={saving} style={{ padding: "10px 18px", fontSize: 14, fontWeight: 600, background: "#4CAAA8", color: "#fff", border: "none", borderRadius: 9, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
                {saving ? "Ukládám…" : "Uložit jídlo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  IMPORT Z EXCELU TAB
// ════════════════════════════════════════════════════════════════════════════
type ImportDish = { name: string; description: string; price: string; allergens: number[]; category: "soup" | "main" };
type ImportStatus = "idle" | "parsing" | "preview" | "importing" | "done";

function parseAllergens(raw: unknown): number[] {
  if (raw == null) return [];
  let parts: string[];
  if (typeof raw === "number") {
    parts = String(raw).replace(".", ",").split(",");
  } else {
    parts = String(raw).split(",");
  }
  return [...new Set(
    parts.map(p => parseInt(p.trim())).filter(n => n >= 1 && n <= 14)
  )].sort((a, b) => a - b);
}

function cleanPrice(raw: unknown): string {
  if (raw == null) return "";
  const s = String(raw).trim().replace(/[,\-\s]+$/, "").replace(",", ".");
  const n = parseInt(parseFloat(s).toString());
  return isNaN(n) ? String(raw) : `${n} Kč`;
}

function cleanName(raw: unknown): string {
  if (raw == null) return "";
  return String(raw).trim().replace(/,$/, "").trim();
}

function ImportTab({ onImportDone }: { onImportDone: () => void }) {
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [dishes, setDishes] = useState<ImportDish[]>([]);
  const [importing, setImporting] = useState(0);
  const [total, setTotal] = useState(0);
  const [results, setResults] = useState<{ imported: number; skipped: number; errors: number }>({ imported: 0, skipped: 0, errors: 0 });
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const parseFile = (file: File) => {
    setStatus("parsing");
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null });

        const parsed: ImportDish[] = [];
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i] as unknown[];
          const [gramaz, name, allergens, price, , sName, sAllergens, sPrice] = row;

          const n = cleanName(name);
          if (n && n !== "úpravy:") {
            parsed.push({ name: n, description: cleanName(gramaz), price: cleanPrice(price), allergens: parseAllergens(allergens), category: "main" });
          }
          const sn = cleanName(sName);
          if (sn && sn !== "úpravy:") {
            parsed.push({ name: sn, description: "", price: cleanPrice(sPrice), allergens: parseAllergens(sAllergens), category: "soup" });
          }
        }
        setDishes(parsed);
        setStatus("preview");
      } catch {
        alert("Nepodařilo se načíst soubor. Ověř, že jde o .xlsx.");
        setStatus("idle");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const runImport = async () => {
    setStatus("importing");
    setTotal(dishes.length);
    setImporting(dishes.length);

    try {
      const res = await fetch("/api/import-dishes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dishes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Chyba serveru");
      setResults({ imported: data.imported, skipped: data.skipped, errors: data.errors });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("Import fetch error:", e);
      alert(`Chyba importu: ${msg}`);
      setStatus("preview");
      return;
    }

    setStatus("done");
    onImportDone();
  };

  const reset = () => { setStatus("idle"); setDishes([]); setFileName(""); if (fileRef.current) fileRef.current.value = ""; };

  const soups = dishes.filter(d => d.category === "soup");
  const mains = dishes.filter(d => d.category === "main");

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "Georgia,serif", fontSize: 28, fontWeight: 500, letterSpacing: "-0.01em" }}>Import z Excelu</h1>
        <p style={{ fontSize: 13, color: "#7A6858", marginTop: 4 }}>Nahraj .xlsx soubor se seznamem jídel — přeskočí duplicity</p>
      </div>

      {status === "idle" && (
        <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "60px 40px", border: "2px dashed #b8e8e7", borderRadius: 16, background: "#EAF6F5", cursor: "pointer", textAlign: "center" }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4CAAA8" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: "#2D7E7D" }}>Klikni a vyber soubor</div>
            <div style={{ fontSize: 13, color: "#7A6858", marginTop: 4 }}>nebo sem přetáhni .xlsx soubor</div>
          </div>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }}
            onChange={e => { const f = e.target.files?.[0]; if (f) parseFile(f); }}
          />
        </label>
      )}

      {status === "parsing" && (
        <div style={{ padding: 40, textAlign: "center", color: "#7A6858" }}>Parsuju {fileName}…</div>
      )}

      {status === "preview" && (
        <>
          <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
            <div style={{ background: "#EAF6F5", border: "1px solid #b8e8e7", borderRadius: 10, padding: "12px 20px", flex: 1, minWidth: 120 }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#2D7E7D" }}>{mains.length}</div>
              <div style={{ fontSize: 12, color: "#7A6858" }}>Hlavní jídla</div>
            </div>
            <div style={{ background: "#EAF6F5", border: "1px solid #b8e8e7", borderRadius: 10, padding: "12px 20px", flex: 1, minWidth: 120 }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#2D7E7D" }}>{soups.length}</div>
              <div style={{ fontSize: 12, color: "#7A6858" }}>Polévky</div>
            </div>
            <div style={{ background: "#EAF6F5", border: "1px solid #b8e8e7", borderRadius: 10, padding: "12px 20px", flex: 1, minWidth: 120 }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#2D7E7D" }}>{dishes.length}</div>
              <div style={{ fontSize: 12, color: "#7A6858" }}>Celkem</div>
            </div>
          </div>

          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #EDE6D8", overflow: "hidden", marginBottom: 20 }}>
            <div style={{ padding: "12px 18px", borderBottom: "1px solid #EDE6D8", fontFamily: "Georgia,serif", fontSize: 15, fontWeight: 500 }}>Náhled — prvních 10 jídel</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#F6F2EB" }}>
                    {["Název", "Popis", "Cena", "Alergeny", "Typ"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontWeight: 600, fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.5px", color: "#7A6858", borderBottom: "1.5px solid #EDE6D8" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dishes.slice(0, 10).map((d, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #F6F2EB" }}>
                      <td style={{ padding: "8px 12px", fontWeight: 500 }}>{d.name}</td>
                      <td style={{ padding: "8px 12px", color: "#7A6858", fontSize: 12 }}>{d.description || "—"}</td>
                      <td style={{ padding: "8px 12px", color: "#2D7E7D", fontWeight: 600, whiteSpace: "nowrap" }}>{d.price || "—"}</td>
                      <td style={{ padding: "8px 12px", color: "#7A6858", fontSize: 12 }}>{d.allergens.join(", ") || "—"}</td>
                      <td style={{ padding: "8px 12px" }}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 999, background: d.category === "soup" ? "#EDE6D8" : "#EAF6F5", color: d.category === "soup" ? "#7A6858" : "#2D7E7D" }}>
                          {d.category === "soup" ? "Polévka" : "Hlavní"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {dishes.length > 10 && (
              <div style={{ padding: "10px 18px", fontSize: 12, color: "#7A6858", borderTop: "1px solid #EDE6D8" }}>
                … a dalších {dishes.length - 10} jídel
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={reset} style={{ padding: "10px 18px", fontSize: 14, fontWeight: 600, border: "1px solid #EDE6D8", borderRadius: 9, background: "transparent", cursor: "pointer", color: "#4A3828" }}>
              Zrušit
            </button>
            <button onClick={runImport} style={{ padding: "10px 22px", fontSize: 14, fontWeight: 600, background: "#4CAAA8", color: "#fff", border: "none", borderRadius: 9, cursor: "pointer" }}>
              Importovat {dishes.length} jídel →
            </button>
          </div>
        </>
      )}

      {status === "importing" && (
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #EDE6D8", padding: 32 }}>
          <div style={{ fontFamily: "Georgia,serif", fontSize: 18, marginBottom: 16 }}>Importuji…</div>
          <div style={{ background: "#F6F2EB", borderRadius: 999, height: 8, overflow: "hidden", marginBottom: 12 }}>
            <div style={{ background: "#4CAAA8", height: "100%", width: `${(importing / total) * 100}%`, transition: "width .2s", borderRadius: 999 }} />
          </div>
          <div style={{ fontSize: 13, color: "#7A6858" }}>{importing} / {total}</div>
        </div>
      )}

      {status === "done" && (
        <div style={{ background: "#EAF6F5", borderRadius: 14, border: "1px solid #b8e8e7", padding: 32 }}>
          <div style={{ fontFamily: "Georgia,serif", fontSize: 22, color: "#2D7E7D", marginBottom: 20 }}>Import dokončen</div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
            <div style={{ background: "#fff", borderRadius: 10, padding: "14px 20px", flex: 1, minWidth: 100, border: "1px solid #b8e8e7" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#2D7E7D" }}>{results.imported}</div>
              <div style={{ fontSize: 12, color: "#7A6858" }}>Importováno</div>
            </div>
            <div style={{ background: "#fff", borderRadius: 10, padding: "14px 20px", flex: 1, minWidth: 100, border: "1px solid #EDE6D8" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#7A6858" }}>{results.skipped}</div>
              <div style={{ fontSize: 12, color: "#7A6858" }}>Přeskočeno (duplicity)</div>
            </div>
            {results.errors > 0 && (
              <div style={{ background: "#fff", borderRadius: 10, padding: "14px 20px", flex: 1, minWidth: 100, border: "1px solid rgba(197,59,59,.3)" }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: "#c53b3b" }}>{results.errors}</div>
                <div style={{ fontSize: 12, color: "#7A6858" }}>Chyby</div>
              </div>
            )}
          </div>
          <button onClick={reset} style={{ padding: "10px 18px", fontSize: 14, fontWeight: 600, border: "1px solid #EDE6D8", borderRadius: 9, background: "#fff", cursor: "pointer", color: "#4A3828" }}>
            Importovat další soubor
          </button>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  HLAVNÍ ADMIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════
type Tab = "today" | "dishes" | "import";

export default function AdminPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [checked, setChecked] = useState(false);
  const [tab, setTab] = useState<Tab>("today");
  const [allDishes, setAllDishes] = useState<Dish[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    checkSession().then(ok => { setUnlocked(ok); setChecked(true); });
  }, []);

  const loadDishes = useCallback(() => {
    getClientPb().collection("dishes")
      .getFullList<Dish>({ sort: "name" })
      .then(setAllDishes).catch(() => {});
  }, []);

  useEffect(() => { if (unlocked) loadDishes(); }, [unlocked, loadDishes]);

  if (!checked) return null;
  if (!unlocked) return <PinScreen onUnlock={() => setUnlocked(true)} />;

  const TABS = [
    { id: "today" as Tab, label: "📋 Dnešní menu", sub: "DENNĚ" },
    { id: "dishes" as Tab, label: "🗃 Databáze jídel", sub: `${allDishes.filter(d => d.is_active).length}/${allDishes.length}` },
    { id: "import" as Tab, label: "⬆ Import z Excelu", sub: ".xlsx" },
  ];

  const logout = () => { logoutSession(); setUnlocked(false); };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F6F2EB", fontFamily: "'DM Sans', system-ui, sans-serif", color: "#1C1510" }}>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        @media (max-width: 880px) {
          .admin-sidebar { transform: translateX(-100%); transition: transform .3s; }
          .admin-sidebar.open { transform: none; }
          .admin-scrim { display: none; position: fixed; inset: 0; background: rgba(0,0,0,.4); z-index: 40; }
          .admin-scrim.open { display: block; }
        }
        @media (min-width: 881px) { .admin-mobile-bar { display: none !important; } .admin-sidebar { transform: none !important; } }
      `}</style>

      {/* Scrim */}
      <div className={`admin-scrim${menuOpen ? " open" : ""}`} onClick={() => setMenuOpen(false)} />

      {/* Sidebar */}
      <aside className={`admin-sidebar${menuOpen ? " open" : ""}`}
        style={{ width: 240, flexShrink: 0, background: "#1C1510", color: "#FDFAF6", padding: "24px 0", position: "sticky", top: 0, height: "100vh", overflowY: "auto", display: "flex", flexDirection: "column", zIndex: 50 }}>
        <div style={{ padding: "0 22px 24px", borderBottom: "1px solid rgba(253,250,246,.08)", display: "flex", alignItems: "center", gap: 12 }}>
          <svg width="36" height="36" viewBox="0 0 64 64" style={{ flexShrink: 0 }}>
            <circle cx="32" cy="32" r="28" stroke="#7ECFCE" strokeWidth="1.5" fill="none"/>
            <text fontFamily="Georgia,serif" fontSize="11" fill="#7ECFCE" textAnchor="middle" x="32" y="36" fontStyle="italic">ČK</text>
          </svg>
          <div style={{ fontFamily: "Georgia,serif", fontSize: 14, fontWeight: 500, lineHeight: 1.2 }}>
            Česká Kanada
            <small style={{ display: "block", fontFamily: "sans-serif", fontSize: 10, fontWeight: 400, color: "rgba(253,250,246,.4)", letterSpacing: ".14em", textTransform: "uppercase", marginTop: 3 }}>Správa webu</small>
          </div>
        </div>

        <nav style={{ padding: "14px 0", flex: 1 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setMenuOpen(false); }}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "12px 22px", fontSize: 14, color: tab === t.id ? "#FDFAF6" : "rgba(253,250,246,.6)", textAlign: "left", fontWeight: 500, background: tab === t.id ? "rgba(76,170,168,.12)" : "transparent", border: "none", cursor: "pointer", borderLeft: tab === t.id ? "3px solid #4CAAA8" : "3px solid transparent", transition: "background .2s, color .2s" }}>
              <span>{t.label}</span>
              <span style={{ marginLeft: "auto", fontSize: 11, color: tab === t.id ? "#7ECFCE" : "rgba(253,250,246,.3)", fontWeight: 600 }}>{t.sub}</span>
            </button>
          ))}
        </nav>

        <div style={{ padding: "16px 22px", fontSize: 11, color: "rgba(253,250,246,.3)", borderTop: "1px solid rgba(253,250,246,.08)", lineHeight: 1.5 }}>
          Restaurace Česká Kanada
          <button onClick={logout} style={{ display: "block", marginTop: 8, fontSize: 12, color: "rgba(253,250,246,.5)", textDecoration: "underline", border: "none", background: "none", cursor: "pointer", padding: 0 }}>
            Odhlásit
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Mobile bar */}
        <div className="admin-mobile-bar" style={{ position: "sticky", top: 0, zIndex: 40, display: "flex", alignItems: "center", gap: 12, background: "#fff", padding: "12px 16px", borderBottom: "1px solid #EDE6D8" }}>
          <button onClick={() => setMenuOpen(true)} style={{ padding: 6, border: "none", background: "none", cursor: "pointer" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <strong style={{ fontFamily: "Georgia,serif", fontWeight: 500 }}>Česká Kanada</strong>
        </div>

        <main style={{ padding: "36px 44px", maxWidth: 1080 }}>
          {tab === "today" && <DailyMenuTab allDishes={allDishes.filter(d => d.is_active !== false)} />}
          {tab === "dishes" && <DishesDbTab dishes={allDishes} onRefresh={loadDishes} />}
          {tab === "import" && <ImportTab onImportDone={loadDishes} />}
        </main>
      </div>
    </div>
  );
}
