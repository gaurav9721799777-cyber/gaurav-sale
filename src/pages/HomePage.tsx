import React, { useEffect, useRef, useState } from "react";
import { Button } from "@mantine/core";
import {
  IconArrowRight,
  IconBatteryCharging,
  IconBolt,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconPlug,
  IconShieldCheck,
  IconTruck,
} from "@tabler/icons-react";
import type { RoutePath } from "../Route/AppRoutes";
import {
  getCategories,
  type Category,
} from "../services/CategoryServiceService";
import microtekBanner from "../assets/microtek-home-banner.png";
import vGuardBanner from "../assets/v-guard-home-banner.png";
import sfSonicBanner from "../assets/sf-sonic-home-banner.png";
import premiumBrandsBanner from "../assets/premium-brands-home-banner.png";
import founderPortrait from "../assets/amit-rai-home.png";

const slides = [
  {
    label: "Microtek",
    image: microtekBanner,
  },
  {
    label: "V-Guard",
    image: vGuardBanner,
  },
  {
    label: "SF Sonic",
    image: sfSonicBanner,
  },
];

const slugifyCategory = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

type HomePageProps = {
  navigate: (path: RoutePath) => void;
};

export default function HomePage({ navigate }: HomePageProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const touchStartX = useRef<number | null>(null);

  const moveSlide = (direction: number) => {
    setActiveSlide((current) => (current + direction + slides.length) % slides.length);
  };

  useEffect(() => {
    let active = true;
    getCategories()
      .then((items) => {
        console.log(items);
        if (!active) return;
        setCategories(items);
      })
      .catch(() => {
        if (!active) return;
        setCategories([]);
      });
    return () => {
      active = false;
    };
  }, []);

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

  return (
    <>
      <section className="gs-brand-hero" aria-label="Featured brand banners" onTouchStart={(event) => { touchStartX.current = event.touches[0]?.clientX ?? null; }} onTouchEnd={(event) => {
        if (touchStartX.current === null) return;
        const distance = event.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(distance) > 45) moveSlide(distance < 0 ? 1 : -1);
        touchStartX.current = null;
      }}>
        <button className="gs-brand-banner" type="button" onClick={() => navigate("/products")} aria-label={`Explore ${slides[activeSlide].label} products`}>
          <img key={slides[activeSlide].label} src={slides[activeSlide].image} alt={`${slides[activeSlide].label} inverter and battery promotion`} />
        </button>
        <button className="gs-brand-arrow is-previous" type="button" aria-label="Previous banner" onClick={() => moveSlide(-1)}><IconChevronLeft size={24} /></button>
        <button className="gs-brand-arrow is-next" type="button" aria-label="Next banner" onClick={() => moveSlide(1)}><IconChevronRight size={24} /></button>
        <div className="gs-brand-banner-controls" role="group" aria-label="Choose a banner">
          {slides.map((item, index) => (
            <button key={item.label} type="button" className={activeSlide === index ? "is-active" : ""} aria-label={`Show banner ${index + 1}: ${item.label}`} aria-pressed={activeSlide === index} onClick={() => setActiveSlide(index)}><span className="gs-visually-hidden">Banner {index + 1}</span></button>
          ))}
        </div>
      </section>

      <section className="gs-benefits">
        <div className="gs-container gs-benefit-grid">
          <div>
            <IconTruck />
            <span>
              <strong>Careful delivery</strong>
              <small>Shipping updates at every step</small>
            </span>
          </div>
          <div>
            <IconShieldCheck />
            <span>
              <strong>Warranty support</strong>
              <small>Help after you purchase</small>
            </span>
          </div>
          <div>
            <IconBolt />
            <span>
              <strong>Power made simpler</strong>
              <small>Clear product guidance</small>
            </span>
          </div>
          <div>
            <IconCheck />
            <span>
              <strong>Cash on delivery</strong>
              <small>Pay when your order arrives</small>
            </span>
          </div>
        </div>
      </section>

      <section className="gs-founder-section">
        <div className="gs-container gs-founder-card">
          <div className="gs-founder-photo">
            <img
              src={founderPortrait}
              alt="Gaurav Rai, representing Gaurav Sales"
              loading="lazy"
            />
            <span>GAURAV SALES</span>
          </div>
          <div className="gs-founder-copy">
            <span className="gs-eyebrow">THE PEOPLE BEHIND GAURAV SALES</span>
            <h2>Meet Gaurav Rai.</h2>
            <p>
              Personal guidance, dependable products, and thoughtful support to
              help every home find the right backup power.
            </p>
            <button
              className="gs-text-button"
              onClick={() => navigate("/about")}
            >
              More about us <IconArrowRight size={17} />
            </button>
          </div>
        </div>
      </section>

      <section
        className="gs-section gs-categories-section"
        aria-labelledby="gs-category-heading"
      >
        <div className="gs-container">
          <div className="gs-section-heading">
            <div>
              <span className="gs-eyebrow">SHOP BY CATEGORY</span>
              <h2 id="gs-category-heading">Start with what you need.</h2>
              <p>
                Choose a category to explore available products and add the
                right option to your bag.
              </p>
            </div>
            <button
              className="gs-text-button"
              onClick={() => navigate("/products")}
            >
              View all products <IconArrowRight size={17} />
            </button>
          </div>
          <div className="gs-category-grid">
            {categories.map((category) => {
              const isBattery = /battery|batter/i.test(category.name);
              const isCharger = /charg/i.test(category.name);
              const CategoryIcon = isBattery
                ? IconBatteryCharging
                : isCharger
                  ? IconPlug
                  : IconBolt;
              const visual = isBattery ? "battery" : isCharger ? "charger" : "inverter";
              const routeSlug = category.slug || slugifyCategory(category.name);
              return (
                <button
                  key={category.id}
                  className="gs-category-card"
                  onClick={() =>
                    navigate(
                      `/products/category/${encodeURIComponent(routeSlug)}`,
                    )
                  }
                >
                  <span
                    className={`gs-category-visual gs-category-visual-${visual}`}
                  >
                    <span className="gs-category-icon-circle" aria-hidden="true">
                      <CategoryIcon size={34} stroke={1.7} />
                    </span>
                  </span>
                  <span className="gs-category-copy">
                    <strong>{category.name}</strong>
                    <small>
                      {isBattery
                        ? "Find a battery for the backup you need."
                        : "Browse reliable power backup for your home."}
                    </small>
                    <span className="gs-category-link">
                      Explore category <IconArrowRight size={16} />
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="gs-premium-brands-section" aria-label="Premium inverter and battery brands">
        <button className="gs-premium-brands-banner" type="button" onClick={() => navigate("/products")} aria-label="Explore our inverter and battery products">
          <img src={premiumBrandsBanner} alt="Premium brands: Microtek, SF Sonic and V-Guard. Reliable power for a brighter tomorrow." loading="lazy" />
        </button>
      </section>

      <section className="gs-feature-band">
        <div className="gs-container gs-feature-content">
          <div className="gs-feature-icon">
            <IconBatteryCharging size={32} />
          </div>
          <div>
            <span className="gs-eyebrow">THE RIGHT POWER SETUP</span>
            <h2>Need a hand choosing an inverter?</h2>
            <p>
              Tell us about your home and the appliances you want to keep
              running. We’ll help you find a sensible place to start.
            </p>
          </div>
          <Button className="gs-button" onClick={() => navigate("/contact")}>
            Talk to our team <IconArrowRight size={17} />
          </Button>
        </div>
      </section>
    </>
  );
}
