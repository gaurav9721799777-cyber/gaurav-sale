import React from "react";
import brandPowerShowcase from "../assets/brand-power-showcase.svg";

type PageHeadingProps = {
  eyebrow: string;
  title: React.ReactNode;
  description: string;
  image?: string;
  imageAlt?: string;
  fullImage?: string;
};

export default function PageHeading({
  eyebrow,
  title,
  description,
  image,
  imageAlt,
  fullImage,
}: PageHeadingProps) {
  return (
    <header className={`gs-page-banner${fullImage ? " is-full-image" : ""}`}>
      {fullImage ? (
        <>
          <img
            className="gs-page-banner-full-art"
            src={fullImage}
            alt={imageAlt || ""}
          />
          <span className="gs-page-banner-full-tint" aria-hidden="true" />
          <div className="gs-page-banner-hidden-copy">
            <span>{eyebrow}</span>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
        </>
      ) : (
        <>
          <img
            className={`gs-page-banner-art${image ? " is-photo" : ""}`}
            src={image || brandPowerShowcase}
            alt={imageAlt || "Microtek, V-Guard and SF Sonic inverter and battery range"}
          />
          <div className="gs-page-banner-shade" />
          <div className="gs-container gs-page-heading">
            <span className="gs-eyebrow gs-eyebrow-light">{eyebrow}</span>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
        </>
      )}
    </header>
  );
}
