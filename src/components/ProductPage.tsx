import React, { useEffect, useState } from "react";
import { IconArrowRight, IconShoppingBag } from "@tabler/icons-react";
import {
  productsApi,
  resolveProductImageUrl,
} from "../services/ProductService";
import type { Product } from "../services/ProductService";
import PageHeading from "./PageHeading";
import AppLoader from "./AppLoader";
import ServerIssueState from "./ServerIssueState";
import {
  apiErrorMessage,
  isServerUnavailableError,
} from "../services/apiError";
import productPageHero from "../assets/product-page-hero.jpg";
import { animateProductToCart } from "../utils/cartAnimation";

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

function ProductPage({
  slug: providedSlug,
  onAdd,
}: {
  slug?: string;
  onAdd: (productId: string) => Promise<void> | void;
}) {
  const slug = providedSlug || "";
  const [product, setProduct] = useState<Product | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [serverIssue, setServerIssue] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartFeedback, setCartFeedback] = useState("");
  const [cartFeedbackIsError, setCartFeedbackIsError] = useState(false);

  const addProductToCart = async (source: HTMLButtonElement) => {
    if (!product) return;
    setAddingToCart(true);
    setCartFeedback("");
    setCartFeedbackIsError(false);
    try {
      await onAdd(product.id);
      animateProductToCart(source);
      setCartFeedback("Added to your bag.");
    } catch (addError) {
      setCartFeedback(
        apiErrorMessage(addError, "Could not add this item. Please try again."),
      );
      setCartFeedbackIsError(true);
    } finally {
      setAddingToCart(false);
    }
  };

  useEffect(() => {
    let decodedSlug: string;
    try {
      decodedSlug = decodeURIComponent(slug);
    } catch {
      setError("This product link is invalid.");
      setLoading(false);
      return;
    }

    let current = true;
    setProduct(null);
    setImageFailed(false);
    setCartFeedback("");
    setLoading(true);
    setError("");
    setServerIssue(false);
    productsApi
      .bySlug(decodedSlug)
      .then((item) => {
        if (current) setProduct(item);
      })
      .catch((err: unknown) => {
        if (current) {
          setError(
            apiErrorMessage(
              err,
              "Product Not Available. Please check back soon.",
            ),
          );
          setServerIssue(isServerUnavailableError(err));
        }
      })
      .finally(() => {
        if (current) setLoading(false);
      });

    return () => {
      current = false;
    };
  }, [slug, retryCount]);

  return (
    <main className="gs-page gs-container storefront">
      <PageHeading
        eyebrow="PRODUCT DETAILS"
        title={
          product ? (
            <>{product.name}</>
          ) : (
            <>
              Product <em>details.</em>
            </>
          )
        }
        description={
          product?.description ||
          "Explore dependable backup power for your home, with the details you need to choose confidently."
        }
        fullImage={productPageHero}
        imageAlt="Premium inverter and battery products from trusted brands"
      />

      <div className="storefront-detail-wrap">
        <a className="storefront-back-link" href="/product">
          ← Back to products
        </a>
        {loading && <AppLoader label="Loading product" variant="inline" />}
        {!loading && error && (
          serverIssue ? (
            <ServerIssueState
              message={error}
              onRetry={() => setRetryCount((count) => count + 1)}
              compact
            />
          ) : (
            <div className="gs-home-empty-state gs-product-unavailable">
              <span className="gs-home-empty-icon">
                <IconShoppingBag size={24} />
              </span>
              <strong>Product Not Available</strong>
              <p>{error}</p>
            </div>
          )
        )}
        {!loading && !error && product && (
          <article className="storefront-detail">
            <div className="storefront-detail-image">
              {resolveProductImageUrl(
                product.mainImageUrl || product.imageUrl || product.image,
              ) && !imageFailed ? (
                <img
                  src={resolveProductImageUrl(
                    product.mainImageUrl || product.imageUrl || product.image,
                  )}
                  alt={product.name}
                  onError={() => setImageFailed(true)}
                />
              ) : (
                <span>{product.name.slice(0, 1).toUpperCase()}</span>
              )}
            </div>
            <div className="storefront-detail-copy">
              <span className="storefront-eyebrow">
                {product.brandName} · {product.categoryName}
              </span>
              <h1>{product.name}</h1>
              <div className="storefront-detail-price">
                {product.discountPrice > 0 &&
                product.discountPrice < product.price ? (
                  <>
                    <strong>{money(product.discountPrice)}</strong>
                    <del>{money(product.price)}</del>
                  </>
                ) : (
                  money(product.price)
                )}
              </div>
              <p>
                {product.description || "A great addition to your collection."}
              </p>
              <div className="storefront-stock">
                <span
                  className={
                    product.stock > 0
                      ? "storefront-stock-dot"
                      : "storefront-stock-dot is-out"
                  }
                />
                {product.stock > 0 ? "In stock" : "Currently unavailable"}
              </div>
              <div className="storefront-detail-actions">
                <button
                  className="gs-button storefront-add-button"
                  onClick={(event) => {
                    void addProductToCart(event.currentTarget);
                  }}
                  disabled={product.stock <= 0 || addingToCart}
                  aria-busy={addingToCart}
                >
                  <IconShoppingBag size={16} />{" "}
                  <span>
                    {addingToCart
                      ? "Adding…"
                      : product.stock > 0
                        ? "Add to bag"
                        : "Out of stock"}
                  </span>{" "}
                  <IconArrowRight size={15} />
                </button>
                <a className="storefront-cta" href="/product">
                  Continue browsing <span aria-hidden="true">→</span>
                </a>
              </div>
              {cartFeedback && (
                <p
                  className={
                    cartFeedbackIsError
                      ? "gs-cart-inline-error"
                      : "storefront-cart-success"
                  }
                  role={cartFeedbackIsError ? "alert" : "status"}
                >
                  {cartFeedback}
                </p>
              )}
              <small className="storefront-sku">SKU {product.sku}</small>
            </div>
          </article>
        )}
      </div>
    </main>
  );
}

export default ProductPage;
