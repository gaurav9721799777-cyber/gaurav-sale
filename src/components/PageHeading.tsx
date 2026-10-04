import React from "react";

type PageHeadingProps = {
  eyebrow: string;
  title: React.ReactNode;
  description: string;
  image: string;
};

export default function PageHeading({
  eyebrow,
  title,
  description,
  image,
}: PageHeadingProps) {
  return (
    <header className="gs-page-banner" style={{ backgroundImage: `url("${image}")` }}>
      <div className="gs-page-banner-shade" />
      <div className="gs-container gs-page-heading">
        <span className="gs-eyebrow gs-eyebrow-light">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </header>
  );
}
