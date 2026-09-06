import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// This is the instruction we give Claude for reading an order form.
// If your order form's layout changes, tweak the wording here.
const EXTRACTION_PROMPT = `You are reading a wholesale food order form (it may be a clean PDF, a scanned page, or a photo taken on a phone, possibly sent through WhatsApp).

Pull out the order details and return ONLY a JSON object, no other text, no markdown fences, in exactly this shape:

{
  "customer_name": "",
  "address": "",
  "phone": "",
  "customer_id": "",
  "terms": "",
  "due_date": "",
  "total_due": "",
  "items": [
    { "item_name": "", "pack": "", "quantity": "", "price": "" }
  ]
}

Rules:
- If a field is missing or unreadable, use an empty string for it. Never invent values.
- "items" should have one entry per line item on the order.
- Keep numbers as plain strings exactly as written on the form (don't reformat currency or add symbols).
- due_date should be written as it appears on the form.`;

function mediaTypeFor(filename, providedType) {
  if (providedType) return providedType;
  const lower = filename.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

// base64Data: the file contents, base64-encoded, no data: prefix
export async function extractOrderFromFile(base64Data, filename, providedType) {
  const mediaType = mediaTypeFor(filename, providedType);
  const isPdf = mediaType === "application/pdf";

  const fileBlock = isPdf
    ? { type: "document", source: { type: "base64", media_type: mediaType, data: base64Data } }
    : { type: "image", source: { type: "base64", media_type: mediaType, data: base64Data } };

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1500,
    messages: [
      {
        role: "user",
        content: [fileBlock, { type: "text", text: EXTRACTION_PROMPT }],
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock) {
    throw new Error("Claude didn't return any text to parse.");
  }

  const cleaned = textBlock.text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}
