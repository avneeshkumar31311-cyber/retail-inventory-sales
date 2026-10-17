"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api, type Product, type Sale } from "../../../lib/api";

interface CartLine {
  product: Product;
  quantity: number;
}

function money(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);
}

export default function CreateSalePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<Sale | null>(null);
  const [discountPercent, setDiscountPercent] = useState("0");
  const [taxPercent, setTaxPercent] = useState("0");

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

  const availableProducts = products.filter((product) => product.isActive !== false && product.quantity > 0);
  const cartSubtotal = useMemo(
    () => Number(cart.reduce(
      (sum, line) => sum + (line.product.sellingPrice ?? line.product.price) * line.quantity,
      0,
    ).toFixed(2)),
    [cart],
  );
  const safeDiscountPercent = Number.isFinite(Number(discountPercent))
    ? Math.min(100, Math.max(0, Number(discountPercent)))
    : 0;
  const safeTaxPercent = Number.isFinite(Number(taxPercent))
    ? Math.min(100, Math.max(0, Number(taxPercent)))
    : 0;
  const cartDiscount = Number((cartSubtotal * safeDiscountPercent / 100).toFixed(2));
  const discountedSubtotal = Number((cartSubtotal - cartDiscount).toFixed(2));
  const cartTax = Number((discountedSubtotal * safeTaxPercent / 100).toFixed(2));
  const cartTotal = Number((discountedSubtotal + cartTax).toFixed(2));
  const unitsInCart = useMemo(
    () => cart.reduce((sum, line) => sum + line.quantity, 0),
    [cart],
  );

  function addSelectedProduct() {
    setError("");
    setSuccess(null);
    const product = availableProducts.find((item) => item._id === selectedProductId);
    if (!product) { setError("Select a product that has stock available."); return; }
    const existing = cart.find((line) => line.product._id === product._id);
    if (existing) {
      if (existing.quantity >= product.quantity) {
        setError(`Only ${product.quantity} unit(s) of ${product.name} are in stock.`); return;
      }
      setCart((current) => current.map((line) => line.product._id === product._id ? { ...line, quantity: line.quantity + 1 } : line));
    } else {
      setCart((current) => [...current, { product, quantity: 1 }]);
    }
    setSelectedProductId("");
  }

  function setQuantity(productId: string, quantity: number) {
    setError("");
    setCart((current) => current.map((line) => {
      if (line.product._id !== productId) return line;
      return { ...line, quantity: Math.min(line.product.quantity, Math.max(1, quantity)) };
    }));
  }

  function removeFromCart(productId: string) {
    setCart((current) => current.filter((line) => line.product._id !== productId));
  }

  async function submitSale() {
    setError("");
    setSuccess(null);
    if (cart.length === 0) {
      setError("Add at least one product before completing the sale.");
      return;
    }

    const parsedDiscount = Number(discountPercent);
    const parsedTax = Number(taxPercent);

    if (!discountPercent.trim() || !Number.isFinite(parsedDiscount) || parsedDiscount < 0 || parsedDiscount > 100) {
      setError("Discount must be between 0% and 100%.");
      return;
    }
    if (!taxPercent.trim() || !Number.isFinite(parsedTax) || parsedTax < 0 || parsedTax > 100) {
      setError("Tax must be between 0% and 100%.");
      return;
    }

    setSaving(true);
    try {
      const sale = await api.createSale({
        items: cart.map((line) => ({
          product: line.product._id,
          quantity: line.quantity,
        })),
        discountPercent: parsedDiscount,
        taxPercent: parsedTax,
      });
      setSuccess(sale);
      setCart([]);
      setDiscountPercent("0");
      setTaxPercent("0");
      setLoading(true);
      await loadProducts();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to complete sale.";
      // Stock is re-read after failures too, since inventory may have changed
      // between loading products and submitting this sale. Preserve the checkout
      // error after the refresh so the user can see why it failed.
      try {
        setProducts(await api.getAllProducts());
        setError(message);
      } catch {
        setError(`${message} Product availability could not be refreshed; please reload the page.`);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="page-heading"><div><h1>Create Sale</h1><p>Select in-stock products, adjust quantities, and complete a transaction.</p></div><Link className="secondary-button" href="/sales">Sales History →</Link></div>
      {error && <div className="error-message" role="alert">{error}</div>}
      {success && (
        <div className="success-message invoice-print-area" role="status">
          <strong>Sale completed successfully.</strong>
          <p>
            Invoice: <strong>{success.invoiceNumber ?? `Sale #${success._id.slice(-6).toUpperCase()}`}</strong>
          </p>
          {success.subtotal !== undefined && (
            <>
              <div className="summary-line">
                <span>Subtotal</span>
                <strong>{money(success.subtotal)}</strong>
              </div>
              <div className="summary-line">
                <span>Discount ({success.discountPercent ?? 0}%)</span>
                <strong>−{money(success.discountAmount ?? 0)}</strong>
              </div>
              <div className="summary-line">
                <span>Tax ({success.taxPercent ?? 0}%)</span>
                <strong>{money(success.taxAmount ?? 0)}</strong>
              </div>
            </>
          )}
          <div className="summary-line summary-total">
            <span>Invoice total</span>
            <strong>{money(success.totalAmount)}</strong>
          </div>
          <div className="table-scroll invoice-items">
            <table className="data-table compact-table">
              <thead>
                <tr><th>Product</th><th>SKU</th><th>Qty</th><th>Unit price</th><th>Amount</th></tr>
              </thead>
              <tbody>
                {success.items.map((item, index) => (
                  <tr key={`${success._id}-${item.product}-${index}`}>
                    <td>{item.productName}</td>
                    <td>{item.sku}</td>
                    <td>{item.quantity}</td>
                    <td>{money(item.unitPrice)}</td>
                    <td>{money(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>Stock was updated by the backend and the invoice was recorded.</p>
          <div className="page-actions">
            <Link className="text-link" href="/sales">View sales history →</Link>
            <button className="secondary-button" type="button" onClick={() => window.print()}>Print Invoice</button>
            <button className="secondary-button" type="button" onClick={() => setSuccess(null)}>Create another sale</button>
          </div>
        </div>
      )}

      <section className="sale-layout">
        <article className="panel">
          <div className="panel-header"><div><h2>Products</h2><p>Only active products with available stock can be added.</p></div></div>
          {loading ? <div className="empty-state">Loading products...</div> : products.length === 0 ? <div className="empty-state">No products found. Add products before creating a sale.</div> : availableProducts.length === 0 ? <div className="empty-state">No active products with available stock. Activate a product or add stock before creating a sale.</div> : (
            <div className="product-picker"><label className="form-field" htmlFor="sale-product-select"><span>Choose product</span><select className="form-input" id="sale-product-select" value={selectedProductId} onChange={(event) => setSelectedProductId(event.target.value)} disabled={saving}><option value="">Select a product…</option>{availableProducts.map((product) => <option key={product._id} value={product._id}>{product.name} ({product.sku}) — {money(product.sellingPrice ?? product.price)} · {product.quantity} in stock</option>)}</select></label><button className="primary-button" type="button" onClick={addSelectedProduct} disabled={saving || !selectedProductId}>Add to cart</button></div>
          )}
          <div className="cart-list">
            {cart.length === 0 ? <div className="empty-state">Your cart is empty.</div> : cart.map((line) => (
              <div className="cart-row" key={line.product._id}>
                <div><strong>{line.product.name}</strong><div className="product-sku">{line.product.sku} · {money(line.product.sellingPrice ?? line.product.price)} each · {line.product.quantity} in stock</div></div>
                <div className="quantity-control"><button type="button" aria-label={`Decrease ${line.product.name} quantity`} onClick={() => line.quantity <= 1 ? removeFromCart(line.product._id) : setQuantity(line.product._id, line.quantity - 1)} disabled={saving}>−</button><span aria-label="Quantity">{line.quantity}</span><button type="button" aria-label={`Increase ${line.product.name} quantity`} onClick={() => setQuantity(line.product._id, line.quantity + 1)} disabled={saving || line.quantity >= line.product.quantity}>+</button></div>
                <strong>{money((line.product.sellingPrice ?? line.product.price) * line.quantity)}</strong>
                <button className="text-button danger-text" type="button" onClick={() => removeFromCart(line.product._id)} disabled={saving}>Remove</button>
              </div>
            ))}
          </div>
        </article>

        <aside className="panel">
          <div className="panel-header"><div><h2>Invoice Summary</h2><p>Server-side totals are authoritative at checkout.</p></div></div>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="sale-discount">Discount (%)</label>
              <input
                className="form-input"
                id="sale-discount"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={discountPercent}
                onChange={(event) => setDiscountPercent(event.target.value)}
                disabled={saving}
              />
            </div>
            <div className="form-field">
              <label htmlFor="sale-tax">Tax (%)</label>
              <input
                className="form-input"
                id="sale-tax"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={taxPercent}
                onChange={(event) => setTaxPercent(event.target.value)}
                disabled={saving}
              />
            </div>
          </div>
          <div className="summary-line"><span>Unique products</span><strong>{cart.length}</strong></div>
          <div className="summary-line"><span>Total units</span><strong>{unitsInCart}</strong></div>
          <div className="summary-line"><span>Subtotal</span><strong>{money(cartSubtotal)}</strong></div>
          <div className="summary-line"><span>Discount ({safeDiscountPercent}%)</span><strong>−{money(cartDiscount)}</strong></div>
          <div className="summary-line"><span>Tax ({safeTaxPercent}%)</span><strong>{money(cartTax)}</strong></div>
          <div className="summary-line summary-total"><span>Estimated total</span><strong>{money(cartTotal)}</strong></div>
          <p className="form-help">Prices and available quantities are verified by the backend during checkout. A sale will not complete if stock is insufficient.</p>
          <button className="primary-button full-width checkout-button" type="button" onClick={() => void submitSale()} disabled={saving || loading || cart.length === 0}>{saving ? "Completing sale…" : "Complete Sale"}</button>
          <Link className="secondary-button full-width back-button" href="/products">Manage Products</Link>
        </aside>
      </section>
    </>
  );
}
