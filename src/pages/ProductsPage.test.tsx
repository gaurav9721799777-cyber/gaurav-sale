import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { vi } from "vitest";
import ProductsPage from "./ProductsPage";

vi.mock("../services/ProductService", () => ({
  addCatalogNamesToProducts: vi.fn((products: unknown[]) => products),
  allProducts: vi.fn(async () => [
    {
      id: "microtek-inverter",
      name: "Microtek inverter",
      slug: "microtek-inverter",
      description: "",
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
      description: "",
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
    {
      id: "luminous-inverter",
      name: "Luminous inverter",
      slug: "luminous-inverter",
      description: "",
      price: 10000,
      discountPrice: 0,
      stock: 5,
      sku: "LI-1",
      imageUrl: "",
      brandId: "luminous",
      categoryId: "inverter",
      brand: "luminous",
      category: "Inverter",
      brandName: "Luminous",
      categoryName: "Inverter",
      active: true,
    },
    {
      id: "luminous-battery",
      name: "Luminous battery",
      slug: "luminous-battery",
      description: "",
      price: 12000,
      discountPrice: 0,
      stock: 5,
      sku: "LB-1",
      imageUrl: "",
      brandId: "luminous",
      categoryId: "battery",
      brand: "luminous",
      category: "Battery",
      brandName: "Luminous",
      categoryName: "Battery",
      active: true,
    },
  ]),
  productIsInActiveCatalog: vi.fn(() => true),
  resolveProductImageUrl: vi.fn((url: string | undefined) => url),
}));

vi.mock("../services/CategoryServiceService", () => ({
  getCategories: vi.fn(async () => [
    { id: "inverter", name: "Inverter", slug: "inverter", active: true },
    { id: "battery", name: "Battery", slug: "battery", active: true },
  ]),
  getCategoryBySlug: vi.fn(),
}));

vi.mock("../services/BrandService", () => ({
  brandKey: (brand: { slug: string }) => brand.slug,
  getBrands: vi.fn(async () => [
    { id: "microtek", name: "Microtek", slug: "microtek", active: true },
    { id: "luminous", name: "Luminous", slug: "luminous", active: true },
  ]),
}));

test("filters the catalog by inverter and battery category counts", async () => {
  const onAdd = vi.fn();
  render(
    <MantineProvider>
      <ProductsPage
        brand="microtek"
        category="Battery"
        onAdd={onAdd}
        navigate={vi.fn()}
      />
    </MantineProvider>,
  );

  expect(
    await screen.findByRole("heading", { name: /browse battery products/i }),
  ).toBeInTheDocument();
  expect(
    await screen.findByRole("heading", { name: "Microtek battery" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /all products\s*2/i }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /inverter\s*1/i }),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /battery\s*1/i })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(
    screen.getByRole("checkbox", { name: /all brands\s*2/i }),
  ).not.toBeChecked();
  expect(
    screen.getAllByRole("button", { name: /add to bag/i }),
  ).toHaveLength(1);

  fireEvent.click(screen.getByRole("checkbox", { name: /luminous\s*1/i }));
  expect(
    screen.getByRole("checkbox", { name: /all brands\s*2/i }),
  ).toBeChecked();
  expect(screen.getAllByRole("button", { name: /add to bag/i })).toHaveLength(
    2,
  );
  fireEvent.click(screen.getByRole("checkbox", { name: /luminous\s*1/i }));
  expect(
    screen.getByRole("checkbox", { name: /microtek\s*1/i }),
  ).toBeChecked();
  expect(
    screen.getByRole("checkbox", { name: /luminous\s*1/i }),
  ).not.toBeChecked();
  expect(screen.getAllByRole("button", { name: /add to bag/i })).toHaveLength(
    1,
  );
  expect(
    screen.getByRole("button", { name: /inverter\s*1/i }),
  ).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /inverter\s*1/i }));
  expect(
    screen.getByRole("heading", { name: /browse inverter products/i }),
  ).toBeInTheDocument();
  expect(screen.getAllByRole("button", { name: /add to bag/i })).toHaveLength(
    1,
  );

  fireEvent.click(screen.getByRole("checkbox", { name: /all brands\s*2/i }));
  expect(screen.getAllByRole("button", { name: /add to bag/i })).toHaveLength(
    2,
  );
  fireEvent.click(screen.getByRole("button", { name: /battery\s*2/i }));
  fireEvent.click(screen.getAllByRole("button", { name: /add to bag/i })[0]);
  await screen.findByRole("button", { name: /added/i });
  expect(onAdd).toHaveBeenCalledWith("microtek-battery", 1);
});
