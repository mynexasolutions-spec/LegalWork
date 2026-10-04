// [name, title, role, department, email, status, joined, phone, reportsTo]
const rows = [
  ["Harsh Kumar", "Admin", "Administrator", "Management", "harsh@nexa.com", "Active", "2025-01-01", "+91 98765 11111", "-"],
  ["Rajesh Kumar", "Senior Advocate", "Partner", "Legal", "rajesh@nexa.com", "Active", "2025-01-15", "+91 98765 22222", "Harsh Kumar (Admin)"],
  ["Anita Sharma", "Associate Advocate", "Advocate", "Legal", "anita@nexa.com", "Active", "2025-01-20", "+91 98765 67890", "Rajesh Kumar (Partner)"],
  ["Vikram Singh", "Paralegal", "Paralegal", "Legal", "vikram@nexa.com", "Active", "2025-02-05", "+91 98765 33333", "Anita Sharma (Advocate)"],
  ["Sunita Devi", "Case Manager", "Case Manager", "Operations", "sunita@nexa.com", "Active", "2025-02-10", "+91 98765 44444", "Harsh Kumar (Admin)"],
  ["Rohan Mehta", "Legal Intern", "Intern", "Legal", "rohan@nexa.com", "Active", "2025-02-12", "+91 98765 55555", "Anita Sharma (Advocate)"],
  ["Pooja Khanna", "Client Manager", "Client Manager", "Client Relations", "pooja@nexa.com", "Active", "2025-02-18", "+91 98765 66666", "Harsh Kumar (Admin)"],
  ["Aman Verma", "Document Specialist", "Staff", "Operations", "aman@nexa.com", "Active", "2025-02-22", "+91 98765 77777", "Sunita Devi (Case Manager)"],
  ["Suresh Patil", "Accounts", "Staff", "Finance", "suresh@nexa.com", "Inactive", "2025-03-01", "+91 98765 88888", "Harsh Kumar (Admin)"],
  ["Neha Gupta", "HR Manager", "HR", "Human Resources", "neha@nexa.com", "Active", "2025-03-05", "+91 98765 99999", "Harsh Kumar (Admin)"],
  ["Kavita Rao", "Junior Advocate", "Advocate", "Legal", "kavita@nexa.com", "Active", "2025-03-10", "+91 98765 10101", "Rajesh Kumar (Partner)"],
  ["Meena Iyer", "Operations Head", "Administrator", "Management", "meena@nexa.com", "Active", "2025-03-12", "+91 98765 20202", "Harsh Kumar (Admin)"],
];

export const members = rows.map(([name, title, role, department, email, status, joined, phone, reportsTo], i) => ({
  id: `m${i}`,
  name, title, role, department, email, status, joined, phone, reportsTo,
  // Anita's numbers come from the design; the rest are derived so each member looks different
  stats: name === "Anita Sharma"
    ? { total: 8, active: 6, hearings: 12, documents: 15 }
    : { total: 3 + ((i * 5) % 9), active: 1 + ((i * 3) % 5), hearings: 4 + ((i * 7) % 12), documents: 6 + ((i * 11) % 18) },
}));

export const roleDefs = ["Administrator", "Partner", "Advocate", "Paralegal", "Staff"];
export const departments = [...new Set(members.map((m) => m.department))];
export const roleOptions = [...new Set(members.map((m) => m.role))];
export const pendingInvites = 1;

export const allPermissions = ["View Cases", "Edit Cases", "Add Hearings", "Upload Documents", "Manage Clients", "Generate Reports", "Manage Team"];

const rolePerms = {
  Administrator: allPermissions,
  Partner: allPermissions.slice(0, 6),
  Advocate: allPermissions.slice(0, 6),
  Paralegal: ["View Cases", "Add Hearings", "Upload Documents"],
};
export const permissionsFor = (role) => rolePerms[role] ?? ["View Cases", "Upload Documents"];

export const roleStyles = {
  Administrator: "bg-red-50 text-red-600",
  Partner: "bg-purple-50 text-purple-600",
  Advocate: "bg-blue-50 text-blue-600",
  Paralegal: "bg-emerald-50 text-emerald-600",
  "Case Manager": "bg-amber-100 text-amber-700",
  Intern: "bg-sky-50 text-sky-600",
  "Client Manager": "bg-pink-50 text-pink-600",
  Staff: "bg-purple-50 text-purple-600",
  HR: "bg-orange-50 text-orange-600",
};

export const activityFor = (m) => [
  { text: "Logged in", when: "Today, 09:12 AM" },
  { text: "Updated a case note", when: "Yesterday, 04:40 PM" },
  { text: "Uploaded a document", when: "02 Oct 2026, 11:05 AM" },
  { text: `Joined the team as ${m.role}`, when: m.joined },
];

// without an explicit list, each member gets a stable spread of cases
export function defaultAssigned(m, cases) {
  const seed = [...m.id].reduce((a, ch) => a + ch.charCodeAt(0), 0);
  return cases.filter((_, i) => (i + seed) % 4 === 0).slice(0, 8).map((c) => c.caseNo);
}
