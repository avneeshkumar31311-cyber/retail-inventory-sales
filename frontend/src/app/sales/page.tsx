"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, type Sale, type Pagination } from "../../lib/api";

const PAGE_SIZE = 10;
function money(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);
}
function dateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown date" : date.toLocaleString("en-IN");
}

export default function SalesHistoryPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSales = useCallback(async (requestedPage: number) => {
    try {
      const result = await api.getSales(requestedPage, PAGE_SIZE);
      setSales(result.sales);
      setPagination(result.pagination);
      setError("");
      if (result.pagination.totalPages > 0 && requestedPage > result.pagination.totalPages) {
        setPage(result.pagination.totalPages);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load sales history.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    api.getSales(page, PAGE_SIZE)
      .then((result) => {
        if (!active) return;
        setSales(result.sales);
        setPagination(result.pagination);
        setError("");

        if (
          result.pagination.totalPages > 0 &&
          page > result.pagination.totalPages
        ) {
          setPage(result.pagination.totalPages);
        }
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Unable to load sales history.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page]);

  return (
    <>
      <div className="page-heading"><div><h1>Sales History</h1><p>Review completed transactions and the items included in each sale.</p></div><Link className="primary-button" href="/sales/new">+ Create Sale</Link></div>
      {error && <div className="error-message" role="alert">{error}<button className="secondary-button" type="button" onClick={() => { setLoading(true); void loadSales(page); }}>Try again</button></div>}
      <section className="table-panel">
        <div className="panel-header table-toolbar"><div><h2>Recorded Sales</h2><p>{loading ? "Loading sales…" : `${pagination.total} transaction(s) in total`}</p></div><span className="muted">Sorted newest first</span></div>
        {loading ? <div className="empty-state">Loading sales history…</div> : sales.length === 0 ? <div className="empty-state">No sales have been recorded yet. <div className="page-actions" style={{ justifyContent: "center" }}><Link className="primary-button" href="/sales/new">Create your first sale</Link></div></div> : (
          <div className="table-scroll"><table className="data-table"><thead><tr><th>Invoice</th><th>Date &amp; Time</th><th>Unique Items</th><th>Units</th><th>Discount</th><th>Tax</th><th>Total</th><th>Details</th></tr></thead><tbody>
            {sales.map((sale) => {
              const totalUnits = sale.items.reduce((sum, item) => sum + item.quantity, 0);
              return <tr key={sale._id}>
                <td>
                  <strong>{sale.invoiceNumber ?? `#${sale._id.slice(-6).toUpperCase()}`}</strong>
                  <div className="product-sku">{sale.createdByName ?? sale._id}</div>
                </td>
                <td>{dateTime(sale.createdAt)}</td>
                <td>{sale.items.length}</td>
                <td>{totalUnits}</td>
                <td>{money(sale.discountAmount ?? 0)}{sale.discountPercent ? ` (${sale.discountPercent}%)` : ""}</td>
                <td>{money(sale.taxAmount ?? 0)}{sale.taxPercent ? ` (${sale.taxPercent}%)` : ""}</td>
                <td><strong>{money(sale.totalAmount)}</strong></td>
                <td><details className="sale-details"><summary>View items</summary><div className="sale-detail-popover">
                  <table className="data-table compact-table">
                    <thead><tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr></thead>
                    <tbody>
                      {sale.items.map((item, index) => (
                        <tr key={`${sale._id}-${item.product}-${index}`}>
                          <td><strong>{item.productName}</strong><div className="product-sku">{item.sku}</div></td>
                          <td>{item.quantity}</td>
                          <td>{money(item.unitPrice)}</td>
                          <td>{money(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="summary-line">
                    <span>Subtotal</span>
                    <strong>{money(sale.subtotal ?? sale.items.reduce((sum, item) => sum + item.subtotal, 0))}</strong>
                  </div>
                  <div className="summary-line">
                    <span>Discount ({sale.discountPercent ?? 0}%)</span>
                    <strong>−{money(sale.discountAmount ?? 0)}</strong>
                  </div>
                  <div className="summary-line">
                    <span>Tax ({sale.taxPercent ?? 0}%)</span>
                    <strong>{money(sale.taxAmount ?? 0)}</strong>
                  </div>
                  <div className="summary-line summary-total">
                    <span>Invoice total</span>
                    <strong>{money(sale.totalAmount)}</strong>
                  </div>
                  {sale.createdByName && (
                    <p className="form-help">
                      Recorded by {sale.createdByName}{sale.createdByRole ? ` (${sale.createdByRole})` : ""}
                    </p>
                  )}
                </div></details></td>
              </tr>;
            })}
          </tbody></table></div>
        )}
        {!loading && pagination.totalPages > 0 && <div className="table-footer"><span>Page {pagination.page} of {pagination.totalPages} · {pagination.total} sale(s)</span><div className="pagination"><button type="button" onClick={() => { setLoading(true); setPage((current) => Math.max(1, current - 1)); }} disabled={page <= 1 || loading}>Previous</button><button type="button" className="active" aria-current="page" disabled>{page}</button><button type="button" onClick={() => { setLoading(true); setPage((current) => Math.min(pagination.totalPages, current + 1)); }} disabled={page >= pagination.totalPages || loading}>Next</button></div></div>}
      </section>
    </>
  );
}
