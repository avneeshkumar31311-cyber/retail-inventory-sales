"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  api,
  type AuthUser,
  type InventoryMovement,
  type Pagination,
  type Product,
} from "../../lib/api";

function dateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Unknown date"
    : date.toLocaleString("en-IN");
}

function movementLabel(type: InventoryMovement["type"]) {
  if (type === "SALE") return "Sale";
  if (type === "ADJUSTMENT_IN") return "Stock added";
  return "Stock removed";
}

export default function InventoryPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [lowStockTotal, setLowStockTotal] = useState(0);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [movementPagination, setMovementPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [movementPage, setMovementPage] = useState(1);
  const [movementProductFilter, setMovementProductFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantityChange, setQuantityChange] = useState("");
  const [reason, setReason] = useState("");

  const loadInventory = useCallback(async () => {
    setLoading(true);

    try {
      const [
        session,
        allProducts,
        lowStockResult,
        movementResult,
      ] = await Promise.all([
        api.getCurrentUser(),
        api.getAllProducts(),
        api.getLowStockProducts(1, 100),
        api.getInventoryMovements(movementPage, 20, movementProductFilter === "all" ? undefined : movementProductFilter),
      ]);

      setUser(session.user);
      setProducts(allProducts);
      setLowStockProducts(lowStockResult.products);
      setLowStockTotal(lowStockResult.pagination.total);
      setMovements(movementResult.movements);
      setMovementPagination(movementResult.pagination);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load inventory data.",
      );
    } finally {
      setLoading(false);
    }
  }, [movementPage, movementProductFilter]);

  useEffect(() => {
    let active = true;

    Promise.all([
      api.getCurrentUser(),
      api.getAllProducts(),
      api.getLowStockProducts(1, 100),
      api.getInventoryMovements(movementPage, 20, movementProductFilter === "all" ? undefined : movementProductFilter),
    ])
      .then(([session, allProducts, lowStockResult, movementResult]) => {
        if (!active) return;
        setUser(session.user);
        setProducts(allProducts);
        setLowStockProducts(lowStockResult.products);
        setLowStockTotal(lowStockResult.pagination.total);
        setMovements(movementResult.movements);
      setMovementPagination(movementResult.pagination);
        setError("");
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(
          err instanceof Error ? err.message : "Unable to load inventory data.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [movementPage, movementProductFilter]);

  const activeProducts = products.filter(
    (product) => product.isActive !== false,
  );
  const isAdmin = user?.role === "Admin";

  async function handleAdjustment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    const amount = Number(quantityChange);

    if (!selectedProduct) {
      setError("Choose a product to adjust.");
      return;
    }
    if (
      !quantityChange.trim() ||
      !Number.isInteger(amount) ||
      amount === 0
    ) {
      setError("Quantity change must be a non-zero whole number.");
      return;
    }
    if (reason.trim().length < 3 || reason.trim().length > 250) {
      setError("Reason must be between 3 and 250 characters.");
      return;
    }

    const product = activeProducts.find(
      (item) => item._id === selectedProduct,
    );

    if (
      product &&
      amount < 0 &&
      product.quantity < Math.abs(amount)
    ) {
      setError(`Cannot remove ${Math.abs(amount)} units; only ${product.quantity} are in stock.`);
      return;
    }

    setSaving(true);

    try {
      const result = await api.adjustInventory({
        product: selectedProduct,
        quantityChange: amount,
        reason: reason.trim(),
      });

      setNotice(
        `Stock adjusted for ${result.product.name}. Quantity is now ${result.product.quantity}.`,
      );
      setSelectedProduct("");
      setQuantityChange("");
      setReason("");
      await loadInventory();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to adjust inventory.",
      );
    } finally {
      setSaving(false);
    }
  }

  const unitsInStock = activeProducts.reduce(
    (sum, product) => sum + product.quantity,
    0,
  );

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Inventory Management</h1>
          <p>Monitor low stock, review quantity changes, and record stock adjustments.</p>
        </div>
        <button
          className="secondary-button"
          type="button"
          onClick={() => void loadInventory()}
          disabled={loading || saving}
        >
          {loading ? "Refreshing…" : "Refresh inventory"}
        </button>
      </div>

      {error && <div className="error-message" role="alert">{error}</div>}
      {notice && <div className="success-message" role="status">{notice}</div>}

      <section className="stats-grid">
        <article className="stat-card">
          <div>
            <p className="stat-label">Active Products</p>
            <p className="stat-value">{loading ? "—" : activeProducts.length}</p>
            <p className="stat-note">Products currently available</p>
          </div>
          <span className="stat-icon">▤</span>
        </article>
        <article className="stat-card">
          <div>
            <p className="stat-label">Units in Stock</p>
            <p className="stat-value">{loading ? "—" : unitsInStock}</p>
            <p className="stat-note">Across active products</p>
          </div>
          <span className="stat-icon blue">□</span>
        </article>
        <article className="stat-card">
          <div>
            <p className="stat-label">Low-Stock Products</p>
            <p className="stat-value">{loading ? "—" : lowStockTotal}</p>
            <p className="stat-note danger">At or below stock threshold</p>
          </div>
          <span className="stat-icon red">!</span>
        </article>
      </section>

      {isAdmin && (
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Manual Stock Adjustment</h2>
              <p>Record stock additions or removals with a reason. Admin access is required.</p>
            </div>
          </div>
          <form onSubmit={handleAdjustment}>
            <div className="form-grid">
              <div className="form-field full-width">
                <label htmlFor="adjustment-product">Product *</label>
                <select
                  className="form-input"
                  id="adjustment-product"
                  value={selectedProduct}
                  onChange={(event) => setSelectedProduct(event.target.value)}
                  required
                  disabled={saving || loading}
                >
                  <option value="">Choose a product…</option>
                  {activeProducts.map((product) => (
                    <option key={product._id} value={product._id}>
                      {product.name} ({product.sku}) — {product.quantity} in stock
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="adjustment-quantity">Quantity Change *</label>
                <input
                  className="form-input"
                  id="adjustment-quantity"
                  type="number"
                  step="1"
                  value={quantityChange}
                  onChange={(event) => setQuantityChange(event.target.value)}
                  placeholder="e.g. 10 or -2"
                  required
                  disabled={saving}
                />
                <p className="form-help">Positive adds stock; negative removes stock.</p>
              </div>
              <div className="form-field">
                <label htmlFor="adjustment-reason">Reason *</label>
                <input
                  className="form-input"
                  id="adjustment-reason"
                  type="text"
                  minLength={3}
                  maxLength={250}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="e.g. Received supplier shipment"
                  required
                  disabled={saving}
                />
              </div>
            </div>
            <div className="form-actions">
              <button
                className="primary-button"
                type="submit"
                disabled={saving || loading || activeProducts.length === 0}
              >
                {saving ? "Saving adjustment…" : "Record Adjustment"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Low-Stock Products</h2>
            <p>Active products whose quantity is at or below their configured threshold</p>
          </div>
          <span className="muted">{lowStockTotal} item(s)</span>
        </div>

        {loading ? (
          <div className="empty-state">Loading low-stock products…</div>
        ) : lowStockProducts.length === 0 ? (
          <div className="empty-state">No active products are currently at or below their stock threshold.</div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Threshold</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.map((product) => (
                  <tr key={product._id}>
                    <td><strong>{product.name}</strong></td>
                    <td>{product.sku}</td>
                    <td>{product.category ?? "Uncategorized"}</td>
                    <td>{product.quantity}</td>
                    <td>{product.lowStockThreshold}</td>
                    <td>
                      <span className={`badge ${product.quantity === 0 ? "danger" : "warning"}`}>
                        {product.quantity === 0 ? "Out of stock" : "Low stock"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {lowStockTotal > lowStockProducts.length && (
          <p className="form-help">
            Showing {lowStockProducts.length} of {lowStockTotal} products. The API returns paginated results.
          </p>
        )}
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Recent Inventory Movements</h2>
            <p>Latest sales and manual adjustments with an audit trail</p>
          </div>
          <div className="table-toolbar">
            <label className="form-field" htmlFor="movement-product-filter">
              <span>Filter product</span>
              <select
                id="movement-product-filter"
                className="form-input"
                value={movementProductFilter}
                onChange={(event) => {
                  setLoading(true);
                  setMovementPage(1);
                  setMovementProductFilter(event.target.value);
                }}
                disabled={loading}
              >
                <option value="all">All products</option>
                {products.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name} ({product.sku})
                  </option>
                ))}
              </select>
            </label>
            <span className="muted">{movementPagination.total} record(s)</span>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">Loading movement history…</div>
        ) : movements.length === 0 ? (
          <div className="empty-state">
            No movements have been recorded yet. New sales and manual adjustments will appear here.
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date &amp; Time</th>
                  <th>Product</th>
                  <th>Movement</th>
                  <th>Change</th>
                  <th>Before</th>
                  <th>After</th>
                  <th>Reason / Invoice</th>
                  <th>Performed By</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((movement) => (
                  <tr key={movement._id}>
                    <td>{dateTime(movement.createdAt)}</td>
                    <td>
                      <strong>{movement.productName}</strong>
                      <div className="product-sku">{movement.sku}</div>
                    </td>
                    <td>{movementLabel(movement.type)}</td>
                    <td>
                      <span className={movement.quantityChange < 0 ? "danger-text" : "success-text"}>
                        {movement.quantityChange > 0 ? "+" : ""}{movement.quantityChange}
                      </span>
                    </td>
                    <td>{movement.quantityBefore}</td>
                    <td>{movement.quantityAfter}</td>
                    <td>
                      {movement.invoiceNumber ?? movement.reason}
                      {movement.invoiceNumber && <div className="product-sku">{movement.reason}</div>}
                    </td>
                    <td>
                      {movement.performedByName}
                      <div className="product-sku">{movement.performedByRole}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && movementPagination.totalPages > 1 && (
          <div className="table-footer">
            <span>
              Page {movementPagination.page} of {movementPagination.totalPages}
              {" · "}{movementPagination.total} movement(s)
            </span>
            <div className="pagination">
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setMovementPage((current) => Math.max(1, current - 1));
                }}
                disabled={movementPage <= 1}
              >
                Previous
              </button>
              <button type="button" className="active" aria-current="page" disabled>
                {movementPage}
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setMovementPage((current) => Math.min(movementPagination.totalPages, current + 1));
                }}
                disabled={movementPage >= movementPagination.totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
