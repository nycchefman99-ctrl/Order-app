import { useState, useRef } from "react";
import Head from "next/head";


const EMPTY_ORDER = {
  customer_name: "", address: "", phone: "", customer_id: "",
  terms: "", due_date: "", total_due: "", items: [],
};

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Home() {
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState(null); // { type: 'info'|'error'|'success', text }
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  async function handleFile(file) {
    if (!file) return;
    setStatus({ type: "info", text: `Reading ${file.name}...` });
    setBusy(true);
    setOrder(null);

    try {
      const base64Data = await fileToBase64(file);
      const res = await fetch("/api/parse-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, fileType: file.type, base64Data }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't read that file.");

      setOrder({ ...EMPTY_ORDER, ...data.order, items: data.order.items?.length ? data.order.items : [{ item_name: "", pack: "", quantity: "", price: "" }] });
      setStatus({ type: "info", text: "Check the details below, then send to the sheet." });
    } catch (err) {
      setStatus({ type: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  function updateField(field, value) {
    setOrder((o) => ({ ...o, [field]: value }));
  }

  function updateItem(index, field, value) {
    setOrder((o) => {
      const items = [...o.items];
      items[index] = { ...items[index], [field]: value };
      return { ...o, items };
    });
  }

  function addItem() {
    setOrder((o) => ({ ...o, items: [...o.items, { item_name: "", pack: "", quantity: "", price: "" }] }));
  }

  function removeItem(index) {
    setOrder((o) => ({ ...o, items: o.items.filter((_, i) => i !== index) }));
  }

  async function confirmOrder() {
    setBusy(true);
    setStatus({ type: "info", text: "Sending to the sheet..." });
    try {
      const res = await fetch("/api/append-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't write to the sheet.");

      setStatus({ type: "success", text: `Order ${data.orderId} added — ${data.rowCount} row(s) written.` });
      setOrder(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      setStatus({ type: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <Head>
        <title>Order Intake</title>
      </Head>

      <div className="header">
        <div className="brand">
          <img src="/icon-192.png" alt="" className="brand-mark" />
          <div>
            <h1>Order Intake</h1>
            <p>Upload a PDF, scan, WhatsApp photo, or CSV — check the details, send it to the sheet.</p>
          </div>
        </div>
      </div>

      <label className="dropzone">
        <span className="dropzone-label">Drop an order here, or tap to choose a file</span>
        <span className="dropzone-sub">PDF, JPG, PNG, or CSV</span>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,.csv"
          onChange={(e) => handleFile(e.target.files[0])}
          disabled={busy}
        />
      </label>

      {status && <div className={`status ${status.type}`}>{status.text}</div>}

      {order && (
        <div className="review-card">
          <h2>Order details</h2>

          {[
            ["customer_name", "Customer"],
            ["address", "Address"],
            ["phone", "Phone"],
            ["customer_id", "Cust. ID"],
            ["terms", "Terms"],
            ["due_date", "Due date"],
            ["total_due", "Total due"],
          ].map(([field, label]) => (
            <div className="field-row" key={field}>
              <label>{label}</label>
              <input value={order[field] || ""} onChange={(e) => updateField(field, e.target.value)} />
            </div>
          ))}

          <table className="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Pack</th>
                <th>Qty</th>
                <th>Price</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, i) => (
                <tr key={i}>
                  <td><input value={item.item_name} onChange={(e) => updateItem(i, "item_name", e.target.value)} /></td>
                  <td><input value={item.pack} onChange={(e) => updateItem(i, "pack", e.target.value)} /></td>
                  <td><input value={item.quantity} onChange={(e) => updateItem(i, "quantity", e.target.value)} /></td>
                  <td><input value={item.price} onChange={(e) => updateItem(i, "price", e.target.value)} /></td>
                  <td><button className="btn-secondary" onClick={() => removeItem(i)} disabled={busy}>×</button></td>
                </tr>
              ))}
            </tbody>
          </table>

          <button className="add-item" onClick={addItem} disabled={busy}>+ Add item</button>

          <div className="actions">
            <button className="btn-primary" onClick={confirmOrder} disabled={busy}>Send to sheet</button>
            <button className="btn-secondary" onClick={() => setOrder(null)} disabled={busy}>Discard</button>
          </div>
        </div>
      )}
    </div>
  );
}
