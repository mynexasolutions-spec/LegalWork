import { Building2 } from "lucide-react";

const palette = [
  "bg-red-100 text-red-600",
  "bg-sky-100 text-sky-600",
  "bg-orange-100 text-orange-600",
  "bg-purple-100 text-purple-600",
  "bg-emerald-100 text-emerald-600",
  "bg-indigo-100 text-indigo-600",
];

const initials = (name) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

// same name always gets the same colour
const colour = (name) => palette[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length];

export default function Avatar({ name, corporate = false, size = "h-10 w-10", text = "text-sm", solid = "" }) {
  if (corporate) {
    return (
      <span className={`flex shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 ${size}`}>
        <Building2 size={22} strokeWidth={1.5} />
      </span>
    );
  }
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${text} ${size} ${solid || colour(name)}`}>
      {initials(name)}
    </span>
  );
}
