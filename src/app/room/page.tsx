import { AuthGate } from "@/components/AuthGate";
import RoomPageV2 from "@v2/features/room/RoomPageV2";

export default function RoomPage() {
  return <AuthGate><RoomPageV2 /></AuthGate>;
}
