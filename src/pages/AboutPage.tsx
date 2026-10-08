import React from "react";
import { Button } from "@mantine/core";
import { IconArrowRight, IconBolt, IconHeart, IconShieldCheck } from "@tabler/icons-react";
import PageHeading from "../components/PageHeading";
import type { RoutePath } from "../Route/AppRoutes";
import premiumBrandsBanner from "../assets/premium-brands-home-banner.png";
import aboutPageHero from "../assets/about-page-hero.jpg";
import founderPortrait from "../assets/amit-rai-about.png";
import founderPortraitAlt from "../assets/amit-rai-home.png";

type AboutPageProps = { navigate: (path: RoutePath) => void };

export default function AboutPage({ navigate }: AboutPageProps) {
  return (
    <section className="gs-page gs-container">
      <PageHeading
        eyebrow="ABOUT GAURAV SALES"
        title={<>A better way to choose <em>home power.</em></>}
        description="We believe finding a dependable inverter should feel clear, personal, and supported from the first question to delivery."
        fullImage={aboutPageHero}
        imageAlt="About Gaurav Sales and our inverter and battery solutions"
      />
      <div className="gs-about-layout">
        <div className="gs-about-copy">
          <span className="gs-eyebrow">POWER, MADE PERSONAL</span>
          <h2>About Gaurav Sales</h2>
          <p>Gaurav Sales helps homes find dependable inverter and battery solutions for everyday power needs.</p>
          <p>Choosing an inverter can come with a lot of technical questions. We’re here to make the options easier to understand and help you find a system that fits your home and priorities.</p>
          <p>From product selection to shipping and after-sales support, our goal is a straightforward experience you can feel good about.</p>
          <Button className="gs-button" onClick={() => navigate("/products")}>Explore our products <IconArrowRight size={16} /></Button>
        </div>
        <div className="gs-about-image">
          <img src={premiumBrandsBanner} alt="Microtek, SF Sonic and V-Guard batteries and inverters displayed together" loading="lazy" />
          <span>MICROTEK · V-GUARD · SF SONIC</span>
        </div>
      </div>
      <section className="gs-about-founder" aria-labelledby="gs-about-founder-heading">
        <div className="gs-about-founder-photos">
          <img className="gs-about-founder-main-photo" src={founderPortrait} alt="Gaurav Rai" loading="lazy" />
          <img className="gs-about-founder-detail-photo" src={founderPortraitAlt} alt="Gaurav Rai at Gaurav Sales" loading="lazy" />
        </div>
        <div>
          <span className="gs-eyebrow">A PERSONAL APPROACH</span>
          <h2 id="gs-about-founder-heading">Gaurav Rai</h2>
          <p>At Gaurav Sales, Gaurav Rai is committed to making the search for a dependable inverter or battery feel clear, personal, and supported from the first question through delivery.</p>
        </div>
      </section>
      <div className="gs-values-grid">
        <article><IconBolt /><h3>Power that fits</h3><p>Browse systems for different capacities, setups, and everyday needs.</p></article>
        <article><IconHeart /><h3>People come first</h3><p>Get approachable help when you’re comparing products or placing an order.</p></article>
        <article><IconShieldCheck /><h3>Support you can count on</h3><p>We’ll help you understand delivery, payment, and product warranty details.</p></article>
      </div>
    </section>
  );
}
