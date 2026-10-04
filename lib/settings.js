export const STORAGE_KEY = "lexpro-settings";

export const colors = [
  { id: "#b4492a", name: "Terracotta" },
  { id: "#2563eb", name: "Blue" },
  { id: "#7c3aed", name: "Purple" },
  { id: "#059669", name: "Green" },
  { id: "#f59e0b", name: "Orange" },
  { id: "#ec4899", name: "Pink" },
];

export const defaults = {
  general: { appName: "LexPro", timezone: "(GMT+05:30) Asia/Kolkata", dateFormat: "DD MMM YYYY (05 Oct 2026)", timeFormat: "12 Hour (10:30 AM)", language: "English" },
  org: {
    name: "Nexa Legal Associates",
    address: "123, Sector 5, Gomti Nagar,\nLucknow, Uttar Pradesh - 226010",
    phone: "+91 98765 43210",
    email: "info@nexalegal.com",
    website: "https://nexalegal.com",
  },
  notifications: { email: true, inApp: true, hearings: true, tasks: true, clients: false, system: true, before: "1 day before" },
  caseMgmt: { numberFormat: "YYYY/#### (2026/0001)", status: "Active", court: "District Court", caseType: "Criminal", autoNumber: true, requireClient: true },
  security: { twoFA: false, timeout: "30 Minutes", loginAlerts: true },
  appearance: { theme: "Light", color: "#b4492a" },
};

export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const saved = JSON.parse(raw);
    // merge per section so settings added later still get their defaults
    return Object.fromEntries(Object.entries(defaults).map(([k, v]) => [k, { ...v, ...(saved[k] ?? {}) }]));
  } catch {
    return defaults;
  }
}

export function saveSettings(next) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // storage unavailable (private mode etc.) - settings just won't persist
  }
}

export function applyBrandColor(color) {
  const root = document.documentElement;
  root.style.setProperty("--color-brand", color);
  root.style.setProperty("--color-brand-dark", `color-mix(in srgb, ${color} 85%, black)`);
}

export function resetBrandColor() {
  document.documentElement.style.removeProperty("--color-brand");
  document.documentElement.style.removeProperty("--color-brand-dark");
}
