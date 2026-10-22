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
import ProductCard from "../components/ProductCard";
import ServerIssueState from "../components/ServerIssueState";
import {
  products as fallbackProducts,
  type Product as CatalogProduct,
} from "../data/products";
import type { RoutePath } from "../Route/NextAppRoutes";
import {
  getCategories,
  type Category,
} from "../services/CategoryServiceService";
import { getBrands } from "../services/BrandService";
import {
  apiErrorMessage,
  isServerUnavailableError,
} from "../services/apiError";
import type { CartLine } from "../services/CartService";
import {
  addCatalogNamesToProducts,
  allProducts,
  productIsInActiveCatalog,
  resolveProductImageUrl,
  type Product as ServiceProduct,
} from "../services/ProductService";
import microtekBanner from "../assets/microtek-home-banner.png";
import vGuardBanner from "../assets/v-guard-home-banner.png";
import sfSonicBanner from "../assets/sf-sonic-home-banner.png";
import microtekLogo from "../assets/microtek-logo.png";
import vGuardLogo from "../assets/v-guard-logo.png";
import sfSonicLogo from "../assets/sf-sonic-logo.png";
import founderPortrait from "../assets/amit-rai-home.png";
import { assetSource } from "../utils/assetSource";

const slides = [
  {
    label: "Microtek",
    image: microtekBanner,
    logo: microtekLogo,
  },
  {
    label: "V-Guard",
    image: vGuardBanner,
    logo: vGuardLogo,
  },
  {
    label: "SF Sonic",
    image: sfSonicBanner,
    logo: sfSonicLogo,
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
  onAdd: (productId: string, quantity?: number) => Promise<void>;
  cart: CartLine[];
};

export default function HomePage({ navigate, onAdd, cart }: HomePageProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [categoriesServerIssue, setCategoriesServerIssue] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState<ServiceProduct[]>(
    [],
  );
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [productsServerIssue, setProductsServerIssue] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const moveSlide = (direction: number) => {
    setActiveSlide(
      (current) => (current + direction + slides.length) % slides.length,
    );
  };

  useEffect(() => {
    let active = true;
    getCategories()
      .then((items) => {
        if (!active) return;
        setCategories(items);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setCategories([]);
        setCategoriesError(
          apiErrorMessage(error, "Services could not be loaded right now."),
        );
        setCategoriesServerIssue(isServerUnavailableError(error));
      })
      .finally(() => {
        if (active) setCategoriesLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      allProducts(),
      getCategories(true).catch(() => []),
      getBrands(true).catch(() => []),
    ])
    .then(([items, productCategories, brands]) => {
      if (!active) return;
      const namedProducts = addCatalogNamesToProducts(
        items,
        productCategories,
        brands,
      );
      const activeProducts = namedProducts.filter(
        (product) =>
          product.active !== false &&
          productIsInActiveCatalog(product, productCategories, brands),
      );
      setFeaturedProducts(activeProducts.slice(0, 4));
    })
    .catch((error: unknown) => {
      if (!active) return;
      console.error("Could not load featured products.", error);
      setFeaturedProducts([]);
      setProductsError(
        apiErrorMessage(error, "Products could not be loaded right now."),
      );
      setProductsServerIssue(isServerUnavailableError(error));
    })
    .finally(() => {
      if (active) setProductsLoading(false);
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
      <section
        className="gs-brand-hero"
        aria-label="Featured brand banners"
        onTouchStart={(event) => {
          touchStartX.current = event.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          if (touchStartX.current === null) return;
          const distance =
            event.changedTouches[0].clientX - touchStartX.current;
          if (Math.abs(distance) > 45) moveSlide(distance < 0 ? 1 : -1);
          touchStartX.current = null;
        }}
      >
        <button
          className="gs-brand-banner"
          type="button"
          onClick={() => navigate("/products")}
          aria-label={`Explore ${slides[activeSlide].label} products`}
        >
          <img
            key={slides[activeSlide].label}
            src={assetSource(slides[activeSlide].image)}
            alt={`${slides[activeSlide].label} inverter and battery promotion`}
          />
        </button>
        <button
          className="gs-brand-arrow is-previous"
          type="button"
          aria-label="Previous banner"
          onClick={() => moveSlide(-1)}
        >
          <IconChevronLeft size={24} />
        </button>
        <button
          className="gs-brand-arrow is-next"
          type="button"
          aria-label="Next banner"
          onClick={() => moveSlide(1)}
        >
          <IconChevronRight size={24} />
        </button>
        <div
          className="gs-brand-banner-controls"
          role="group"
          aria-label="Choose a banner"
        >
          {slides.map((item, index) => (
            <button
              key={item.label}
              type="button"
              className={activeSlide === index ? "is-active" : ""}
              aria-label={`Show banner ${index + 1}: ${item.label}`}
              aria-pressed={activeSlide === index}
              onClick={() => setActiveSlide(index)}
            >
              <span className="gs-visually-hidden">Banner {index + 1}</span>
            </button>
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
              src={assetSource(founderPortrait)}
              alt="Amrit Rai, representing Gaurav Sales"
              loading="lazy"
            />
            <span>GAURAV SALES</span>
          </div>
          <div className="gs-founder-copy">
            <span className="gs-eyebrow">THE PEOPLE BEHIND GAURAV SALES</span>
            <h2>Meet Amrit Rai.</h2>
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
          {categoriesLoading ? (
            <div
              className="gs-home-empty-state gs-home-empty-loading"
              role="status"
            >
              <strong>Finding the right services for you…</strong>
            </div>
          ) : categoriesError ? (
            categoriesServerIssue ? (
              <ServerIssueState
                message={categoriesError}
                onRetry={() => window.location.reload()}
                compact
              />
            ) : (
              <div className="gs-home-empty-state" role="status">
                <span className="gs-home-empty-icon">
                  <IconBolt size={25} />
                </span>
                <strong>Services Could Not Be Loaded</strong>
                <p>{categoriesError}</p>
              </div>
            )
          ) : categories.length > 0 ? (
            <div
              className={`gs-category-grid${categories.length === 1 ? " has-single-category" : ""}`}
            >
              {categories.map((category) => {
                const isBattery = /battery|batter/i.test(category.name);
                const isCharger = /charg/i.test(category.name);
                const CategoryIcon = isBattery
                  ? IconBatteryCharging
                  : isCharger
                    ? IconPlug
                    : IconBolt;
                const visual = isBattery
                  ? "battery"
                  : isCharger
                    ? "charger"
                    : "inverter";
                const routeSlug =
                  category.slug || slugifyCategory(category.name);
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
                      <span
                        className="gs-category-icon-circle"
                        aria-hidden="true"
                      >
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
          ) : (
            <div className="gs-home-empty-state">
              <span className="gs-home-empty-icon">
                <IconBolt size={25} />
              </span>
              <strong>Service Not Available</strong>
              <p>Our services are being updated. Please check back soon.</p>
            </div>
          )}
        </div>
      </section>

      <section
        className="gs-home-products"
        aria-labelledby="gs-home-products-heading"
      >
        <div className="gs-container">
          <div className="gs-section-heading">
            <div>
              <span className="gs-eyebrow">OUR PRODUCTS</span>
              <h2 id="gs-home-products-heading">Power you can count on.</h2>
              <p>
                Explore dependable inverters and batteries selected for everyday
                home backup.
              </p>
            </div>
            <button
              className="gs-text-button"
              onClick={() => navigate("/products")}
            >
              View all products <IconArrowRight size={17} />
            </button>
          </div>

          {productsLoading ? (
            <p className="gs-home-products-message" role="status">
              Loading products…
            </p>
          ) : productsError ? (
            productsServerIssue ? (
              <ServerIssueState
                message={productsError}
                onRetry={() => window.location.reload()}
                compact
              />
            ) : (
              <div className="gs-home-empty-state" role="status">
                <span className="gs-home-empty-icon">
                  <IconBatteryCharging size={25} />
                </span>
                <strong>Products Could Not Be Loaded</strong>
                <p>{productsError}</p>
              </div>
            )
          ) : featuredProducts.length > 0 ? (
            <div
              className={`gs-product-grid${featuredProducts.length === 1 ? " is-single-product" : ""}`}
            >
              {featuredProducts.map((product) => {
                const fallbackImage = fallbackProducts.find(
                  (item) =>
                    item.brand === product.brand &&
                    item.category === product.category,
                )?.image;
                const price =
                  product.discountPrice > 0 &&
                  product.discountPrice < product.price
                    ? `₹${product.discountPrice.toLocaleString("en-IN")} (was ₹${product.price.toLocaleString("en-IN")})`
                    : `₹${product.price.toLocaleString("en-IN")}`;
                const catalogProduct: CatalogProduct = {
                  id: product.id,
                  name: product.name,
                  brand: product.brand,
                  category: product.categoryName || product.category,
                  price,
                  description: product.description,
                  image:
                    resolveProductImageUrl(product.image || product.imageUrl) ||
                    fallbackImage ||
                    "",
                  badge: product.brandName || product.brand,
                  capacity: "",
                };

                return (
                  <ProductCard
                    key={product.id}
                    product={catalogProduct}
                    onAdd={onAdd}
                    onOpen={(slug) =>
                      navigate(`/products/${encodeURIComponent(slug)}`)
                    }
                    slug={product.slug || product.id}
                    originalPrice={product.price}
                    discountPrice={product.discountPrice}
                    stock={product.stock}
                    inCartQuantity={
                      cart.find((line) => line.productId === product.id)
                        ?.quantity || 0
                    }
                  />
                );
              })}
            </div>
          ) : (
            <div className="gs-home-empty-state">
              <span className="gs-home-empty-icon">
                <IconBatteryCharging size={25} />
              </span>
              <strong>Product Not Available</strong>
              <p>Our products are being updated. Please check back soon.</p>
            </div>
          )}
        </div>
      </section>

      <section
        className="gs-home-partners"
        aria-labelledby="gs-home-partners-heading"
      >
        <div className="gs-container">
          <div className="gs-home-partners-frame">
            <div className="gs-home-partners-heading">
              <span className="gs-eyebrow">TRUSTED POWER BRANDS</span>
              <h2 id="gs-home-partners-heading">
                Trusted names. Reliable power.
              </h2>
              <p>
                Explore dependable inverter and battery options from brands
                trusted by homes across India.
              </p>
            </div>
            <div className="gs-home-partner-grid">
              {slides.map((brand) => (
                <button
                  className="gs-home-partner-card"
                  key={brand.label}
                  type="button"
                  onClick={() => navigate("/products")}
                  aria-label={`Browse ${brand.label} products`}
                >
                  <span className="gs-home-partner-logo">
                    <img src={assetSource(brand.logo)} alt={`${brand.label} logo`} />
                  </span>
                  <span className="gs-home-partner-link">
                    Explore products <IconArrowRight size={15} />
                  </span>
                </button>
              ))}
            </div>
            <span className="gs-home-partners-caption">
              Quality products for the backup power your home needs.
            </span>
          </div>
        </div>
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
