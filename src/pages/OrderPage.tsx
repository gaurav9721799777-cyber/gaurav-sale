import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Button, Select, TextInput, Textarea } from "@mantine/core";
import { IconArrowRight, IconCash, IconCheck, IconShoppingBag, IconTruck, IconTrash } from "@tabler/icons-react";
import PageHeading from "../components/PageHeading";
import AppLoader from "../components/AppLoader";
import { allProducts, resolveProductImageUrl, type Product } from "../services/ProductService";
import type { CartLine } from "../services/CartService";
import type { RoutePath } from "../Route/AppRoutes";
import type { FormEvent } from "react";
import { getOrderById, getOrderByNumber, getOrderErrorMessage, placeOrder, type OrderRecord, type PlaceOrderRequest } from "../services/OrderService";

type OrderPageProps = { cart: CartLine[]; cartId: string; navigate: (path: RoutePath) => void; onRemove: (productId: string) => Promise<void>; onQuantityChange: (productId: string, quantity: number) => Promise<void>; onClearCart: () => Promise<void>; onOrderPlaced: () => Promise<void>; cartBusy: boolean; cartMessage: string };

type OrderFormValues = {
  fullName: string;
  phoneNumber: string;
  email: string;
  streetAddress: string;
  city: string;
  postalCode: string;
  countryRegion: string;
  deliveryInstructions: string;
};

type OrderField = keyof OrderFormValues;
type OrderFieldErrors = Partial<Record<OrderField, string>>;

const emptyOrderForm: OrderFormValues = {
  fullName: "", phoneNumber: "", email: "", streetAddress: "", city: "", postalCode: "", countryRegion: "India", deliveryInstructions: "",
};

const validateOrderForm = (values: OrderFormValues): OrderFieldErrors => {
  const errors: OrderFieldErrors = {};
  const fullName = (values.fullName ?? "").trim();
  const phoneNumber = (values.phoneNumber ?? "").trim();
  const email = (values.email ?? "").trim();
  const streetAddress = (values.streetAddress ?? "").trim();
  const city = (values.city ?? "").trim();
  const postalCode = (values.postalCode ?? "").trim();
  const countryRegion = (values.countryRegion ?? "").trim();
  const deliveryInstructions = values.deliveryInstructions ?? "";
  if (fullName.length < 2 || fullName.length > 100) errors.fullName = "Full name must be between 2 and 100 characters.";
  if (!/^[6-9][0-9]{9}$/.test(phoneNumber)) errors.phoneNumber = "Enter a valid 10 digit Indian phone number.";
  if (email && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 150)) errors.email = "Enter a valid email address up to 150 characters.";
  if (!streetAddress) errors.streetAddress = "Street address is required.";
  else if (streetAddress.length > 300) errors.streetAddress = "Street address cannot exceed 300 characters.";
  if (!city) errors.city = "City is required.";
  else if (city.length > 100) errors.city = "City cannot exceed 100 characters.";
  if (!/^[0-9]{6}$/.test(postalCode)) errors.postalCode = "Postal code must be 6 digits.";
  if (!countryRegion) errors.countryRegion = "Country / region is required.";
  else if (countryRegion.length > 100) errors.countryRegion = "Country / region cannot exceed 100 characters.";
  if (deliveryInstructions.length > 500) errors.deliveryInstructions = "Delivery instructions cannot exceed 500 characters.";
  return errors;
};

const orderStages = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];
const statusLabel = (status: string) => status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());

function OrderTracking({ order }: { order: OrderRecord }) {
  const rawStatus = String(order.orderStatus ?? order.status ?? "PENDING").toUpperCase().replace(/[\s-]+/g, "_");
  const canonicalStatus = rawStatus === "PLACED" ? "PENDING" : rawStatus;
  const cancelled = canonicalStatus === "CANCELLED";
  const currentStage = orderStages.indexOf(canonicalStatus);
  const progressStage = currentStage < 0 ? 0 : currentStage;

  return (
    <section className={`gs-order-tracking${cancelled ? " is-cancelled" : ""}`} aria-label="Order tracking progress">
      <div className="gs-order-tracking-heading"><div><span>ORDER TRACKING</span><h3>Delivery progress</h3></div><strong className="gs-order-status-pill">{statusLabel(canonicalStatus)}</strong></div>
      {cancelled ? (
        <p className="gs-order-cancelled-message">This order was cancelled. Please contact our team if you need help.</p>
      ) : (
        <ol className="gs-order-tracking-steps">
          {orderStages.map((stage, index) => {
            const complete = index < progressStage;
            const active = index === progressStage;
            return <li key={stage} className={`${complete ? "is-complete" : ""}${active ? " is-active" : ""}`}>
              <span className="gs-order-step-marker">{complete ? "✓" : index + 1}</span>
              <span className="gs-order-step-label">{statusLabel(stage)}</span>
            </li>;
          })}
        </ol>
      )}
    </section>
  );
}

function CartQuantityInput({ productId, quantity, stock, disabled, onQuantityChange }: {
  productId: string;
  quantity: number;
  stock: number;
  disabled: boolean;
  onQuantityChange: (productId: string, quantity: number) => Promise<void>;
}) {
  const [draft, setDraft] = useState(String(quantity));
  const [error, setError] = useState("");

  useEffect(() => {
    setDraft(String(quantity));
    setError("");
  }, [quantity]);

  const commit = () => {
    const next = Number(draft);
    if (!Number.isInteger(next) || next < 1) {
      setError("Enter a quantity of at least 1.");
      return;
    }
    if (next > stock) {
      setError(`Only ${stock} available in stock.`);
      return;
    }
    setError("");
    if (next !== quantity) {
      void onQuantityChange(productId, next).catch(() => {
        setDraft(String(quantity));
        setError("Could not update quantity. Check available stock and try again.");
      });
    }
  };

  return (
    <span className="gs-cart-quantity-control">
      <input
        className="gs-cart-quantity-input"
        type="number"
        inputMode="numeric"
        min={1}
        max={stock}
        step={1}
        value={draft}
        aria-label={`Quantity, maximum ${stock}`}
        aria-invalid={!!error}
        disabled={disabled}
        onChange={(event) => { setDraft(event.currentTarget.value); setError(""); }}
        onBlur={commit}
        onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); event.currentTarget.blur(); } }}
      />
      {error && <span className="gs-cart-quantity-error" role="alert">{error}</span>}
    </span>
  );
}

export default function OrderPage({ cart, cartId, navigate, onRemove, onQuantityChange, onClearCart, onOrderPlaced, cartBusy, cartMessage }: OrderPageProps) {
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [formValues, setFormValues] = useState<OrderFormValues>(emptyOrderForm);
  const [fieldErrors, setFieldErrors] = useState<OrderFieldErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lookupType, setLookupType] = useState<"number" | "id">("number");
  const [lookupValue, setLookupValue] = useState("");
  const [lookupResult, setLookupResult] = useState<OrderRecord | null>(null);
  const [lookupError, setLookupError] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  useEffect(() => {
    let active = true;
    allProducts().then((items) => { if (active) setCatalog(items); }).catch(() => { if (active) setCatalog([]); }).finally(() => { if (active) setCatalogLoading(false); });
    return () => { active = false; };
  }, []);
  const cartItems = cart
    .map((line) => ({ ...line, product: catalog.find((product) => product.id === line.productId) }))
    .filter((line) => line.product);
  const money = (value: number) => `₹${value.toLocaleString("en-IN")}`;
  const cartMessageIsError = !!cartMessage && !["Added to your bag.", "Item removed from your bag.", "Bag updated.", "Bag cleared."].includes(cartMessage);
  const updateField = (field: OrderField, value: string) => {
    setFormValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError("");
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError("");
    const values = { ...emptyOrderForm, ...formValues };
    setFormValues(values);
    const validationErrors = validateOrderForm(values);
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length) {
      setSubmitError("Please check the highlighted details and try again.");
      return;
    }
    if (!cart.length) {
      setSubmitError("Your bag is empty. Add an item before placing your order.");
      return;
    }

    const request: PlaceOrderRequest = {
      fullName: values.fullName.trim(),
      phoneNumber: values.phoneNumber.trim(),
      ...(values.email.trim() ? { email: values.email.trim() } : {}),
      streetAddress: values.streetAddress.trim(),
      city: values.city.trim(),
      postalCode: values.postalCode.trim(),
      countryRegion: values.countryRegion.trim(),
      ...(values.deliveryInstructions.trim() ? { deliveryInstructions: values.deliveryInstructions.trim() } : {}),
      paymentMethod: "CASH_ON_DELIVERY",
    };

    setSubmitting(true);
    try {
      const placedOrder = await placeOrder(cartId, request);
      setOrder(placedOrder);
      await onOrderPlaced().catch(() => undefined);
      setLookupResult(null);
      setFormValues(emptyOrderForm);
    } catch (error) {
      setSubmitError(getOrderErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const lookupOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!lookupValue.trim()) {
      setLookupError(lookupType === "number" ? "Enter your order number." : "Enter your order ID.");
      return;
    }
    setLookingUp(true);
    setLookupError("");
    setLookupResult(null);
    try {
      const found = lookupType === "number"
        ? await getOrderByNumber(lookupValue.trim())
        : await getOrderById(lookupValue.trim());
      setLookupResult(found);
    } catch (error) {
      setLookupError(getOrderErrorMessage(error));
    } finally {
      setLookingUp(false);
    }
  };

  const orderNumber = order ? String(order.orderNumber ?? order.number ?? "") : "";
  const placedOrderStatus = order ? String(order.orderStatus ?? order.status ?? "") : "";

  return (
    <section className="gs-page gs-container">
      <PageHeading
        eyebrow="PLACE YOUR ORDER"
        title={<>A few details, then <em>we'll take it from here.</em></>}
        description="Share your contact and delivery details. Payment is by cash on delivery, subject to order confirmation."
      />
      <div className="gs-checkout-layout">
        <form className="gs-form-card gs-order-form" onSubmit={submit} noValidate>
          {order ? (
            <div className="gs-order-confirmation" role="status">
              <span className="gs-order-confirmation-icon"><IconCheck size={27} /></span>
              <span className="gs-order-confirmation-eyebrow">ORDER RECEIVED</span>
              <h2>Your order is on its way to confirmation.</h2>
              <p>Thanks for choosing Gaurav Sales. We’ve received your order and will contact you to confirm delivery.</p>
              <div className="gs-order-confirmation-details">
                <>
                  {orderNumber && <div><small>ORDER NUMBER</small><strong>{orderNumber}</strong></div>}
                  {placedOrderStatus && <div><small>ORDER STATUS</small><strong>{placedOrderStatus.replace(/_/g, " ")}</strong></div>}
                </>
              </div>
              <OrderTracking order={order} />
              <button className="gs-order-new-button" type="button" onClick={() => setOrder(null)}>Place another order <IconArrowRight size={15} /></button>
            </div>
          ) : (
            <>
              <div className="gs-form-title"><span>01</span><div><h2>Contact details</h2><p>How can we reach you about this order?</p></div></div>
              <div className="gs-form-row">
                <TextInput label="Full name" placeholder="Your name" autoComplete="name" required maxLength={100} value={formValues.fullName ?? ""} error={fieldErrors.fullName} onChange={(event) => updateField("fullName", event.currentTarget.value)} />
                <TextInput label="Phone number" placeholder="Reachable phone number" type="tel" autoComplete="tel" required value={formValues.phoneNumber ?? ""} error={fieldErrors.phoneNumber} onChange={(event) => updateField("phoneNumber", event.currentTarget.value)} />
              </div>
              <TextInput label="Email address (optional)" placeholder="you@example.com" type="email" autoComplete="email" value={formValues.email ?? ""} error={fieldErrors.email} onChange={(event) => updateField("email", event.currentTarget.value)} />
              <div className="gs-form-title"><span>02</span><div><h2>Delivery address</h2><p>Enter the address where you’d like your order delivered.</p></div></div>
              <TextInput label="Street address" placeholder="House number and street" autoComplete="street-address" required maxLength={300} value={formValues.streetAddress ?? ""} error={fieldErrors.streetAddress} onChange={(event) => updateField("streetAddress", event.currentTarget.value)} />
              <div className="gs-form-row">
                <Select label="City" placeholder="Select city" autoComplete="address-level2" required data={["Azamgarh"]} value={formValues.city || null} error={fieldErrors.city} onChange={(value) => updateField("city", value ?? "")} />
                <TextInput label="Postal code" placeholder="Postal code" autoComplete="postal-code" required inputMode="numeric" maxLength={6} value={formValues.postalCode ?? ""} error={fieldErrors.postalCode} onChange={(event) => updateField("postalCode", event.currentTarget.value.replace(/\D/g, "").slice(0, 6))} />
              </div>
              <Select label="Country / region" required data={["India"]} value={formValues.countryRegion || null} error={fieldErrors.countryRegion} onChange={(value) => updateField("countryRegion", value ?? "")} />
              <Textarea label="Delivery instructions (optional)" placeholder="Landmark, preferred delivery time, or other details" minRows={3} maxLength={500} value={formValues.deliveryInstructions ?? ""} error={fieldErrors.deliveryInstructions} onChange={(event) => updateField("deliveryInstructions", event.currentTarget.value)} />
              <div className="gs-cod-confirm"><IconCash /><span><strong>Cash on delivery</strong><small>Pay the confirmed amount when your order arrives.</small></span><IconCheck className="gs-cod-check" /></div>
              {submitError && <div className="gs-order-error" role="alert">{submitError}</div>}
              <Button className="gs-button gs-order-submit" type="submit" loading={submitting} disabled={submitting || catalogLoading || !cart.length}>{submitting ? "Placing your order…" : "Place order"} {!submitting && <IconArrowRight size={17} />}</Button>
              {!cart.length && <small className="gs-form-footnote">Add an item to your bag before placing an order.</small>}
            </>
          )}
        </form>
        <aside className="gs-order-summary">
          <div className="gs-summary-title"><IconShoppingBag /><h2>Your order</h2>{cart.length > 0 && <button className="gs-cart-clear" type="button" onClick={() => { void Swal.fire({ title: "Clear your bag?", text: "All items will be removed.", icon: "warning", showCancelButton: true, confirmButtonText: "Clear bag", confirmButtonColor: "#b42318" }).then((result) => { if (result.isConfirmed) void onClearCart().catch(() => undefined); }); }} disabled={cartBusy}>Clear bag</button>}</div>
          {cartMessage && <p className={`gs-cart-feedback${cartMessageIsError ? " is-error" : ""}`} role={cartMessageIsError ? "alert" : "status"}>{cartMessage}</p>}
          {cartBusy && <AppLoader label="Updating your bag" variant="inline" />}
          {cart.length > 0 && catalogLoading && <AppLoader label="Loading your items" variant="inline" />}
          {cartItems.length ? cartItems.map(({ product, quantity }) => product && (
            <div className="gs-summary-item" key={product.id}>
              <img src={resolveProductImageUrl(product.mainImageUrl || product.imageUrl || product.image) || ""} alt="" />
              <div><strong>{product.name}</strong><small>{product.categoryName || product.category} · Qty {quantity}</small>
                <small className={quantity >= product.stock ? "gs-stock-unavailable" : "gs-stock-available"}>{product.stock > quantity ? `${product.stock - quantity} more in stock` : "Maximum stock reached"}</small>
                <div className="gs-cart-item-actions"><span className="gs-cart-quantity-label">Quantity</span><CartQuantityInput productId={product.id} quantity={quantity} stock={product.stock} disabled={cartBusy} onQuantityChange={onQuantityChange} /><button className="gs-cart-remove-button" type="button" onClick={() => { void Swal.fire({ title: `Remove ${product.name}?`, icon: "warning", showCancelButton: true, confirmButtonText: "Remove", confirmButtonColor: "#b42318" }).then((result) => { if (result.isConfirmed) void onRemove(product.id).catch(() => undefined); }); }} aria-label={`Remove ${product.name} from bag`} title="Remove item" disabled={cartBusy}><IconTrash size={14} /></button></div>
              </div>
              <b>{money((product.discountPrice > 0 && product.discountPrice < product.price ? product.discountPrice : product.price) * quantity)}</b>
            </div>
          )) : <p className="gs-summary-empty">Your bag is empty. You can still send an order enquiry, or browse our inverter range first.</p>}
          <div className="gs-summary-delivery"><IconTruck size={18} /> Shipping details confirmed before dispatch</div>
          <Button variant="subtle" className="gs-order-browse" onClick={() => navigate("/products")}>Continue shopping <IconArrowRight size={15} /></Button>
          <section className="gs-order-lookup" aria-labelledby="gs-order-lookup-title">
            <h3 id="gs-order-lookup-title">Already placed an order?</h3>
            <p>Look up its latest details.</p>
            <div className="gs-order-lookup-tabs" role="group" aria-label="Order lookup type">
              <button type="button" className={lookupType === "number" ? "is-active" : ""} onClick={() => { setLookupType("number"); setLookupValue(""); setLookupError(""); setLookupResult(null); }}>Order number</button>
              <button type="button" className={lookupType === "id" ? "is-active" : ""} onClick={() => { setLookupType("id"); setLookupValue(""); setLookupError(""); setLookupResult(null); }}>Order ID</button>
            </div>
            <form className="gs-order-lookup-form" onSubmit={lookupOrder}>
              <TextInput
                aria-label={lookupType === "number" ? "Order number" : "Order ID"}
                placeholder={lookupType === "number" ? "Enter order number" : "Enter order ID"}
                value={lookupValue}
                onChange={(event) => { setLookupValue(event.currentTarget.value); setLookupError(""); }}
              />
              <Button type="submit" className="gs-order-lookup-submit" loading={lookingUp} disabled={lookingUp}>{lookingUp ? "Looking up…" : "Find order"}</Button>
            </form>
            {lookupError && <p className="gs-order-lookup-error" role="alert">{lookupError}</p>}
            {lookupResult && <div className="gs-order-lookup-result" role="status">
              <>
                <span>Order found</span>
                <strong>{String(lookupResult.orderNumber ?? lookupResult.number ?? `#${lookupResult.id ?? lookupResult.orderId ?? lookupValue}`)}</strong>
                {(lookupResult.orderStatus ?? lookupResult.status) && <small>Status · {String(lookupResult.orderStatus ?? lookupResult.status).replace(/_/g, " ")}</small>}
                {(lookupResult.totalAmount !== undefined || lookupResult.total !== undefined) && <small>Total · {money(Number(lookupResult.totalAmount ?? lookupResult.total))}</small>}
                <OrderTracking order={lookupResult} />
              </>
            </div>}
          </section>
        </aside>
      </div>
    </section>
  );
}
