import CaseDetailView from "@/components/case-detail/CaseDetailView";

export default async function CaseDetailPage({ params }) {
  const { slug } = await params;
  return <CaseDetailView slug={slug} />;
}
