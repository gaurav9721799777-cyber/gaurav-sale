import React from "react";
import brandPowerShowcase from "../assets/brand-power-showcase.svg";

type PageHeadingProps = {
  eyebrow: string;
  title: React.ReactNode;
  description: string;
};

export default function PageHeading({
  eyebrow,
  title,
  description,
}: PageHeadingProps) {
  return (
    <header className="gs-page-banner">
      <img className="gs-page-banner-art" src={brandPowerShowcase} alt="Microtek, V-Guard and SF Sonic inverter and battery range" />
      <div className="gs-page-banner-shade" />
      <div className="gs-container gs-page-heading">
        <span className="gs-eyebrow gs-eyebrow-light">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </header>
  );
}
