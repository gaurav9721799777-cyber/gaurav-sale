import React, { useState } from "react";
import {
  IconArrowRight,
  IconBatteryCharging,
  IconBolt,
  IconChevronDown,
  IconDeviceDesktop,
  IconMenu2,
  IconPackage,
  IconShoppingBag,
  IconShieldCheck,
  IconX,
} from "@tabler/icons-react";
import brandLogo from "./assets/gs-logo.png";
import AppRoutes, { useAppNavigation } from "./Route/AppRoutes";
import type { RoutePath } from "./Route/AppRoutes";
import type { CartLine } from "./pages/OrderPage";
import "./App.css";
import "./StorePages.css";

const navigation: { label: string; path: RoutePath }[] = [
  { label: "Home", path: "/" },
  { label: "Products", path: "/products" },
  { label: "About us", path: "/about" },
  { label: "Shipping", path: "/shipping" },
  { label: "Payment", path: "/payment" },
  { label: "Contact", path: "/contact" },
  { label: "FAQs", path: "/faq" },
];

function App() {
  const { path, navigate } = useAppNavigation();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productsMenuOpen, setProductsMenuOpen] = useState(false);

  const addToCart = (productId: string) => {
    setCart((current) => {
      const existing = current.find((line) => line.productId === productId);
      return existing
        ? current.map((line) =>
            line.productId === productId ? { ...line, quantity: line.quantity + 1 } : line,
          )
        : [...current, { productId, quantity: 1 }];
    });
  };

  const go = (next: RoutePath) => {
    navigate(next);
    setMobileMenuOpen(false);
    setProductsMenuOpen(false);
  };
  const cartCount = cart.reduce((total, line) => total + line.quantity, 0);

  return (
    <div className="gs-site">
      <div className="gs-announcement">
        <span><IconBolt size={15} fill="currentColor" /> Powering homes with confidence</span>
        <button onClick={() => go("/products")}>Explore inverter range <IconArrowRight size={14} /></button>
      </div>
      <header
        className="gs-header"
        onMouseLeave={() => setProductsMenuOpen(false)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setProductsMenuOpen(false);
        }}
      >
        <div className="gs-container gs-header-inner">
          <button className="gs-brand" onClick={() => go("/")} aria-label="Gaurav Sales home">
            <img src={brandLogo} alt="" />
            <span>Gaurav Sales<small>INVERTERS &amp; SOLAR POWER</small></span>
          </button>
          <nav className="gs-desktop-nav" aria-label="Main navigation">
            {navigation.filter((item) => item.path === "/about").map((item) => (
              <button key={item.path} className={path === item.path ? "is-active" : ""} onClick={() => go(item.path)} aria-current={path === item.path ? "page" : undefined}>
                {item.label}
              </button>
            ))}
            <button
              className={`gs-products-trigger${path === "/products" ? " is-active" : ""}`}
              onClick={() => setProductsMenuOpen((open) => !open)}
              aria-expanded={productsMenuOpen}
              aria-controls="gs-products-menu"
            >
              Products <IconChevronDown size={14} />
            </button>
            {navigation.filter((item) => ["/shipping", "/payment", "/contact", "/faq"].includes(item.path)).map((item) => (
              <button key={item.path} className={path === item.path ? "is-active" : ""} onClick={() => go(item.path)} aria-current={path === item.path ? "page" : undefined}>
                {item.label}
              </button>
            ))}
          </nav>
          <div className="gs-header-actions">
            <button className="gs-cart-button" onClick={() => go("/order")} aria-label={`Place order, ${cartCount} items in bag`}>
              <IconShoppingBag size={19} /><span>Order</span><b>{cartCount}</b>
            </button>
            <button className="gs-mobile-toggle" onClick={() => setMobileMenuOpen((open) => !open)} aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={mobileMenuOpen}>
              {mobileMenuOpen ? <IconX /> : <IconMenu2 />}
            </button>
          </div>
        </div>
        {productsMenuOpen && (
          <div className="gs-mega-menu" id="gs-products-menu">
            <div className="gs-mega-inner">
              <div className="gs-mega-categories">
                <span>POWER BACKUP</span>
                <button onClick={() => go("/products")}>Home inverter systems <IconArrowRight size={14} /></button>
                <button onClick={() => go("/products")}>Battery solutions <IconArrowRight size={14} /></button>
                <button onClick={() => go("/products")}>UPS &amp; backup power <IconArrowRight size={14} /></button>
                <button onClick={() => go("/products")}>High capacity systems <IconArrowRight size={14} /></button>
              </div>
              <div className="gs-mega-products">
                <div className="gs-mega-title"><strong>Explore products</strong><button onClick={() => go("/products")}>Shop all <IconArrowRight size={14} /></button></div>
                <div className="gs-mega-grid">
                  <button onClick={() => go("/products")}><span><IconDeviceDesktop /></span><strong>Home inverter</strong><small>Everyday backup</small></button>
                  <button onClick={() => go("/products")}><span><IconBatteryCharging /></span><strong>Inverter battery</strong><small>Reliable storage</small></button>
                  <button onClick={() => go("/products")}><span><IconPackage /></span><strong>UPS systems</strong><small>Uninterrupted power</small></button>
                  <button onClick={() => go("/products")}><span><IconBolt /></span><strong>High capacity</strong><small>More power at home</small></button>
                </div>
              </div>
              <aside className="gs-mega-help"><IconShieldCheck size={25} /><strong>Need help choosing?</strong><p>Get friendly advice on the right inverter for your home.</p><button onClick={() => go("/contact")}>Talk to us <IconArrowRight size={14} /></button></aside>
            </div>
          </div>
        )}
        {mobileMenuOpen && (
          <nav className="gs-mobile-nav" aria-label="Mobile navigation">
            {navigation.map((item) => (
              <button key={item.path} onClick={() => go(item.path)}>{item.label}<IconArrowRight size={16} /></button>
            ))}
            <button onClick={() => go("/order")}>Place an order<IconArrowRight size={16} /></button>
          </nav>
        )}
      </header>

      <main>
        <AppRoutes path={path} navigate={go} cart={cart} onAdd={addToCart} />
      </main>

      <footer className="gs-footer">
        <div className="gs-container">
          <div className="gs-footer-main">
            <div className="gs-footer-brand">
              <button className="gs-brand" onClick={() => go("/")}>
                <img src={brandLogo} alt="" />
                <span>Gaurav Sales<small>INVERTERS &amp; SOLAR POWER</small></span>
              </button>
              <p>Dependable inverter solutions and helpful service for your home.</p>
            </div>
            <div><strong>Explore</strong><button onClick={() => go("/products")}>Shop inverters</button><button onClick={() => go("/about")}>About us</button><button onClick={() => go("/faq")}>FAQs</button></div>
            <div><strong>Order help</strong><button onClick={() => go("/shipping")}>Shipping information</button><button onClick={() => go("/payment")}>Cash on delivery</button><button onClick={() => go("/contact")}>Contact our team</button></div>
            <div className="gs-footer-promise"><IconBolt size={25} /><strong>Power made<br />straightforward.</strong><span>Here when you need us.</span></div>
          </div>
          <div className="gs-footer-bottom"><span>© {new Date().getFullYear()} Gaurav Sales</span><span>Payment method: Cash on delivery</span><button onClick={() => go("/faq")}>Help &amp; FAQs</button></div>
        </div>
      </footer>
    </div>
  );
}

export default App;
