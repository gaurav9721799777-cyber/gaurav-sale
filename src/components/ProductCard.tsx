import React from "react";
import { IconArrowRight, IconBolt, IconShoppingBag } from "@tabler/icons-react";
import type { Product } from "../data/products";

type ProductCardProps = {
  product: Product;
  onAdd: (productId: string) => void;
};

export default function ProductCard({ product, onAdd }: ProductCardProps) {
  return (
    <article className="gs-product-card">
      <div className="gs-product-image">
        <img
          src={product.image}
          alt={`${product.brand} ${product.category.toLowerCase()}`}
          loading="lazy"
        />
        <span className="gs-product-badge">{product.badge}</span>
      </div>
      <div className="gs-product-info">
        <span className="gs-product-category">{product.category}</span>
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <div className="gs-product-capacity">
          <IconBolt size={16} aria-hidden="true" />
          {product.capacity}
        </div>
        <div className="gs-product-bottom">
          <strong>{product.price}</strong>
          <button className="gs-button gs-button-small" onClick={() => onAdd(product.id)}>
            <IconShoppingBag size={16} /> Add to bag
            <IconArrowRight size={15} />
          </button>
        </div>
      </div>
    </article>
  );
}
