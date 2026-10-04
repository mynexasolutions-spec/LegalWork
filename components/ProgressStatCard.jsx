import CountUp from "@/components/ui/CountUp";
import Bar from "@/components/ui/Bar";

export default function ProgressStatCard({ label, value, icon, iconBg, bar, barBg, percent }) {
  return (
    <div className="lift flex h-full items-center gap-3 rounded-xl border border-line bg-white p-3 shadow-sm sm:gap-4 sm:p-5">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:h-16 sm:w-16 ${iconBg}`}>{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-600 sm:text-sm">{label}</p>
        <p className="text-2xl font-bold leading-tight sm:text-3xl"><CountUp value={value} /></p>
        {bar && (
          <div className="mt-1.5 flex items-center gap-3">
            <Bar pct={percent} color={bar} track={barBg} />
            <span className="text-xs text-slate-600">{percent}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
