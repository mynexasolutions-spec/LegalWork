import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  ClipboardCheck,
  CalendarClock,
  Bell,
  File,
  BookOpen,
  Brain,
  User,
  Users,
  BarChart3,
  Settings,
} from "lucide-react";

export const navMain = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "My Cases", href: "/cases", icon: FolderOpen },
  { label: "Active Cases", href: "/active-cases", icon: FileText },
  { label: "Closed Cases", href: "/closed-cases", icon: ClipboardCheck },
  { label: "Upcoming Hearings", href: "/hearings", icon: CalendarClock },
  { label: "Reminders", href: "/reminders", icon: Bell },
  { label: "Case Reference", href: "/case-reference", icon: BookOpen },
  { label: "AI Analysis", href: "/ai-analysis", icon: Brain },
];

export const navSecondary = [
  { label: "Documents", href: "/documents", icon: File },
  { label: "Clients", href: "/clients", icon: User },
  { label: "Team & Roles", href: "/team", icon: Users },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export const hearings = [
  { day: "05", month: "Oct", time: "10:30 AM", title: "State vs. Rajesh Kumar", caseNo: "CR/2026/145", court: "Court No. 3", type: "Criminal" },
  { day: "06", month: "Oct", time: "11:00 AM", title: "Anita Sharma vs. M/s ABC Ltd.", caseNo: "CS/2026/089", court: "Court No. 5", type: "Civil" },
  { day: "08", month: "Oct", time: "02:30 PM", title: "Rohan vs. State", caseNo: "CR/2026/211", court: "High Court", type: "Criminal" },
];

export const reminders = [
  { title: "Next hearing tomorrow", subtitle: "State vs. Rajesh Kumar", tag: "Tomorrow", tone: "red", icon: "calendar", highlight: true },
  { title: "Submit additional documents", subtitle: "State vs. Rajesh Kumar", tag: "05 Oct", tone: "red", icon: "doc" },
  { title: "Follow up with client", subtitle: "Anita Sharma vs. M/s ABC Ltd.", tag: "06 Oct", tone: "orange", icon: "user" },
  { title: "File written arguments", subtitle: "Rohan vs. State", tag: "08 Oct", tone: "red", icon: "doc" },
];

export const recentCases = [
  { title: "State vs. Rajesh Kumar", caseNo: "CR/2026/145", client: "Rajesh Kumar", type: "Criminal", status: "Active", next: "05 Oct 2026" },
  { title: "Anita Sharma vs. M/s ABC Ltd.", caseNo: "CS/2026/089", client: "Anita Sharma", type: "Civil", status: "Active", next: "06 Oct 2026" },
  { title: "Rohan vs. State", caseNo: "CR/2026/211", client: "Rohan", type: "Criminal", status: "Active", next: "08 Oct 2026" },
  { title: "Meera Devi vs. Union of India", caseNo: "WP/2026/076", client: "Meera Devi", type: "Writ", status: "Pending", next: "15 Oct 2026" },
  { title: "Karan Singh vs. RTO", caseNo: "MV/2026/054", client: "Karan Singh", type: "Motor Vehicle", status: "Closed", next: "-" },
];

export const caseTypeStyles = {
  Criminal: "bg-red-50 text-red-600",
  Civil: "bg-indigo-50 text-indigo-600",
  Writ: "bg-purple-50 text-purple-600",
  "Motor Vehicle": "bg-sky-50 text-sky-600",
};

export const statusStyles = {
  Active: "bg-green-50 text-green-600",
  Pending: "bg-amber-100 text-amber-700",
  Closed: "bg-indigo-50 text-indigo-600",
};
