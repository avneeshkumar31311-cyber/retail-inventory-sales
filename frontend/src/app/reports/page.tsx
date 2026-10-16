"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, type Product, type Sale, type SalesSummary } from "../../lib/api";

function money(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);
}
function dateOnly(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown date" : date.toLocaleDateString("en-IN");
}

export default function ReportsPage() {
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReports = useCallback(async () => {
    try {
      const [summaryResult, productResults, salesResult] = await Promise.all([
        api.getSalesSummary(), api.getAllProducts(), api.getSales(1, 5),
      ]);
      setSummary(summaryResult);
      setProducts(productResults);
      setRecentSales(salesResult.sales);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load reports.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    Promise.all([
      api.getSalesSummary(),
      api.getAllProducts(),
      api.getSales(1, 5),
    ])
      .then(([summaryResult, productResults, salesResult]) => {
        if (!active) return;
        setSummary(summaryResult);
        setProducts(productResults);
        setRecentSales(salesResult.sales);
        setError("");
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Unable to load reports.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const lowStockCount = products.filter((product) => product.quantity <= product.lowStockThreshold).length;
  const inventoryValue = products.reduce((total, product) => total + product.price * product.quantity, 0);
  const metrics = [
    { label: "Lifetime Revenue", value: summary ? money(summary.totalRevenue) : "—", note: "Total amount across recorded sales", icon: "₹" },
    { label: "Completed Sales", value: summary ? summary.totalSales.toLocaleString("en-IN") : "—", note: "Recorded sale transactions", icon: "↗" },
    { label: "Units Sold", value: summary ? summary.totalUnitsSold.toLocaleString("en-IN") : "—", note: "Total quantity across sales", icon: "▤" },
    { label: "Current Inventory Value", value: loading ? "—" : money(inventoryValue), note: "Current price × current stock", icon: "□" },
  ];

  return (
    <>
      <div className="page-heading"><div><h1>Reports</h1><p>Sales performance and inventory metrics from live API data.</p></div><button className="secondary-button" type="button" onClick={() => { setLoading(true); void loadReports(); }} disabled={loading}>{loading ? "Refreshing…" : "Refresh report"}</button></div>
      {error && <div className="error-message" role="alert">{error}<p>Some report sections may be unavailable until the backend connection is restored.</p><button className="secondary-button" type="button" onClick={() => { setLoading(true); void loadReports(); }}>Try again</button></div>}
      <section className="stats-grid">
        {metrics.map((metric, index) => <article className="stat-card" key={metric.label}><div><p className="stat-label">{metric.label}</p><p className="stat-value">{loading ? "—" : metric.value}</p><p className="stat-note">{metric.note}</p></div><span className={`stat-icon ${index === 1 ? "blue" : ""}`}>{metric.icon}</span></article>)}
      </section>
      <section className="report-grid">
        <article className="panel">
          <div className="panel-header"><div><h2>Inventory Health</h2><p>Calculated from the current product catalogue</p></div><Link className="text-link" href="/products">Manage products →</Link></div>
          <div className="summary-line"><span>Products in catalogue</span><strong>{loading ? "—" : products.length}</strong></div>
          <div className="summary-line"><span>Units currently in stock</span><strong>{loading ? "—" : products.reduce((sum, product) => sum + product.quantity, 0)}</strong></div>
          <div className="summary-line"><span>Low-stock products</span><strong className={lowStockCount > 0 ? "danger-text" : ""}>{loading ? "—" : lowStockCount}</strong></div>
          <div className="summary-line"><span>Out-of-stock products</span><strong>{loading ? "—" : products.filter((product) => product.quantity === 0).length}</strong></div>
        </article>
        <article className="panel">
          <div className="panel-header"><div><h2>Recent Sales</h2><p>Most recent five transactions</p></div><Link className="text-link" href="/sales">Sales history →</Link></div>
          {loading ? <div className="empty-state">Loading recent sales…</div> : recentSales.length === 0 ? <div className="empty-state">No sales recorded yet.</div> : <div className="stock-list">{recentSales.map((sale) => <div className="stock-item" key={sale._id}><div><strong>Sale #{sale._id.slice(-6).toUpperCase()}</strong><small>{dateOnly(sale.createdAt)} · {sale.items.reduce((sum, item) => sum + item.quantity, 0)} unit(s)</small></div><strong>{money(sale.totalAmount)}</strong></div>)}</div>}
        </article>
      </section>
      <p className="form-help report-disclaimer">The backend currently supplies lifetime sales summaries and paginated transaction records, but not daily or weekly revenue aggregates. This page therefore does not present a fabricated time-series chart.</p>
    </>
  );
}
