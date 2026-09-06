// Writes order rows to Google Sheets through a tiny Apps Script "Web App"
// that lives inside the Sheet itself. No Google Cloud console, no service
// account, no key files. See README.md for how to set that script up.

const SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;
const SCRIPT_SECRET = process.env.GOOGLE_SCRIPT_SECRET;

// order: the parsed order object (customer_name, address, phone, customer_id,
// terms, due_date, total_due, items: [{item_name, pack, quantity, price}])
// Sends one row per item, repeating the order-level info on each row.
export async function appendOrderToSheet(order, orderId) {
  if (!SCRIPT_URL) {
    throw new Error("GOOGLE_SCRIPT_URL isn't set yet — see README.md.");
  }

  const rows = (order.items || []).map((item) => [
    orderId,
    order.customer_name || "",
    order.address || "",
    order.phone || "",
    order.customer_id || "",
    order.terms || "",
    item.item_name || "",
    item.pack || "",
    item.quantity || "",
    item.price || "",
    order.due_date || "",
    order.total_due || "",
  ]);

  if (rows.length === 0) {
    // still record the order even if no items came through, so nothing gets lost
    rows.push([
      orderId,
      order.customer_name || "",
      order.address || "",
      order.phone || "",
      order.customer_id || "",
      order.terms || "",
      "", "", "", "",
      order.due_date || "",
      order.total_due || "",
    ]);
  }

  const res = await fetch(SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret: SCRIPT_SECRET, rows }),
  });

  const data = await res.json();
  if (!data.ok) {
    throw new Error(data.error || "The Sheet script rejected the request.");
  }

  return rows.length;
}
