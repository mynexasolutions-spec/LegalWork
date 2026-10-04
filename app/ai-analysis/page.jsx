import { Sparkles } from "lucide-react";
import AiView from "@/components/ai/AiView";

export const metadata = { title: "AI Legal Analysis - LexPro" };

export default function AiAnalysisPage() {
  return (
    <div className="mx-auto flex max-w-350 flex-col gap-5">
      <div className="flex items-start gap-4">
        <div className="flex h-13 w-13 items-center justify-center rounded-xl bg-purple-600 text-white">
          <Sparkles size={26} />
        </div>
        <div>
          <h1 className="text-3xl font-bold leading-tight">AI Legal Analysis</h1>
          <p className="text-slate-600">Get insights, similar cases, relevant judgments and answers to your legal queries.</p>
        </div>
      </div>

      <AiView />
    </div>
  );
}
