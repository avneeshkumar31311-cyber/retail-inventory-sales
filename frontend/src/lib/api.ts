
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export interface Product {
  _id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  lowStockThreshold: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SaleItem {
  product: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Sale {
  _id: string;
  items: SaleItem[];
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SalesSummary {
  totalRevenue: number;
  totalSales: number;
  totalUnitsSold: number;
}

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
  error?: {
    code: string;
    message: string;
  };
}

async function request<T>(path: string): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      cache: "no-store",
    });
  } catch {
    throw new Error(
      "Cannot connect to the backend. Make sure it is running on port 4000.",
    );
  }

  const result = (await response.json()) as ApiEnvelope<T>;

  if (!response.ok || !result.success) {
    throw new Error(
      result.error?.message ||
        result.message ||
        `API request failed (${response.status})`,
    );
  }

  return result.data;
}

export const api = {
 
getProducts: () =>
  request<{
    products: Product[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>("/products"),

  getSales: (page = 1, limit = 10) =>
    request<{
      sales: Sale[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/sales?page=${page}&limit=${limit}`),

  getSalesSummary: () => request<SalesSummary>("/sales/summary"),
};