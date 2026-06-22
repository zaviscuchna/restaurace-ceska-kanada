import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-cormorant",
});

const dmSans = DM_Sans({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://restauraceceskakanada.cz"),
  title: {
    default: "Restaurace Česká Kanada — Autokemp Zvůle, Kunžak",
    template: "%s | Restaurace Česká Kanada",
  },
  description:
    "Poctivá česká kuchyně v srdci České Kanady. Svíčková, řízek, pstruh — u rybníka Zvůle v Kunžaku. Denně otevřeno od 11 hodin.",
  keywords: [
    "restaurace Česká Kanada",
    "restaurace Zvůle",
    "restaurace Kunžak",
    "česká kuchyně Kunžak",
    "autokemp Zvůle restaurace",
    "svíčková Kunžak",
    "výlet Česká Kanada jídlo",
  ],
  authors: [{ name: "KSH Studio", url: "https://ksh-partners.cz" }],
  creator: "KSH Studio",
  openGraph: {
    type: "website",
    locale: "cs_CZ",
    url: "https://restauraceceskakanada.cz",
    siteName: "Restaurace Česká Kanada",
    title: "Restaurace Česká Kanada — Poctivá česká kuchyně u Zvůle",
    description:
      "Svíčková, řízek, pstruh na grilu — u rybníka Zvůle v Kunžaku. Denně otevřeno od 11 hodin.",
    images: [
      {
        url: "/images/hero-prkenko.jpg",
        width: 1200,
        height: 630,
        alt: "Restaurace Česká Kanada — poctivá česká kuchyně",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Restaurace Česká Kanada",
    description:
      "Poctivá česká kuchyně u rybníka Zvůle v Kunžaku. Denně otevřeno od 11 hodin.",
    images: ["/images/hero-prkenko.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://restauraceceskakanada.cz",
  },
};

export const viewport = {
  themeColor: "#15100a",
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: "Restaurace Česká Kanada",
  description:
    "Poctivá česká kuchyně v autokempu u rybníka Zvůle, v srdci České Kanady.",
  url: "https://restauraceceskakanada.cz",
  telephone: "+420607541511",
  email: "zvule@zvule.cz",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Sportovní 197",
    addressLocality: "Kunžak",
    postalCode: "378 62",
    addressCountry: "CZ",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 49.018,
    longitude: 15.155,
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday"],
      opens: "11:00",
      closes: "22:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Friday", "Saturday"],
      opens: "11:00",
      closes: "23:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Sunday"],
      opens: "11:00",
      closes: "21:00",
    },
  ],
  servesCuisine: "Czech",
  priceRange: "$$",
  image: "https://restauraceceskakanada.cz/images/hero-prkenko.jpg",
  hasMap: "https://maps.google.com/?q=Autokemp+Zvůle+Sportovní+197+Kunžak",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="cs"
      className={`${cormorantGaramond.variable} ${dmSans.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
