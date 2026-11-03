import axiosInstance from "../interceptor/AxiosInterceptor";

export type Dealer = {
  id: string;
  name: string;
  businessName: string;
  phoneNumber: string;
  email: string;
  gstin: string;
  address: string;
};

export type DealerSale = {
  id: string;
  orderNumber: string;
  customer: { fullName: string; phoneNumber: string };
  dealerId: Dealer | string;
  createdAt: string;
  totalAmount: number;
  amountPaid: number;
  paymentStatus: "PENDING" | "PARTIALLY_PAID" | "PAID";
  items: { name: string; sku: string; quantity: number; unitPrice: number }[];
  payments: { amount: number; method: string; note: string; receivedAt: string }[];
};

const unwrap = <T,>(payload: unknown): T => {
  if (!payload || typeof payload !== "object") throw new Error("The server returned an invalid response.");
  const record = payload as Record<string, unknown>;
  if (record.success === false) {
    throw new Error(typeof record.message === "string" ? record.message : "The request was not accepted.");
  }
  return (record.data ?? payload) as T;
};

export const listDealers = async (): Promise<Dealer[]> =>
  unwrap<Dealer[]>((await axiosInstance.get<unknown>("/api/dealers")).data);

export const createDealer = async (dealer: Omit<Dealer, "id">): Promise<Dealer> =>
  unwrap<Dealer>((await axiosInstance.post<unknown>("/api/dealers", dealer)).data);

export const listDealerSales = async (): Promise<DealerSale[]> =>
  unwrap<DealerSale[]>((await axiosInstance.get<unknown>("/api/dealer-sales")).data);

export const createDealerSale = async (sale: {
  dealerId: string;
  amountPaid: number;
  paymentMethod: string;
  items: { productId: string; quantity: number; unitPrice: number }[];
}): Promise<DealerSale> =>
  unwrap<DealerSale>((await axiosInstance.post<unknown>("/api/dealer-sales", sale)).data);

export const recordDealerPayment = async (
  saleId: string,
  payment: { amount: number; method: string; note: string },
): Promise<DealerSale> =>
  unwrap<DealerSale>((await axiosInstance.post<unknown>(`/api/dealer-sales/${encodeURIComponent(saleId)}/payments`, payment)).data);
