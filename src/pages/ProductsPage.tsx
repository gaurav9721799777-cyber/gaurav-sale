import React, { useEffect, useState } from "react";
import { Button } from "@mantine/core";
import { IconArrowRight, IconBolt } from "@tabler/icons-react";
import ProductCard from "../components/ProductCard";
import PageHeading from "../components/PageHeading";
import { products } from "../data/products";
import type { ProductBrand, ProductCategory } from "../data/products";
import type { RoutePath } from "../Route/AppRoutes";
import inverterBanner from "../assets/inverter-hero-backup.svg";

const availableBrands = Array.from(new Set(products.map((product) => product.brand)));

type ProductsPageProps = {
  brand: ProductBrand | "all";
  category?: ProductCategory;
  onAdd: (productId: string) => void;
  navigate: (path: RoutePath) => void;
};

export default function ProductsPage({ brand, category, onAdd, navigate }: ProductsPageProps) {
  const [selectedBrands, setSelectedBrands] = useState<ProductBrand[]>(
    brand === "all" ? availableBrands : [brand],
  );
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(category ?? null);

  useEffect(() => {
    setSelectedBrands(brand === "all" ? availableBrands : [brand]);
    setSelectedCategory(category ?? null);
  }, [brand, category]);

  const allBrandsSelected = availableBrands.every((availableBrand) =>
    selectedBrands.includes(availableBrand),
  );
  const shownProducts = products.filter((product) =>
    selectedBrands.includes(product.brand) &&
    (!selectedCategory || product.category === selectedCategory),
  );
  const inverterCount = products.filter((product) =>
    selectedBrands.includes(product.brand) && product.category === "Inverter",
  ).length;
  const batteryCount = products.filter((product) =>
    selectedBrands.includes(product.brand) && product.category === "Battery",
  ).length;
  const allCount = inverterCount + batteryCount;
  const brandName = selectedBrands.length === availableBrands.length
    ? "Microtek and Luminous"
    : selectedBrands.map((selectedBrand) =>
        selectedBrand === "microtek" ? "Microtek" : "Luminous",
      ).join(" and ") || "no selected brands";
  const titleBrand = selectedCategory
    ? selectedCategory === "Inverter" ? "Browse home inverters." : "Browse home batteries."
    : selectedBrands.length === availableBrands.length
      ? "Explore home backup power."
      : `${brandName} inverter & battery range.`;
  const allCategoryFilters: { label: string; category: ProductCategory | null; count: number }[] = [
    { label: "All products", category: null, count: allCount },
    { label: "Inverters", category: "Inverter", count: inverterCount },
    { label: "Batteries", category: "Battery", count: batteryCount },
  ];
  const filters = selectedCategory
    ? allCategoryFilters.filter((filter) => filter.category === selectedCategory)
    : allCategoryFilters;
  return (
    <section className="gs-page gs-container">
      <PageHeading
        eyebrow={selectedCategory ? `${selectedCategory} CATEGORY` : "BRANDS & PRODUCTS"}
        title={<>{titleBrand.split(" ").slice(0, -2).join(" ")} <em>{titleBrand.split(" ").slice(-2).join(" ")}</em></>}
        description={selectedCategory
          ? `Browse ${selectedCategory === "Inverter" ? "home inverters" : "backup batteries"} from ${brandName}. Add your selection to the bag and our team will confirm availability and pricing.`
          : `Browse ${brandName} inverters and backup batteries. Exact model availability, compatible batteries, and pricing are confirmed with our team.`}
        image={inverterBanner}
      />
      <div className="gs-catalog-layout">
        <aside className="gs-catalog-filters" aria-label="Filter products">
          <strong>Categories</strong>
          {filters.map((filter) => (
            <button
              key={filter.label}
              className={selectedCategory === filter.category ? "is-active" : ""}
              aria-pressed={selectedCategory === filter.category}
              onClick={() => setSelectedCategory(filter.category)}
            >
              <span>{filter.label}</span><span>{filter.count}</span>
            </button>
          ))}
          <strong className="gs-catalog-filter-heading">Brands</strong>
          <label className="gs-brand-filter">
            <input
              type="checkbox"
              checked={allBrandsSelected}
              onChange={(event) =>
                setSelectedBrands(event.currentTarget.checked ? availableBrands : [])
              }
            />
            <span>All brands</span>
            <span>{products.filter((product) =>
              !selectedCategory || product.category === selectedCategory,
            ).length}</span>
          </label>
          {availableBrands.map((filterBrand) => {
            const label = filterBrand === "microtek" ? "Microtek" : "Luminous";
            const count = products.filter((product) =>
              product.brand === filterBrand &&
              (!selectedCategory || product.category === selectedCategory),
            ).length;
            return (
              <label className="gs-brand-filter" key={filterBrand}>
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(filterBrand)}
                  onChange={(event) => {
                    const checked = event.currentTarget.checked;
                    setSelectedBrands((current) =>
                      checked
                        ? [...current, filterBrand]
                        : current.filter((selectedBrand) => selectedBrand !== filterBrand),
                    );
                  }}
                />
                <span>{label}</span>
                <span>{count}</span>
              </label>
            );
          })}
        </aside>
        <div className="gs-catalog-results">
          <div className="gs-catalog-toolbar">
            <span>{shownProducts.length} {shownProducts.length === 1 ? "product" : "products"}</span>
            <span>
              <IconBolt size={16} />
              {selectedCategory === "Inverter"
                ? "Home inverters"
                : selectedCategory === "Battery"
                  ? "Backup batteries"
                  : "Inverters & batteries"}
            </span>
          </div>
          <div className="gs-product-grid">
            {shownProducts.length > 0
              ? shownProducts.map((product) => (
                    <ProductCard key={product.id} product={product} onAdd={onAdd} />
                  ))
              : <p className="gs-catalog-empty">Select at least one brand to see matching products.</p>}
          </div>
        </div>
      </div>
      <div className="gs-help-banner">
        <div><strong>Not sure which inverter is right for you?</strong><p>Share your needs and we’ll help you compare your options.</p></div>
        <Button className="gs-button" onClick={() => navigate("/contact")}>Get product help <IconArrowRight size={16} /></Button>
      </div>
    </section>
  );
}
