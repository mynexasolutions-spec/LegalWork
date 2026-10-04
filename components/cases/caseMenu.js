import { Eye, Pencil, CalendarPlus, StickyNote, XCircle, RotateCcw, Trash2, Upload } from "lucide-react";

// shared kebab menu for a case row (used by My Cases, Active Cases, Dashboard...)
export function caseMenu(c, act, router, after) {
  return [
    { label: "View details", icon: Eye, onClick: () => router.push(`/cases/${c.id}`) },
    { label: "Edit case", icon: Pencil, onClick: () => act.editCase(c) },
    { label: "Add hearing", icon: CalendarPlus, hidden: c.status === "Closed", onClick: () => act.addHearing({ caseNo: c.caseNo }) },
    { label: "Add note", icon: StickyNote, onClick: () => act.addNote({ key: `case:${c.caseNo}`, title: c.title }) },
    { label: "Upload document", icon: Upload, onClick: () => act.upload({ caseNo: c.caseNo }) },
    { label: "Close case", icon: XCircle, hidden: c.status === "Closed", divider: true, onClick: () => act.closeCase(c) },
    { label: "Reopen case", icon: RotateCcw, hidden: c.status !== "Closed", divider: true, onClick: () => act.reopenCase(c) },
    { label: "Delete case", icon: Trash2, danger: true, onClick: () => act.deleteCase(c, after) },
  ];
}
