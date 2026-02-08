import { AuthGate } from "@/components/AuthGate";
import RoomPageV1 from "@/components/legacy/RoomPageV1";
import { isV2RoomEnabled } from "@/lib/featureFlags";
import RoomPageV2 from "@v2/features/room/RoomPageV2";

export default function RoomPage() {
  return <AuthGate>{isV2RoomEnabled() ? <RoomPageV2 /> : <RoomPageV1 />}</AuthGate>;
}
