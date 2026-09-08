import { useState } from "react";
import PPOrders from "../components/PPOrders";

const GREEN = "#173A2B";
const INK = "#0A0A0A";
const OFFWHITE = "#F7F5EC";

export default function OrdersPage() {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: OFFWHITE,
        fontFamily: "Inter, sans-serif",
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

      {open && <PPOrders onClose={() => setOpen(false)} />}
    </div>
  );
}
