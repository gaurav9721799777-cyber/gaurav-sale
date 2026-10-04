import React from "react";
import { Button } from "@mantine/core";
import { IconArrowRight, IconCash, IconCheck, IconShieldCheck } from "@tabler/icons-react";
import PageHeading from "../components/PageHeading";
import type { RoutePath } from "../Route/AppRoutes";
import inverterBanner from "../assets/inverter-hero-battery.svg";

type PaymentPageProps = { navigate: (path: RoutePath) => void };

export default function PaymentPage({ navigate }: PaymentPageProps) {
  return (
    <section className="gs-page gs-container">
      <PageHeading
        eyebrow="PAYMENT INFORMATION"
        title={<>Simple checkout. <em>Cash on delivery.</em></>}
        description="Pay for your inverter order when it arrives. No online card payment is required in this storefront."
        image={inverterBanner}
      />
      <div className="gs-payment-card">
        <div className="gs-payment-icon"><IconCash size={38} /></div>
        <div className="gs-payment-copy"><span className="gs-eyebrow">AVAILABLE PAYMENT METHOD</span><h2>Cash on delivery (COD)</h2><p>Choose COD when placing your order and pay the delivery representative when your package is handed over. Please keep the confirmed order amount ready.</p></div>
        <span className="gs-cod-badge"><IconCheck size={16} /> COD</span>
      </div>
      <div className="gs-payment-notes">
        <article><IconShieldCheck /><div><strong>Confirm before dispatch</strong><p>We’ll confirm the order details, delivery address, and payment amount with you before dispatch.</p></div></article>
        <article><IconCheck /><div><strong>Check the delivery</strong><p>Check the package and product details at delivery, and contact us promptly if anything is wrong.</p></div></article>
      </div>
      <p className="gs-payment-caveat">COD availability may depend on delivery location and order verification. Our team will confirm eligibility before dispatch.</p>
      <Button className="gs-button" onClick={() => navigate("/order")}>Continue to order form <IconArrowRight size={16} /></Button>
    </section>
  );
}
