import Papa from "papaparse";
import { extractOrderFromFile } from "../../lib/claude";

// Photos from phones can be a few MB, so raise the default body limit.
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

function parseCsv(base64Data) {
  const text = Buffer.from(base64Data, "base64").toString("utf-8");
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });

  // Group CSV rows into one order per unique customer_name + due_date,
  // since a CSV export may already list one row per item.
  const rows = parsed.data;
  if (rows.length === 0) {
    throw new Error("That CSV looks empty.");
  }

  const first = rows[0];
  return {
    customer_name: first.customer_name || first["Customer Name"] || "",
    address: first.address || first["Address"] || "",
    phone: first.phone || first["Phone"] || "",
    customer_id: first.customer_id || first["Customer ID"] || "",
    terms: first.terms || first["Terms"] || "",
    due_date: first.due_date || first["Due Date"] || "",
    total_due: first.total_due || first["Total Due"] || "",
    items: rows.map((row) => ({
      item_name: row.item_name || row["Item Name"] || "",
      pack: row.pack || row["Pack"] || "",
      quantity: row.quantity || row["Quantity"] || "",
      price: row.price || row["Price"] || "",
    })),
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST." });
  }

  const { filename, fileType, base64Data } = req.body || {};
  if (!filename || !base64Data) {
    return res.status(400).json({ error: "Missing file data." });
  }

  try {
    const isCsv = fileType === "text/csv" || filename.toLowerCase().endsWith(".csv");
    const order = isCsv
      ? parseCsv(base64Data)
      : await extractOrderFromFile(base64Data, filename, fileType);

    return res.status(200).json({ order });
  } catch (err) {
    console.error("parse-order failed:", err);
    return res.status(500).json({ error: err.message || "Couldn't read that file." });
  }
}
