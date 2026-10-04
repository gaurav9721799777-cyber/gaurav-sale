import React, { useEffect, useState } from "react";
import { Button } from "@mantine/core";
import {
  IconArrowRight,
  IconBatteryCharging,
  IconBolt,
  IconCheck,
  IconShieldCheck,
  IconTruck,
} from "@tabler/icons-react";
import type { RoutePath } from "../Route/AppRoutes";
import powerSetupBanner from "../assets/home-power-setup.svg";
import batteryBanner from "../assets/home-battery.svg";
import founderPortrait from "../assets/gaurav-tripathi-placeholder.jpg";

const slides = [
  {
    label: "INVERTER + BATTERY",
    title: <>Power through<br /><em>every moment.</em></>,
    description:
      "A dependable backup setup for the lights, devices, and everyday essentials that matter.",
    image: powerSetupBanner,
  },
  {
    label: "DEPENDABLE BATTERY BACKUP",
    title: <>Backup power,<br /><em>made simple.</em></>,
    description:
      "Find a reliable battery solution to keep your home ready when the power goes out.",
    image: batteryBanner,
  },
];

const categories = [
  {
    title: "Home inverters",
    description: "Browse reliable power backup for your home.",
    image: powerSetupBanner,
    path: "/products/inverters" as const,
    visual: "inverter",
  },
  {
    title: "Backup batteries",
    description: "Find a battery for the backup you need.",
    image: batteryBanner,
    path: "/products/batteries" as const,
    visual: "battery",
  },
];

type HomePageProps = {
  navigate: (path: RoutePath) => void;
};

export default function HomePage({ navigate }: HomePageProps) {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    if (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const timer = window.setInterval(
      () => setActiveSlide((current) => (current + 1) % slides.length),
      6000,
    );
    return () => window.clearInterval(timer);
  }, []);

  const slide = slides[activeSlide];
  return (
    <>
      <section className="gs-hero" aria-label="Featured inverter solutions">
        {slides.map((item, index) => (
          <div
            key={item.label}
            className={`gs-hero-image${activeSlide === index ? " is-active" : ""}`}
            style={activeSlide === index ? { backgroundImage: `url("${item.image}")` } : undefined}
            aria-hidden="true"
          />
        ))}
        <div className="gs-hero-shade" />
        <div className="gs-container gs-hero-inner">
          <div className="gs-hero-copy" key={slide.label}>
            <span className="gs-eyebrow gs-eyebrow-light">{slide.label}</span>
            <h1>{slide.title}</h1>
            <p>{slide.description}</p>
            <div className="gs-hero-actions">
              <Button className="gs-button gs-button-light" onClick={() => navigate("/products")}>
                Shop inverters <IconArrowRight size={17} />
              </Button>
              <button className="gs-text-button gs-text-light" onClick={() => navigate("/about")}>
                Why Gaurav Sales <IconArrowRight size={16} />
              </button>
            </div>
            <div className="gs-hero-trust">
              <span><IconShieldCheck size={18} /> Trusted guidance</span>
              <span><IconCheck size={18} /> COD available</span>
            </div>
          </div>
          <div className="gs-slide-controls" aria-label="Hero slides">
            {slides.map((item, index) => (
              <button
                key={item.label}
                className={activeSlide === index ? "is-active" : ""}
                aria-label={`Show banner ${index + 1}`}
                aria-pressed={activeSlide === index}
                onClick={() => setActiveSlide(index)}
              >
                <span>0{index + 1}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="gs-benefits">
        <div className="gs-container gs-benefit-grid">
          <div><IconTruck /><span><strong>Careful delivery</strong><small>Shipping updates at every step</small></span></div>
          <div><IconShieldCheck /><span><strong>Warranty support</strong><small>Help after you purchase</small></span></div>
          <div><IconBolt /><span><strong>Power made simpler</strong><small>Clear product guidance</small></span></div>
          <div><IconCheck /><span><strong>Cash on delivery</strong><small>Pay when your order arrives</small></span></div>
        </div>
      </section>

      <section className="gs-founder-section">
        <div className="gs-container gs-founder-card">
          <div className="gs-founder-photo">
            <img src={founderPortrait} alt="Temporary stock portrait placeholder for Gaurav Tripathi" loading="lazy" />
            <span>PORTRAIT PLACEHOLDER</span>
          </div>
          <div className="gs-founder-copy">
            <span className="gs-eyebrow">ABOUT GAURAV SALES</span>
            <h2>Meet Gaurav Tripathi.</h2>
            <p>Get to know the people behind Gaurav Sales and our straightforward approach to helping homes find dependable backup power.</p>
            <button className="gs-text-button" onClick={() => navigate("/about")}>More about us <IconArrowRight size={17} /></button>
          </div>
        </div>
      </section>

      <section className="gs-section gs-categories-section" aria-labelledby="gs-category-heading">
        <div className="gs-container">
          <div className="gs-section-heading">
            <div><span className="gs-eyebrow">SHOP BY CATEGORY</span><h2 id="gs-category-heading">Start with what you need.</h2><p>Choose a category to explore available products and add the right option to your bag.</p></div>
            <button className="gs-text-button" onClick={() => navigate("/products")}>View all products <IconArrowRight size={17} /></button>
          </div>
          <div className="gs-category-grid">
            {categories.map((category) => (
              <button
                key={category.title}
                className="gs-category-card"
                onClick={() => navigate(category.path)}
              >
                <span className={`gs-category-visual gs-category-visual-${category.visual}`}>
                  <img src={category.image} alt="" loading="lazy" />
                </span>
                <span className="gs-category-copy">
                  <strong>{category.title}</strong>
                  <small>{category.description}</small>
                  <span className="gs-category-link">Explore category <IconArrowRight size={16} /></span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="gs-testimonial-section">
        <div className="gs-container gs-testimonial-showcase">
          <div className="gs-testimonial-visual">
            <img src={powerSetupBanner} alt="Illustration of a home inverter and backup battery" loading="lazy" />
            <span><IconBolt size={15} /> POWER FOR EVERYDAY MOMENTS</span>
          </div>
          <div className="gs-testimonial-content">
            <span className="gs-eyebrow">CUSTOMER STORIES</span>
            <h2>Real homes. Real experiences.</h2>
            <p className="gs-testimonial-pending">
              We’re saving this space for genuine customer stories, shared with permission—not made-up reviews.
            </p>
            <div className="gs-testimonial-promise">
              <span><IconShieldCheck size={18} /><span><strong>Honest guidance</strong><small>Help choosing a setup that fits your home.</small></span></span>
              <span><IconCheck size={18} /><span><strong>Verified stories</strong><small>Customer experiences, when they’re ready to share.</small></span></span>
            </div>
            <button className="gs-text-button" onClick={() => navigate("/contact")}>
              Share your experience <IconArrowRight size={17} />
            </button>
          </div>
        </div>
      </section>

      <section className="gs-feature-band">
        <div className="gs-container gs-feature-content">
          <div className="gs-feature-icon"><IconBatteryCharging size={32} /></div>
          <div><span className="gs-eyebrow">THE RIGHT POWER SETUP</span><h2>Need a hand choosing an inverter?</h2><p>Tell us about your home and the appliances you want to keep running. We’ll help you find a sensible place to start.</p></div>
          <Button className="gs-button" onClick={() => navigate("/contact")}>Talk to our team <IconArrowRight size={17} /></Button>
        </div>
      </section>
    </>
  );
}
