import axiosInstance from "../interceptor/AxiosInterceptor";

export type OrderStatus = "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";
export enum PaymentStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  REFUNDED = "REFUNDED",
}
export const paymentStatuses = Object.values(PaymentStatus);
export type AdminOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  email: string;
  date: string;
  amount: number;
  status: OrderStatus;
  paymentStatus: string;
  raw: Record<string, unknown>;
};

const unwrap = (payload: unknown): unknown => {
  if (!payload || typeof payload !== "object") return payload;
  const envelope = payload as Record<string, unknown>;
  if (envelope.success === false) throw new Error(typeof envelope.message === "string" ? envelope.message : "The order request failed.");
  return envelope.data ?? envelope.order ?? payload;
};

const ensureSuccess = (payload: unknown): void => {
  if (!payload || typeof payload !== "object") return;
  const response = payload as Record<string, unknown>;
  if (response.success === false) throw new Error(typeof response.message === "string" ? response.message : "The order update was not accepted.");
};

const orderList = (payload: unknown): Record<string, unknown>[] => {
  const value = unwrap(payload);
  if (Array.isArray(value)) return value.filter((item) => !!item && typeof item === "object") as Record<string, unknown>[];
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  for (const key of ["orders", "content", "items", "results", "data"]) {
    if (record[key] !== undefined && record[key] !== value) {
      const rows = orderList(record[key]);
      if (rows.length || Array.isArray(record[key])) return rows;
    }
  }
  return [];
};

const asText = (...values: unknown[]): string => {
  const found = values.find((value) => value !== null && value !== undefined && String(value).trim() !== "");
  return found === undefined ? "" : String(found);
};

const asNumber = (...values: unknown[]): number => {
  const found = values.find((value) => value !== null && value !== undefined && value !== "");
  const parsed = Number(found ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatDate = (value: unknown): string => {
  if (!value) return "—";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
};

export const normalizeAdminOrder = (row: Record<string, unknown>): AdminOrder => {
  const customerValue = row.customer ?? row.customerDetails;
  const customer = customerValue && typeof customerValue === "object" ? customerValue as Record<string, unknown> : {};
  const shippingValue = row.shippingAddress ?? row.shipping_address;
  const shipping = shippingValue && typeof shippingValue === "object" ? shippingValue as Record<string, unknown> : {};
  const payment = row.payment && typeof row.payment === "object" ? row.payment as Record<string, unknown> : {};
  const rawStatus = asText(row.orderStatus, row.status, "PENDING").toUpperCase().replace(/[\s-]+/g, "_");
  const validStatuses: OrderStatus[] = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];
  const status = validStatuses.includes(rawStatus as OrderStatus) ? rawStatus as OrderStatus : "PENDING";
  return {
    id: asText(row.id, row.orderId, row.order_id),
    orderNumber: asText(row.orderNumber, row.order_number, row.number, row.orderNo),
    customerName: asText(row.fullName, row.full_name, row.customerName, row.customer_name, row.customerFullName, row.name, customer.fullName, customer.full_name, customer.name, shipping.fullName, shipping.full_name, shipping.name, "Customer"),
    email: asText(row.email, row.customerEmail, row.customer_email, customer.email),
    date: formatDate(row.createdAt ?? row.created_at ?? row.orderDate ?? row.order_date ?? row.createdOn ?? row.date),
    amount: asNumber(row.totalAmount, row.total_amount, row.amount, row.total, row.grandTotal, row.totalPrice, row.orderAmount),
    status,
    paymentStatus: asText(row.paymentStatus, row.payment_status, payment.status, "UNKNOWN").toUpperCase().replace(/[\s-]+/g, "_"),
    raw: row,
  };
};

export const listAdminOrders = async (): Promise<AdminOrder[]> => {
  const response = await axiosInstance.get<unknown>("/api/orders/admin");
  return orderList(response.data).map(normalizeAdminOrder);
};

export const listAdminOrdersByStatus = async (status: string): Promise<AdminOrder[]> => {
  const response = await axiosInstance.get<unknown>(`/api/orders/admin/status/${encodeURIComponent(status)}`);
  return orderList(response.data).map(normalizeAdminOrder);
};

export const listAdminOrdersByPaymentStatus = async (status: string): Promise<AdminOrder[]> => {
  const response = await axiosInstance.get<unknown>(`/api/orders/admin/payment-status/${encodeURIComponent(status)}`);
  return orderList(response.data).map(normalizeAdminOrder);
};

const getAdminOrder = async (path: string): Promise<AdminOrder> => {
  const response = await axiosInstance.get<unknown>(path);
  const value = unwrap(response.data);
  if (!value || typeof value !== "object") throw new Error("The order was not found.");
  return normalizeAdminOrder(value as Record<string, unknown>);
};

export const getAdminOrderById = (id: string): Promise<AdminOrder> => getAdminOrder(`/api/orders/admin/${encodeURIComponent(id)}`);
export const getAdminOrderByNumber = (number: string): Promise<AdminOrder> => getAdminOrder(`/api/orders/admin/number/${encodeURIComponent(number)}`);

export const updateAdminOrderStatus = async (id: string, status: string): Promise<void> => {
  const response = await axiosInstance.patch<unknown>(`/api/orders/admin/${encodeURIComponent(id)}/status`, null, { params: { status, orderStatus: status } });
  ensureSuccess(response.data);
};

export const updateAdminPaymentStatus = async (id: string, paymentStatus: PaymentStatus): Promise<void> => {
  const response = await axiosInstance.patch<unknown>(`/api/orders/admin/${encodeURIComponent(id)}/payment-status`, null, { params: { status: paymentStatus, paymentStatus } });
  ensureSuccess(response.data);
};

export const cancelAdminOrder = async (id: string): Promise<void> => {
  const response = await axiosInstance.patch<unknown>(`/api/orders/admin/${encodeURIComponent(id)}/cancel`);
  ensureSuccess(response.data);
};

const numberResponse = (payload: unknown): number => {
  const value = unwrap(payload);
  if (typeof value === "number" || typeof value === "string") return asNumber(value);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return asNumber(record.count, record.total, record.totalOrders, record.revenue, record.totalRevenue, record.value);
  }
  return 0;
};

export const getAdminOrderCount = async (): Promise<number> => numberResponse((await axiosInstance.get<unknown>("/api/orders/admin/count")).data);
export const getAdminOrderCountByStatus = async (status: string): Promise<number> => numberResponse((await axiosInstance.get<unknown>(`/api/orders/admin/count/status/${encodeURIComponent(status)}`)).data);
export const getAdminRevenue = async (): Promise<number> => numberResponse((await axiosInstance.get<unknown>("/api/orders/admin/revenue")).data);

export const getAdminOrderDashboard = async (): Promise<Record<string, unknown>> => {
  const response = await axiosInstance.get<unknown>("/api/orders/admin/dashboard");
  const value = unwrap(response.data);
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
};
