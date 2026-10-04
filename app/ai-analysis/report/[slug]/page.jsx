import ReportPage from "@/components/ai/ReportPage";

export default async function ReportRoute({ params }) {
  const { slug } = await params;
  return <ReportPage slug={slug} />;
}
