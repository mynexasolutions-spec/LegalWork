// Validated categorical slots (blue, orange, aqua) from the reference palette - assigned by entity, never by rank.
export const SERIES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#4a3aa7"];

export const INK = {
  surface: "#ffffff",
  primary: "#0b0b0b",
  secondary: "#52514e",
  muted: "#898781",
  grid: "#e1e0d9",
  axis: "#c3c2b7",
};

// the same entity always gets the same colour on every chart
export const STATUS_COLOR = { Active: SERIES[0], Pending: SERIES[1], Closed: SERIES[2] };

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function niceStep(max) {
  const rough = Math.max(max, 1) / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  for (const m of [1, 2, 5, 10]) if (m * mag >= rough) return m * mag;
  return 10 * mag;
}

// Monday-based week buckets around today: [{ start, end, label }] from -n to +n weeks
export function weekBuckets(todayIsoStr, n) {
  const [y, m, d] = todayIsoStr.split("-").map(Number);
  const base = Date.UTC(y, m - 1, d);
  const dow = (new Date(base).getUTCDay() + 6) % 7;
  const monday = base - dow * 86400000;
  const iso = (ms) => new Date(ms).toISOString().slice(0, 10);
  return Array.from({ length: n * 2 + 1 }, (_, k) => {
    const start = monday + (k - n) * 7 * 86400000;
    const s = new Date(start);
    return { start: iso(start), end: iso(start + 6 * 86400000), label: `${s.getUTCDate()} ${MONTHS[s.getUTCMonth()]}` };
  });
}
