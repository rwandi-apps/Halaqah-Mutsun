import { calculateAyatRange } from "./calculateAyatRange";

export default function DebugTahfizh() {
  const result = calculateAyatRange({
    start: { surah: "At-Tahrim", ayat: 1 },
    end: { surah: "Adz-Dzariyat", ayat: 30 },
  });

  return (
    <div style={{ padding: 24 }}>
      <h1>DEBUG TAHFIZH SDQ</h1>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}
