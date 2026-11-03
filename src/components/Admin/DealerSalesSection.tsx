import React, { FormEvent, useEffect, useMemo, useState } from "react";
import { IconBuildingStore, IconDownload, IconPlus, IconPrinter, IconReceipt, IconX } from "@tabler/icons-react";
import {
  createDealer,
  createDealerSale,
  listDealers,
  listDealerSales,
  recordDealerPayment,
  type Dealer,
  type DealerSale,
} from "../../services/DealerSalesService";
import { allProducts, type Product } from "../../services/ProductService";
import { apiErrorMessage } from "../../services/apiError";

type SaleLine = { productId: string; quantity: string; unitPrice: string };
type SectionProps = { onNotice: (message: string) => void; onProductsChanged: () => Promise<void> };

const money = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(amount);

const dealerForSale = (sale: DealerSale): Dealer | null =>
  typeof sale.dealerId === "object" ? sale.dealerId : null;

const safeHtml = (value: unknown) =>
  String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);

const downloadCsv = (filename: string, columns: string[], rows: unknown[][]) => {
  const csvValue = (value: unknown) => {
    const text = String(value ?? "");
    const safeText = /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text;
    return `"${safeText.replace(/"/g, '""')}"`;
  };
  const csv = [columns, ...rows]
    .map((row) => row.map(csvValue).join(","))
    .join("\r\n");
  const url = URL.createObjectURL(
    new Blob([String.fromCharCode(65279) + csv], { type: "text/csv;charset=utf-8;" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export default function DealerSalesSection({ onNotice, onProductsChanged }: SectionProps) {
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [sales, setSales] = useState<DealerSale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dealerFilter, setDealerFilter] = useState("all");
  const [showDealerForm, setShowDealerForm] = useState(false);
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [paymentSale, setPaymentSale] = useState<DealerSale | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      const [dealerRows, saleRows, productRows] = await Promise.all([
        listDealers(),
        listDealerSales(),
        allProducts(),
      ]);
      setDealers(dealerRows);
      setSales(saleRows);
      setProducts(productRows.filter((product) => product.active !== false));
    } catch (requestError) {
      setError(apiErrorMessage(requestError, "Could not load dealer sales."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const visibleSales = useMemo(
    () => dealerFilter === "all" ? sales : sales.filter((sale) => {
      const dealer = dealerForSale(sale);
      return dealer?.id === dealerFilter || sale.dealerId === dealerFilter;
    }),
    [dealerFilter, sales],
  );
  const totalDue = sales.reduce((sum, sale) => sum + Math.max(0, sale.totalAmount - sale.amountPaid), 0);

  const exportDealers = () => {
    if (!dealers.length) {
      onNotice("There are no dealer accounts to export yet.");
      return;
    }
    const columns = [
      "Dealer ID",
      "Business Name",
      "Contact Name",
      "Phone Number",
      "Email",
      "GSTIN",
      "Address",
      "Number of Sales",
      "Lifetime Sales (INR)",
      "Amount Paid (INR)",
      "Outstanding Due (INR)",
    ];
    const rows = dealers.map((dealer) => {
      const dealerSales = sales.filter(
        (sale) => dealerForSale(sale)?.id === dealer.id || sale.dealerId === dealer.id,
      );
      const amountDue = dealerSales.reduce(
        (sum, sale) => sum + Math.max(0, sale.totalAmount - sale.amountPaid),
        0,
      );
      return [
        dealer.id,
        dealer.businessName,
        dealer.name,
        dealer.phoneNumber,
        dealer.email,
        dealer.gstin,
        dealer.address,
        dealerSales.length,
        dealerSales.reduce((sum, sale) => sum + sale.totalAmount, 0).toFixed(2),
        dealerSales.reduce((sum, sale) => sum + sale.amountPaid, 0).toFixed(2),
        amountDue.toFixed(2),
      ];
    });
    downloadCsv(
      `gaurav-sales-dealers-${new Date().toISOString().slice(0, 10)}.csv`,
      columns,
      rows,
    );
    onNotice(`Exported ${dealers.length} dealer accounts.`);
  };

  const exportDealerSales = () => {
    if (!sales.length) {
      onNotice("There are no dealer sales to export yet.");
      return;
    }
    const columns = [
      "Sale ID",
      "Invoice Number",
      "Sale Date",
      "Dealer Business Name",
      "Contact Name",
      "Phone Number",
      "GSTIN",
      "Address",
      "Products",
      "Total Quantity",
      "Total (INR)",
      "Amount Paid (INR)",
      "Balance Due (INR)",
      "Payment Status",
      "Payment History",
    ];
    const rows = sales.map((sale) => {
      const dealer = dealerForSale(sale);
      const amountPaid = Number(sale.amountPaid) || 0;
      const total = Number(sale.totalAmount) || 0;
      const items = (sale.items ?? []).map(
        (item) => `${item.name} x ${item.quantity} @ ${money(item.unitPrice)}`,
      ).join("; ");
      const payments = (sale.payments ?? []).map((payment) => {
        const receivedDate = payment.receivedAt
          ? new Date(payment.receivedAt).toLocaleDateString("en-IN")
          : "";
        return [
          receivedDate,
          payment.method.replace(/_/g, " "),
          money(payment.amount),
          payment.note,
        ].filter(Boolean).join(" ");
      }).join("; ");
      return [
        sale.id,
        sale.orderNumber,
        new Date(sale.createdAt).toLocaleString("en-IN"),
        dealer?.businessName ?? "",
        sale.customer.fullName,
        sale.customer.phoneNumber,
        dealer?.gstin ?? "",
        dealer?.address ?? "",
        items,
        (sale.items ?? []).reduce((sum, item) => sum + item.quantity, 0),
        total.toFixed(2),
        amountPaid.toFixed(2),
        Math.max(0, total - amountPaid).toFixed(2),
        sale.paymentStatus.replace(/_/g, " "),
        payments,
      ];
    });
    downloadCsv(
      `gaurav-sales-dealer-orders-${new Date().toISOString().slice(0, 10)}.csv`,
      columns,
      rows,
    );
    onNotice(`Exported ${sales.length} dealer sales.`);
  };

  const saveDealer = async (dealer: Omit<Dealer, "id">) => {
    setSaving(true);
    setError("");
    try {
      await createDealer(dealer);
      setShowDealerForm(false);
      onNotice("Dealer registered.");
      await refresh();
    } catch (requestError) {
      setError(apiErrorMessage(requestError, "Could not register this dealer."));
    } finally {
      setSaving(false);
    }
  };

  const saveSale = async (sale: {
    dealerId: string;
    amountPaid: number;
    paymentMethod: string;
    items: { productId: string; quantity: number; unitPrice: number }[];
  }) => {
    setSaving(true);
    setError("");
    try {
      await createDealerSale(sale);
      setShowSaleForm(false);
      onNotice("Dealer sale recorded. Stock was reduced at handover.");
      await Promise.all([refresh(), onProductsChanged()]);
    } catch (requestError) {
      setError(apiErrorMessage(requestError, "Could not record this dealer sale."));
    } finally {
      setSaving(false);
    }
  };

  const savePayment = async (sale: DealerSale, payment: { amount: number; method: string; note: string }) => {
    setSaving(true);
    setError("");
    try {
      await recordDealerPayment(sale.id, payment);
      setPaymentSale(null);
      onNotice("Dealer payment recorded and balance updated.");
      await refresh();
    } catch (requestError) {
      setError(apiErrorMessage(requestError, "Could not record this payment."));
    } finally {
      setSaving(false);
    }
  };

  const printInvoice = (sale: DealerSale) => {
    const dealer = dealerForSale(sale);
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setError("Allow pop-ups to print the dealer invoice.");
      return;
    }
    const formatDate = (value: string) => {
      const date = new Date(value);
      return Number.isNaN(date.getTime())
        ? "—"
        : new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(date);
    };
    const due = Math.max(0, sale.totalAmount - sale.amountPaid);
    const rows = sale.items.map((item, index) => `
      <tr>
        <td class="item-number">${String(index + 1).padStart(2, "0")}</td>
        <td class="item-description"><strong>${safeHtml(item.name)}</strong>${item.sku ? `<small>SKU: ${safeHtml(item.sku)}</small>` : ""}</td>
        <td class="numeric">${item.quantity}</td>
        <td class="numeric">${money(item.unitPrice)}</td>
        <td class="numeric item-amount">${money(item.quantity * item.unitPrice)}</td>
      </tr>`).join("");
    const payments = (sale.payments ?? []).map((payment) => `
      <tr><td>${formatDate(payment.receivedAt)}</td><td>${safeHtml(payment.method.replace(/_/g, " "))}</td>
      <td>${safeHtml(payment.note || "Payment received")}</td><td class="numeric">${money(payment.amount)}</td></tr>`).join("");
    const paymentRows = payments || `<tr><td colspan="4" class="empty-payment">No payment received yet</td></tr>`;
    const paymentLabel = due === 0 ? "PAID" : sale.amountPaid > 0 ? "PARTIALLY PAID" : "PAYMENT DUE";
    const businessName = safeHtml(dealer?.businessName || sale.customer.fullName);
    const dealerName = safeHtml(sale.customer.fullName);
    const dealerAddress = dealer?.address ? `<p>${safeHtml(dealer.address)}</p>` : "";
    const dealerGstin = dealer?.gstin ? `<p><span>GSTIN</span><strong>${safeHtml(dealer.gstin)}</strong></p>` : "";
    const invoiceDate = formatDate(sale.createdAt);
    const logoUrl = new URL("/gs-logo.png", window.location.origin).toString();
    printWindow.document.write(`<!doctype html>
      <html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
      <title>Invoice ${safeHtml(sale.orderNumber)} | Gaurav Sales</title>
      <style>
        :root{color-scheme:light;--ink:#17243a;--muted:#69778b;--line:#e4e9f0;--blue:#234d91;--pale:#f3f6fb;--green:#147d59}
        *{box-sizing:border-box}body{margin:0;background:#eef1f5;color:var(--ink);font:13px/1.5 Arial,Helvetica,sans-serif}
        .sheet{position:relative;width:min(850px,calc(100% - 40px));min-height:1050px;margin:32px auto;padding:48px 54px;background:#fff;box-shadow:0 12px 40px #18283d18}
        .accent{position:absolute;inset:0 0 auto;height:8px;background:linear-gradient(90deg,#173b76,#3c70b7 65%,#90acd2)}
        .masthead{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;padding-bottom:27px;border-bottom:1px solid var(--line)}
        .brand{display:flex;align-items:center;gap:14px}.brand img{width:60px;height:60px;object-fit:contain}
        .brand h1{margin:0;color:var(--blue);font-size:23px;letter-spacing:-.7px}.brand p{margin:4px 0 0;color:var(--muted);font-size:11px}
        .invoice-heading{text-align:right}.invoice-heading h2{margin:0;color:var(--ink);font-size:25px;letter-spacing:1.6px}
        .invoice-heading p{margin:5px 0 10px;color:var(--muted);font-size:11px}
        .badge{display:inline-block;border:1px solid #d5e0ef;border-radius:20px;padding:5px 10px;background:#f1f5fb;color:var(--blue);font-size:9px;font-weight:700;letter-spacing:.7px}
        .badge.paid{border-color:#cbe9dc;background:#eff9f4;color:var(--green)}.badge.due{border-color:#f2dfba;background:#fff8e9;color:#9b6710}
        .parties{display:grid;grid-template-columns:1.15fr .85fr;gap:34px;padding:28px 0}
        .eyebrow{margin:0 0 11px;color:#8591a2;font-size:9px;font-weight:700;letter-spacing:1.25px;text-transform:uppercase}
        .bill-to{border-left:3px solid #426ca6;padding-left:15px}.bill-to h3{margin:0 0 5px;font-size:16px}
        .bill-to p{margin:3px 0;color:var(--muted);font-size:11px}.bill-to .contact{margin-top:9px;color:#35465f}
        .invoice-info{display:grid;grid-template-columns:1fr 1fr;gap:12px 18px;align-content:start}
        .info-cell{padding:0 0 9px;border-bottom:1px solid var(--line)}.info-cell span{display:block;margin-bottom:4px;color:#8591a2;font-size:9px;font-weight:700;letter-spacing:.7px;text-transform:uppercase}
        .info-cell strong{font-size:11px;overflow-wrap:anywhere}
        table{width:100%;border-collapse:collapse}thead{display:table-header-group}
        .items th{padding:11px 9px;background:#f1f4f8;color:#68778b;font-size:9px;letter-spacing:.7px;text-align:left;text-transform:uppercase}
        .items td{padding:13px 9px;border-bottom:1px solid var(--line);font-size:11px}
        .items tbody tr:nth-child(even){background:#fbfcfe}.items .item-number{width:42px;color:#8692a2;font-size:10px}
        .item-description strong{display:block;color:#25344a;font-size:11px}.item-description small{display:block;margin-top:3px;color:#8994a3;font-size:9px}
        .numeric{text-align:right;white-space:nowrap}.item-amount{font-weight:700}
        .summary-row{display:flex;justify-content:flex-end;margin-top:22px}.totals{width:min(310px,100%);padding:15px 17px;border:1px solid var(--line);border-radius:8px;background:#fafbfd}
        .totals p{display:flex;justify-content:space-between;gap:20px;margin:0;padding:6px 0;color:var(--muted);font-size:11px}
        .totals strong{color:var(--ink);font-size:11px}.totals .grand{margin-top:5px;padding-top:12px;border-top:1px solid #dce3ed;color:var(--ink);font-size:13px;font-weight:700}
        .totals .grand strong{color:var(--blue);font-size:17px}.totals .balance{margin:9px -5px -5px;padding:10px;border-radius:5px;background:#fff4e5;color:#8a5708;font-weight:700}
        .totals .balance.settled{background:#eaf7f0;color:var(--green)}.totals .balance strong{color:inherit;font-size:13px}
        .payments{margin-top:28px}.payments h3{margin:0 0 9px;font-size:12px}
        .payment-table th{padding:9px;background:#f7f8fa;color:#778498;font-size:9px;text-align:left;text-transform:uppercase}
        .payment-table td{padding:9px;border-bottom:1px solid var(--line);color:#46556a;font-size:10px}
        .payment-table .empty-payment{text-align:center;color:#8b96a5}
        .footer{display:flex;justify-content:space-between;gap:25px;margin-top:40px;padding-top:19px;border-top:1px solid var(--line)}
        .footer-note{max-width:370px;color:var(--muted);font-size:10px}.footer-note strong{display:block;margin-bottom:4px;color:#35465f}
        .signature{width:175px;margin-top:25px;border-top:1px solid #aeb8c6;padding-top:8px;color:#778498;font-size:9px;text-align:center}
        .thank-you{margin-top:26px;color:#718096;font-size:10px;text-align:center}
        @page{size:A4;margin:0} @media print{body{background:#fff}.sheet{width:100%;min-height:0;margin:0;padding:38px 44px;box-shadow:none}.accent{-webkit-print-color-adjust:exact;print-color-adjust:exact}thead th,.badge,.totals,.items tbody tr:nth-child(even){-webkit-print-color-adjust:exact;print-color-adjust:exact}.items tr,.payments tr,.totals,.parties{break-inside:avoid}.footer{margin-top:32px}}
        @media(max-width:620px){.sheet{width:100%;margin:0;padding:28px 22px}.masthead{gap:12px}.brand img{width:45px;height:45px}.brand h1{font-size:18px}.invoice-heading h2{font-size:19px}.parties{grid-template-columns:1fr;gap:22px}.invoice-info{grid-template-columns:1fr 1fr}.items th,.items td{padding:9px 5px;font-size:9px}.footer{flex-direction:column}.signature{margin-top:12px}}
      </style></head><body><main class="sheet"><div class="accent"></div>
      <header class="masthead"><div class="brand"><img src="${logoUrl}" alt="Gaurav Sales logo"><div><h1>Gaurav Sales</h1><p>Inverters · Batteries · Solar Power</p></div></div>
      <div class="invoice-heading"><h2>INVOICE</h2><p>Dealer sales invoice</p><span class="badge ${due === 0 ? "paid" : "due"}">${paymentLabel}</span></div></header>
      <section class="parties"><div class="bill-to"><h4 class="eyebrow">Billed to</h4><h3>${businessName}</h3>
        <p>${dealerName}</p><p class="contact">${safeHtml(sale.customer.phoneNumber)}</p>${dealerAddress}${dealerGstin}</div>
        <div class="invoice-info"><div class="info-cell"><span>Invoice number</span><strong>${safeHtml(sale.orderNumber)}</strong></div>
        <div class="info-cell"><span>Invoice date</span><strong>${invoiceDate}</strong></div>
        <div class="info-cell"><span>Payment terms</span><strong>Due on receipt</strong></div>
        <div class="info-cell"><span>Payment method</span><strong>${safeHtml(sale.payments?.length ? sale.payments[sale.payments.length - 1].method.replace(/_/g, " ") : "Credit / due")}</strong></div>
      </div></section>
      <table class="items"><thead><tr><th>#</th><th>Product / description</th><th class="numeric">Qty</th><th class="numeric">Unit price</th><th class="numeric">Amount</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="summary-row"><section class="totals"><p><span>Subtotal</span><strong>${money(sale.totalAmount)}</strong></p>
        <p><span>Tax</span><strong>Not included</strong></p><p class="grand"><span>Total</span><strong>${money(sale.totalAmount)}</strong></p>
        <p><span>Amount received</span><strong>${money(sale.amountPaid)}</strong></p>
        <p class="balance ${due === 0 ? "settled" : ""}"><span>${due === 0 ? "Balance settled" : "Balance due"}</span><strong>${money(due)}</strong></p></section></div>
      <section class="payments"><h3>Payment history</h3><table class="payment-table"><thead><tr><th>Date</th><th>Method</th><th>Reference / note</th><th class="numeric">Received</th></tr></thead><tbody>${paymentRows}</tbody></table></section>
      <footer class="footer"><div class="footer-note"><strong>Notes</strong>Please retain this invoice for your records. Contact Gaurav Sales for any questions about this transaction.</div><div class="signature">Authorised signatory</div></footer>
      <p class="thank-you">Thank you for your business.</p>
      <script>window.addEventListener("load",()=>{const image=document.querySelector("img");if(image.complete){window.print()}else{image.addEventListener("load",()=>window.print(),{once:true});image.addEventListener("error",()=>window.print(),{once:true})}})</script>
      </main></body></html>`);
    printWindow.document.close();
  };

  return (
    <section className="dealer-sales-section">
      <div className="admin-section-heading">
        <div>
          <span className="admin-eyebrow">B2B ACCOUNTS</span>
          <h1>Dealer sales</h1>
          <p>Register dealers, record stock handovers, and track payments due.</p>
        </div>
        <div className="dealer-sales-actions">
          <button className="admin-secondary-button" type="button" onClick={() => setShowDealerForm(true)}>
            <IconPlus size={16} /> Add dealer
          </button>
          <button className="admin-primary-button" type="button" disabled={!dealers.length || !products.length} onClick={() => setShowSaleForm(true)}>
            <IconReceipt size={16} /> New dealer sale
          </button>
        </div>
      </div>

      {error && <div className="admin-notice is-error" role="alert">{error}<button aria-label="Dismiss error" onClick={() => setError("")}><IconX size={17} /></button></div>}

      <div className="admin-stat-grid dealer-sales-stats">
        <div className="admin-stat-card"><div className="stat-card-top">Registered dealers <span className="stat-icon purple"><IconBuildingStore /></span></div><strong className="stat-value">{dealers.length}</strong><span className="stat-helper">Active dealer accounts</span></div>
        <div className="admin-stat-card"><div className="stat-card-top">Dealer sales <span className="stat-icon blue"><IconReceipt /></span></div><strong className="stat-value">{sales.length}</strong><span className="stat-helper">Products handed over</span></div>
        <div className="admin-stat-card"><div className="stat-card-top">Outstanding balance <span className="stat-icon orange"><IconBuildingStore /></span></div><strong className="stat-value">{money(totalDue)}</strong><span className="stat-helper">Across all dealer accounts</span></div>
        <div className="admin-stat-card"><div className="stat-card-top">In stock catalog <span className="stat-icon green"><IconReceipt /></span></div><strong className="stat-value">{products.filter((product) => product.stock > 0).length}</strong><span className="stat-helper">Products available for sale</span></div>
      </div>

      <div className="admin-panel-card dealer-account-panel">
        <div className="admin-panel-heading">
          <div><h2>Dealer account balances</h2><p>Outstanding amount is calculated from recorded sales and payments.</p></div>
          <button className="admin-secondary-button" type="button" disabled={loading || !dealers.length} onClick={exportDealers}>
            <IconDownload size={15} /> Export dealers
          </button>
        </div>
        {loading ? <div className="admin-table-loader">Loading dealer accounts...</div> : dealers.length ? (
          <div className="dealer-account-grid">
            {dealers.map((dealer) => {
              const balance = sales.filter((sale) => dealerForSale(sale)?.id === dealer.id || sale.dealerId === dealer.id)
                .reduce((sum, sale) => sum + Math.max(0, sale.totalAmount - sale.amountPaid), 0);
              return <article className="dealer-account-card" key={dealer.id}>
                <span className="dealer-account-avatar"><IconBuildingStore size={18} /></span>
                <div><strong>{dealer.businessName}</strong><small>{dealer.name} · {dealer.phoneNumber}</small></div>
                <b>{money(balance)} due</b>
              </article>;
            })}
          </div>
        ) : <div className="admin-empty-inline">No dealers yet. Register a dealer before recording a dealer sale.</div>}
      </div>

      <div className="admin-panel-card admin-table-panel dealer-sales-table-panel">
        <div className="admin-table-toolbar">
          <div><h2>Dealer ledger</h2><p>Each row is a completed handover and its payment balance.</p></div>
          <div className="dealer-export-actions">
            <select className="admin-filter-button order-filter" aria-label="Filter sales by dealer" value={dealerFilter} onChange={(event) => setDealerFilter(event.currentTarget.value)}>
              <option value="all">All dealers</option>
              {dealers.map((dealer) => <option key={dealer.id} value={dealer.id}>{dealer.businessName}</option>)}
            </select>
            <button className="admin-secondary-button" type="button" disabled={loading || !sales.length} onClick={exportDealerSales}>
              <IconDownload size={15} /> Export all sales
            </button>
          </div>
        </div>
        <div className="admin-table-scroll">
          <table className="admin-table dealer-sales-table">
            <thead><tr><th>INVOICE</th><th>DEALER</th><th>DATE</th><th>TOTAL</th><th>RECEIVED</th><th>DUE</th><th>PAYMENT</th><th>ACTIONS</th></tr></thead>
            <tbody>
              {!loading && visibleSales.map((sale) => {
                const dealer = dealerForSale(sale);
                const due = Math.max(0, sale.totalAmount - sale.amountPaid);
                return <tr key={sale.id}>
                  <td><strong>{sale.orderNumber}</strong><small className="dealer-item-count">{sale.items.reduce((sum, item) => sum + item.quantity, 0)} item(s)</small></td>
                  <td><strong>{dealer?.businessName || sale.customer.fullName}</strong><small className="dealer-item-count">{sale.customer.phoneNumber}</small></td>
                  <td>{new Date(sale.createdAt).toLocaleDateString("en-IN")}</td>
                  <td>{money(sale.totalAmount)}</td><td>{money(sale.amountPaid)}</td>
                  <td className={due > 0 ? "dealer-due" : "dealer-settled"}>{money(due)}</td>
                  <td><span className={`dealer-payment-badge ${sale.paymentStatus.toLowerCase()}`}>{sale.paymentStatus.replace(/_/g, " ")}</span></td>
                  <td><div className="dealer-sale-row-actions">
                    <button className="admin-secondary-button" type="button" onClick={() => printInvoice(sale)} aria-label={`Print invoice ${sale.orderNumber}`}><IconPrinter size={15} /> Invoice</button>
                    {due > 0 && <button className="admin-primary-button" type="button" onClick={() => setPaymentSale(sale)}>Receive payment</button>}
                  </div></td>
                </tr>;
              })}
              {!loading && !visibleSales.length && <tr><td colSpan={8}><div className="admin-empty-state"><IconReceipt size={28} /><strong>No dealer sales found</strong><p>Record a sale when a dealer takes products from your stock.</p></div></td></tr>}
            </tbody>
          </table>
          {loading && <div className="admin-table-loader">Loading dealer ledger...</div>}
        </div>
        <div className="admin-table-footer">Showing <strong>{visibleSales.length}</strong> of {sales.length} dealer sales</div>
      </div>

      {showDealerForm && <DealerForm saving={saving} onClose={() => setShowDealerForm(false)} onSave={saveDealer} />}
      {showSaleForm && <SaleForm dealers={dealers} products={products} saving={saving} onClose={() => setShowSaleForm(false)} onSave={saveSale} />}
      {paymentSale && <PaymentForm sale={paymentSale} saving={saving} onClose={() => setPaymentSale(null)} onSave={(payment) => savePayment(paymentSale, payment)} />}
    </section>
  );
}

function Modal({ title, description, children, onClose }: { title: string; description: string; children: React.ReactNode; onClose: () => void }) {
  return <div className="admin-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="admin-product-form dealer-modal" aria-label={title}>
      <div className="admin-form-heading"><div><span className="admin-eyebrow">DEALER MANAGEMENT</span><h2>{title}</h2><p>{description}</p></div>
        <button type="button" className="admin-modal-close" aria-label="Close form" onClick={onClose}><IconX /></button>
      </div>
      {children}
    </section>
  </div>;
}

function DealerForm({ saving, onClose, onSave }: { saving: boolean; onClose: () => void; onSave: (dealer: Omit<Dealer, "id">) => void }) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSave({
      name: String(form.get("name")).trim(),
      businessName: String(form.get("businessName")).trim(),
      phoneNumber: String(form.get("phoneNumber")).trim(),
      email: String(form.get("email")).trim(),
      gstin: String(form.get("gstin")).trim(),
      address: String(form.get("address")).trim(),
    });
  };
  return <Modal title="Register a dealer" description="Save dealer details for invoices and account balance tracking." onClose={onClose}>
    <form className="admin-form-content" onSubmit={submit}>
      <div className="admin-form-row"><label>Contact name<input name="name" required maxLength={100} /></label><label>Business name<input name="businessName" required maxLength={120} /></label></div>
      <div className="admin-form-row"><label>Phone number<input name="phoneNumber" required type="tel" minLength={7} maxLength={20} /></label><label>Email (optional)<input name="email" type="email" maxLength={160} /></label></div>
      <div className="admin-form-row"><label>GSTIN (optional)<input name="gstin" maxLength={20} /></label><label>Business address (optional)<input name="address" maxLength={250} /></label></div>
      <div className="admin-form-actions"><button type="button" className="admin-secondary-button" onClick={onClose}>Cancel</button><button className="admin-primary-button" type="submit" disabled={saving}>{saving ? "Saving..." : "Register dealer"}</button></div>
    </form>
  </Modal>;
}

function SaleForm({ dealers, products, saving, onClose, onSave }: {
  dealers: Dealer[];
  products: Product[];
  saving: boolean;
  onClose: () => void;
  onSave: (sale: { dealerId: string; amountPaid: number; paymentMethod: string; items: { productId: string; quantity: number; unitPrice: number }[] }) => void;
}) {
  const [dealerId, setDealerId] = useState(dealers[0]?.id ?? "");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [amountPaid, setAmountPaid] = useState("0");
  const [lines, setLines] = useState<SaleLine[]>([{ productId: "", quantity: "1", unitPrice: "" }]);
  const total = Math.round((lines.reduce((sum, line) => sum + (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0), 0) + Number.EPSILON) * 100) / 100;
  const changeLine = (index: number, patch: Partial<SaleLine>) =>
    setLines((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, ...patch } : line));
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave({
      dealerId,
      amountPaid: Number(amountPaid),
      paymentMethod: Number(amountPaid) > 0 ? paymentMethod : "CREDIT",
      items: lines.map((line) => ({ productId: line.productId, quantity: Number(line.quantity), unitPrice: Number(line.unitPrice) })),
    });
  };
  return <Modal title="Record dealer handover" description="Stock is deducted as soon as the sale is saved. Set each dealer price and record any amount received." onClose={onClose}>
    <form className="admin-form-content dealer-sale-form" onSubmit={submit}>
      <label>Dealer<select required value={dealerId} onChange={(event) => setDealerId(event.currentTarget.value)}>{dealers.map((dealer) => <option key={dealer.id} value={dealer.id}>{dealer.businessName} — {dealer.name}</option>)}</select></label>
      <div className="dealer-line-items"><div className="dealer-lines-heading"><strong>Products and dealer prices</strong><button type="button" className="admin-secondary-button" onClick={() => setLines((current) => [...current, { productId: "", quantity: "1", unitPrice: "" }])}><IconPlus size={15} /> Add product</button></div>
        {lines.map((line, index) => {
          const selected = products.find((product) => product.id === line.productId);
          const selectedIds = new Set(lines.filter((_, lineIndex) => lineIndex !== index).map((item) => item.productId));
          return <div className="dealer-line-row" key={index}>
            <label>Product<select required value={line.productId} onChange={(event) => {
              const product = products.find((candidate) => candidate.id === event.currentTarget.value);
              changeLine(index, { productId: event.currentTarget.value, unitPrice: product ? String(product.discountPrice > 0 ? product.discountPrice : product.price) : "" });
            }}><option value="">Select product</option>{products.filter((product) => product.stock > 0 && (!selectedIds.has(product.id) || product.id === line.productId)).map((product) => <option key={product.id} value={product.id}>{product.name} · {product.stock} in stock</option>)}</select><small>{selected ? `${selected.stock} available` : "Only products with stock are listed"}</small></label>
            <label>Quantity<input required type="number" min="1" max={selected?.stock ?? undefined} step="1" value={line.quantity} onChange={(event) => changeLine(index, { quantity: event.currentTarget.value })} /></label>
            <label>Dealer price<input required type="number" min="0" step="0.01" value={line.unitPrice} onChange={(event) => changeLine(index, { unitPrice: event.currentTarget.value })} /></label>
            <button type="button" className="dealer-remove-line" aria-label="Remove product" disabled={lines.length === 1} onClick={() => setLines((current) => current.filter((_, lineIndex) => lineIndex !== index))}><IconX size={17} /></button>
          </div>;
        })}
      </div>
      <div className="dealer-sale-payment-row"><label>Amount received now<input type="number" min="0" max={total} step="0.01" required value={amountPaid} onChange={(event) => setAmountPaid(event.currentTarget.value)} /></label>
        {Number(amountPaid) > 0 && <label>Payment method<select value={paymentMethod} onChange={(event) => setPaymentMethod(event.currentTarget.value)}><option value="CASH">Cash</option><option value="UPI">UPI</option><option value="BANK_TRANSFER">Bank transfer</option><option value="CHEQUE">Cheque</option></select></label>}
        <div className="dealer-sale-total"><span>Total</span><strong>{money(total)}</strong><small>Due after payment: {money(Math.max(0, total - (Number(amountPaid) || 0)))}</small></div>
      </div>
      <div className="admin-form-actions"><button type="button" className="admin-secondary-button" onClick={onClose}>Cancel</button><button className="admin-primary-button" type="submit" disabled={saving || !products.length}>{saving ? "Saving..." : "Save handover"}</button></div>
    </form>
  </Modal>;
}

function PaymentForm({ sale, saving, onClose, onSave }: {
  sale: DealerSale;
  saving: boolean;
  onClose: () => void;
  onSave: (payment: { amount: number; method: string; note: string }) => void;
}) {
  const due = Math.max(0, sale.totalAmount - sale.amountPaid);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSave({ amount: Number(form.get("amount")), method: String(form.get("method")), note: String(form.get("note")).trim() });
  };
  return <Modal title="Receive dealer payment" description={`${sale.orderNumber} · ${money(due)} remaining`} onClose={onClose}>
    <form className="admin-form-content" onSubmit={submit}>
      <label>Amount received<input name="amount" type="number" min="0.01" max={due} step="0.01" required /></label>
      <label>Payment method<select name="method" defaultValue="CASH"><option value="CASH">Cash</option><option value="UPI">UPI</option><option value="BANK_TRANSFER">Bank transfer</option><option value="CHEQUE">Cheque</option></select></label>
      <label>Note (optional)<input name="note" maxLength={200} placeholder="Reference or receipt details" /></label>
      <div className="admin-form-actions"><button type="button" className="admin-secondary-button" onClick={onClose}>Cancel</button><button className="admin-primary-button" type="submit" disabled={saving}>{saving ? "Saving..." : "Record payment"}</button></div>
    </form>
  </Modal>;
}
