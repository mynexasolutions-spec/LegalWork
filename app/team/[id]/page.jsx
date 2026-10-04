import MemberDetailView from "@/components/team/MemberDetailView";

export default async function MemberPage({ params }) {
  const { id } = await params;
  return <MemberDetailView id={id} />;
}
