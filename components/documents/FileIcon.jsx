import { FileText, FileSpreadsheet, Image as ImageIcon, FileArchive } from "lucide-react";

const map = {
  pdf: { Icon: FileText, cls: "bg-red-50 text-red-500" },
  doc: { Icon: FileText, cls: "bg-blue-50 text-blue-600" },
  sheet: { Icon: FileSpreadsheet, cls: "bg-emerald-50 text-emerald-600" },
  image: { Icon: ImageIcon, cls: "bg-purple-50 text-purple-600" },
  zip: { Icon: FileArchive, cls: "bg-orange-50 text-orange-500" },
};

export default function FileIcon({ kind, size = 18, box = "h-8 w-8" }) {
  const { Icon, cls } = map[kind] ?? map.doc;
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-md ${box} ${cls}`}>
      <Icon size={size} strokeWidth={1.75} />
    </span>
  );
}
