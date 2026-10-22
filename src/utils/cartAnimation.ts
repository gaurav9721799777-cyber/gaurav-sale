export function animateProductToCart(source: HTMLElement): void {
  const cartButton = document.querySelector<HTMLElement>(".gs-cart-button");
  if (
    !cartButton ||
    (typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches)
  ) {
    return;
  }

  const productImage = source
    .closest(".gs-product-card, .storefront-detail")
    ?.querySelector("img");
  const sourceElement = productImage ?? source;
  const sourceRect = sourceElement.getBoundingClientRect();
  const cartRect = cartButton.getBoundingClientRect();
  const flyer = document.createElement("span");
  flyer.className = "gs-cart-flight";
  flyer.setAttribute("aria-hidden", "true");
  flyer.style.left = `${sourceRect.left + sourceRect.width / 2 - 22}px`;
  flyer.style.top = `${sourceRect.top + sourceRect.height / 2 - 22}px`;

  if (productImage instanceof HTMLImageElement && productImage.currentSrc) {
    const image = document.createElement("img");
    image.src = productImage.currentSrc;
    image.alt = "";
    flyer.appendChild(image);
  }

  document.body.appendChild(flyer);
  const offsetX =
    cartRect.left + cartRect.width / 2 - (sourceRect.left + sourceRect.width / 2);
  const offsetY =
    cartRect.top + cartRect.height / 2 - (sourceRect.top + sourceRect.height / 2);

  if (typeof flyer.animate === "function") {
    const flight = flyer.animate(
      [
        { transform: "translate3d(0, 0, 0) scale(1)", opacity: 1 },
        {
          transform: `translate3d(${offsetX}px, ${offsetY}px, 0) scale(0.16)`,
          opacity: 0.35,
        },
      ],
      { duration: 650, easing: "cubic-bezier(0.2, 0.75, 0.3, 1)" },
    );
    flight.onfinish = () => flyer.remove();
    flight.oncancel = () => flyer.remove();
  } else {
    flyer.remove();
  }

  if (typeof cartButton.animate === "function") {
    cartButton.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(1.07)" },
        { transform: "scale(1)" },
      ],
      { duration: 420, easing: "ease-out" },
    );
  }
}
