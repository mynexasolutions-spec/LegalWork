export default function Badge({ children, className = "" }) {
  return (
    <span
      className={`inline-block min-w-20 rounded-md px-3 py-1.5 text-center text-xs font-medium ${className}`}
    >
      {children}
    </span>
  );
}
