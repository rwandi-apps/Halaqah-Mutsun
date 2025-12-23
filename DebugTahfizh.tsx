import React from "react";
import { calculateTahfizhRange } from "./calculateTahfizhRange";

export default function DebugTahfizh() {
  const result = calculateTahfizhRange(
    "An-Naba",
    1,
    "An-Naba",
    30
  );

  return (
    <div style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h1>DEBUG TAHFIZH</h1>

      <p><strong>Range:</strong> An-Naba ayat 1 → 30</p>

      <div style={{ marginTop: 20 }}>
        <p><strong>Total Halaman:</strong> {result.totalPages}</p>
        <p><strong>Total Baris:</strong> {result.totalLines}</p>
      </div>
    </div>
  );
}
