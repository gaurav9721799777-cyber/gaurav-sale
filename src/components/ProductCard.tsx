import React, { useEffect, useState } from "react";
import { IconArrowRight, IconBolt, IconShoppingBag, IconLoader2, IconPlus, IconMinus } from "@tabler/icons-react";
import type { Product } from "../data/products";

type ProductCardProps = {
  product: Product;
  onAdd: (productId: string, quantity?: number) => Promise<void>;
  onOpen: (slug: string) => void;
  slug: string;
  originalPrice?: number;
  discountPrice?: number;
  stock: number;
  inCartQuantity: number;
};

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export default function ProductCard({
  product,
  onAdd,
  onOpen,
  slug,
  originalPrice,
  discountPrice,
  stock,
  inCartQuantity,
}: ProductCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [added, setAdded] = useState(false);
  const category = product.category || "Product";
  const brand = product.brand || product.badge || "Product";
  const hasDiscount =
    discountPrice !== undefined &&
    originalPrice !== undefined &&
    discountPrice > 0 &&
    discountPrice < originalPrice;
  const discountPercent = hasDiscount && originalPrice
    ? Math.round(((originalPrice - discountPrice) / originalPrice) * 100)
    : 0;
  const availableToAdd = Math.max(0, stock - inCartQuantity);
  useEffect(() => {
    setQuantity((current) => Math.min(current, Math.max(1, availableToAdd)));
  }, [availableToAdd]);
  const addErrorText = (error: unknown) => {
    if (error && typeof error === "object") {
      const networkError = error as { code?: string; message?: string };
      if (networkError.code === "ERR_NETWORK" || networkError.message === "Network Error") {
        return "Can't reach the cart service. Check that the backend is running on port 8080.";
      }
      const responseData = (error as { response?: { data?: { message?: unknown; error?: unknown } } }).response?.data;
      const message = responseData?.message || responseData?.error;
      if (typeof message === "string") return message;
    }
    return error instanceof Error ? error.message : "Could not add this item. Please try again.";
  };

  const addSelectedQuantity = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setAddError("");
    setAdded(false);
    setAdding(true);
    try {
      await onAdd(product.id, quantity);
      setAdded(true);
    } catch (error) {
      setAddError(addErrorText(error));
    } finally {
      setAdding(false);
    }
  };

  return (
    <article
      className="gs-product-card"
      role="link"
      tabIndex={0}
      aria-label={`View ${product.name} details`}
      onClick={() => onOpen(slug)}
      onKeyDown={(event) => {
        if (
          event.target === event.currentTarget &&
          (event.key === "Enter" || event.key === " ")
        ) {
          event.preventDefault();
          onOpen(slug);
        }
      }}
    >
      <div className="gs-product-image">
        {product.image && !imageFailed ? (
          <img
            src={product.image}
            alt={`${brand} ${category.toLowerCase()}`}
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className="gs-product-image-fallback" aria-hidden="true">
            {product.name.slice(0, 1).toUpperCase()}
          </span>
        )}
        <span className="gs-product-badge">{product.badge}</span>
        {hasDiscount && <span className="gs-product-discount">{discountPercent}% off</span>}
      </div>
      <div className="gs-product-info">
        <div className="gs-product-meta"><span className="gs-product-category">{category}</span><span className="gs-product-brand-name">{product.badge}</span></div>
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        {product.capacity && (
          <div className="gs-product-capacity">
            <IconBolt size={16} aria-hidden="true" />
            {product.capacity}
          </div>
        )}
        <div className="gs-product-price">
          <strong>{hasDiscount ? money(discountPrice) : product.price}</strong>
          {hasDiscount && <><del>{money(originalPrice)}</del><span className="gs-product-saving">Save {discountPercent}%</span></>}
        </div>
        <div className="gs-card-stock-row">
          <span className={availableToAdd > 0 ? "gs-stock-available" : "gs-stock-unavailable"}>
            {availableToAdd > 0 ? `${availableToAdd} available` : "Out of stock"}
          </span>
          <div className="gs-quantity-stepper" aria-label={`Quantity for ${product.name}`}>
            <button type="button" aria-label="Decrease quantity" onClick={(event) => { event.stopPropagation(); setQuantity((current) => Math.max(1, current - 1)); }} disabled={quantity <= 1 || adding}><IconMinus size={13} /></button>
            <span aria-live="polite">{quantity}</span>
            <button type="button" aria-label="Increase quantity" onClick={(event) => { event.stopPropagation(); setQuantity((current) => Math.min(Math.max(1, availableToAdd), current + 1)); }} disabled={quantity >= availableToAdd || adding}><IconPlus size={13} /></button>
          </div>
        </div>
        <div className="gs-product-bottom">
          <button
            className="gs-button gs-button-small"
            onClick={addSelectedQuantity}
            disabled={adding || availableToAdd <= 0}
            aria-busy={adding}
          >
            {adding ? <><IconLoader2 className="gs-spinner" size={15} /> Adding</> : added ? <><IconShoppingBag size={14} /> Added</> : <><IconShoppingBag size={14} /> Add to bag <IconArrowRight size={13} /></>}
          </button>
        </div>
        {addError && <p className="gs-cart-inline-error" role="alert">{addError}</p>}
      </div>
    </article>
  );
}
