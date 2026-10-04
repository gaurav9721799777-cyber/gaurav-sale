import React from "react";
import { render, screen } from "@testing-library/react";
import ContactPage from "./ContactPage";

test("shows the provided contact details and location map without a form", () => {
  render(<ContactPage />);

  expect(screen.getByRole("link", { name: /naurauli, azamgarh/i })).toHaveAttribute(
    "href",
    expect.stringContaining(encodeURIComponent("Naurauli, Azamgarh")),
  );
  expect(screen.getByRole("link", { name: "674238472384" })).toHaveAttribute("href", "tel:674238472384");
  expect(screen.getByRole("link", { name: "gaurav@gmail.com" })).toHaveAttribute("href", "mailto:gaurav@gmail.com");
  expect(screen.getByTitle("Google Map showing Naurauli, Azamgarh")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /send your message/i })).not.toBeInTheDocument();
});
