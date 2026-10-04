import { ChevronDown } from "lucide-react";

export default function FilterSelect({ label, value, onChange, options, allLabel = "All" }) {
  return (
    <label className="block min-w-32.5">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      <span className="relative block">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-sm outline-none focus:border-brand"
        >
          <option value="All">{allLabel}</option>
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <ChevronDown size={15} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
      </span>
    </label>
  );
}
