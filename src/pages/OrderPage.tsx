import React, { useState } from "react";
import { Button, TextInput, Textarea } from "@mantine/core";
import { IconArrowRight, IconCash, IconCheck, IconShoppingBag, IconTruck } from "@tabler/icons-react";
import PageHeading from "../components/PageHeading";
import { products } from "../data/products";
import type { RoutePath } from "../Route/AppRoutes";
import type { FormEvent } from "react";
import inverterBanner from "../assets/inverter-hero-backup.svg";

export type CartLine = { productId: string; quantity: number };
type OrderPageProps = { cart: CartLine[]; navigate: (path: RoutePath) => void };

export default function OrderPage({ cart, navigate }: OrderPageProps) {
  const [submitted, setSubmitted] = useState(false);
  const cartItems = cart
    .map((line) => ({ ...line, product: products.find((product) => product.id === line.productId) }))
    .filter((line) => line.product);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <section className="gs-page gs-container">
      <PageHeading
        eyebrow="PLACE YOUR ORDER"
        title={<>A few details, then <em>we'll take it from here.</em></>}
        description="Share your contact and delivery details. Payment is by cash on delivery, subject to order confirmation."
        image={inverterBanner}
      />
      <div className="gs-checkout-layout">
        <form className="gs-form-card gs-order-form" onSubmit={submit}>
          {submitted ? (
            <div className="gs-form-success" role="status"><span><IconCheck size={26} /></span><strong>Your order request is ready.</strong><p>This demo storefront does not send orders to a backend. Please contact Gaurav Sales directly to confirm availability and delivery.</p></div>
          ) : (
            <>
              <div className="gs-form-title"><span>01</span><div><h2>Contact details</h2><p>How can we reach you about this order?</p></div></div>
              <div className="gs-form-row"><TextInput label="Full name" placeholder="Your name" autoComplete="name" required /><TextInput label="Phone number" placeholder="Reachable phone number" type="tel" autoComplete="tel" required /></div>
              <TextInput label="Email address (optional)" placeholder="you@example.com" type="email" autoComplete="email" />
              {!cartItems.length && <TextInput label="Product or inverter model" placeholder="Which inverter would you like to order?" required />}
              <div className="gs-form-title"><span>02</span><div><h2>Delivery address</h2><p>Enter the address where you’d like your order delivered.</p></div></div>
              <TextInput label="Street address" placeholder="House number and street" autoComplete="street-address" required />
              <div className="gs-form-row"><TextInput label="City" placeholder="City" autoComplete="address-level2" required /><TextInput label="Postal code" placeholder="Postal code" autoComplete="postal-code" required /></div>
              <TextInput label="Country / region" placeholder="Country or region" autoComplete="country-name" required />
              <Textarea label="Delivery instructions (optional)" placeholder="Landmark, preferred delivery time, or other details" minRows={3} />
              <div className="gs-cod-confirm"><IconCash /><span><strong>Cash on delivery</strong><small>Pay the confirmed amount when your order arrives.</small></span><IconCheck className="gs-cod-check" /></div>
              <Button className="gs-button gs-order-submit" type="submit">Submit order request <IconArrowRight size={17} /></Button>
              <small className="gs-form-footnote">Submitting this demo form does not process a real order or payment.</small>
            </>
          )}
        </form>
        <aside className="gs-order-summary">
          <div className="gs-summary-title"><IconShoppingBag /><h2>Your order</h2></div>
          {cartItems.length ? cartItems.map(({ product, quantity }) => product && (
            <div className="gs-summary-item" key={product.id}><img src={product.image} alt="" /><div><strong>{product.name}</strong><small>{product.capacity} · Qty {quantity}</small></div><b>{product.price}</b></div>
          )) : <p className="gs-summary-empty">Your bag is empty. You can still send an order enquiry, or browse our inverter range first.</p>}
          <div className="gs-summary-delivery"><IconTruck size={18} /> Shipping details confirmed before dispatch</div>
          <Button variant="subtle" className="gs-order-browse" onClick={() => navigate("/products")}>Continue shopping <IconArrowRight size={15} /></Button>
        </aside>
      </div>
    </section>
  );
}
