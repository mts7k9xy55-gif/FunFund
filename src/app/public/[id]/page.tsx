import PublicDetailPageV2 from "@v2/features/public/PublicDetailPageV2";

interface PublicDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PublicDetailPage({ params }: PublicDetailPageProps) {
  const { id } = await params;
  return <PublicDetailPageV2 id={id} />;
}
