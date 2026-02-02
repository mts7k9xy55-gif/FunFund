// src/components/room/RoomSelector.tsx
// Roomセレクタ: 画面上部に配置

"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

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
  const rooms = useQuery(api.rooms.listRoomsForMe) ?? [];
  const createRoom = useMutation(api.rooms.createRoom);

  const handleCreateRoom = async () => {
    const name = prompt(language === "ja" ? "Room名を入力" : "Enter room name");
    if (!name || !name.trim()) return;

    try {
      const roomId = await createRoom({ name: name.trim() });
      // Roomはdraft状態で作成される（Stripe決済後にactiveになる）
      onSelectRoom(roomId);
      onCreateRoom();
    } catch (error: any) {
      alert(error.message || (language === "ja" ? "Room作成に失敗しました" : "Failed to create room"));
    }
  };

  if (rooms.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleCreateRoom}
          className="px-3 py-1.5 rounded-lg bg-primary text-primary-fg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          {language === "ja" ? "Roomを作成" : "Create Room"}
        </button>
      </div>
    );
  }

  return (
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
          </option>
        ))}
      </select>
      <button
        onClick={handleCreateRoom}
        className="px-3 py-1.5 rounded-lg bg-muted text-fg text-sm font-medium hover:bg-muted/80 transition-colors"
      >
        {language === "ja" ? "+ 新規" : "+ New"}
      </button>
    </div>
  );
}
