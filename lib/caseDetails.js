import { allCases } from "./cases";

const advocate = { name: "Adv. Suresh Mehta", note: "Reg. No. D/12345" };

// Rich data exists only for the first case; the rest get defaults built from the list row.
const rajesh = {
  firNo: "FIR/2026/045",
  filed: "2026-01-12",
  sections: "379 IPC",
  description:
    "Alleged theft of mobile phone from market area on 10 Jan 2026. Investigation completed, chargesheet filed.",
  parties: [
    { role: "Petitioner / Accused", name: "Rajesh Kumar", note: "S/o Mohan Kumar", kind: "person", phone: "+91 98765 43210" },
    { role: "Respondent", name: "State Government", note: "Through Public Prosecutor", kind: "govt" },
    { role: "Investigating Officer", name: "SI Amit Verma", note: "City Police Station", kind: "officer", phone: "+91 99000 11122" },
    { role: "Advocate (Defense)", name: advocate.name, note: advocate.note, kind: "person", phone: "+91 98111 22233" },
  ],
  extraDates: [{ label: "Charge Framed", date: "2026-03-20" }],
};

function buildDefault(c) {
  const [a, b] = c.title.split(" vs. ");
  const criminal = c.type === "Criminal";
  const n = Number(c.caseNo.split("/")[2]) || 1;
  // spread filing dates across the year so reports and charts have something to show
  const filed = `2026-${String(1 + (n % 9)).padStart(2, "0")}-${String(1 + ((n * 7) % 27)).padStart(2, "0")}`;
  return {
    firNo: criminal ? `FIR/2026/${c.caseNo.split("/")[2]}` : "-",
    filed,
    sections: criminal ? "IPC" : "-",
    description: `${c.subtitle}. Matter is currently ${c.status.toLowerCase()} before ${c.court}.`,
    parties: [
      { role: "Petitioner / Client", name: c.client, note: a, kind: "person" },
      { role: "Respondent", name: b ?? "Opposite Party", note: "Through counsel", kind: "govt" },
      ...(criminal ? [{ role: "Investigating Officer", name: "SI Amit Verma", note: "City Police Station", kind: "officer" }] : []),
      { role: "Advocate", name: advocate.name, note: advocate.note, kind: "person" },
    ],
    extraDates: [],
  };
}

// seed-time helper: the case-specific fields a case record carries
export function detailFor(c) {
  const d = c.caseNo === allCases[0].caseNo ? rajesh : buildDefault(c);
  return {
    ...d,
    parties: d.parties.map((p, i) => ({ id: `${c.caseNo}-p${i}`, ...p })),
    extraDates: d.extraDates.map((x, i) => ({ id: `${c.caseNo}-d${i}`, ...x })),
  };
}

export const defaultAdvocate = advocate;
