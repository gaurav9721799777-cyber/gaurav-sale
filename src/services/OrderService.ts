import axiosInstance from "../interceptor/AxiosInterceptor";
import { apiErrorMessage } from "./apiError";

export type PlaceOrderRequest = {
  fullName: string;
  phoneNumber: string;
  email?: string;
  streetAddress: string;
  city: string;
  postalCode: string;
  countryRegion: string;
  deliveryInstructions?: string;
  paymentMethod: "CASH_ON_DELIVERY";
};

export type OrderRecord = Record<string, unknown>;

const unwrap = (payload: unknown): OrderRecord => {
  if (!payload || typeof payload !== "object") return {};
  const wrapper = payload as Record<string, unknown>;
  if (wrapper.success === false) {
    throw new Error(typeof wrapper.message === "string" ? wrapper.message : "The order request was not accepted.");
  }
  const data = wrapper.data ?? wrapper.order ?? payload;
  return data && typeof data === "object" ? data as OrderRecord : {};
};

export const placeOrder = async (cartId: string, request: PlaceOrderRequest): Promise<OrderRecord> => {
  const response = await axiosInstance.post<unknown>(`/api/orders/${encodeURIComponent(cartId)}`, request);
  return unwrap(response.data);
};

export const getOrderById = async (id: string): Promise<OrderRecord> => {
  const response = await axiosInstance.get<unknown>(`/api/orders/${encodeURIComponent(id)}`);
  return unwrap(response.data);
};

export const getOrderByNumber = async (orderNumber: string): Promise<OrderRecord> => {
  const response = await axiosInstance.get<unknown>(`/api/orders/number/${encodeURIComponent(orderNumber)}`);
  return unwrap(response.data);
};

export const getOrderErrorMessage = (error: unknown): string => {
  return apiErrorMessage(error, "We couldn't place that order. Please review the details and try again.");
};
