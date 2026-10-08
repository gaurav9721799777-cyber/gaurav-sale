import axiosInstance from "../interceptor/AxiosInterceptor";
import { getBrandById, getBrands, brandKey, type Brand } from "./BrandService";
import { getCategories, getCategoryById, type Category } from "./CategoryServiceService";

const productApiBaseUrl = process.env.REACT_APP_API_URL || "http://localhost:8080";

export const resolveProductImageUrl = (imageUrl?: string): string | undefined => {
  if (!imageUrl) return undefined;
  try {
    return new URL(imageUrl, `${productApiBaseUrl.replace(/\/$/, "")}/`).toString();
  } catch {
    return imageUrl;
  }
};

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  discountPrice: number;
  stock: number;
  sku: string;
  imageUrl: string;
  brandId: number | string;
  categoryId: number | string;

  // Display fields used by the existing Products page.
  brand: string;
  category: string;
  image?: string;
  mainImageUrl?: string;
  brandName?: string;
  categoryName?: string;
  active?: boolean;
}

const lookupKey = (value: unknown): string => String(value ?? "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const belongsToEntity = (product: Product, entity: Category | Brand, kind: "category" | "brand"): boolean => {
  const id = kind === "category" ? product.categoryId : product.brandId;
  if (id !== undefined && id !== null && String(id) !== "" && String(id) === String(entity.id)) return true;
  const values = kind === "category" ? [product.category, product.categoryName] : [product.brand, product.brandName];
  return values.some((value) => {
    const key = lookupKey(value);
    return !!key && [entity.name, entity.slug].some((candidate) => key === lookupKey(candidate));
  });
};

export const productIsInActiveCatalog = (product: Product, categories: Category[], brands: Brand[]): boolean =>
  !categories.some((category) => category.active === false && belongsToEntity(product, category, "category")) &&
  !brands.some((brand) => brand.active === false && belongsToEntity(product, brand, "brand"));

export type ProductWriteRequest = {
  name: string;
  slug: string;
  description: string;
  price: number;
  discountPrice: number;
  stockQuantity: number;
  sku: string;
  image: File | null;
  brandId: number | string;
  categoryId: number | string;
};

const toProductFormData = (product: ProductWriteRequest): FormData => {
  const formData = new FormData();
  formData.append("name", product.name);
  formData.append("slug", product.slug);
  formData.append("description", product.description || "");
  formData.append("price", String(product.price));
  formData.append("discountPrice", String(product.discountPrice));
  formData.append("stockQuantity", String(product.stockQuantity));
  if (product.sku) formData.append("sku", product.sku);
  formData.append("brandId", String(product.brandId));
  formData.append("categoryId", String(product.categoryId));
  if (product.image) formData.append("image", product.image);
  return formData;
};

const getProductRows = (payload: unknown): Record<string, unknown>[] => {
  if (Array.isArray(payload)) return payload as Record<string, unknown>[];
  if (payload && typeof payload === "object") {
    const result = payload as { data?: unknown; products?: unknown; results?: unknown; items?: unknown; content?: unknown };
    for (const rows of [result.data, result.products, result.results, result.items, result.content]) {
      if (Array.isArray(rows)) return rows as Record<string, unknown>[];
      if (rows && typeof rows === "object") {
        const nestedRows = getProductRows(rows);
        if (nestedRows.length) return nestedRows;
      }
    }
  }
  return [];
};

const normalizeProduct = (row: Record<string, unknown>): Product => {
  const nestedBrand = row.brand && typeof row.brand === "object"
    ? row.brand as Record<string, unknown>
    : undefined;
  const nestedCategory = row.category && typeof row.category === "object"
    ? row.category as Record<string, unknown>
    : undefined;
  const categoryName = String(
    row.categoryName || nestedCategory?.name || nestedCategory?.categoryName ||
    (typeof row.category === "string" ? row.category : ""),
  );
  const categoryId = (row.categoryId ?? nestedCategory?.id ?? nestedCategory?.categoryId ?? "") as number | string;
  const brandName = String(
    row.brandName || nestedBrand?.name || nestedBrand?.brandName ||
    (typeof row.brand === "string" ? row.brand : ""),
  );
  const brandId = row.brandId ?? nestedBrand?.id ?? nestedBrand?.brandId;
  const imageValue = [row.imageUrl, row.mainImageUrl, row.imagePath, row.productImage, row.imageName, row.image]
    .find((value) => typeof value === "string" && value.trim());
  const rawImagePath = typeof imageValue === "string" ? imageValue.trim().replace(/\\/g, "/") : "";
  const productImagePath = rawImagePath && !/^(https?:|data:|blob:|\/)/i.test(rawImagePath) && !rawImagePath.includes("/")
    ? `upload/product/${rawImagePath}`
    : rawImagePath;

  return {
    ...row,
    id: String(row.id ?? ""),
    category: categoryName || String(categoryId),
    categoryName: categoryName || undefined,
    categoryId,
    brandId: brandId as number | string,
    brand: String(row.brandSlug ?? nestedBrand?.slug ?? (brandName || brandId || "")).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    brandName: brandName || undefined,
    name: String(row.name || ""),
    slug: String(row.slug || ""),
    description: String(row.description || ""),
    price: Number(row.price || 0),
    discountPrice: Number(row.discountPrice || 0),
    stock: Number(row.stockQuantity ?? row.stock ?? 0),
    sku: String(row.sku || ""),
    imageUrl: productImagePath,
    image: productImagePath || undefined,
    active: row.active !== false,
  } as Product;
};

export const allProducts = async (): Promise<Product[]> => {
  const response = await axiosInstance.get<unknown>("/api/products");
  if (response.data && typeof response.data === "object" && (response.data as { success?: unknown }).success === false) {
    const message = (response.data as { message?: unknown }).message;
    throw new Error(typeof message === "string" ? message : "The product list could not be loaded.");
  }
  return getProductRows(response.data).map(normalizeProduct);
};

const unwrapProduct = (payload: unknown): Product => {
  if (!payload || typeof payload !== "object") throw new Error("The product service returned an invalid product.");
  const envelope = payload as { success?: unknown; message?: unknown; data?: unknown; product?: unknown };
  if (envelope.success === false) throw new Error(typeof envelope.message === "string" ? envelope.message : "The product request was not accepted.");
  const record = envelope.data ?? envelope.product ?? payload;
  if (!record || typeof record !== "object") throw new Error("The product service returned an invalid product.");
  return normalizeProduct(record as Record<string, unknown>);
};

export const getProductById = async (id: number | string): Promise<Product> => {
  const response = await axiosInstance.get<unknown>(`/api/products/${encodeURIComponent(String(id))}`);
  return unwrapProduct(response.data);
};

export const createProduct = async (product: ProductWriteRequest): Promise<Product> => {
  const response = await axiosInstance.post<unknown>("/api/products", toProductFormData(product), {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return unwrapProduct(response.data);
};

export const updateProduct = async (id: number | string, product: ProductWriteRequest): Promise<Product> => {
  const response = await axiosInstance.put<unknown>(`/api/products/${encodeURIComponent(String(id))}`, toProductFormData(product), {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return unwrapProduct(response.data);
};

export const deleteProduct = async (id: number | string): Promise<void> => {
  const response = await axiosInstance.delete<unknown>(`/api/products/${encodeURIComponent(String(id))}`);
  if (response.data && typeof response.data === "object" && (response.data as { success?: unknown }).success === false) {
    const message = (response.data as { message?: unknown }).message;
    throw new Error(typeof message === "string" ? message : "The product could not be deleted.");
  }
};

export const productsApi = {
  async list(): Promise<Product[]> {
    const [products, brands, categories] = await Promise.all([allProducts(), getBrands(true).catch(() => []), getCategories(true).catch(() => [])]);
    return products.filter((product) => product.active !== false && productIsInActiveCatalog(product, categories, brands)).map((product) => {
      const brand = brands.find((item) => String(item.id) === String(product.brandId));
      return {
        ...product,
        ...(brand ? { brand: brandKey(brand), brandName: brand.name } : {}),
        active: product.active !== false,
        mainImageUrl: resolveProductImageUrl(
          product.mainImageUrl || product.imageUrl || product.image,
        ),
        brandName: brand?.name || product.brandName,
        categoryName: product.categoryName || product.category,
      };
    });
  },

  async bySlug(slug: string): Promise<Product> {
    const response = await axiosInstance.get<unknown>(
      `/api/products/slug/${encodeURIComponent(slug)}`,
    );
    const payload = response.data && typeof response.data === "object"
      ? (response.data as { data?: unknown }).data ?? response.data
      : response.data;
    const product = normalizeProduct(payload as Record<string, unknown>);
    const [brand, category] = await Promise.all([
      product.brandId ? getBrandById(product.brandId).catch(() => null) : Promise.resolve(null),
      product.categoryId ? getCategoryById(product.categoryId).catch(() => null) : Promise.resolve(null),
    ]);
    if (product.active === false || !productIsInActiveCatalog(product, category ? [category] : [], brand ? [brand] : [])) {
      throw new Error("This product is not available.");
    }
    return {
      ...product,
      active: true,
      brand: brand ? brandKey(brand) : product.brand,
      brandName: brand?.name || product.brandName,
      categoryName: category?.name || product.categoryName || product.category,
      mainImageUrl: resolveProductImageUrl(
        product.mainImageUrl || product.imageUrl || product.image,
      ),
    };
  },
};
