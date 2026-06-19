export const dynamic = "force-dynamic";

import { SiteNav } from "@/components/site-nav";
import { Hero } from "@/components/hero";
import { About } from "@/components/about";
import { Menu } from "@/components/menu";
import { Prase } from "@/components/prase";
import { Reviews } from "@/components/reviews";
import { Camp } from "@/components/camp";
import { Gallery } from "@/components/gallery";
import { Contact } from "@/components/contact";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <>
      <SiteNav />
      <Hero />
      <Menu />
      <Prase />
      <About />
      <Reviews />
      <Camp />
      <Gallery />
      <Contact />
      <Footer />
    </>
  );
}
