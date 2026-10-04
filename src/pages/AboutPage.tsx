import React from "react";
import { Button } from "@mantine/core";
import { IconArrowRight, IconBolt, IconHeart, IconShieldCheck } from "@tabler/icons-react";
import PageHeading from "../components/PageHeading";
import type { RoutePath } from "../Route/AppRoutes";
import inverterBanner from "../assets/inverter-hero-battery.svg";
import founderPortrait from "../assets/gaurav-tripathi-placeholder.jpg";

type AboutPageProps = { navigate: (path: RoutePath) => void };

export default function AboutPage({ navigate }: AboutPageProps) {
  return (
    <section className="gs-page gs-container">
      <PageHeading
        eyebrow="ABOUT GAURAV SALES"
        title={<>A better way to choose <em>home power.</em></>}
        description="We believe finding a dependable inverter should feel clear, personal, and supported from the first question to delivery."
        image={inverterBanner}
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
          <img src={inverterBanner} alt="Illustrated home inverter and backup battery system" loading="lazy" />
          <span>ENERGY FOR EVERYDAY LIVING</span>
        </div>
      </div>
      <section className="gs-about-founder" aria-labelledby="gs-about-founder-heading">
        <img src={founderPortrait} alt="Temporary stock portrait placeholder for Gaurav Tripathi" loading="lazy" />
        <div>
          <span className="gs-eyebrow">A PERSONAL APPROACH</span>
          <h2 id="gs-about-founder-heading">Gaurav Tripathi</h2>
          <p>Gaurav Sales is here to make choosing an inverter or battery feel clear, practical, and supported.</p>
          <span className="gs-founder-placeholder-note">Portrait placeholder — replace with an approved photo.</span>
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
