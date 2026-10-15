
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api, type Product } from "../../lib/api";

function money(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProducts = useCallback(async () => {
    try {
      setError("");
      setLoading(true);

      const result = await api.getProducts();
      setProducts(result.products);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load products.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const filteredProducts = products.filter((product) => {
    const term = search.trim().toLowerCase();
    return (
      product.name.toLowerCase().includes(term) ||
      product.sku.toLowerCase().includes(term)
    );
  });

  const lowStockCount = products.filter(
    (product) => product.quantity <= product.lowStockThreshold,
  ).length;

  const totalUnits = products.reduce(
    (total, product) => total + product.quantity,
    0,
  );

  const inventoryValue = products.reduce(
    (total, product) => total + product.price * product.quantity,
    0,
  );

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Products &amp; Inventory</h1>
          <p>Manage your products, stock levels, and inventory value.</p>
        </div>
        <button
          className="primary-button"
          onClick={() =>
            alert("We'll connect the Add Product form in the next step.")
          }
        >
          + Add Product
        </button>
      </div>

      {error && (
        <div className="error-message" role="alert">
          {error}
          <p>
            Check that your backend is running on port 4000.
          </p>
          <button className="secondary-button" onClick={() => void loadProducts()}>
            Try again
          </button>
        </div>
      )}

      <section className="stats-grid">
        <article className="stat-card">
          <div>
            <p className="stat-label">Total Products</p>
            <p className="stat-value">{loading ? "—" : products.length}</p>
            <p className="stat-note">Products in your catalogue</p>
          </div>
          <span className="stat-icon">▤</span>
        </article>

        <article className="stat-card">
          <div>
            <p className="stat-label">Total Units in Stock</p>
            <p className="stat-value">{loading ? "—" : totalUnits}</p>
            <p className="stat-note">Across all products</p>
          </div>
          <span className="stat-icon blue">□</span>
        </article>

        <article className="stat-card">
          <div>
            <p className="stat-label">Inventory Value</p>
            <p className="stat-value">
              {loading ? "—" : money(inventoryValue)}
            </p>
            <p className="stat-note">Price × available quantity</p>
          </div>
          <span className="stat-icon">₹</span>
        </article>

        <article className="stat-card">
          <div>
            <p className="stat-label">Low Stock Items</p>
            <p className="stat-value">{loading ? "—" : lowStockCount}</p>
            <p className="stat-note danger">At or below stock threshold</p>
          </div>
          <span className="stat-icon red">!</span>
        </article>
      </section>

      <section className="table-panel">
        <div className="panel-header" style={{ padding: 20 }}>
          <div>
            <h2>All Products</h2>
            <p>
              {loading
                ? "Loading inventory..."
                : `${filteredProducts.length} product(s) found`}
            </p>
          </div>

          <input
            className="search-input"
            type="search"
            placeholder="Search name or SKU..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search products by name or SKU"
          />
        </div>

        {loading ? (
          <div className="empty-state">Loading products from your backend...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-state">
            {search
              ? "No products match your search."
              : "No products found. Add your first product to get started."}
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Stock Status</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const isLow =
                    product.quantity <= product.lowStockThreshold;

                  return (
                    <tr key={product._id}>
                      <td>
                        <strong>{product.name}</strong>
                      </td>
                      <td>{product.sku}</td>
                      <td>{money(product.price)}</td>
                      <td>{product.quantity}</td>
                      <td>
                        <span className={`badge ${isLow ? "danger" : "success"}`}>
                          {isLow ? "Low stock" : "In stock"}
                        </span>
                      </td>
                      <td>
                        {product.updatedAt
                          ? new Date(product.updatedAt).toLocaleDateString("en-IN")
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div style={{ marginTop: 16 }}>
        <Link className="secondary-button" href="/">
          ← Back to Dashboard
        </Link>
      </div>
    </>
  );
}