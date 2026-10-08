import axiosInstance from "../interceptor/AxiosInterceptor";

export type Brand = {
  id: number | string;
  name: string;
  slug: string;
  logoUrl?: string;
  active?: boolean;
};

type BrandRecord = Partial<Brand> & { brandId?: number | string; brandName?: string; isActive?: boolean; is_active?: boolean; status?: string };

const toBrand = (record: BrandRecord): Brand | null => {
  const name = record.name || record.brandName;
  if (!name) return null;
  const slug = record.slug || name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return {
    id: record.id ?? record.brandId ?? slug,
    name,
    slug,
    logoUrl: record.logoUrl,
    active: (record.active ?? record.isActive ?? record.is_active ?? (record.status ? record.status.toUpperCase() !== "INACTIVE" : true)) !== false,
  };
};

const unwrapBrands = (payload: unknown): BrandRecord[] => {
  if (Array.isArray(payload)) return payload as BrandRecord[];
  if (payload && typeof payload === "object") {
    const envelope = payload as { data?: unknown; brands?: unknown; results?: unknown; items?: unknown };
    for (const value of [envelope.data, envelope.brands, envelope.results, envelope.items]) {
      if (Array.isArray(value)) return value as BrandRecord[];
      if (value && typeof value === "object") {
        const nested = unwrapBrands(value);
        if (nested.length) return nested;
      }
    }
  }
  return [];
};

const unwrapBrand = (payload: unknown): BrandRecord | null => {
  if (!payload || typeof payload !== "object") return null;
  const envelope = payload as { data?: unknown };
  const record = envelope.data && typeof envelope.data === "object" ? envelope.data : payload;
  return Array.isArray(record) ? null : record as BrandRecord;
};

export const getBrands = async (includeInactive = false): Promise<Brand[]> => {
  const response = await axiosInstance.get<unknown>("/api/brands");
  return unwrapBrands(response.data).map(toBrand).filter((brand): brand is Brand => !!brand && (includeInactive || brand.active !== false));
};

export type BrandWriteRequest = { name: string; slug: string; logoUrl: string; active: boolean };
const unwrapBrandResult = (payload: unknown): Brand => {
  const brand = toBrand(unwrapBrand(payload) || {});
  if (!brand) throw new Error("The brand service returned an invalid brand.");
  return brand;
};
export const createBrand = async (value: BrandWriteRequest): Promise<Brand> => {
  const response = await axiosInstance.post<unknown>("/api/brands", value);
  return unwrapBrandResult(response.data);
};
export const updateBrand = async (id: number | string, value: BrandWriteRequest): Promise<Brand> => {
  const response = await axiosInstance.put<unknown>(`/api/brands/${encodeURIComponent(String(id))}`, value);
  return unwrapBrandResult(response.data);
};
export const deleteBrand = async (id: number | string): Promise<void> => {
  await axiosInstance.delete(`/api/brands/${encodeURIComponent(String(id))}`);
};

export const getBrandById = async (id: number | string): Promise<Brand> => {
  const response = await axiosInstance.get<unknown>(`/api/brands/${encodeURIComponent(String(id))}`);
  const brand = toBrand(unwrapBrand(response.data) || {});
  if (!brand) throw new Error("Brand not found.");
  return brand;
};

export const brandKey = (brand: Pick<Brand, "name" | "slug">): string =>
  brand.slug || brand.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const BrandService = { getBrands, getBrandById };
export default BrandService;
