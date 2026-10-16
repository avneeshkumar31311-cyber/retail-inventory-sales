const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

const TOKEN_KEY = "retailsync_access_token";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Staff";
}

export interface AuthSession {
  token: string;
  tokenType: "Bearer";
  expiresIn: number;
  user: AuthUser;
}

export interface LoginInput {
  email: string;
  password: string;
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;

  return window.sessionStorage.getItem(TOKEN_KEY);
}

export function clearAccessToken(): void {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(TOKEN_KEY);
  }
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

async function request<T>(
  path: string,
  options: RequestInit = {},
  requiresAuth = true,
): Promise<T> {
  let response: Response;
  const headers = new Headers(options.headers);

  if (options.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = requiresAuth ? getAccessToken() : null;

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      cache: "no-store",
    });
  } catch {
    throw new Error(
      "Cannot connect to the backend. Make sure it is running on port 4000.",
    );
  }

  let result: ApiEnvelope<T> | null = null;

  try {
    result = (await response.json()) as ApiEnvelope<T>;
  } catch {
    // Handle empty and non-JSON server responses below.
  }

  if (!response.ok || !result?.success) {
    if (response.status === 401 && requiresAuth) {
      clearAccessToken();

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("retailsync:unauthorized"));
      }
    }

    throw new Error(
      result?.error?.message ||
        result?.message ||
        `API request failed (${response.status})`,
    );
  }

  return result.data;
}

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

export interface ProductInput {
  name: string;
  sku: string;
  price: number;
  quantity: number;
  lowStockThreshold: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
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

export interface CreateSaleInput {
  items: Array<{ product: string; quantity: number }>;
}

export interface SalesSummary {
  totalRevenue: number;
  totalSales: number;
  totalUnitsSold: number;
}

export const api = {
  async login(input: LoginInput): Promise<AuthSession> {
    const session = await request<AuthSession>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify(input),
      },
      false,
    );

    if (typeof window === "undefined") {
      throw new Error("Login must be performed in the browser.");
    }

    window.sessionStorage.setItem(TOKEN_KEY, session.token);
    return session;
  },

  getCurrentUser: () =>
    request<{ user: AuthUser }>("/auth/me"),

  logout(): void {
    clearAccessToken();
  },

  getProducts: (page = 1, limit = 10) =>
    request<{ products: Product[]; pagination: Pagination }>(
      `/products?page=${page}&limit=${limit}`,
    ),

  async getAllProducts(): Promise<Product[]> {
    const firstPage = await request<{
      products: Product[];
      pagination: Pagination;
    }>("/products?page=1&limit=100");

    if (firstPage.pagination.totalPages <= 1) {
      return firstPage.products;
    }

    const remainingPages = await Promise.all(
      Array.from(
        { length: firstPage.pagination.totalPages - 1 },
        (_, index) =>
          request<{
            products: Product[];
            pagination: Pagination;
          }>(`/products?page=${index + 2}&limit=100`),
      ),
    );

    return [
      firstPage.products,
      ...remainingPages.map((page) => page.products),
    ].flat();
  },

  createProduct: (input: ProductInput) =>
    request<Product>("/products", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  updateProduct: (id: string, input: ProductInput) =>
    request<Product>(`/products/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),

  deleteProduct: (id: string) =>
    request<null>(`/products/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),

  createSale: (input: CreateSaleInput) =>
    request<Sale>("/sales", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  getSale: (id: string) =>
    request<Sale>(`/sales/${encodeURIComponent(id)}`),

  getSales: (page = 1, limit = 10) =>
    request<{ sales: Sale[]; pagination: Pagination }>(
      `/sales?page=${page}&limit=${limit}`,
    ),

  getSalesSummary: () =>
    request<SalesSummary>("/sales/summary"),
};
