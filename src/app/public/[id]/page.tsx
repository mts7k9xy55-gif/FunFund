import PublicDetailPageV2 from "@v2/features/public/PublicDetailPageV2";

interface PublicDetailPageProps {
  params: {
    id: string;
  };
}

export default function PublicDetailPage({ params }: PublicDetailPageProps) {
  return <PublicDetailPageV2 id={params.id} />;
}
