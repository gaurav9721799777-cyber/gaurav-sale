import axiosInstance from "../interceptor/AxiosInterceptor";

export type Category = {
  id: number | string;
  name: string;
  slug: string;
  description?: string;
  active?: boolean;
};

type CategoryRecord = {
  id?: number | string;
  categoryId?: number | string;
  name?: string;
  categoryName?: string;
  category?: string;
  slug?: string;
  categorySlug?: string;
  description?: string;
  active?: boolean;
};

const toCategory = (record: CategoryRecord, index = 0): Category | null => {
  const name = record.name || record.categoryName || record.category;
  if (!name) return null;
  const slug =
    record.slug ||
    record.categorySlug ||
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  return {
    id: record.id ?? record.categoryId ?? name ?? index,
    name,
    slug,
    description: record.description,
    active: record.active !== false,
  };
};

const unwrapCategories = (payload: unknown): CategoryRecord[] => {
  if (Array.isArray(payload)) return payload as CategoryRecord[];
  if (payload && typeof payload === "object") {
    const result = payload as {
      data?: unknown;
      categories?: unknown;
      results?: unknown;
      items?: unknown;
    };
    for (const collection of [
      result.categories,
      result.results,
      result.items,
      result.data,
    ]) {
      if (Array.isArray(collection)) return collection as CategoryRecord[];
      if (collection && typeof collection === "object") {
        const nested = unwrapCategories(collection);
        if (nested.length) return nested;
      }
    }
  }
  return [];
};

export const getCategories = async (includeInactive = false): Promise<Category[]> => {
  const response = await axiosInstance.get<unknown>("/api/categories");
  return unwrapCategories(response.data)
    .map(toCategory)
    .filter(
      (category): category is Category =>
        category !== null && (includeInactive || category.active !== false),
    );
};

const unwrapCategory = (payload: unknown): CategoryRecord | null => {
  if (!payload || typeof payload !== "object") return null;
  const envelope = payload as { data?: unknown };
  const record =
    envelope.data && typeof envelope.data === "object"
      ? envelope.data
      : payload;
  return Array.isArray(record) ? null : (record as CategoryRecord);
};

export type CategoryWriteRequest = { name: string; slug: string; description: string; active: boolean };

const unwrapCategoryResult = (payload: unknown): Category => {
  const category = toCategory(unwrapCategory(payload) || {});
  if (!category) throw new Error("The category service returned an invalid category.");
  return category;
};

export const createCategory = async (value: CategoryWriteRequest): Promise<Category> => {
  const response = await axiosInstance.post<unknown>("/api/categories", value);
  return unwrapCategoryResult(response.data);
};

export const updateCategory = async (id: number | string, value: CategoryWriteRequest): Promise<Category> => {
  const response = await axiosInstance.put<unknown>(`/api/categories/${encodeURIComponent(String(id))}`, value);
  return unwrapCategoryResult(response.data);
};
export const getCategoryById = async (
  id: number | string,
): Promise<Category> => {
  const response = await axiosInstance.get<unknown>(
    `/api/categories/${encodeURIComponent(String(id))}`,
  );
  const category = toCategory(unwrapCategory(response.data) || {});
  if (!category) throw new Error("Category not found.");
  return category;
};

export const getCategoryBySlug = async (slug: string): Promise<Category> => {
  const categories = await getCategories();
  const normalized = slug.toLowerCase();
  const category =
    categories.find((item) => item.slug.toLowerCase() === normalized) ||
    categories.find(
      (item) =>
        item.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") === normalized,
    );
  if (category) return category;
  throw new Error("Category not found.");
};

const CategoryServiceService = {
  getCategories,
  getCategoryById,
  getCategoryBySlug,
};
export default CategoryServiceService;
