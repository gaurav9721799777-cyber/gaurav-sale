import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@mantine/core";
import { IconArrowRight, IconBolt } from "@tabler/icons-react";

import ProductCard from "../components/ProductCard";
import PageHeading from "../components/PageHeading";
import AppLoader from "../components/AppLoader";

import {
  products as fallbackProducts,
  type Product as CatalogProduct,
  type ProductBrand,
  type ProductCategory,
} from "../data/products";

import type { RoutePath } from "../Route/AppRoutes";
import type { CartLine } from "../services/CartService";
import InfiniteScrollTrigger from "../components/InfiniteScrollTrigger";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";


import {
  allProducts,
  productIsInActiveCatalog,
  resolveProductImageUrl,
  type Product as ServiceProduct,
} from "../services/ProductService";
import { getCategories, getCategoryBySlug, type Category } from "../services/CategoryServiceService";
import { brandKey, getBrands, type Brand } from "../services/BrandService";
import { apiErrorMessage } from "../services/apiError";
import productPageHero from "../assets/product-page-hero.jpg";

type ProductsPageProps = {
  brand: ProductBrand | "all";
  category?: ProductCategory;
  categorySlug?: string;
  onAdd: (productId: string, quantity?: number) => Promise<void>;
  cart?: CartLine[];
  navigate: (path: RoutePath) => void;
};

const productMatchesCategory = (
  product: ServiceProduct,
  categoryName: string | null,
  categories: Category[],
) => {
  if (!categoryName) return true;
  const target = categories.find((item) => item.name.toLowerCase() === categoryName.toLowerCase());
  const productName = String(product.categoryName || product.category || "").toLowerCase();
  const categoryIdMatches = !!target && [product.categoryId, product.category]
    .some((value) => value !== undefined && value !== null && String(value) === String(target.id));
  return productName === categoryName.toLowerCase() ||
    (!!target && productName === target.slug.toLowerCase()) ||
    categoryIdMatches;
};

export default function ProductsPage({
  brand,
  category,
  categorySlug,
  onAdd,
  cart = [],
  navigate,
}: ProductsPageProps) {
  // ==========================================
  // PRODUCTS FROM API
  // ==========================================

  const [products, setProducts] = useState<ServiceProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  // ==========================================
  // FILTER STATE
  // ==========================================

  const [selectedBrands, setSelectedBrands] = useState<ProductBrand[]>([]);

  const [selectedCategory, setSelectedCategory] =
    useState<ProductCategory | null>(category ?? null);

  // ==========================================
  // GET PRODUCTS
  // ==========================================

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const [data, categoryData, brandData] = await Promise.all([
          allProducts(),
          getCategories(true).catch(() => []),
          getBrands(true).catch(() => []),
        ]);
        const activeBrands = brandData.filter((item) => item.active !== false);
        const activeCategories = categoryData.filter((item) => item.active !== false);
        setBrands(activeBrands);
        const productsWithApiBrands = data.filter((product) => product.active !== false && productIsInActiveCatalog(product, categoryData, brandData)).map((product) => {
          const normalizeBrand = (value: string | undefined) =>
            String(value || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
          const productBrandName = normalizeBrand(product.brandName);
          const productBrandSlug = normalizeBrand(product.brand);
          const apiBrand = activeBrands.find((item) => String(item.id) === String(product.brandId)) ||
            activeBrands.find((item) => [item.name, item.slug].some((value) => {
              const normalized = normalizeBrand(value);
              return normalized && (normalized === productBrandName || normalized === productBrandSlug);
            }));
          return apiBrand
            ? { ...product, brand: brandKey(apiBrand), brandName: apiBrand.name }
            : product;
        });
        setProducts(productsWithApiBrands);
        const resolvedCategories = activeCategories;
        if (categorySlug) {
          const selected = await getCategoryBySlug(categorySlug).catch(() =>
            resolvedCategories.find((item) => item.slug.toLowerCase() === categorySlug.toLowerCase()) ||
            resolvedCategories.find((item) => item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") === categorySlug.toLowerCase()),
          );
          if (!selected) throw new Error("Category not found.");
          setCategories(resolvedCategories.some((item) => String(item.id) === String(selected.id))
            ? resolvedCategories
            : [...resolvedCategories, selected]);
          setSelectedCategory(selected.name);
        } else {
          setCategories(resolvedCategories);
          setSelectedCategory(category ?? null);
        }
      } catch (error: unknown) {
        console.error("Error fetching products:", error);

        setError(apiErrorMessage(error, "Unable to load products."));
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category, categorySlug]);

  // ==========================================
  // AVAILABLE BRANDS
  // ==========================================

  const availableBrands = useMemo<ProductBrand[]>(() => {
    // Keep the brand filter based on the whole catalog. If it were derived from
    // the active category, switching categories could leave only a subset of
    // brands selected and make the other category counts incorrectly show 0.
    const matchingProductBrands = new Set(products.map((product) => product.brand));
    if (brands.length) {
      const listedBrands = brands.map(brandKey).filter((brandKeyValue) => matchingProductBrands.has(brandKeyValue));
      return [...listedBrands, ...Array.from(matchingProductBrands).filter((brandKeyValue) => !listedBrands.includes(brandKeyValue))];
    }
    return Array.from(matchingProductBrands);
  }, [products, brands]);

  // ==========================================
  // INITIAL FILTER
  // ==========================================

  useEffect(() => {
    if (brand === "all") {
      setSelectedBrands(availableBrands);
    } else {
      const routeBrand = brands.find((item) =>
        item.slug === brand || brandKey(item) === brand ||
        (brand === "microtek" && /micro|tech/i.test(`${item.name} ${item.slug}`)) ||
        (brand === "luminous" && /lumin/i.test(`${item.name} ${item.slug}`)),
      );
      setSelectedBrands([routeBrand ? brandKey(routeBrand) : brand]);
    }

  }, [brand, availableBrands, brands]);

  useEffect(() => {
    if (!categorySlug) setSelectedCategory(category ?? null);
  }, [category, categorySlug]);

  // ==========================================
  // ALL BRANDS SELECTED
  // ==========================================

  const allBrandsSelected =
    availableBrands.length > 0 &&
    availableBrands.every((availableBrand) =>
      selectedBrands.includes(availableBrand),
    );

  // ==========================================
  // FILTER PRODUCTS
  // ==========================================

  const shownProducts = products.filter((product) => {
    const brandMatch = selectedBrands.includes(product.brand);

    const categoryMatch = productMatchesCategory(product, selectedCategory, categories);

    return brandMatch && categoryMatch;
  });
  const { visibleCount, hasMore, loadMore } = useInfiniteScroll(shownProducts.length, 12, `${selectedCategory ?? "all"}|${selectedBrands.join(",")}`);
  const visibleProducts = shownProducts.slice(0, visibleCount);

  const toCatalogProduct = (product: ServiceProduct): CatalogProduct => {
    const fallbackImage = fallbackProducts.find(
      (item) => item.brand === product.brand && item.category === product.category,
    )?.image;
    const price = product.discountPrice > 0 && product.discountPrice < product.price
      ? `₹${product.discountPrice.toLocaleString("en-IN")} (was ₹${product.price.toLocaleString("en-IN")})`
      : `₹${product.price.toLocaleString("en-IN")}`;

    return {
      id: product.id,
      name: product.name,
      brand: product.brand,
      category: product.categoryName || product.category,
      price,
      description: product.description,
      image: resolveProductImageUrl(product.image || product.imageUrl) || fallbackImage || "",
      badge: product.brandName || product.brand,
      capacity: "",
    };
  };

  // ==========================================
  // PRODUCT COUNTS
  // ==========================================

  const categoryCount = (name: string | null) => products.filter((product) =>
    selectedBrands.includes(product.brand) &&
    productMatchesCategory(product, name, categories),
  ).length;
  const allCount = categoryCount(null);

  // ==========================================
  // BRAND NAME
  // ==========================================

  const brandName =
    selectedBrands.length === availableBrands.length &&
    availableBrands.length > 0
      ? selectedBrands
          .map((selectedBrand) => brands.find((item) => brandKey(item) === selectedBrand)?.name || selectedBrand)
          .join(" and ")
      : selectedBrands
          .map((selectedBrand) => brands.find((item) => brandKey(item) === selectedBrand)?.name || selectedBrand)
          .join(" and ") || "no selected brands";

  // ==========================================
  // TITLE
  // ==========================================

  const titleBrand = selectedCategory
    ? `Browse ${selectedCategory.toLowerCase()} products.`
    : selectedBrands.length === availableBrands.length
      ? "Explore home backup power."
      : `${brandName} inverter & battery range.`;

  // ==========================================
  // CATEGORY FILTERS
  // ==========================================

  const allCategoryFilters: {
    label: string;
    category: ProductCategory | null;
    count: number;
  }[] = [
    {
      label: "All products",
      category: null,
      count: allCount,
    },

    ...categories.map((item) => ({
      label: item.name,
      category: item.name,
      count: categoryCount(item.name),
    })),
  ];

  const filters = categorySlug && selectedCategory
    ? allCategoryFilters.filter((filter) => filter.category === selectedCategory)
    : allCategoryFilters;

  const pageHeading = (
    <PageHeading
      eyebrow={selectedCategory ? `${selectedCategory} CATEGORY` : "BRANDS & PRODUCTS"}
      title={
        <>
          {titleBrand.split(" ").slice(0, -2).join(" ")}{" "}
          <em>{titleBrand.split(" ").slice(-2).join(" ")}</em>
        </>
      }
      description={
        selectedCategory
          ? `Browse ${selectedCategory.toLowerCase()} products from ${brandName}. Add your selection to the bag and our team will confirm availability and pricing.`
          : `Browse ${brandName} inverters and backup batteries. Exact model availability, compatible batteries, and pricing are confirmed with our team.`
      }
      fullImage={productPageHero}
      imageAlt="Premium inverter and battery products from trusted brands"
    />
  );

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <section className="gs-page gs-container">
        {pageHeading}
        <AppLoader label="Loading products" variant="section" />
      </section>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <section className="gs-page gs-container">
        {pageHeading}
        <div className="gs-home-empty-state gs-catalog-unavailable">
          <span className="gs-home-empty-icon"><IconBolt size={25} /></span>
          <strong>{categorySlug ? "Service Not Available" : "Product Not Available"}</strong>
          <p>{error}</p>
        </div>
      </section>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <section className="gs-page gs-container">
      {pageHeading}

      {/* ======================================
          CATALOG
      ======================================= */}

      <div className="gs-catalog-layout">
        {/* FILTERS */}

        <aside className="gs-catalog-filters" aria-label="Filter products">
          <strong>Categories</strong>

          {filters.map((filter) => (
            <button
              key={filter.label}
              className={
                selectedCategory === filter.category ? "is-active" : ""
              }
              aria-pressed={selectedCategory === filter.category}
              onClick={() => setSelectedCategory(filter.category)}
            >
              <span>{filter.label}</span>

              <span>{filter.count}</span>
            </button>
          ))}

          <strong className="gs-catalog-filter-heading">Brands</strong>

          {/* ALL BRANDS */}

          <label className="gs-brand-filter">
            <input
              type="checkbox"
              checked={allBrandsSelected}
              onChange={(event) =>
                setSelectedBrands(
                  event.currentTarget.checked ? availableBrands : [],
                )
              }
            />

            <span>All brands</span>

            <span>
              {
                products.filter(
                  (product) => productMatchesCategory(product, selectedCategory, categories),
                ).length
              }
            </span>
          </label>

          {/* INDIVIDUAL BRANDS */}

          {availableBrands.map((filterBrand) => {
            const label = brands.find((item) => brandKey(item) === filterBrand)?.name ||
              products.find((product) => product.brand === filterBrand)?.brandName || filterBrand;

            const count = products.filter(
              (product) =>
              product.brand === filterBrand &&
                productMatchesCategory(product, selectedCategory, categories),
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
                        : current.filter(
                            (selectedBrand) => selectedBrand !== filterBrand,
                          ),
                    );
                  }}
                />

                <span>{label}</span>

                <span>{count}</span>
              </label>
            );
          })}
        </aside>

        {/* PRODUCTS */}

        <div className="gs-catalog-results">
          <div className="gs-catalog-toolbar">
            <span>
              {shownProducts.length}{" "}
              {shownProducts.length === 1 ? "product" : "products"}
            </span>

            <span>
              <IconBolt size={16} />

              {selectedCategory || "Inverters & batteries"}
            </span>
          </div>

          <div className="gs-product-grid">
            {shownProducts.length > 0 ? (
              visibleProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={toCatalogProduct(product)}
                  onAdd={onAdd}
                  onOpen={(slug) => navigate(`/products/${encodeURIComponent(slug)}`)}
                  slug={product.slug}
                  originalPrice={product.price}
                  discountPrice={product.discountPrice}
                  stock={product.stock}
                  inCartQuantity={cart.find((line) => line.productId === product.id)?.quantity || 0}
                />
              ))
            ) : (
              <div className="gs-home-empty-state gs-catalog-unavailable">
                <span className="gs-home-empty-icon"><IconBolt size={25} /></span>
                <strong>Product Not Available</strong>
                <p>No products match this selection right now. Please check back soon.</p>
              </div>
            )}
          </div>
          <InfiniteScrollTrigger hasMore={hasMore} onLoadMore={loadMore} />
        </div>
      </div>

      {/* HELP */}

      <div className="gs-help-banner">
        <div>
          <strong>Not sure which inverter is right for you?</strong>

          <p>Share your needs and we’ll help you compare your options.</p>
        </div>

        <Button className="gs-button" onClick={() => navigate("/contact")}>
          Get product help
          <IconArrowRight size={16} />
        </Button>
      </div>
    </section>
  );
}
