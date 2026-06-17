// ──────────────────────────────────────────────────────────────────
//  CENTRÁLNÍ OBSAH WEBU — vše k editaci na jednom místě.
//  ⚠️ Hodnoty označené TODO jsou PLACEHOLDERY — doplň reálná data.
// ──────────────────────────────────────────────────────────────────

export const site = {
  name: "Restaurace Česká Kanada",
  shortName: "Česká Kanada",
  place: "Autokemp Zvůle",
  region: "Česká Kanada",

  // Reálná data z oficiálního webu zvule.cz (ověř telefon — restaurace vs. kemp).
  phone: "+420 607 541 511",
  phoneHref: "+420607541511",
  email: "zvule@zvule.cz",
  web: "www.zvule.cz",
  address: {
    line1: "Sportovní 197",
    line2: "378 62 Kunžak",
  },
  mapsUrl: "https://maps.google.com/?q=Autokemp+Zvůle+Sportovní+197+Kunžak",

  // TODO: doplnit reálné profily (nebo nech prázdné a zmizí)
  social: {
    facebook: "",
    instagram: "",
  },
} as const;

export const nav = [
  { label: "O nás", href: "#o-nas" },
  { label: "Jídelníček", href: "#jidelnicek" },
  { label: "Kemp & okolí", href: "#kemp" },
  { label: "Galerie", href: "#galerie" },
  { label: "Kontakt", href: "#kontakt" },
] as const;

// TODO: upravit dle skutečné otevírací doby
export const hours = [
  { day: "Pondělí", time: "11:00 – 22:00" },
  { day: "Úterý", time: "11:00 – 22:00" },
  { day: "Středa", time: "11:00 – 22:00" },
  { day: "Čtvrtek", time: "11:00 – 22:00" },
  { day: "Pátek", time: "11:00 – 23:00" },
  { day: "Sobota", time: "11:00 – 23:00" },
  { day: "Neděle", time: "11:00 – 21:00" },
] as const;

export const features = [
  {
    title: "Poctivá domácí kuchyně",
    text: "Vepřová pečeně, svíčková, řízek i sváteční polévka s knedlíkem — vaříme klasiku tak, jak má být.",
  },
  {
    title: "Vychlazený ležák",
    text: "Točené české pivo do skla s pěnou. Ke stolu, na terasu i k vodě.",
  },
  {
    title: "Přímo u rybníka Zvůle",
    text: "Posezení v borových lesích a pár kroků k vodě. Klid, který v centru nenajdete.",
  },
  {
    title: "Autokemp & ubytování",
    text: "Chatky i místa pro stany a karavany — zůstaňte přes noc uprostřed České Kanady.",
  },
] as const;

// ⚠️ AKTUALIZOVAT KAŽDÝ DEN — datum + položky denní nabídky
export const dailyMenu = {
  date: "17. 6. 2026",
  note: "Nabídka platí do vyprodání zásob · Alergeny na vyžádání u obsluhy",
  categories: [
    {
      category: "Polévka",
      items: [
        { name: "Hovězí vývar s játrovým knedlíčkem", desc: "domácí vývar, kořenová zelenina", price: "59 Kč" },
      ],
    },
    {
      category: "Hlavní jídla",
      items: [
        { name: "Kuřecí steak s houbovou omáčkou", desc: "vařené brambory, petržel", price: "165 Kč" },
        { name: "Smažená treska, americké brambory", desc: "tatarská omáčka, citron", price: "155 Kč" },
        { name: "Bramboráky se zelím a uzeninou", desc: "domácí recept babičky", price: "145 Kč" },
      ],
    },
  ],
} as const;

// ⚠️ UKÁZKOVÝ JÍDELNÍČEK — ceny i položky jsou návrh k nahrazení reálným menu.
export const menu = [
  {
    category: "Polévky",
    items: [
      { name: "Sváteční polévka s játrovým knedlíčkem", desc: "domácí vývar, kořenová zelenina", price: "59 Kč" },
      { name: "Česnečka se sýrem a krutony", desc: "poctivá, na zahřátí", price: "65 Kč" },
    ],
  },
  {
    category: "Hlavní jídla",
    items: [
      { name: "Vepřová pečeně, knedlík, zelí", desc: "domácí, jak od babičky", price: "189 Kč" },
      { name: "Svíčková na smetaně", desc: "houskový knedlík, brusinky, šlehačka", price: "215 Kč" },
      { name: "Smažený řízek, bramborový salát", desc: "vepřový, ručně řezaný", price: "199 Kč" },
      { name: "Pstruh na másle", desc: "petrželka, vařené brambory", price: "229 Kč" },
    ],
  },
  {
    category: "K pivu",
    items: [
      { name: "Pečené koleno", desc: "křen, hořčice, čerstvý chléb", price: "279 Kč" },
      { name: "Nakládaný hermelín", desc: "cibule, pečivo", price: "95 Kč" },
      { name: "Utopenci", desc: "domácí, s cibulí", price: "89 Kč" },
    ],
  },
] as const;

export const camp = [
  {
    title: "Rybník Zvůle",
    text: "Čistá voda, písčitá pláž a koupání kousek od stolu. Ideální letní den.",
  },
  {
    title: "Lesy & cyklostezky",
    text: "Borové lesy České Kanady protkané značenými trasami pro pěší i kolo.",
  },
  {
    title: "Ubytování v kempu",
    text: "Chatky a místa pro stany i karavany — zázemí restaurace na dosah.",
  },
  {
    title: "Výlety po okolí",
    text: "Hrad Landštejn, Slavonice, Nová Bystřice a úzkokolejka — na den i na víkend.",
  },
] as const;
