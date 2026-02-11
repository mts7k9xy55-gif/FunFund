import { AuthGate } from "@/components/AuthGate";
import RoomThreadPageV2 from "@v2/features/room/RoomThreadPageV2";

interface RoomThreadPageProps {
  params: {
    roomId: string;
    threadId: string;
  };
}

export default function RoomThreadPage({ params }: RoomThreadPageProps) {
  return (
    <AuthGate>
      <RoomThreadPageV2 roomId={params.roomId} threadId={params.threadId} />
    </AuthGate>
  );
}
