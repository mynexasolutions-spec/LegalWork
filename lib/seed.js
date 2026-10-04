import { allCases, caseSlug } from "./cases";
import { detailFor } from "./caseDetails";
import { hearings as hearingRows } from "./hearings";
import { reminders as reminderRows } from "./reminders";
import { documents as documentRows } from "./documents";
import { clients as clientRows, seedNotes } from "./clients";
import { members as memberRows, allPermissions } from "./team";

// closed cases from the list get an outcome so the Closed Cases page has something to show
const outcomes = { "MV/2026/054": "Won", "CR/2026/167": "Settled", "CR/2026/121": "Won", "MV/2026/033": "Lost", "WP/2026/049": "Won" };

const cases = allCases.map((c) => {
  const { hearingDate, hearingTime, ...rest } = c; // next hearing is derived from the hearings list
  const closed = c.status === "Closed";
  return {
    id: caseSlug(c.caseNo),
    ...rest,
    ...detailFor(c),
    result: closed ? outcomes[c.caseNo] ?? "Won" : null,
    closedDate: closed ? c.updated : null,
  };
});

const hearings = [
  ...hearingRows.map((h, i) => ({
    id: `h${i}`, caseNo: h.caseNo, date: h.date, time: h.time, court: h.court, purpose: h.purpose, status: "Scheduled", remarks: "",
  })),
  { id: "hx1", caseNo: "CR/2026/145", date: "2026-09-21", time: "11:00 AM", court: "Court No. 3, District Court", purpose: "Evidence recording", status: "Completed", remarks: "Evidence recorded. Next date fixed." },
  { id: "hx2", caseNo: "CR/2026/145", date: "2026-07-10", time: "11:30 AM", court: "Court No. 3, District Court", purpose: "Framing of charges", status: "Completed", remarks: "Charges framed u/s 379 IPC." },
  { id: "hx3", caseNo: "CR/2026/145", date: "2026-05-12", time: "10:00 AM", court: "Court No. 3, District Court", purpose: "Plea hearing", status: "Completed", remarks: "Plea taken. Matter listed for evidence." },
];
// make sure every date a case already showed also exists as a hearing
allCases.forEach((c, i) => {
  if (c.hearingDate && !hearings.some((h) => h.caseNo === c.caseNo && h.date === c.hearingDate)) {
    hearings.push({ id: `hs${i}`, caseNo: c.caseNo, date: c.hearingDate, time: c.hearingTime, court: c.court, purpose: "Hearing", status: "Scheduled", remarks: "" });
  }
});

const notes = Object.fromEntries(
  Object.entries(seedNotes).map(([id, list]) => [`client:${id}`, list.map((n, i) => ({ id: `${id}-n${i}`, ...n }))])
);

const roles = {
  Administrator: allPermissions,
  Partner: allPermissions.slice(0, 6),
  Advocate: allPermissions.slice(0, 6),
  Paralegal: ["View Cases", "Add Hearings", "Upload Documents"],
  Staff: ["View Cases", "Upload Documents"],
};

export const seed = {
  cases,
  hearings,
  reminders: reminderRows.map((r) => ({ ...r })),
  documents: documentRows.map((d) => ({ ...d, trashed: false })),
  clients: clientRows.map((c) => ({ ...c })),
  members: memberRows.map((m) => ({ ...m })),
  invites: [{ id: "inv1", email: "new.advocate@nexa.com", role: "Advocate", date: "2026-10-03" }],
  notes,
  roles,
  activity: [
    { id: "a1", text: "Uploaded FIR Copy.pdf to State vs. Rajesh Kumar", at: "2026-10-05T10:30:00" },
    { id: "a2", text: "Added hearing for Anita Sharma vs. M/s ABC Ltd.", at: "2026-10-03T16:20:00" },
    { id: "a3", text: "Invited new.advocate@nexa.com as Advocate", at: "2026-10-03T11:05:00" },
    { id: "a4", text: "Closed case Karan Singh vs. RTO (Won)", at: "2026-09-20T12:10:00" },
  ],
  folders: [],
  readNotifs: [],
  saved: [],
  logo: null,
};
