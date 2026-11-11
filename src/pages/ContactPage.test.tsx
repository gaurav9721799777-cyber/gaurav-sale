import React from "react";
import { render, screen } from "@testing-library/react";
import ContactPage from "./ContactPage";

test("shows the provided contact details and location map without a form", () => {
  render(<ContactPage />);

  expect(
    screen.getByRole("link", { name: /tiraha, mau rd.*narauli, azamgarh/i }),
  ).toHaveAttribute(
    "href",
    expect.stringContaining(
      encodeURIComponent(
        "Tiraha, Mau Rd, beside HP Petrol Pump, Narauli, Azamgarh, Uttar Pradesh 276128",
      ),
    ),
  );
  const phoneLinks = screen.getAllByRole("link", { name: "+91 97217 99777" });
  expect(phoneLinks).toHaveLength(2);
  expect(
    phoneLinks.find((link) => link.getAttribute("href") === "tel:+919721799777"),
  ).toBeInTheDocument();
  expect(
    phoneLinks.find(
      (link) => link.getAttribute("href") === "https://wa.me/919721799777",
    ),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "gauravsales2009@gmail.com" }),
  ).toHaveAttribute("href", "mailto:gauravsales2009@gmail.com");
  expect(document.querySelector(".gs-contact-banner-panel")).toBeNull();
  expect(
    screen.getByTitle("Google Map showing Gaurav Sales, Tiraha Narauli"),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /send your message/i }),
  ).not.toBeInTheDocument();
});
