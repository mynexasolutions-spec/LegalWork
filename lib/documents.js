import { allCases } from "./cases";

const caseTitle = (caseNo) => allCases.find((c) => c.caseNo === caseNo)?.title ?? caseNo;

const to24 = (t) => {
  const [hm, ap] = t.split(" ");
  let [h, m] = hm.split(":").map(Number);
  if (ap === "PM" && h !== 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const extKind = (name) => {
  const ext = name.split(".").pop().toLowerCase();
  if (ext === "pdf") return "pdf";
  if (["doc", "docx"].includes(ext)) return "doc";
  if (["xls", "xlsx"].includes(ext)) return "sheet";
  if (["jpg", "jpeg", "png"].includes(ext)) return "image";
  return "zip";
};

// [name, caseNo, type, date, time, sizeKb, uploadedBy]
const featured = [
  ["FIR Copy.pdf", "CR/2026/145", "Case File", "2026-10-05", "10:30 AM", 2458, "Harsh Kumar"],
  ["Chargesheet.pdf", "CR/2026/145", "Case File", "2026-10-02", "11:20 AM", 3174, "Harsh Kumar"],
  ["Court_Order_05102026.pdf", "CR/2026/145", "Court Order", "2026-10-05", "01:15 PM", 1843, "Suresh Mehta"],
  ["Evidence_List.xlsx", "CS/2026/089", "Evidence", "2026-10-03", "04:20 PM", 450, "Harsh Kumar"],
  ["CCTV_Footage.zip", "CR/2026/145", "Evidence", "2026-10-01", "09:10 AM", 12698, "Amit Verma"],
  ["Witness_Statement.pdf", "CR/2026/145", "Evidence", "2026-09-28", "11:45 AM", 800, "Harsh Kumar"],
  ["Plea_Draft.docx", "CR/2026/211", "Pleading", "2026-09-25", "02:30 PM", 620, "Suresh Mehta"],
  ["Notice_to_Respondent.pdf", "CS/2026/132", "Notice", "2026-09-20", "11:00 AM", 290, "Harsh Kumar"],
  ["Site_Photographs.jpg", "CR/2026/198", "Evidence", "2026-09-18", "05:10 PM", 2150, "Amit Verma"],
  ["Legal_Research.docx", "CS/2026/201", "Research", "2026-09-15", "12:20 PM", 410, "Harsh Kumar"],
];

// how many more documents each type needs so the folder totals come out right (124 overall)
const remaining = {
  "Case File": 56, Pleading: 9, Notice: 5, Correspondence: 4, Research: 2,
  Draft: 5, "Court Order": 11, Evidence: 14, Other: 8,
};

const templates = {
  "Case File": [["Petition_Copy", "pdf"], ["Vakalatnama", "pdf"], ["Affidavit", "docx"], ["ID_Proof", "pdf"], ["Property_Papers", "pdf"], ["Case_Brief", "docx"], ["Client_Statement", "pdf"], ["Annexures", "pdf"]],
  "Court Order": [["Interim_Order", "pdf"], ["Final_Order", "pdf"], ["Court_Order", "pdf"]],
  Evidence: [["Evidence_Photo", "jpg"], ["Evidence_Bundle", "zip"], ["Evidence_Log", "xlsx"]],
  Pleading: [["Written_Statement", "docx"], ["Reply_Affidavit", "pdf"], ["Rejoinder", "docx"]],
  Notice: [["Legal_Notice", "pdf"], ["Notice_to_Respondent", "pdf"]],
  Correspondence: [["Email_Thread", "pdf"], ["Client_Letter", "docx"]],
  Research: [["Legal_Research", "docx"], ["Case_Law_Notes", "pdf"]],
  Draft: [["Draft_Petition", "docx"], ["Draft_Appeal", "docx"]],
  Other: [["Misc_Document", "pdf"], ["Scanned_Copy", "pdf"]],
};

const TIMES = ["10:15 AM", "11:40 AM", "12:05 PM", "02:20 PM", "03:45 PM", "04:30 PM", "09:30 AM"];
const USERS = ["Harsh Kumar", "Suresh Mehta", "Amit Verma"];

// small seeded shuffle so the generated rows don't come out grouped by type, and are the same on server and client
function shuffle(list, seed = 7) {
  let s = seed;
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) % 2147483648;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const counters = {};
const generatedTypes = shuffle(
  Object.entries(remaining).flatMap(([type, n]) => Array(n).fill(type))
);

const generated = generatedTypes.map((type, i) => {
  const n = (counters[type] = (counters[type] ?? -1) + 1);
  const [base, ext] = templates[type][n % templates[type].length];
  const d = new Date(Date.UTC(2026, 8, 14) - Math.floor(i * 1.6) * 86400000);
  return [
    `${base}_${n + 1}.${ext}`,
    allCases[(i * 5 + 3) % allCases.length].caseNo,
    type,
    d.toISOString().slice(0, 10),
    TIMES[i % TIMES.length],
    90 + ((i * 7919) % 4000),
    USERS[i % USERS.length],
  ];
});

export const documents = [...featured, ...generated].map(
  ([name, caseNo, type, date, time, sizeKb, by], i) => ({
    id: `doc${i}`,
    name, caseNo, caseTitle: caseTitle(caseNo), type, date, time, sizeKb, by,
    ts: `${date}T${to24(time)}`,
    kind: extKind(name),
  })
);

export const formatSize = (kb) => (kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`);

export const docTypes = ["Case File", "Court Order", "Evidence", "Pleading", "Notice", "Correspondence", "Research", "Draft", "Other"];

const caseGroup = ["Case File", "Pleading", "Notice", "Correspondence", "Research", "Draft"];

// "Case Files" is a parent folder that also holds the pleading/notice/etc. sub-folders
export const folders = [
  { id: "all", label: "All Documents", types: null },
  { id: "case", label: "Case Files", types: caseGroup },
  { id: "orders", label: "Court Orders", types: ["Court Order"] },
  { id: "evidence", label: "Evidence", types: ["Evidence"] },
  { id: "pleadings", label: "Pleadings", types: ["Pleading"] },
  { id: "notices", label: "Notices", types: ["Notice"] },
  { id: "correspondence", label: "Correspondence", types: ["Correspondence"] },
  { id: "research", label: "Research", types: ["Research"] },
  { id: "drafts", label: "Drafts", types: ["Draft"] },
  { id: "others", label: "Others", types: ["Other"] },
  { id: "trash", label: "Trash", types: [], danger: true },
];

export const folderCount = (f) =>
  f.types === null ? documents.length : documents.filter((d) => f.types.includes(d.type)).length;

export const typeStyles = {
  "Case File": "bg-blue-50 text-blue-600",
  "Court Order": "bg-purple-50 text-purple-600",
  Evidence: "bg-emerald-50 text-emerald-600",
  Pleading: "bg-amber-100 text-amber-700",
  Notice: "bg-red-50 text-red-600",
  Correspondence: "bg-sky-50 text-sky-600",
  Research: "bg-slate-100 text-slate-600",
  Draft: "bg-orange-50 text-orange-600",
  Other: "bg-slate-100 text-slate-600",
};

export const kindLabel = { pdf: "PDF Document", doc: "Word Document", sheet: "Excel Spreadsheet", image: "Image", zip: "ZIP Archive" };

export const storage = { usedGb: 2.4, totalGb: 10 };
