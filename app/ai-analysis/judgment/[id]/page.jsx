import JudgmentPage from "@/components/ai/JudgmentPage";

export default async function JudgmentRoute({ params }) {
  const { id } = await params;
  return <JudgmentPage id={id} />;
}
