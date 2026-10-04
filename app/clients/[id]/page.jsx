import ClientDetailView from "@/components/clients/ClientDetailView";

export default async function ClientPage({ params }) {
  const { id } = await params;
  return <ClientDetailView id={id} />;
}
