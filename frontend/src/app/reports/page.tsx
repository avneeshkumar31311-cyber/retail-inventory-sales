"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  api,
  type Product,
  type Sale,
  type SalesDateReport,
  type TopSellingProduct,
  type ProfitDateReport,
} from "../../lib/api";

function money(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function dateOnly(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Unknown date"
    : date.toLocaleDateString("en-IN");
}

export default function ReportsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [salesReport, setSalesReport] = useState<SalesDateReport | null>(null);
  const [topProducts, setTopProducts] = useState<TopSellingProduct[]>([]);
  const [profitReport, setProfitReport] = useState<ProfitDateReport | null>(null);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReports = useCallback(async () => {
    try {
      const [
        productResults,
        salesResult,
        periodSales,
        topProductsResult,
        profitResult,
        lowStockResult,
      ] = await Promise.all([
        api.getAllProducts(),
        api.getSales(1, 5),
        api.getSalesDateReport(from || undefined, to || undefined),
        api.getTopSellingProducts(from || undefined, to || undefined, 10),
        api.getProfitReport(from || undefined, to || undefined),
        api.getLowStockProducts(1, 100),
      ]);

      setProducts(productResults);
      setRecentSales(salesResult.sales);
      setSalesReport(periodSales);
      setTopProducts(topProductsResult.products);
      setProfitReport(profitResult);
      setLowStockCount(lowStockResult.pagination.total);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load reports.",
      );
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    let active = true;

    Promise.all([
      api.getAllProducts(),
      api.getSales(1, 5),
      api.getSalesDateReport(from || undefined, to || undefined),
      api.getTopSellingProducts(from || undefined, to || undefined, 10),
      api.getProfitReport(from || undefined, to || undefined),
      api.getLowStockProducts(1, 100),
    ])
      .then(([
        productResults,
        salesResult,
        periodSales,
        topProductsResult,
        profitResult,
        lowStockResult,
      ]) => {
        if (!active) return;
        setProducts(productResults);
        setRecentSales(salesResult.sales);
        setSalesReport(periodSales);
        setTopProducts(topProductsResult.products);
        setProfitReport(profitResult);
        setLowStockCount(lowStockResult.pagination.total);
        setError("");
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(
          err instanceof Error ? err.message : "Unable to load reports.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [from, to]);

  const activeProducts = products.filter(
    (product) => product.isActive !== false,
  );
  const inventoryValue = activeProducts.reduce(
    (total, product) =>
      total + (product.sellingPrice ?? product.price) * product.quantity,
    0,
  );
  const totalUnits = activeProducts.reduce(
    (sum, product) => sum + product.quantity,
    0,
  );
  const outOfStockCount = activeProducts.filter(
    (product) => product.quantity === 0,
  ).length;

  const metrics = [
    {
      label: "Sales Collected",
      value: salesReport ? money(salesReport.totalCollected) : "—",
      note: "For the selected date range",
      icon: "₹",
    },
    {
      label: "Completed Sales",
      value: salesReport
        ? salesReport.totalSales.toLocaleString("en-IN")
        : "—",
      note: "Transactions in the selected period",
      icon: "↗",
    },
    {
      label: "Units Sold",
      value: salesReport
        ? salesReport.totalUnitsSold.toLocaleString("en-IN")
        : "—",
      note: "Items sold in the selected period",
      icon: "▤",
    },
    {
      label: "Gross Profit",
      value: profitReport
        ? money(profitReport.grossProfitWithKnownCost)
        : "—",
      note: profitReport && !profitReport.profitComplete
        ? "Partial: some sales lack recorded costs"
        : "Based on recorded purchase costs",
      icon: "₹",
    },
  ];

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Reports</h1>
          <p>Sales performance, inventory health, and profitability.</p>
        </div>
        <button
          className="secondary-button"
          type="button"
          onClick={() => {
            setLoading(true);
            void loadReports();
          }}
          disabled={loading}
        >
          {loading ? "Refreshing…" : "Refresh reports"}
        </button>
      </div>

      <section className="panel" aria-label="Report date range">
        <div className="panel-header">
          <div>
            <h2>Report period</h2>
            <p>Leave both dates blank to report on all available sales.</p>
          </div>
        </div>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="report-from">From date</label>
            <input
              className="form-input"
              id="report-from"
              type="date"
              value={from}
              max={to || undefined}
              onChange={(event) => {
                setLoading(true);
                setFrom(event.target.value);
              }}
            />
          </div>
          <div className="form-field">
            <label htmlFor="report-to">To date</label>
            <input
              className="form-input"
              id="report-to"
              type="date"
              value={to}
              min={from || undefined}
              onChange={(event) => {
                setLoading(true);
                setTo(event.target.value);
              }}
            />
          </div>
          <div className="form-field">
            <label>Selected range</label>
            <p className="form-help">
              {from || to ? `${from || "First sale"} — ${to || "Latest sale"}` : "All recorded sales"}
            </p>
          </div>
        </div>
      </section>

      {error && (
        <div className="error-message" role="alert">
          {error}
          <p>Check that the backend is running and that the new report routes are registered.</p>
          <button
            className="secondary-button"
            type="button"
            onClick={() => {
              setLoading(true);
              void loadReports();
            }}
          >
            Try again
          </button>
        </div>
      )}

      <section className="stats-grid">
        {metrics.map((metric, index) => (
          <article className="stat-card" key={metric.label}>
            <div>
              <p className="stat-label">{metric.label}</p>
              <p className="stat-value">{loading ? "—" : metric.value}</p>
              <p className="stat-note">{metric.note}</p>
            </div>
            <span className={`stat-icon ${index === 1 ? "blue" : ""}`}>
              {metric.icon}
            </span>
          </article>
        ))}
      </section>

      <section className="report-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <h2>Sales Breakdown</h2>
              <p>Server-calculated totals for the selected period</p>
            </div>
          </div>
          <div className="summary-line">
            <span>Gross subtotal</span>
            <strong>{loading || !salesReport ? "—" : money(salesReport.grossSubtotal)}</strong>
          </div>
          <div className="summary-line">
            <span>Discounts</span>
            <strong>{loading || !salesReport ? "—" : money(salesReport.discountAmount)}</strong>
          </div>
          <div className="summary-line">
            <span>Net sales before tax</span>
            <strong>{loading || !salesReport ? "—" : money(salesReport.netSales)}</strong>
          </div>
          <div className="summary-line">
            <span>Tax collected</span>
            <strong>{loading || !salesReport ? "—" : money(salesReport.taxAmount)}</strong>
          </div>
          <div className="summary-line summary-total">
            <span>Average order value</span>
            <strong>{loading || !salesReport ? "—" : money(salesReport.averageOrderValue)}</strong>
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <h2>Inventory Health</h2>
              <p>Current active-product stock levels</p>
            </div>
            <Link className="text-link" href="/products">Manage products →</Link>
          </div>
          <div className="summary-line">
            <span>Active products</span>
            <strong>{loading ? "—" : activeProducts.length}</strong>
          </div>
          <div className="summary-line">
            <span>Units currently in stock</span>
            <strong>{loading ? "—" : totalUnits}</strong>
          </div>
          <div className="summary-line">
            <span>Low-stock products</span>
            <strong className={lowStockCount > 0 ? "danger-text" : ""}>
              {loading ? "—" : lowStockCount}
            </strong>
          </div>
          <div className="summary-line">
            <span>Out-of-stock products</span>
            <strong>{loading ? "—" : outOfStockCount}</strong>
          </div>
          <div className="summary-line summary-total">
            <span>Current inventory value</span>
            <strong>{loading ? "—" : money(inventoryValue)}</strong>
          </div>
          <p className="form-help">
            Inventory value uses selling price multiplied by current stock; it is not the value at purchase cost.
          </p>
        </article>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Top-Selling Products</h2>
            <p>Ranked by units sold in the selected period</p>
          </div>
        </div>
        {loading ? (
          <div className="empty-state">Loading top-selling products…</div>
        ) : topProducts.length === 0 ? (
          <div className="empty-state">No sales found for this period.</div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Units sold</th>
                  <th>Transactions</th>
                  <th>Gross sales</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((product) => (
                  <tr key={product.product}>
                    <td><strong>{product.productName}</strong></td>
                    <td>{product.sku}</td>
                    <td>{product.unitsSold}</td>
                    <td>{product.salesCount}</td>
                    <td>{money(product.grossSales)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Profitability</h2>
            <p>Gross profit after discounts and recorded purchase costs</p>
          </div>
        </div>
        {!profitReport ? (
          <div className="empty-state">
            {loading ? "Loading profit report…" : "Profit report is unavailable."}
          </div>
        ) : (
          <>
            {!profitReport.profitComplete && (
              <div className="error-message" role="status">
                Profit data is incomplete: {profitReport.unitsWithoutCost} unit(s)
                were sold without a purchase-cost snapshot. Those units are excluded
                from cost and profit totals; no historical costs have been estimated.
              </div>
            )}
            <div className="summary-line">
              <span>Net sales before tax</span>
              <strong>{money(profitReport.netSales)}</strong>
            </div>
            <div className="summary-line">
              <span>Revenue with known cost</span>
              <strong>{money(profitReport.revenueWithKnownCost)}</strong>
            </div>
            <div className="summary-line">
              <span>Known cost of goods</span>
              <strong>{money(profitReport.costOfGoods)}</strong>
            </div>
            <div className="summary-line summary-total">
              <span>Gross profit on known costs</span>
              <strong>{money(profitReport.grossProfitWithKnownCost)}</strong>
            </div>
            {profitReport.products.length > 0 && (
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Units sold</th>
                      <th>Missing-cost units</th>
                      <th>Known cost</th>
                      <th>Known gross profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profitReport.products.map((product) => (
                      <tr key={product.product}>
                        <td><strong>{product.productName}</strong><div className="product-sku">{product.sku}</div></td>
                        <td>{product.unitsSold}</td>
                        <td>{product.unitsWithoutCost}</td>
                        <td>{money(product.costOfGoods)}</td>
                        <td>{money(product.grossProfitWithKnownCost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Recent Sales</h2>
            <p>Most recent five transactions</p>
          </div>
          <Link className="text-link" href="/sales">Sales history →</Link>
        </div>
        {loading ? (
          <div className="empty-state">Loading recent sales…</div>
        ) : recentSales.length === 0 ? (
          <div className="empty-state">No sales recorded yet.</div>
        ) : (
          <div className="stock-list">
            {recentSales.map((sale) => (
              <div className="stock-item" key={sale._id}>
                <div>
                  <strong>{sale.invoiceNumber ?? `Sale #${sale._id.slice(-6).toUpperCase()}`}</strong>
                  <small>
                    {dateOnly(sale.createdAt)} · {sale.items.reduce((sum, item) => sum + item.quantity, 0)} unit(s)
                  </small>
                </div>
                <strong>{money(sale.totalAmount)}</strong>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="form-help report-disclaimer">
        Reports use server-side aggregates and the selected UTC calendar-date range.
        Profit is explicitly marked incomplete when historical sale items lack recorded
        purchase costs.
      </p>
    </>
  );
}
