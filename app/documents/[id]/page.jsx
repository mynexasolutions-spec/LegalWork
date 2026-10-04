import DocumentDetailView from "@/components/documents/DocumentDetailView";

export default async function DocumentPage({ params }) {
  const { id } = await params;
  return <DocumentDetailView id={id} />;
}
