import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import type { NextRouter, Url } from "next/dist/shared/lib/router/router";
import { RouterContext } from "next/dist/shared/lib/router-context.shared-runtime";
import { vi } from "vitest";
import App from "./App";

vi.mock("./services/ProductService", () => ({
  allProducts: vi.fn(async () => [
    {
      id: "microtek-inverter",
      name: "Microtek inverter",
      slug: "microtek-inverter",
      description: "Reliable backup power for home.",
      price: 10000,
      discountPrice: 0,
      stock: 5,
      sku: "MI-1",
      imageUrl: "",
      brandId: "microtek",
      categoryId: "inverter",
      brand: "microtek",
      category: "Inverter",
      brandName: "Microtek",
      categoryName: "Inverter",
      active: true,
    },
    {
      id: "microtek-battery",
      name: "Microtek battery",
      slug: "microtek-battery",
      description: "A dependable home backup battery.",
      price: 12000,
      discountPrice: 0,
      stock: 5,
      sku: "MB-1",
      imageUrl: "",
      brandId: "microtek",
      categoryId: "battery",
      brand: "microtek",
      category: "Battery",
      brandName: "Microtek",
      categoryName: "Battery",
      active: true,
    },
  ]),
  productIsInActiveCatalog: vi.fn(() => true),
  resolveProductImageUrl: vi.fn((url: string | undefined) => url),
}));

vi.mock("./services/CategoryServiceService", () => {
  const categories = [
    { id: "inverter", name: "Inverter", slug: "inverter", active: true },
    { id: "battery", name: "Battery", slug: "battery", active: true },
  ];
  return {
    getCategories: vi.fn(async () => categories),
    getCategoryBySlug: vi.fn(async (slug: string) => {
      const category = categories.find((item) => item.slug === slug);
      if (!category) throw new Error("Category not found.");
      return category;
    }),
  };
});

vi.mock("./services/BrandService", () => ({
  brandKey: (brand: { slug: string }) => brand.slug,
  getBrands: vi.fn(async () => [
    { id: "microtek", name: "Microtek", slug: "microtek", active: true },
  ]),
}));

vi.mock("./services/CartService", () => ({
  addCartItem: vi.fn(async () => undefined),
  clearCart: vi.fn(async () => undefined),
  getCart: vi.fn(async () => []),
  normalizeCartLines: vi.fn(() => []),
  removeCartItem: vi.fn(async () => undefined),
  updateCartItem: vi.fn(async () => undefined),
}));

function TestRouterProvider({ children }: { children: React.ReactNode }) {
  const [asPath, setAsPath] = React.useState("/");
  const router = React.useMemo<NextRouter>(() => {
    const navigate = async (url: Url) => {
      const nextPath =
        typeof url === "string"
          ? url
          : `${url.pathname ?? "/"}${url.search ?? ""}${url.hash ?? ""}`;
      window.history.replaceState({}, "", nextPath);
      setAsPath(nextPath);
      return true;
    };
    return {
      basePath: "",
      pathname: asPath.split("?")[0],
      route: asPath.split("?")[0],
      query: {},
      asPath,
      isLocaleDomain: false,
      isFallback: false,
      isReady: true,
      isPreview: false,
      push: navigate,
      replace: navigate,
      reload: () => {},
      back: () => {},
      forward: () => {},
      prefetch: async () => {},
      beforePopState: () => {},
      events: { on: () => {}, off: () => {}, emit: () => {} },
    };
  }, [asPath]);

  return (
    <RouterContext.Provider value={router}>
      {children}
    </RouterContext.Provider>
  );
}

const renderApp = () =>
  render(
    <TestRouterProvider>
      <MantineProvider>
        <App />
      </MantineProvider>
    </TestRouterProvider>,
  );

beforeEach(() => {
  window.history.replaceState({}, "", "/");
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      json: async () => ({ authenticated: false }),
    })),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test("renders the responsive storefront header and category-led homepage", async () => {
  renderApp();

  expect(
    screen.getByRole("button", { name: /gaurav sales home/i }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("searchbox", { name: /search products/i }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /log in to the admin dashboard/i }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /place order, 0 items in bag/i }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: /meet amrit rai/i }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: /start with what you need/i }),
  ).toBeInTheDocument();

  const bannerControls = screen.getAllByRole("button", {
    name: /show banner/i,
  });
  expect(bannerControls).toHaveLength(3);
  fireEvent.click(bannerControls[1]);
  expect(
    screen.getByRole("button", { name: /explore v-guard products/i }),
  ).toBeInTheDocument();

  fireEvent.click(
    await screen.findByRole("button", {
      name: /battery.*explore category/i,
    }),
  );
  expect(
    await screen.findByRole("heading", {
      name: /browse battery products/i,
    }),
  ).toBeInTheDocument();
}, 20000);

test("searches the product catalog from the global header", async () => {
  renderApp();

  fireEvent.change(screen.getByRole("searchbox", { name: /search products/i }), {
    target: { value: "Microtek battery" },
  });
  fireEvent.click(screen.getByRole("button", { name: /^search$/i }));

  expect(
    await screen.findByRole("heading", {
      name: /search results for "microtek battery"/i,
    }),
  ).toBeInTheDocument();
  expect(
    await screen.findByRole("heading", { name: "Microtek battery" }),
  ).toBeInTheDocument();
  await waitFor(() => {
    expect(
      screen.queryByRole("heading", { name: "Microtek inverter" }),
    ).not.toBeInTheDocument();
  });
});
