import React, { lazy, Suspense, useEffect } from "react";
import { useRouter } from "next/router";

import HomePage from "../pages/HomePage";
import ProductsPage from "../pages/ProductsPage";
import type { CartLine } from "../services/CartService";
import AppLoader from "../components/AppLoader";

const AboutPage = lazy(() => import("../pages/AboutPage"));
const ContactPage = lazy(() => import("../pages/ContactPage"));
const FaqPage = lazy(() => import("../pages/FaqPage"));
const OrderPage = lazy(() => import("../pages/OrderPage"));
const ShippingPage = lazy(() => import("../pages/ShippingPage"));
const PaymentPage = lazy(() => import("../pages/PaymentPage"));
const ProductPage = lazy(() => import("../components/ProductPage"));
const AdminLogin = lazy(() => import("../components/Admin/AdminLoginPage"));
const AdminPanel = lazy(() => import("../components/Admin/AdminPanel"));

export type RoutePath =
  | "/"
  | "/login"
  | "/products"
  | `/products?search=${string}`
  | "/product"
  | "/products/microtek"
  | "/products/luminous"
  | "/products/inverters"
  | "/products/batteries"
  | `/products/${string}`
  | "/about"
  | "/contact"
  | "/faq"
  | "/order"
  | "/shipping"
  | "/payment"
  | "/admin"
  | "/admin/login"
  | "/admin/dashboard"
  | "/admin/products"
  | "/admin/categories"
  | "/admin/brands"
  | "/admin/customers"
  | "/admin/orders";

type AppRoutesProps = {
  path: string;
  searchQuery: string;
  navigate: (path: RoutePath) => void;
  cart: CartLine[];
  cartId: string;
  onAdd: (productId: string, quantity?: number) => Promise<void>;
  onRemove: (productId: string) => Promise<void>;
  onQuantityChange: (productId: string, quantity: number) => Promise<void>;
  onClearCart: () => Promise<void>;
  onOrderPlaced: () => Promise<void>;
  cartBusy: boolean;
  cartMessage: string;
  adminAuthenticated: boolean;
  adminAuthLoading: boolean;
  onAdminLogin: () => void;
  onAdminLogout: () => void;
};

const LoadingPage = () => (
  <AppLoader label="Loading page" variant="section" />
);

function RedirectHome({ navigate }: Pick<AppRoutesProps, "navigate">) {
  useEffect(() => {
    navigate("/");
  }, [navigate]);

  return <LoadingPage />;
}

function AdminRoute({
  path,
  adminAuthenticated,
  adminAuthLoading,
  navigate,
  onAdminLogin,
  onAdminLogout,
}: Pick<
  AppRoutesProps,
  | "path"
  | "adminAuthenticated"
  | "adminAuthLoading"
  | "navigate"
  | "onAdminLogin"
  | "onAdminLogout"
>) {
  const router = useRouter();
  const isLogin = path === "/admin/login";

  useEffect(() => {
    if (adminAuthLoading) return;
    if (isLogin && adminAuthenticated) {
      void router.replace("/admin/dashboard");
    } else if (!isLogin && !adminAuthenticated) {
      void router.replace("/admin/login");
    }
  }, [adminAuthLoading, adminAuthenticated, isLogin, router]);

  if (
    adminAuthLoading ||
    (isLogin && adminAuthenticated) ||
    (!isLogin && !adminAuthenticated)
  ) {
    return <LoadingPage />;
  }

  if (isLogin) return <AdminLogin onLogin={onAdminLogin} />;

  return (
    <AdminPanel
      routePath={path}
      navigate={navigate}
      onLogout={onAdminLogout}
    />
  );
}

function AppRouteContent(props: AppRoutesProps) {
  const { path } = props;

  if (path === "/") {
    return <HomePage navigate={props.navigate} onAdd={props.onAdd} cart={props.cart} />;
  }

  if (
    path === "/products" ||
    path === "/product" ||
    path === "/products/microtek" ||
    path === "/products/luminous" ||
    path === "/products/inverters" ||
    path === "/products/batteries" ||
    path.startsWith("/products/category/")
  ) {
    const categorySlug = path.startsWith("/products/category/")
      ? path.slice("/products/category/".length)
      : undefined;
    const brand =
      path === "/products/microtek"
        ? "microtek"
        : path === "/products/luminous"
          ? "luminous"
          : "all";
    const category =
      path === "/products/inverters"
        ? "Inverter"
        : path === "/products/batteries"
          ? "Battery"
          : undefined;

    return (
      <ProductsPage
        brand={brand}
        category={category}
        categorySlug={categorySlug}
        searchQuery={props.searchQuery}
        onAdd={props.onAdd}
        cart={props.cart}
        navigate={props.navigate}
      />
    );
  }

  if (path.startsWith("/products/")) {
    const slug = path.slice("/products/".length);
    return (
      <Suspense fallback={<LoadingPage />}>
        <ProductPage slug={slug} onAdd={props.onAdd} />
      </Suspense>
    );
  }

  if (path === "/about") {
    return (
      <Suspense fallback={<LoadingPage />}>
        <AboutPage navigate={props.navigate} />
      </Suspense>
    );
  }

  if (path === "/contact") {
    return (
      <Suspense fallback={<LoadingPage />}>
        <ContactPage />
      </Suspense>
    );
  }

  if (path === "/faq") {
    return (
      <Suspense fallback={<LoadingPage />}>
        <FaqPage navigate={props.navigate} />
      </Suspense>
    );
  }

  if (path === "/shipping") {
    return (
      <Suspense fallback={<LoadingPage />}>
        <ShippingPage navigate={props.navigate} />
      </Suspense>
    );
  }

  if (path === "/payment") {
    return (
      <Suspense fallback={<LoadingPage />}>
        <PaymentPage navigate={props.navigate} />
      </Suspense>
    );
  }

  if (path.startsWith("/admin")) {
    return (
      <Suspense fallback={<LoadingPage />}>
        <AdminRoute
          path={path}
          adminAuthenticated={props.adminAuthenticated}
          adminAuthLoading={props.adminAuthLoading}
          navigate={props.navigate}
          onAdminLogin={props.onAdminLogin}
          onAdminLogout={props.onAdminLogout}
        />
      </Suspense>
    );
  }

  if (path === "/order") {
    return (
      <Suspense fallback={<LoadingPage />}>
        <OrderPage
          cart={props.cart}
          cartId={props.cartId}
          navigate={props.navigate}
          onRemove={props.onRemove}
          onQuantityChange={props.onQuantityChange}
          onClearCart={props.onClearCart}
          onOrderPlaced={props.onOrderPlaced}
          cartBusy={props.cartBusy}
          cartMessage={props.cartMessage}
        />
      </Suspense>
    );
  }

  return <RedirectHome navigate={props.navigate} />;
}

export default function NextAppRoutes(props: AppRoutesProps) {
  return <AppRouteContent {...props} />;
}
