import { appendOrderToSheet } from "../../lib/sheets";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST." });
  }

  const { order } = req.body || {};
  if (!order) {
    return res.status(400).json({ error: "Missing order data." });
  }

  try {
    const orderId = `PP-${Date.now()}`;
    const rowCount = await appendOrderToSheet(order, orderId);
    return res.status(200).json({ orderId, rowCount });
  } catch (err) {
    console.error("append-order failed:", err);
    return res.status(500).json({ error: err.message || "Couldn't write to the sheet." });
  }
}
