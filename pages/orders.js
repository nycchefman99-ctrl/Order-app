import { useState } from "react";
import PPOrders from "../components/PPOrders";

const GREEN = "#173A2B";
const INK = "#0A0A0A";
const OFFWHITE = "#F7F5EC";

const PAGE_URL = "https://order-app-ten-rouge.vercel.app/orders";
const QR_SRC = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(PAGE_URL)}`;

export default function OrdersPage() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(PAGE_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Clipboard API can fail on some older browsers/contexts — fail quietly
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
        background: OFFWHITE,
        fontFamily: "Inter, sans-serif",
        padding: 24,
      }}
    >
      <button
        onClick={() => setOpen(true)}
        style={{
          background: GREEN,
          color: OFFWHITE,
          fontWeight: 800,
          fontSize: 16,
          border: `2px solid ${INK}`,
          borderRadius: 2,
          padding: "14px 28px",
          cursor: "pointer",
        }}
      >
        File New Orders
      </button>

      {/* Share card */}
      <div
        style={{
          border: `2px solid ${INK}`,
          background: "#FFFFFF",
          borderRadius: 2,
          padding: 20,
          textAlign: "center",
          maxWidth: 280,
        }}
      >
        <div style={{ color: INK, fontWeight: 800, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 12 }}>
          Scan to open on your phone or iPad
        </div>
        <img
          src={QR_SRC}
          alt="QR code linking to the PP Orders page"
          width={180}
          height={180}
          style={{ border: `2px solid ${INK}`, display: "block", margin: "0 auto 14px" }}
        />
        <button
          onClick={copyLink}
          style={{
            width: "100%",
            background: copied ? "#4A7A5E" : GREEN,
            color: OFFWHITE,
            fontWeight: 800,
            fontSize: 13,
            border: `2px solid ${INK}`,
            borderRadius: 2,
            padding: "9px 0",
            cursor: "pointer",
          }}
        >
          {copied ? "Link copied" : "Copy link"}
        </button>
      </div>

      {open && <PPOrders onClose={() => setOpen(false)} />}
    </div>
  );
}
