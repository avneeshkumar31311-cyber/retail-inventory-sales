
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type Sale } from "../lib/api";

function money(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

export default function DashboardPage() {
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalSales: 0,
    totalUnitsSold: 0,
  });

  const [sales, setSales] = useState<Sale[]>([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setError("");

        const [summaryResult, salesResult, productsResult] =
          await Promise.all([
            api.getSalesSummary(),
            api.getSales(1, 5),
            api.getProducts(),
          ]);

        setSummary(summaryResult);
        setSales(salesResult.sales);

        
setLowStockCount(
  productsResult.products.filter(
    (product) =>
      product.quantity <= product.lowStockThreshold,
  ).length,
);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load dashboard data.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();
  }, []);

  const stats = [
    {
      label: "Total Revenue",
      value: money(summary.totalRevenue),
      icon: "₹",
    },
    {
      label: "Total Sales",
      value: summary.totalSales.toLocaleString("en-IN"),
      icon: "↗",
    },
    {
      label: "Units Sold",
      value: summary.totalUnitsSold.toLocaleString("en-IN"),
      icon: "▤",
    },
    {
      label: "Low Stock Items",
      value: lowStockCount.toLocaleString("en-IN"),
      icon: "!",
    },
  ];

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Dashboard</h1>
          <p>Here&apos;s what&apos;s happening with your store.</p>
        </div>
        <Link className="primary-button" href="/sales/new">
          + Create Sale
        </Link>
      </div>

      {error && (
        <div className="error-message" role="alert">
          {error}
          <p>
            Check that your backend is running at{" "}
            <code>localhost:4000</code> and the API response has the
            expected format.
          </p>
        </div>
      )}

      <section className="stats-grid">
        {stats.map((stat, index) => (
          <article className="stat-card" key={stat.label}>
            <div>
              <p className="stat-label">{stat.label}</p>
              <p className="stat-value">
                {loading ? "—" : stat.value}
              </p>
              <p className={`stat-note${index === 3 ? " danger" : ""}`}>
                {[
                  "Across recorded sales",
                  "Recorded transactions",
                  "Across all sales",
                  "At or below stock threshold",
                ][index]}
              </p>
            </div>
            <span
              className={`stat-icon ${index === 1 ? "blue" : ""} ${
                index === 3 ? "red" : ""
              }`}
            >
              {stat.icon}
            </span>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <div className="stack">
          <article className="panel">
            <div className="panel-header">
              <div>
                <h2>Sales Overview</h2>
                <p>Sales performance</p>
              </div>
              <Link className="text-link" href="/reports">
                View reports →
              </Link>
            </div>

            <div className="chart-placeholder">
              {[35, 52, 40, 68, 83, 72, 91].map((height, index) => (
                <div className="chart-column" key={index}>
                  <div
                    className="chart-bar"
                    style={{ height: `${height}%` }}
                  />
                  <span>
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index]}
                  </span>
                </div>
              ))}
            </div>
            <p className="stat-note">
              Illustrative chart — daily revenue reporting is not yet
              available from the backend.
            </p>
          </article>

          <article className="table-panel">
            <div
              className="panel-header"
              style={{ padding: "20px 20px 0" }}
            >
              <div>
                <h2>Recent Sales</h2>
                <p>Latest recorded transactions</p>
              </div>
              <Link className="text-link" href="/sales">
                View all →
              </Link>
            </div>

            {loading ? (
              <div className="empty-state">Loading sales...</div>
            ) : sales.length === 0 ? (
              <div className="empty-state">
                No sales recorded yet.
              </div>
            ) : (
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Sale ID</th>
                      <th>Date &amp; Time</th>
                      <th>Items</th>
                      <th>Amount</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((sale) => (
                      <tr key={sale._id}>
                        <td>#{sale._id.slice(-6).toUpperCase()}</td>
                        <td>
                          {new Date(sale.createdAt).toLocaleString()}
                        </td>
                        <td>{sale.items.length}</td>
                        <td>{money(sale.totalAmount)}</td>
                        <td>
                          <Link
                            className="text-link"
                            href={`/sales?id=${encodeURIComponent(sale._id)}`}
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        </div>

        <aside className="panel">
          <div className="panel-header">
            <div>
              <h2>Inventory Alerts</h2>
              <p>Products needing attention</p>
            </div>
            <span className="badge danger">{lowStockCount}</span>
          </div>

          {loading ? (
            <p className="muted">Checking inventory...</p>
          ) : lowStockCount > 0 ? (
            <p>
              {lowStockCount} product(s) are at or below their low-stock
              threshold.
            </p>
          ) : (
            <p className="muted">
              No products currently meet the low-stock alert condition.
            </p>
          )}

          <Link className="primary-button full-width" href="/products">
            Manage Products
          </Link>

          <div style={{ marginTop: 12 }}>
            <Link className="secondary-button full-width" href="/sales/new">
              Start a Sale
            </Link>
          </div>
        </aside>
      </section>
    </>
  );
}