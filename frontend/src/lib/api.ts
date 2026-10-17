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
  category?: string;
  purchasePrice?: number;
  sellingPrice?: number;
  isActive?: boolean;
  quantity: number;
  lowStockThreshold: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductInput {
  name: string;
  sku: string;
  price: number;
  category?: string;
  purchasePrice?: number;
  sellingPrice?: number;
  isActive?: boolean;
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
  unitCost?: number;
  subtotal: number;
}

export interface Sale {
  _id: string;
  invoiceNumber?: string;
  items: SaleItem[];
  subtotal?: number;
  discountPercent?: number;
  discountAmount?: number;
  taxPercent?: number;
  taxAmount?: number;
  totalAmount: number;
  createdByName?: string;
  createdByRole?: "Admin" | "Staff";
  createdAt: string;
  updatedAt: string;
}

export interface CreateSaleInput {
  items: Array<{ product: string; quantity: number }>;
  discountPercent?: number;
  taxPercent?: number;
}

export interface SalesSummary {
  totalRevenue: number;
  totalSales: number;
  totalUnitsSold: number;
}

export interface ReportDateRange {
  from: string | null;
  to: string | null;
}

export interface SalesDateReport {
  dateRange: ReportDateRange;
  totalSales: number;
  totalUnitsSold: number;
  grossSubtotal: number;
  discountAmount: number;
  netSales: number;
  taxAmount: number;
  totalCollected: number;
  averageOrderValue: number;
}

export interface TopSellingProduct {
  product: string;
  productName: string;
  sku: string;
  unitsSold: number;
  grossSales: number;
  salesCount: number;
}

export interface TopSellingProductsReport {
  dateRange: ReportDateRange;
  products: TopSellingProduct[];
}

export interface ProfitProductReport {
  product: string;
  productName: string;
  sku: string;
  unitsSold: number;
  unitsWithoutCost: number;
  netSales: number;
  costOfGoods: number;
  grossProfitWithKnownCost: number;
  profitComplete: boolean;
}

export interface ProfitDateReport {
  dateRange: ReportDateRange;
  totalSales: number;
  totalUnits: number;
  unitsWithoutCost: number;
  netSales: number;
  revenueWithKnownCost: number;
  costOfGoods: number;
  grossProfitWithKnownCost: number;
  profitComplete: boolean;
  products: ProfitProductReport[];
}

export interface InventoryMovement {
  _id: string;
  product: string;
  productName: string;
  sku: string;
  type: "SALE" | "ADJUSTMENT_IN" | "ADJUSTMENT_OUT";
  quantityChange: number;
  quantityBefore: number;
  quantityAfter: number;
  reason: string;
  referenceSale?: string;
  invoiceNumber?: string;
  unitCost?: number;
  performedBy: string;
  performedByName: string;
  performedByRole: "Admin" | "Staff";
  createdAt: string;
  updatedAt: string;
}

function queryPath(
  path: string,
  params: Record<string, string | number | undefined>,
): string {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  }

  const encoded = query.toString();
  return encoded ? `${path}?${encoded}` : path;
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

  updateProduct: (
    id: string,
    input: Partial<ProductInput> & { isActive?: boolean },
  ) =>
    request<Product>(`/products/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),

  deleteProduct: (id: string) =>
    request<null>(`/products/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),

  getLowStockProducts: (page = 1, limit = 10) =>
    request<{ products: Product[]; pagination: Pagination }>(
      `/inventory/low-stock?page=${page}&limit=${limit}`,
    ),

  getInventoryMovements: (page = 1, limit = 10, product?: string) =>
    request<{ movements: InventoryMovement[]; pagination: Pagination }>(
      queryPath("/inventory/movements", { page, limit, product }),
    ),

  adjustInventory: (input: {
    product: string;
    quantityChange: number;
    reason: string;
  }) =>
    request<{ product: Product; movement: InventoryMovement }>(
      "/inventory/adjustments",
      { method: "POST", body: JSON.stringify(input) },
    ),

  getSalesDateReport: (from?: string, to?: string) =>
    request<SalesDateReport>(
      queryPath("/reports/sales", { from, to }),
    ),

  getTopSellingProducts: (from?: string, to?: string, limit = 10) =>
    request<TopSellingProductsReport>(
      queryPath("/reports/top-products", { from, to, limit }),
    ),

  getProfitReport: (from?: string, to?: string) =>
    request<ProfitDateReport>(
      queryPath("/reports/profit", { from, to }),
    ),

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
