import { CalendarDays, FileText, User } from "lucide-react";
import SectionCard from "./SectionCard";
import { reminders } from "@/lib/data";

const icons = {
  calendar: { Icon: CalendarDays, style: "bg-red-50 text-red-600" },
  doc: { Icon: FileText, style: "bg-red-50 text-red-600" },
  user: { Icon: User, style: "bg-orange-50 text-orange-600" },
};

const tagStyles = {
  red: "bg-red-50 text-red-600",
  orange: "bg-slate-100 text-slate-600",
};

export default function Reminders() {
  return (
    <SectionCard title="Reminders" href="/reminders" className="h-full">
      <ul className="flex flex-col gap-4">
        {reminders.map((r) => {
          const { Icon, style } = icons[r.icon];
          return (
            <li key={r.title} className="flex items-center gap-3">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${style}`}
              >
                <Icon size={20} strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{r.title}</p>
                <p className="truncate text-xs text-slate-500">{r.subtitle}</p>
              </div>
              <span
                className={`shrink-0 rounded-md px-2.5 py-1 text-xs ${
                  r.highlight ? "bg-sky-50 text-sky-600" : tagStyles.orange
                }`}
              >
                {r.tag}
              </span>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}
