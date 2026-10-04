// [name, type, phone, email, totalCases, activeCases, city, added, status]
const featured = [
  ["Rajesh Kumar", "Individual", "+91 98765 43210", "rajesh@gmail.com", 3, 2, "Lucknow", "2026-09-12", "Active"],
  ["Anita Sharma", "Individual", "+91 98765 67890", "anita.sharma@gmail.com", 2, 1, "Delhi", "2026-09-10", "Active"],
  ["ABC Pvt. Ltd.", "Corporate", "+91 11 2345 6789", "legal@abcpvtltd.com", 5, 4, "Noida", "2026-09-05", "Active"],
  ["Vikram Singh", "Individual", "+91 91234 56789", "vikram.singh@gmail.com", 1, 1, "Kanpur", "2026-08-28", "Active"],
  ["Sunita Devi", "Individual", "+91 87654 32109", "sunita.devi@gmail.com", 4, 2, "Lucknow", "2026-08-25", "Active"],
  ["Rohan Mehta", "Individual", "+91 78901 23456", "rohan.mehta@gmail.com", 2, 0, "Mumbai", "2026-08-20", "Inactive"],
  ["City Corporation", "Corporate", "+91 522 345 6789", "legal@citycorp.in", 3, 2, "Lucknow", "2026-08-18", "Active"],
  ["Pooja Khanna", "Individual", "+91 99887 66554", "pooja.khanna@gmail.com", 1, 1, "Delhi", "2026-08-12", "Active"],
  ["Suresh Patil", "Individual", "+91 78787 99876", "sureshpatil@gmail.com", 2, 1, "Pune", "2026-08-08", "Active"],
  ["XYZ Enterprises", "Corporate", "+91 22 4455 6677", "contact@xyzent.com", 6, 3, "Mumbai", "2026-08-01", "Active"],
];

const first = ["Amit", "Neha", "Karan", "Priya", "Sanjay", "Meera", "Arjun", "Divya", "Manoj", "Kavita", "Imran", "Fatima", "Ravi", "Sneha", "Deepak", "Nisha"];
const last = ["Verma", "Gupta", "Yadav", "Joshi", "Nair", "Reddy", "Khan", "Iyer", "Mishra", "Bansal", "Chauhan", "Rao"];
const corp = ["Alpha Traders", "Sharma Estates", "Tech Solutions", "Gupta Industries", "Bharat Motors", "Sun Pharma Distributors", "Kalyan Builders", "Metro Logistics", "Orion Textiles", "Patel & Sons", "Green Valley Foods", "Nova Infotech", "Royal Hospitality", "Vertex Constructions", "Zenith Exports"];
const cities = ["Lucknow", "Delhi", "Noida", "Kanpur", "Mumbai", "Pune", "Jaipur", "Bhopal", "Patna", "Chandigarh"];

// seeded shuffle: stable between server and client renders
function shuffle(list, seed) {
  let s = seed;
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) % 2147483648;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 46 more rows so the totals work out: 56 clients, 38 individual / 18 corporate, 42 active
const kinds = shuffle([...Array(31).fill("Individual"), ...Array(15).fill("Corporate")], 11);
const states = shuffle([...Array(33).fill("Active"), ...Array(13).fill("Inactive")], 23);
let ind = 0;
let org = 0;

const generated = kinds.map((type, i) => {
  const name = type === "Individual"
    ? `${first[ind % first.length]} ${last[Math.floor(ind++ / 2 + i) % last.length]}`
    : corp[org++ % corp.length];
  const slug = name.toLowerCase().replace(/[^a-z]+/g, ".").replace(/\.$/, "");
  const total = 1 + ((i * 3) % 5);
  const status = states[i];
  const active = status === "Active" ? Math.max(1, total - (i % 3)) : 0;
  const d = new Date(Date.UTC(2026, 6, 30) - i * 7 * 86400000);
  return [
    name, type,
    `+91 9${String(8000000000 + i * 7919317).slice(0, 4)} ${String(10000 + i * 331).slice(0, 5)}`,
    type === "Individual" ? `${slug}@gmail.com` : `legal@${slug.replaceAll(".", "")}.com`,
    total, active, cities[i % cities.length], d.toISOString().slice(0, 10), status,
  ];
});

export const clients = [...featured, ...generated].map(([name, type, phone, email, totalCases, activeCases, city, added, status], i) => ({
  id: `cl${i}`,
  name, type, phone, email, totalCases, activeCases, city, added, status,
  address: i === 0 ? "123, Sector 5, Gomti Nagar, Lucknow, Uttar Pradesh - 226010" : `${12 + i}, Civil Lines, ${city}`,
  referredBy: i % 4 === 1 ? "Existing client" : "Self",
  identity: type === "Individual" ? "Aadhar Card (XXXX-XXXX-1234)" : "GST Certificate (GSTIN verified)",
  documents: 5,
}));

export const clientCities = [...new Set(clients.map((c) => c.city))].sort();

export const seedNotes = {
  cl0: [
    { by: "Harsh Kumar", at: "12 Sep 2026, 11:30 AM", text: "Discussed about the property dispute case." },
    { by: "Harsh Kumar", at: "14 Sep 2026, 02:15 PM", text: "Shared the required documents." },
  ],
};

export const typeStyles = {
  Individual: "bg-sky-50 text-sky-600",
  Corporate: "bg-purple-50 text-purple-600",
};
