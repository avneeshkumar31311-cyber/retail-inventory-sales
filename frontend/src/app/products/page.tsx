"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { api, type Product, type ProductInput } from "../../lib/api";

interface ProductFormValues {
  name: string;
  sku: string;
  price: string;
  quantity: string;
  lowStockThreshold: string;
}

const EMPTY_FORM: ProductFormValues = {
  name: "",
  sku: "",
  price: "",
  quantity: "",
  lowStockThreshold: "5",
};

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
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormValues>(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      const loadedProducts = await api.getAllProducts();
      setProducts(loadedProducts);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load products.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    api.getAllProducts()
      .then((loadedProducts) => {
        if (!active) return;
        setProducts(loadedProducts);
        setError("");
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Unable to load products.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isFormOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !saving) closeForm();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // closeForm depends on component state and intentionally reads current saving.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFormOpen, saving]);

  function openAddForm() {
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setNotice(null);
    setIsFormOpen(true);
  }

  function openEditForm(product: Product) {
    setEditingProduct(product);
    setForm({
      name: product.name,
      sku: product.sku,
      price: String(product.price),
      quantity: String(product.quantity),
      lowStockThreshold: String(product.lowStockThreshold),
    });
    setFormError("");
    setNotice(null);
    setIsFormOpen(true);
  }

  function closeForm() {
    if (saving) return;
    setIsFormOpen(false);
    setFormError("");
  }

  function validateForm(): ProductInput | null {
    const name = form.name.trim();
    const sku = form.sku.trim().toUpperCase();
    const price = Number(form.price);
    const quantity = Number(form.quantity);
    const lowStockThreshold = Number(form.lowStockThreshold);

    if (name.length < 2 || name.length > 100) {
      setFormError("Product name must be between 2 and 100 characters."); return null;
    }
    if (sku.length < 1 || sku.length > 50) {
      setFormError("SKU is required and must be no longer than 50 characters."); return null;
    }
    if (!form.price.trim() || !Number.isFinite(price) || price < 0.01) {
      setFormError("Price must be at least ₹0.01."); return null;
    }
    if (!form.quantity.trim() || !Number.isInteger(quantity) || quantity < 0) {
      setFormError("Quantity must be a whole number greater than or equal to zero."); return null;
    }
    if (!form.lowStockThreshold.trim() || !Number.isInteger(lowStockThreshold) || lowStockThreshold < 0) {
      setFormError("Low-stock threshold must be a whole number greater than or equal to zero."); return null;
    }

    return { name, sku, price, quantity, lowStockThreshold };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setNotice(null);
    const input = validateForm();
    if (!input) return;

    setSaving(true);
    try {
      if (editingProduct) {
        const updated = await api.updateProduct(editingProduct._id, input);
        setNotice({ kind: "success", text: `${updated.name} was updated successfully.` });
      } else {
        const created = await api.createProduct(input);
        setNotice({ kind: "success", text: `${created.name} was added successfully.` });
      }
      setIsFormOpen(false);
      setEditingProduct(null);
      setForm(EMPTY_FORM);
      setLoading(true);
      await loadProducts();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unable to save product.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(product: Product) {
    const confirmed = window.confirm(
      `Delete “${product.name}” (${product.sku})? This cannot be undone.`,
    );
    if (!confirmed) return;

    setDeletingId(product._id);
    setNotice(null);
    try {
      await api.deleteProduct(product._id);
      setNotice({ kind: "success", text: `${product.name} was deleted successfully.` });
      setLoading(true);
      await loadProducts();
    } catch (err) {
      setNotice({ kind: "error", text: err instanceof Error ? err.message : "Unable to delete product." });
    } finally {
      setDeletingId(null);
    }
  }

  const filteredProducts = products.filter((product) => {
    const term = search.trim().toLowerCase();
    return product.name.toLowerCase().includes(term) || product.sku.toLowerCase().includes(term);
  });
  const lowStockCount = products.filter((product) => product.quantity <= product.lowStockThreshold).length;
  const totalUnits = products.reduce((total, product) => total + product.quantity, 0);
  const inventoryValue = products.reduce((total, product) => total + product.price * product.quantity, 0);

  return (
    <>
      <div className="page-heading">
        <div><h1>Products &amp; Inventory</h1><p>Manage your products, stock levels, and inventory value.</p></div>
        <button className="primary-button" type="button" onClick={openAddForm}>+ Add Product</button>
      </div>

      {notice && <div className={notice.kind === "success" ? "success-message" : "error-message"} role={notice.kind === "success" ? "status" : "alert"}>{notice.text}</div>}
      {error && <div className="error-message" role="alert">{error}<p>Check that your backend is running on port 4000.</p><button className="secondary-button" type="button" onClick={() => { setLoading(true); void loadProducts(); }}>Try again</button></div>}

      <section className="stats-grid">
        <article className="stat-card"><div><p className="stat-label">Total Products</p><p className="stat-value">{loading ? "—" : products.length}</p><p className="stat-note">Products in your catalogue</p></div><span className="stat-icon">▤</span></article>
        <article className="stat-card"><div><p className="stat-label">Total Units in Stock</p><p className="stat-value">{loading ? "—" : totalUnits}</p><p className="stat-note">Across all products</p></div><span className="stat-icon blue">□</span></article>
        <article className="stat-card"><div><p className="stat-label">Inventory Value</p><p className="stat-value">{loading ? "—" : money(inventoryValue)}</p><p className="stat-note">Price × available quantity</p></div><span className="stat-icon">₹</span></article>
        <article className="stat-card"><div><p className="stat-label">Low Stock Items</p><p className="stat-value">{loading ? "—" : lowStockCount}</p><p className="stat-note danger">At or below stock threshold</p></div><span className="stat-icon red">!</span></article>
      </section>

      <section className="table-panel">
        <div className="panel-header table-toolbar">
          <div><h2>All Products</h2><p>{loading ? "Loading inventory..." : `${filteredProducts.length} product(s) found`}</p></div>
          <input className="search-input" type="search" placeholder="Search name or SKU..." value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search products by name or SKU" />
        </div>
        {loading ? <div className="empty-state">Loading products from your backend...</div> : filteredProducts.length === 0 ? <div className="empty-state">{search ? "No products match your search." : "No products found. Add your first product to get started."}</div> : (
          <div className="table-scroll"><table className="data-table"><thead><tr><th>Product</th><th>SKU</th><th>Price</th><th>Quantity</th><th>Stock Status</th><th>Updated</th><th>Actions</th></tr></thead><tbody>
            {filteredProducts.map((product) => {
              const isOut = product.quantity === 0;
              const isLow = product.quantity <= product.lowStockThreshold;
              return <tr key={product._id}>
                <td><strong>{product.name}</strong></td><td>{product.sku}</td><td>{money(product.price)}</td><td>{product.quantity}</td>
                <td><span className={`badge ${isOut ? "danger" : isLow ? "warning" : "success"}`}>{isOut ? "Out of stock" : isLow ? "Low stock" : "In stock"}</span></td>
                <td>{product.updatedAt ? new Date(product.updatedAt).toLocaleDateString("en-IN") : "—"}</td>
                <td><div className="action-buttons"><button className="secondary-button compact-button" type="button" onClick={() => openEditForm(product)} disabled={saving || deletingId !== null}>Edit</button><button className="danger-button compact-button" type="button" onClick={() => void handleDelete(product)} disabled={saving || deletingId !== null}>{deletingId === product._id ? "Deleting…" : "Delete"}</button></div></td>
              </tr>;
            })}
          </tbody></table></div>
        )}
      </section>

      <div className="page-actions"><Link className="secondary-button" href="/">← Back to Dashboard</Link></div>

      {isFormOpen && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeForm(); }}>
          <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="product-form-title" aria-describedby="product-form-description">
            <div className="modal-header"><div><h2 id="product-form-title">{editingProduct ? "Edit Product" : "Add Product"}</h2><p id="product-form-description">{editingProduct ? "Update the product details below." : "Enter product details to add it to your inventory."}</p></div><button className="modal-close" type="button" onClick={closeForm} disabled={saving} aria-label="Close product form">×</button></div>
            <form noValidate onSubmit={handleSubmit}>
              {formError && <div className="error-message" role="alert">{formError}</div>}
              <div className="form-grid">
                <div className="form-field full-width"><label htmlFor="product-name">Product name *</label><input className="form-input" id="product-name" type="text" minLength={2} maxLength={100} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="e.g. Wireless Mouse" required disabled={saving} /></div>
                <div className="form-field"><label htmlFor="product-sku">SKU *</label><input className="form-input" id="product-sku" type="text" maxLength={50} value={form.sku} onChange={(event) => setForm((current) => ({ ...current, sku: event.target.value }))} placeholder="e.g. MOUSE-001" required disabled={saving} /></div>
                <div className="form-field"><label htmlFor="product-price">Price (₹) *</label><input className="form-input" id="product-price" type="number" min="0.01" step="0.01" value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} placeholder="899.00" required disabled={saving} /></div>
                <div className="form-field"><label htmlFor="product-quantity">Quantity *</label><input className="form-input" id="product-quantity" type="number" min="0" step="1" value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))} placeholder="20" required disabled={saving} /></div>
                <div className="form-field"><label htmlFor="product-low-stock">Low-stock threshold *</label><input className="form-input" id="product-low-stock" type="number" min="0" step="1" value={form.lowStockThreshold} onChange={(event) => setForm((current) => ({ ...current, lowStockThreshold: event.target.value }))} required disabled={saving} /></div>
              </div>
              <p className="form-help">Products at or below the threshold are marked as low stock. A quantity of zero means out of stock.</p>
              <div className="form-actions"><button className="secondary-button" type="button" onClick={closeForm} disabled={saving}>Cancel</button><button className="primary-button" type="submit" disabled={saving}>{saving ? "Saving…" : editingProduct ? "Save Changes" : "Save Product"}</button></div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
