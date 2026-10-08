import React, { lazy, Suspense } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

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

export type RoutePath =
  | "/"
  | "/login"
  | "/products"
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
};

export const useAppNavigation = () => {
  const location = useLocation();
  const routerNavigate = useNavigate();

  const navigate = (path: RoutePath) => {
    routerNavigate(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return { path: location.pathname, navigate };
};

const LoadingPage = () => {
  return <AppLoader label="Loading page" variant="section" />;
};

const AppRouteContent = ({
  path,
  cart,
  cartId,
  onAdd,
  onRemove,
  onQuantityChange,
  onClearCart,
  onOrderPlaced,
  cartBusy,
  cartMessage,
  navigate,
}: AppRoutesProps) => {
  return (
    <Suspense fallback={<LoadingPage />}>
      <Routes location={path}>
        {/* HOME */}
        <Route path="/" element={<HomePage navigate={navigate} />} />

        {/* PRODUCTS */}
        <Route
          path="/products"
          element={
            <ProductsPage
              brand="all"
              onAdd={onAdd}
              cart={cart}
              navigate={navigate}
            />
          }
        />
        <Route path="/product" element={<Navigate to="/products" replace />} />
        <Route
          path="/products/microtek"
          element={
            <ProductsPage
              brand="microtek"
              onAdd={onAdd}
              cart={cart}
              navigate={navigate}
            />
          }
        />
        <Route
          path="/products/luminous"
          element={
            <ProductsPage
              brand="luminous"
              onAdd={onAdd}
              cart={cart}
              navigate={navigate}
            />
          }
        />
        <Route
          path="/products/inverters"
          element={
            <ProductsPage
              brand="all"
              category="Inverter"
              onAdd={onAdd}
              cart={cart}
              navigate={navigate}
            />
          }
        />

        <Route
          path="/products/batteries"
          element={
            <ProductsPage
              brand="all"
              category="Battery"
              onAdd={onAdd}
              cart={cart}
              navigate={navigate}
            />
          }
        />

        <Route
          path="/products/category/:categorySlug"
          element={
            <CategoryProductsRoute
              onAdd={onAdd}
              cart={cart}
              navigate={navigate}
            />
          }
        />

        <Route path="/products/:slug" element={<ProductPage onAdd={onAdd} />} />

        {/* INFORMATION PAGES */}

        <Route path="/about" element={<AboutPage navigate={navigate} />} />

        <Route path="/contact" element={<ContactPage />} />

        <Route path="/faq" element={<FaqPage navigate={navigate} />} />

        <Route
          path="/shipping"
          element={<ShippingPage navigate={navigate} />}
        />

        <Route path="/payment" element={<PaymentPage navigate={navigate} />} />

        {/* ORDER */}

        <Route
          path="/order"
          element={
            <OrderPage
              cart={cart}
              cartId={cartId}
              navigate={navigate}
              onRemove={onRemove}
              onQuantityChange={onQuantityChange}
              onClearCart={onClearCart}
              onOrderPlaced={onOrderPlaced}
              cartBusy={cartBusy}
              cartMessage={cartMessage}
            />
          }
        />

        {/* INVALID ROUTE */}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

const AppRoutes = (props: AppRoutesProps) => {
  return <AppRouteContent {...props} />;
};

const CategoryProductsRoute = ({
  onAdd,
  cart,
  navigate,
}: Pick<AppRoutesProps, "onAdd" | "cart" | "navigate">) => {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  return (
    <ProductsPage
      brand="all"
      categorySlug={categorySlug}
      onAdd={onAdd}
      cart={cart}
      navigate={navigate}
    />
  );
};

export default AppRoutes;
