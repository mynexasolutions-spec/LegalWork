import CountUp from "@/components/ui/CountUp";

export default function StatCard({ label, value, icon, iconBg, note, onClick }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag onClick={onClick} className="lift flex h-full w-full items-center gap-3 rounded-xl border border-line bg-white p-3 text-left shadow-sm sm:gap-4 sm:p-5">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:h-16 sm:w-16 ${iconBg}`}>{icon}</div>
      <div>
        <p className="text-xs text-slate-600 sm:text-sm">{label}</p>
        <div className="flex flex-wrap items-baseline gap-x-4">
          <p className="text-2xl font-bold leading-tight sm:text-3xl"><CountUp value={value} /></p>
          {note && <span className="text-xs font-medium text-red-600 sm:text-sm">{note}</span>}
        </div>
      </div>
    </Tag>
  );
}
