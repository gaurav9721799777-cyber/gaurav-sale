import nodemailer from "nodemailer";

type OrderLine = {
  name: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
};

type OrderConfirmation = {
  to: string;
  customerName: string;
  orderNumber: string;
  totalAmount: number;
  items: OrderLine[];
};

export type OrderEmailResult =
  | { status: "sent"; message: string }
  | { status: "skipped"; message: string }
  | { status: "failed"; message: string };

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);

export async function sendOrderConfirmationEmail(
  order: OrderConfirmation,
): Promise<OrderEmailResult> {
  if (!order.to.trim()) {
    return {
      status: "skipped",
      message: "No email address was provided, so no confirmation email was sent.",
    };
  }
  const user = process.env.GMAIL_USER?.trim();
  const appPassword = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "");
  if (!user || !appPassword) {
    return {
      status: "skipped",
      message: "Gmail is not configured on the server, so no confirmation email was sent.",
    };
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass: appPassword },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  const rows = order.items.map((item) => {
    const name = escapeHtml(item.name);
    const sku = item.sku ? `<br><small>${escapeHtml(item.sku)}</small>` : "";
    const lineTotal = formatCurrency(item.unitPrice * item.quantity);
    return `<tr><td>${name}${sku}</td><td>${item.quantity}</td><td>${formatCurrency(item.unitPrice)}</td><td>${lineTotal}</td></tr>`;
  }).join("");
  const greetingName = escapeHtml(order.customerName);

  try {
    await transporter.sendMail({
      from: { name: "Gaurav Sales", address: user },
      to: order.to,
      subject: `Order confirmation ${order.orderNumber} | Gaurav Sales`,
      text: [
        `Hello ${order.customerName},`,
        "",
        `We received your order ${order.orderNumber}.`,
        ...order.items.map((item) => `${item.name} x ${item.quantity} — ${formatCurrency(item.unitPrice * item.quantity)}`),
        "",
        `Order total: ${formatCurrency(order.totalAmount)}`,
        "Payment: Cash on delivery",
        "",
        "We will contact you to confirm delivery.",
        "Gaurav Sales",
      ].join("\n"),
      html: `<!doctype html><html><body style="margin:0;padding:24px;background:#f7f7fa;font:14px Arial,sans-serif;color:#252530">
        <div style="max-width:620px;margin:0 auto;padding:28px;background:#fff;border:1px solid #ececf1;border-radius:12px">
        <h1 style="margin:0;color:#3158b8">Gaurav Sales</h1><p style="color:#777">Order confirmation</p>
        <p>Hello ${greetingName}, we received your order.</p>
        <p><strong>Order number:</strong> ${escapeHtml(order.orderNumber)}</p>
        <table style="width:100%;border-collapse:collapse;text-align:left">
          <thead><tr><th style="padding:10px;border-bottom:1px solid #ddd">Product</th><th style="padding:10px;border-bottom:1px solid #ddd">Qty</th><th style="padding:10px;border-bottom:1px solid #ddd">Price</th><th style="padding:10px;border-bottom:1px solid #ddd">Amount</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="text-align:right;font-size:18px"><strong>Total: ${formatCurrency(order.totalAmount)}</strong></p>
        <p>Payment: Cash on delivery</p><p>We will contact you to confirm delivery.</p></div></body></html>`,
    });
    return { status: "sent", message: "Order confirmation email sent." };
  } catch (error) {
    console.error(`Could not send confirmation email for order ${order.orderNumber}.`, error);
    return {
      status: "failed",
      message: "Your order was saved, but the confirmation email could not be sent. Please contact the store if you need help.",
    };
  } finally {
    transporter.close();
  }
}
