import Link from "next/link";

export default function SectionCard({ title, href = "#", children, className = "" }) {
  return (
    <section
      className={`rounded-xl border border-line bg-white p-5 shadow-sm ${className}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">{title}</h2>
        <Link
          href={href}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-brand"
        >
          View All
        </Link>
      </div>
      {children}
    </section>
  );
}
