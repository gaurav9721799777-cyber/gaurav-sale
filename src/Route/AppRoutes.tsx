import React, { lazy, Suspense, useEffect, useState } from "react";
import HomePage from "../pages/HomePage";
import ProductsPage from "../pages/ProductsPage";
import type { CartLine } from "../pages/OrderPage";

const AboutPage = lazy(() => import("../pages/AboutPage"));
const ContactPage = lazy(() => import("../pages/ContactPage"));
const FaqPage = lazy(() => import("../pages/FaqPage"));
const OrderPage = lazy(() => import("../pages/OrderPage"));
const ShippingPage = lazy(() => import("../pages/ShippingPage"));
const PaymentPage = lazy(() => import("../pages/PaymentPage"));

export type RoutePath =
  | "/"
  | "/products"
  | "/products/microtek"
  | "/products/luminous"
  | "/products/inverters"
  | "/products/batteries"
  | "/about"
  | "/contact"
  | "/faq"
  | "/order"
  | "/shipping"
  | "/payment";

const knownPaths: RoutePath[] = [
  "/",
  "/products",
  "/products/microtek",
  "/products/luminous",
  "/products/inverters",
  "/products/batteries",
  "/about",
  "/contact",
  "/faq",
  "/order",
  "/shipping",
  "/payment",
];

export function useAppNavigation() {
  const [path, setPath] = useState<RoutePath>(() => resolvePath(window.location.pathname));

  useEffect(() => {
    const syncPath = () => setPath(resolvePath(window.location.pathname));
    window.addEventListener("popstate", syncPath);
    return () => window.removeEventListener("popstate", syncPath);
  }, []);

  const navigate = (next: RoutePath) => {
    if (window.location.pathname !== next) {
      window.history.pushState({}, "", next);
    }
    setPath(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return { path, navigate };
}

function resolvePath(pathname: string): RoutePath {
  const path = pathname.replace(/\/+$/, "") || "/";
  return knownPaths.includes(path as RoutePath) ? (path as RoutePath) : "/";
}

type AppRoutesProps = {
  path: RoutePath;
  navigate: (path: RoutePath) => void;
  cart: CartLine[];
  onAdd: (productId: string) => void;
};

export default function AppRoutes({
  path,
  navigate,
  cart,
  onAdd,
}: AppRoutesProps) {
  let page: React.ReactNode;
  switch (path) {
    case "/products":
      page = <ProductsPage brand="all" onAdd={onAdd} navigate={navigate} />;
      break;
    case "/products/microtek":
      page = <ProductsPage brand="microtek" onAdd={onAdd} navigate={navigate} />;
      break;
    case "/products/luminous":
      page = <ProductsPage brand="luminous" onAdd={onAdd} navigate={navigate} />;
      break;
    case "/products/inverters":
      page = <ProductsPage brand="all" category="Inverter" onAdd={onAdd} navigate={navigate} />;
      break;
    case "/products/batteries":
      page = <ProductsPage brand="all" category="Battery" onAdd={onAdd} navigate={navigate} />;
      break;
    case "/about":
      page = <AboutPage navigate={navigate} />;
      break;
    case "/contact":
      page = <ContactPage />;
      break;
    case "/faq":
      page = <FaqPage navigate={navigate} />;
      break;
    case "/order":
      page = <OrderPage cart={cart} navigate={navigate} />;
      break;
    case "/shipping":
      page = <ShippingPage navigate={navigate} />;
      break;
    case "/payment":
      page = <PaymentPage navigate={navigate} />;
      break;
    case "/":
    default:
      page = <HomePage navigate={navigate} />;
      break;
  }
  return (
    <Suspense fallback={<div className="gs-route-loading" role="status">Loading page…</div>}>
      {page}
    </Suspense>
  );
}
