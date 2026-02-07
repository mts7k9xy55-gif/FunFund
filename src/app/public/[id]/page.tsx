import PublicDetailPageV1 from "@/components/legacy/PublicDetailPageV1";
import { isV2PublicEnabled } from "@/lib/featureFlags";
import PublicDetailPageV2 from "@v2/features/public/PublicDetailPageV2";

interface PublicDetailPageProps {
  params: {
    id: string;
  };
}

export default function PublicDetailPage({ params }: PublicDetailPageProps) {
  if (isV2PublicEnabled()) {
    return <PublicDetailPageV2 id={params.id} />;
  }
  return <PublicDetailPageV1 id={params.id} />;
}
