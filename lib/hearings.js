// [date, time, title, caseNo, client, type, court, purpose]
const rows = [
  ["2026-10-01", "10:00 AM", "Pooja Mehta vs. State", "CR/2026/220", "Pooja Mehta", "Criminal", "Court No. 3, District Court", "Hearing"],
  ["2026-10-05", "10:30 AM", "State vs. Rajesh Kumar", "CR/2026/145", "Rajesh Kumar", "Criminal", "Court No. 3, District Court", "Arguments"],
  ["2026-10-06", "11:00 AM", "Anita Sharma vs. M/s ABC Ltd.", "CS/2026/089", "Anita Sharma", "Civil", "Court No. 5, District Court", "Evidence recording"],
  ["2026-10-08", "02:30 PM", "Rohan vs. State", "CR/2026/211", "Rohan", "Criminal", "High Court", "Framing of charges"],
  ["2026-10-12", "11:00 AM", "Sunita vs. City Corporation", "CS/2026/132", "Sunita Devi", "Civil", "Court No. 2", "Plea hearing"],
  ["2026-10-15", "12:00 PM", "Meera Devi vs. Union of India", "WP/2026/076", "Meera Devi", "Writ", "High Court", "Final arguments"],
  ["2026-10-20", "11:00 AM", "Vikram vs. State", "CR/2026/198", "Vikram", "Criminal", "Sessions Court", "Evidence"],
  ["2026-10-25", "10:00 AM", "ABC Ltd. vs. DEF Corp.", "CS/2026/201", "ABC Ltd.", "Civil", "Commercial Court", "Written submissions"],
  ["2026-10-28", "12:30 PM", "Rahul vs. Insurance Co.", "CS/2026/176", "Rahul Verma", "Civil", "Court No. 4", "Hearing"],
];

export const hearings = rows.map(([date, time, title, caseNo, client, type, court, purpose]) => ({
  date, time, title, caseNo, client, type, court, purpose,
}));

export const hearingCourts = [...new Set(hearings.map((h) => h.court))];

// whole days from `refMs` (UTC midnight) to an ISO date
export function daysUntil(iso, refMs) {
  const [y, m, d] = iso.split("-").map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - refMs) / 86400000);
}

export function relativeLabel(days) {
  if (days === 0) return { text: "Today", tone: "bg-red-100 text-red-600" };
  if (days === 1) return { text: "Tomorrow", tone: "bg-amber-100 text-amber-700" };
  if (days > 1) return { text: `In ${days} days`, tone: "bg-sky-50 text-sky-600" };
  const ago = Math.abs(days);
  return { text: `${ago} ${ago === 1 ? "day" : "days"} ago`, tone: "bg-red-100 text-red-600" };
}
