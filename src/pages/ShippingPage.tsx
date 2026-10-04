import React from "react";
import { Button } from "@mantine/core";
import { IconArrowRight, IconMapPin, IconPackage, IconTruck } from "@tabler/icons-react";
import PageHeading from "../components/PageHeading";
import type { RoutePath } from "../Route/AppRoutes";
import inverterBanner from "../assets/inverter-hero-home.svg";

type ShippingPageProps = { navigate: (path: RoutePath) => void };

export default function ShippingPage({ navigate }: ShippingPageProps) {
  return (
    <section className="gs-page gs-container">
      <PageHeading
        eyebrow="DELIVERY & SHIPPING"
        title={<>From our store <em>to your door.</em></>}
        description="A clear guide to order processing, delivery updates, and what to expect when your inverter is on its way."
        image={inverterBanner}
      />
      <div className="gs-shipping-steps">
        <article><span><IconPackage /></span><b>01 · Order confirmed</b><p>We review your order and confirm product availability and delivery details.</p></article>
        <article><span><IconTruck /></span><b>02 · Carefully dispatched</b><p>After dispatch, keep an eye out for the delivery update and tracking information.</p></article>
        <article><span><IconMapPin /></span><b>03 · Delivered to you</b><p>Please make sure someone is available to receive and check the package.</p></article>
      </div>
      <div className="gs-shipping-details">
        <div><h2>Shipping information</h2><p>Delivery coverage, shipping charges, and estimated arrival dates can vary by location, package size, and product availability. The final details will be confirmed with you before the order is dispatched.</p><ul><li>Use a complete address and a reachable phone number.</li><li>Inspect the package on delivery and report any visible damage promptly.</li><li>For delivery changes or delays, contact our support team with your order details.</li></ul></div>
        <aside><IconTruck size={28} /><strong>Have a delivery question?</strong><p>Our team can help confirm shipping details for your area.</p><Button className="gs-button" onClick={() => navigate("/contact")}>Ask our team <IconArrowRight size={16} /></Button></aside>
      </div>
    </section>
  );
}
