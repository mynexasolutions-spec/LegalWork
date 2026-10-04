import { allCases } from "./cases";

// [date, time, title, note, caseNo, type, priority, icon]
const pendingRows = [
  ["2026-10-02", "05:00 PM", "Submit court fee receipt", "Upload fee receipt to the registry", "CR/2026/220", "Task", "High", "check"],
  ["2026-10-03", "11:00 AM", "Reply to legal notice", "Draft reply to opposite party notice", "WP/2026/083", "Document", "Medium", "doc"],
  ["2026-10-05", "10:30 AM", "Prepare arguments", "Review latest evidence and prepare arguments", "CR/2026/145", "Hearing", "High", "doc"],
  ["2026-10-05", "12:00 PM", "Check latest order", "Verify the latest court order", "CR/2026/198", "Document", "Medium", "upload"],
  ["2026-10-05", "03:00 PM", "Client call", "Update client on case progress", "CS/2026/089", "Call", "Low", "phone"],
  ["2026-10-06", "11:00 AM", "Upload evidence documents", "Upload CCTV footage and charge sheet", "CS/2026/089", "Document", "High", "upload"],
  ["2026-10-08", "02:30 PM", "Client meeting", "Discuss case strategy with client", "CR/2026/211", "Meeting", "Medium", "users"],
  ["2026-10-10", "05:00 PM", "File written submission", "Draft and file written submission", "CS/2026/132", "Task", "Medium", "check"],
  ["2026-10-12", "11:00 AM", "Follow up with client", "Collect missing documents", "WP/2026/076", "Call", "Low", "phone"],
  ["2026-10-15", "12:00 PM", "Court fee payment", "Pay court fee for appeal", "CR/2026/198", "Task", "Medium", "card"],
  ["2026-10-20", "10:00 AM", "Draft appeal", "Prepare appeal draft", "CS/2026/201", "Task", "Low", "file"],
  ["2026-10-25", "11:00 AM", "Check order copy", "Verify and download latest order", "CS/2026/176", "Document", "Low", "doc"],
];

const completedTemplates = [
  ["Prepare arguments", "Hearing", "High", "doc"],
  ["Upload evidence documents", "Document", "High", "upload"],
  ["Client meeting", "Meeting", "Medium", "users"],
  ["File written submission", "Task", "Medium", "check"],
  ["Follow up with client", "Call", "Low", "phone"],
  ["Court fee payment", "Task", "Medium", "card"],
];

const completedRows = Array.from({ length: 18 }, (_, i) => {
  const [title, type, priority, icon] = completedTemplates[i % completedTemplates.length];
  const c = allCases[i % allCases.length];
  const day = String(28 - i).padStart(2, "0");
  return [`2026-09-${day}`, "11:00 AM", title, "Completed on time", c.caseNo, type, priority, icon];
});

const caseTitle = (caseNo) => allCases.find((c) => c.caseNo === caseNo)?.title ?? caseNo;

const build = (rows, completed) =>
  rows.map(([date, time, title, note, caseNo, type, priority, icon], i) => ({
    id: `${completed ? "c" : "p"}${i}`,
    date, time, title, note, caseNo, caseTitle: caseTitle(caseNo), type, priority, icon, completed,
  }));

export const reminders = [...build(pendingRows, false), ...build(completedRows, true)];

export const reminderTypes = ["Hearing", "Document", "Meeting", "Task", "Call"];
export const priorities = ["High", "Medium", "Low"];

export const typeStyles = {
  Hearing: "bg-indigo-50 text-indigo-600",
  Document: "bg-sky-50 text-sky-600",
  Meeting: "bg-orange-50 text-orange-600",
  Task: "bg-emerald-50 text-emerald-600",
  Call: "bg-blue-50 text-blue-600",
};

export const priorityStyles = {
  High: "bg-red-50 text-red-600",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-green-50 text-green-600",
};

// icon tile colours, keyed by the icon name stored on each reminder
export const iconTile = {
  doc: "bg-red-50 text-red-500",
  upload: "bg-sky-50 text-sky-500",
  users: "bg-orange-50 text-orange-500",
  check: "bg-emerald-50 text-emerald-600",
  phone: "bg-purple-50 text-purple-600",
  card: "bg-red-50 text-red-500",
  file: "bg-blue-50 text-blue-600",
};

export const typeDot = {
  Hearing: "bg-red-500",
  Document: "bg-blue-500",
  Meeting: "bg-orange-500",
  Task: "bg-emerald-500",
  Call: "bg-amber-500",
};
