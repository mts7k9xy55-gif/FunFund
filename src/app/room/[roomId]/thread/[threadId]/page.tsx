import { AuthGate } from "@/components/AuthGate";
import RoomThreadPageV2 from "@v2/features/room/RoomThreadPageV2";

interface RoomThreadPageProps {
  params: Promise<{
    roomId: string;
    threadId: string;
  }>;
}

export default async function RoomThreadPage({ params }: RoomThreadPageProps) {
  const { roomId, threadId } = await params;
  return (
    <AuthGate>
      <RoomThreadPageV2 roomId={roomId} threadId={threadId} />
    </AuthGate>
  );
}
