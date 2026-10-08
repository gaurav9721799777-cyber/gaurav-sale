import React, { useEffect, useState } from "react";

import { BrowserRouter, useLocation, useNavigate } from "react-router-dom";

import {
  IconArrowRight,
  IconBatteryCharging,
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandYoutube,
  IconBolt,
  IconChevronDown,
  IconCreditCard,
  IconDeviceDesktop,
  IconHelpCircle,
  IconInfoCircle,
  IconMenu2,
  IconPackage,
  IconPhone,
  IconShieldCheck,
  IconShoppingBag,
  IconTruck,
  IconUserCircle,
  IconX,
} from "@tabler/icons-react";

import brandLogo from "./assets/gs-logo.png";

import AppRoutes, { type RoutePath } from "./Route/AppRoutes";

import { addCartItem, clearCart as clearCartRequest, getCart, normalizeCartLines, removeCartItem, updateCartItem, type CartLine } from "./services/CartService";
import { getCategories, type Category } from "./services/CategoryServiceService";
import { apiErrorMessage } from "./services/apiError";

import "./App.css";
import "./StorePages.css";

const navigation: {
  label: string;
  path: RoutePath;
}[] = [
  {
    label: "Home",
    path: "/",
  },
  {
    label: "Products",
    path: "/product",
  },
  {
    label: "About us",
    path: "/about",
  },
  {
    label: "Shipping",
    path: "/shipping",
  },
  {
    label: "Payment",
    path: "/payment",
  },
  {
    label: "Contact",
    path: "/contact",
  },
  {
    label: "FAQs",
    path: "/faq",
  },
];

function AppContent() {
  const navigate = useNavigate();

  const location = useLocation();

  const path = location.pathname as RoutePath;

  // ==========================================
  // CART
  // ==========================================

  const [cartId] = useState(() => {
    const storageKey = "gaurav-sales-cart-id";
    const existing = window.localStorage.getItem(storageKey);
    if (existing) return existing;
    const nextId = typeof window.crypto?.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `cart-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(storageKey, nextId);
    return nextId;
  });
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartBusy, setCartBusy] = useState(true);
  const [cartMessage, setCartMessage] = useState("");
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  const [socialLinksOpen, setSocialLinksOpen] = useState(false);
  const [productCategories, setProductCategories] = useState<Category[]>([]);

  useEffect(() => {
    let active = true;
    getCart(cartId)
      .then((record) => { if (active) setCart(normalizeCartLines(record)); })
      .catch((error: unknown) => {
        if (active) setCartMessage(apiErrorMessage(error, "Could not load your bag."));
      })
      .finally(() => { if (active) setCartBusy(false); });
    return () => { active = false; };
  }, [cartId]);

  useEffect(() => {
    let active = true;
    getCategories()
      .then((categories) => {
        if (active) setProductCategories(categories);
      })
      .catch((error: unknown) => {
        console.error("Could not load product categories for navigation.", error);
        if (active) setProductCategories([]);
      });
    return () => {
      active = false;
    };
  }, []);

  // ==========================================
  // MENU
  // ==========================================

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [productsMenuOpen, setProductsMenuOpen] = useState(false);

  // ==========================================
  // ADD TO CART
  // ==========================================

  const runCartAction = async (action: () => Promise<void>, successMessage: string): Promise<void> => {
    setCartBusy(true);
    setCartMessage("");
    try {
      await action();
      const latestCart = await getCart(cartId);
      setCart(normalizeCartLines(latestCart));
      setCartMessage(successMessage);
    } catch (error) {
      const message = apiErrorMessage(error, "Could not update your bag. Please try again.");
      setCartMessage(message);
      throw error;
    } finally {
      setCartBusy(false);
    }
  };

  const addToCart = (productId: string, quantity = 1): Promise<void> =>
    runCartAction(() => addCartItem(cartId, productId, quantity), "Added to your bag.");

  const removeFromCart = (productId: string): Promise<void> =>
    runCartAction(() => removeCartItem(cartId, productId), "Item removed from your bag.");

  const changeCartQuantity = (productId: string, quantity: number): Promise<void> =>
    runCartAction(() => updateCartItem(cartId, productId, quantity), "Bag updated.");

  const emptyCart = (): Promise<void> =>
    runCartAction(() => clearCartRequest(cartId), "Bag cleared.");

  const handleOrderPlaced = async (): Promise<void> => {
    setCart([]);
    setCartMessage("");
  };;

  // ==========================================
  // NAVIGATION
  // ==========================================

  const go = (next: RoutePath) => {
    navigate(next);

    setMobileMenuOpen(false);

    setProductsMenuOpen(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ==========================================
  // CART COUNT
  // ==========================================

  const cartCount = cart.reduce((total, line) => total + line.quantity, 0);

  return (
    <div className={`gs-site${path.startsWith("/admin") ? " is-admin-route" : ""}`}>
      {/* ========================================
          ANNOUNCEMENT
      ========================================= */}

      <div className="gs-announcement">
        <span>
          <IconBolt size={15} fill="currentColor" />
          Powering homes with confidence
        </span>

        <button onClick={() => go("/products")}>
          Explore inverter range
          <IconArrowRight size={14} />
        </button>
      </div>

      {/* ========================================
          HEADER
      ========================================= */}

      <header
        className="gs-header"
        onMouseLeave={() => setProductsMenuOpen(false)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setProductsMenuOpen(false);
          }
        }}
      >
        <div className="gs-container gs-header-inner">
          {/* BRAND */}

          <button
            className="gs-brand"
            onClick={() => go("/")}
            aria-label="Gaurav Sales home"
          >
            <img src={brandLogo} alt="Gaurav Sales" />

            <span>
              Gaurav Sales
              <small>INVERTERS &amp; SOLAR POWER</small>
            </span>
          </button>

          {/* ====================================
              DESKTOP NAVIGATION
          ===================================== */}

          <nav className="gs-desktop-nav" aria-label="Main navigation">
            {/* ABOUT */}

            <button
              className={path === "/about" ? "is-active" : ""}
              onClick={() => go("/about")}
              aria-current={path === "/about" ? "page" : undefined}
            >
              <IconInfoCircle className="gs-nav-icon gs-nav-icon-about" size={16} />
              About us
            </button>

            {/* PRODUCTS */}

            <span className="gs-products-nav-group">
              <button
                className={`gs-products-trigger${
                  path === "/product" || path.startsWith("/products") ? " is-active" : ""
                }`}
                onClick={() => go("/product")}
              >
                <IconPackage className="gs-nav-icon gs-nav-icon-products" size={16} />
                Products
              </button>
              {productCategories.length > 0 && (
                <button
                  className="gs-products-dropdown-toggle"
                  type="button"
                  onClick={() => setProductsMenuOpen((open) => !open)}
                  aria-label={productsMenuOpen ? "Hide product categories" : "Show product categories"}
                  aria-expanded={productsMenuOpen}
                  aria-controls="gs-products-menu"
                >
                  <IconChevronDown size={14} />
                </button>
              )}
            </span>

            {/* SHIPPING */}

            <button
              className={path === "/shipping" ? "is-active" : ""}
              onClick={() => go("/shipping")}
            >
              <IconTruck className="gs-nav-icon gs-nav-icon-shipping" size={16} />
              Shipping
            </button>

            {/* PAYMENT */}

            <button
              className={path === "/payment" ? "is-active" : ""}
              onClick={() => go("/payment")}
            >
              <IconCreditCard className="gs-nav-icon gs-nav-icon-payment" size={16} />
              Payment
            </button>

            {/* CONTACT */}

            <button
              className={path === "/contact" ? "is-active" : ""}
              onClick={() => go("/contact")}
            >
              <IconPhone className="gs-nav-icon gs-nav-icon-contact" size={16} />
              Contact
            </button>

            {/* FAQ */}

            <button
              className={path === "/faq" ? "is-active" : ""}
              onClick={() => go("/faq")}
            >
              <IconHelpCircle className="gs-nav-icon gs-nav-icon-faq" size={16} />
              FAQs
            </button>
          </nav>

          {/* ====================================
              HEADER ACTIONS
          ===================================== */}

          <div className="gs-header-actions">
            <button
              className="gs-login-button"
              onClick={() => go("/admin/login")}
            >
              <IconUserCircle size={16} />
              <span>Login</span>
            </button>

            {/* ORDER */}

            <button
              className="gs-cart-button"
              onClick={() => go("/order")}
              aria-label={`Place order, ${cartCount} items in bag`}
            >
              <IconShoppingBag size={19} />

              <span>Order</span>

              <b>{cartCount}</b>
            </button>

            {/* MOBILE */}

            <button
              className="gs-mobile-toggle"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label={
                mobileMenuOpen
                  ? "Close navigation menu"
                  : "Open navigation menu"
              }
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <IconX /> : <IconMenu2 />}
            </button>
          </div>
        </div>

        {/* ========================================
            MEGA MENU
        ========================================= */}

        {productsMenuOpen && productCategories.length > 0 && (
          <div className="gs-mega-menu" id="gs-products-menu">
            <div className="gs-mega-inner">
              <div className="gs-mega-categories">
                <span>SHOP BY CATEGORY</span>
                {productCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => go(`/products/category/${encodeURIComponent(category.slug)}`)}
                  >
                    {category.name}
                    <IconArrowRight size={14} />
                  </button>
                ))}
              </div>

              <div className="gs-mega-products">
                <div className="gs-mega-title">
                  <strong>Explore categories</strong>
                  <button onClick={() => go("/product")}>
                    View all products
                    <IconArrowRight size={14} />
                  </button>
                </div>

                <div className="gs-mega-grid">
                  {productCategories.map((category) => {
                    const isBattery = /battery|batter/i.test(category.name);
                    const CategoryIcon = isBattery ? IconBatteryCharging : IconDeviceDesktop;
                    return (
                      <button
                        key={category.id}
                        onClick={() => go(`/products/category/${encodeURIComponent(category.slug)}`)}
                      >
                        <span><CategoryIcon /></span>
                        <strong>{category.name}</strong>
                        <small>{category.description || "Explore available products"}</small>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* HELP */}

              <aside className="gs-mega-help">
                <IconShieldCheck size={25} />

                <strong>Need help choosing?</strong>

                <p>Get friendly advice on the right inverter for your home.</p>

                <button onClick={() => go("/contact")}>
                  Talk to us
                  <IconArrowRight size={14} />
                </button>
              </aside>
            </div>
          </div>
        )}

        {/* ========================================
            MOBILE NAV
        ========================================= */}

        {mobileMenuOpen && (
          <nav className="gs-mobile-nav" aria-label="Mobile navigation">
            {navigation.map((item) => (
              <button key={item.path} onClick={() => go(item.path)}>
                {item.label}

                <IconArrowRight size={16} />
              </button>
            ))}

            <button onClick={() => go("/order")}>
              Place an order
              <IconArrowRight size={16} />
            </button>
            <button onClick={() => go("/admin/login")}>
              Login
              <IconArrowRight size={16} />
            </button>
          </nav>
        )}
      </header>

      {/* ========================================
          ROUTES
      ========================================= */}

      <main>
        <AppRoutes
          path={path}
          navigate={go}
          cart={cart}
          cartId={cartId}
          onAdd={addToCart}
          onRemove={removeFromCart}
          onQuantityChange={changeCartQuantity}
          onClearCart={emptyCart}
          onOrderPlaced={handleOrderPlaced}
          cartBusy={cartBusy}
          cartMessage={cartMessage}
          adminAuthenticated={adminAuthenticated}
          onAdminLogin={() => {
            setAdminAuthenticated(true);
            go("/admin/dashboard");
          }}
          onAdminLogout={() => {
            setAdminAuthenticated(false);
            go("/");
          }}
        />
      </main>

      {/* ========================================
          FOOTER
      ========================================= */}

      <footer className="gs-footer">
        <div className="gs-container">
          <div className="gs-footer-main">
            {/* FOOTER BRAND */}

            <div className="gs-footer-brand">
              <button className="gs-brand" onClick={() => go("/")}>
                <img src={brandLogo} alt="Gaurav Sales" />

                <span>
                  Gaurav Sales
                  <small>INVERTERS &amp; SOLAR POWER</small>
                </span>
              </button>

              <p>
                Dependable inverter solutions and helpful service for your home.
              </p>
              <div className="gs-footer-social" aria-label="Follow Gaurav Sales">
                <a href="https://www.facebook.com/" target="_blank" rel="noreferrer" aria-label="Visit Facebook" title="Facebook" className="social-facebook"><IconBrandFacebook /></a>
                <a href="https://www.instagram.com/" target="_blank" rel="noreferrer" aria-label="Visit Instagram" title="Instagram" className="social-instagram"><IconBrandInstagram /></a>
                <a href="https://www.youtube.com/" target="_blank" rel="noreferrer" aria-label="Visit YouTube" title="YouTube" className="social-youtube"><IconBrandYoutube /></a>
              </div>
            </div>

            {/* EXPLORE */}

            <div>
              <strong>Explore</strong>

              <button onClick={() => go("/products")}>Shop inverters</button>

              <button onClick={() => go("/about")}>About us</button>

              <button onClick={() => go("/faq")}>FAQs</button>
            </div>

            {/* ORDER HELP */}

            <div>
              <strong>Order help</strong>

              <button onClick={() => go("/shipping")}>
                Shipping information
              </button>

              <button onClick={() => go("/payment")}>Cash on delivery</button>

              <button onClick={() => go("/contact")}>Contact our team</button>
            </div>

            {/* PROMISE */}

            <div className="gs-footer-promise">
              <IconBolt size={25} />

              <strong>
                Power made
                <br />
                straightforward.
              </strong>

              <span>Here when you need us.</span>
            </div>
          </div>

          {/* FOOTER BOTTOM */}

          <div className="gs-footer-bottom">
            <span>© {new Date().getFullYear()} Gaurav Sales</span>

            <span>Payment method: Cash on delivery</span>

            <button onClick={() => go("/faq")}>Help &amp; FAQs</button>
          </div>
        </div>
      </footer>

      <aside
        className={`gs-social-dock${socialLinksOpen ? " is-open" : ""}`}
        aria-label="Social media"
      >
        <div className="gs-social-links" id="gs-social-links">
          <a
            className="social-facebook"
            href="https://www.facebook.com/"
            target="_blank"
            rel="noreferrer"
            aria-label="Visit Facebook"
            title="Facebook"
          >
            <IconBrandFacebook />
          </a>
          <a
            className="social-instagram"
            href="https://www.instagram.com/"
            target="_blank"
            rel="noreferrer"
            aria-label="Visit Instagram"
            title="Instagram"
          >
            <IconBrandInstagram />
          </a>
          <a
            className="social-youtube"
            href="https://www.youtube.com/"
            target="_blank"
            rel="noreferrer"
            aria-label="Visit YouTube"
            title="YouTube"
          >
            <IconBrandYoutube />
          </a>
        </div>
        <button
          type="button"
          className="gs-social-toggle"
          aria-label={socialLinksOpen ? "Hide social media links" : "Show social media links"}
          aria-expanded={socialLinksOpen}
          aria-controls="gs-social-links"
          onClick={() => setSocialLinksOpen((open) => !open)}
        >
          <span>SOCIAL MEDIA</span>
        </button>
      </aside>
    </div>
  );
}

// ============================================
// ROOT APP
// ============================================

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
