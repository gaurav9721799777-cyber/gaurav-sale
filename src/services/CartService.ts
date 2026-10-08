import axiosInstance from "../interceptor/AxiosInterceptor";

export type CartLine = { productId: string; quantity: number };
export type CartRecord = { id?: string; cartId?: string; items?: unknown };

const unwrap = (value: unknown): unknown => {
  if (!value || typeof value !== "object") return value;
  const record = value as Record<string, unknown>;
  return record.data ?? record.cart ?? value;
};

const extractRows = (value: unknown): unknown[] => {
  const body = unwrap(value);
  if (Array.isArray(body)) return body;
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    const rows = record.items ?? record.cartItems ?? record.products;
    return Array.isArray(rows) ? rows : [];
  }
  return [];
};

export const normalizeCartLines = (payload: unknown): CartLine[] => {
  const lines = new Map<string, number>();
  extractRows(payload).forEach((value) => {
    if (!value || typeof value !== "object") return;
    const row = value as Record<string, unknown>;
    const product = row.product && typeof row.product === "object"
      ? row.product as Record<string, unknown>
      : undefined;
    const productId = String(row.productId ?? product?.id ?? row.id ?? "");
    const quantity = Number(row.quantity ?? row.qty ?? 1);
    if (productId && Number.isFinite(quantity) && quantity > 0) {
      lines.set(productId, (lines.get(productId) || 0) + Math.floor(quantity));
    }
  });
  return Array.from(lines, ([productId, quantity]) => ({ productId, quantity }));
};

export const getCart = async (cartId: string): Promise<CartRecord> => {
  const response = await axiosInstance.get<unknown>(`/api/cart/${encodeURIComponent(cartId)}`);
  const body = unwrap(response.data);
  return body && typeof body === "object" ? body as CartRecord : {};
};

const toBackendProductId = (productId: string): number => {
  const id = Number(productId);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("This product has an invalid ID and cannot be added to the cart.");
  }
  return id;
};

export const addCartItem = async (cartId: string, productId: string, quantity = 1): Promise<void> => {
  await axiosInstance.post(`/api/cart/${encodeURIComponent(cartId)}/items`, {
    productId: toBackendProductId(productId),
    quantity: Math.floor(quantity),
  });
};

export const updateCartItem = async (cartId: string, productId: string, quantity: number): Promise<void> => {
  await axiosInstance.put(`/api/cart/${encodeURIComponent(cartId)}/items/${toBackendProductId(productId)}`, { quantity: Math.floor(quantity) });
};

export const removeCartItem = async (cartId: string, productId: string): Promise<void> => {
  await axiosInstance.delete(`/api/cart/${encodeURIComponent(cartId)}/items/${toBackendProductId(productId)}`);
};

export const clearCart = async (cartId: string): Promise<void> => {
  await axiosInstance.delete(`/api/cart/${encodeURIComponent(cartId)}/items`);
};
