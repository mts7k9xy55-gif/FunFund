import PublicListPageV1 from "@/components/legacy/PublicListPageV1";
import { isV2PublicEnabled } from "@/lib/featureFlags";
import PublicListPageV2 from "@v2/features/public/PublicListPageV2";

export default function PublicPage() {
  if (isV2PublicEnabled()) {
    return <PublicListPageV2 />;
  }
  return <PublicListPageV1 />;
}
