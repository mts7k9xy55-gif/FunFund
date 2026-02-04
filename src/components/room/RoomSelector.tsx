// src/components/room/RoomSelector.tsx
// Roomセレクタ: 画面上部に配置

"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import CreateRoomModal from "./CreateRoomModal";

interface RoomSelectorProps {
  selectedRoomId: Id<"rooms"> | null;
  onSelectRoom: (roomId: Id<"rooms"> | null) => void;
  language: "ja" | "en";
  onCreateRoom: () => void;
}

export default function RoomSelector({
  selectedRoomId,
  onSelectRoom,
  language,
  onCreateRoom,
}: RoomSelectorProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const rooms = useQuery(api.rooms.listRoomsForMe) ?? [];
  const createRoom = useMutation(api.rooms.createRoom);

  const handleCreateRoom = async (
    name: string,
    isPrivate: boolean,
    evaluationMode: "open" | "closed"
  ) => {
    try {
      const roomId = await createRoom({
        name,
        isPrivate,
        evaluationMode,
      });
      // Roomはdraft状態で作成される（Stripe決済後にactiveになる）
      onSelectRoom(roomId);
      onCreateRoom();
    } catch (error: any) {
      alert(
        error.message ||
          (language === "ja"
            ? "Room作成に失敗しました"
            : "Failed to create room")
      );
    }
  };

  return (
    <>
      {rooms.length === 0 ? (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-primary text-primary-fg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            {language === "ja" ? "Roomを作成" : "Create Room"}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <select
            value={selectedRoomId ?? ""}
            onChange={(e) => {
              const roomId = e.target.value;
              onSelectRoom(roomId ? (roomId as Id<"rooms">) : null);
            }}
            className="px-3 py-1.5 rounded-lg bg-muted border border-border text-sm text-fg focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">
              {language === "ja" ? "Roomを選択" : "Select Room"}
            </option>
            {rooms.map((room) => (
              <option key={room._id} value={room._id}>
                {room.name} ({room.status})
                {room.isPrivate && " 🔒"}
              </option>
            ))}
          </select>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-muted text-fg text-sm font-medium hover:bg-muted/80 transition-colors"
          >
            {language === "ja" ? "+ 新規" : "+ New"}
          </button>
        </div>
      )}

      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateRoom}
        language={language}
      />
    </>
  );
}
