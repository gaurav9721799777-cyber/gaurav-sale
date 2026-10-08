import React, { useEffect, useState } from 'react';
import { productsApi } from '../services/ProductService';
import type { Product } from '../services/ProductService';
import AppLoader from './AppLoader';
import InfiniteScrollTrigger from './InfiniteScrollTrigger';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { apiErrorMessage } from '../services/apiError';

const money = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);

function LandingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { visibleCount, hasMore, loadMore } = useInfiniteScroll(products.length, 8);
  const visibleProducts = products.slice(0, visibleCount);

  useEffect(() => {
    let current = true;

    productsApi.list()
      .then((items) => {
        if (current) setProducts(items.filter((product) => product.active !== false));
      })
      .catch((err: unknown) => {
        if (current) setError(apiErrorMessage(err, "Products are not available right now. Please check back soon."));
      })
      .finally(() => {
        if (current) setLoading(false);
      });

    return () => {
      current = false;
    };
  }, []);

  return (
    <main className="storefront">
      <header className="storefront-header">
        <a className="storefront-brand" href="/">gaurav<span>sales</span></a>
        <nav aria-label="Main navigation">
          <a href="#products">Shop products</a>
          <a className="storefront-admin-link" href="/admin">Admin</a>
        </nav>
      </header>

      <section className="storefront-hero">
        <div className="storefront-hero-copy">
          <span className="storefront-eyebrow">THE GAURAV SALES COLLECTION</span>
          <h1>Good products.<br />Made easy.</h1>
          <p>Explore our hand-picked catalog and find something you’ll love.</p>
          <a className="storefront-cta" href="#products">Explore products <span aria-hidden="true">→</span></a>
        </div>
        <div className="storefront-hero-art" aria-hidden="true">
          <span className="hero-art-orbit orbit-one" />
          <span className="hero-art-orbit orbit-two" />
          <span className="hero-art-g">g<span>.</span></span>
        </div>
      </section>

      <section className="storefront-products" id="products">
        <div className="storefront-section-heading">
          <div>
            <span className="storefront-eyebrow">FIND YOUR NEXT FAVORITE</span>
            <h2>Featured products</h2>
          </div>
          {!loading && <span>{products.length} {products.length === 1 ? 'product' : 'products'}</span>}
        </div>

        {error && (
          <div className="gs-home-empty-state">
            <strong>Product Not Available</strong>
            <p>{error}</p>
          </div>
        )}
        {loading && <AppLoader label="Loading products" variant="inline" />}
        {!loading && !error && products.length === 0 && (
          <div className="gs-home-empty-state">
            <strong>Product Not Available</strong>
            <p>Products are not available right now. Please check back soon.</p>
          </div>
        )}

        <div className="storefront-product-grid">
          {visibleProducts.map((product, index) => (
            <a className="storefront-product-card" href={`/products/${encodeURIComponent(product.slug)}`} key={product.id}>
              <div className={`storefront-product-image tone-${index % 4}`}>
                {product.mainImageUrl
                  ? <img src={product.mainImageUrl} alt={product.name} />
                  : <span>{product.name.slice(0, 1).toUpperCase()}</span>}
              </div>
              <div className="storefront-product-info">
                <span>{product.brandName}</span>
                <h3>{product.name}</h3>
                <strong>{money(product.discountPrice ?? product.price)}</strong>
              </div>
              <span className="storefront-product-arrow" aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
        <InfiniteScrollTrigger hasMore={hasMore} onLoadMore={loadMore} />
      </section>

      <footer className="storefront-footer">
        <a className="storefront-brand" href="/">gaurav<span>sales</span></a>
        <span>Thoughtfully selected for you.</span>
      </footer>
    </main>
  );
}

export default LandingPage;
