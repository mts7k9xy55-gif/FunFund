// src/components/room/RoomSelector.tsx
// Roomセレクタ: 画面上部に配置

"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
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
  const [isDeleting, setIsDeleting] = useState(false);
  const rooms = useQuery(api.rooms.listRoomsForMe) ?? [];
  const createRoom = useMutation(api.rooms.createRoom);
  const deleteRoom = useMutation(api.rooms.deleteRoom);
  const effectiveSelectedRoomId = selectedRoomId ?? null;
  const selectedRoom = rooms.find((room) => room._id === selectedRoomId);

  const handleCreateRoom = async (
    name: string,
    mode: "open" | "closed"
  ) => {
    try {
      const roomId = await createRoom({
        name,
        isPrivate: mode === "closed",
        evaluationMode: mode,
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

  const handleDeleteRoom = async () => {
    if (!selectedRoom) {
      return;
    }

    const confirmed = window.confirm(
      language === "ja"
        ? `Room「${selectedRoom.name}」を削除します。元に戻せません。続行しますか？`
        : `Delete room "${selectedRoom.name}"? This cannot be undone.`
    );
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteRoom({ roomId: selectedRoom._id });
      const next = rooms.find((room) => room._id !== selectedRoom._id);
      onSelectRoom(next?._id ?? null);
    } catch (error: any) {
      alert(
        error.message ||
          (language === "ja"
            ? "Room削除に失敗しました"
            : "Failed to delete room")
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {rooms.length === 0 ? (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3 py-1.5 rounded-lg border border-blue-600 bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            {language === "ja" ? "Roomを作成" : "Create Room"}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <select
            value={effectiveSelectedRoomId ?? ""}
            onChange={(e) => {
              const roomId = e.target.value;
              onSelectRoom(roomId ? (roomId as Id<"rooms">) : null);
            }}
            className="min-w-[220px] px-3 py-1.5 rounded-lg border border-slate-400 bg-white text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <option value="" disabled>
              {language === "ja" ? "部屋を選択" : "Select room"}
            </option>
            {rooms.map((room) => (
              <option key={room._id} value={room._id}>
                {room.name}
                {room.isPrivate && " 🔒"}
              </option>
            ))}
          </select>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            {language === "ja" ? "+ 新規" : "+ New"}
          </button>
          {selectedRoom?.myRole === "owner" ? (
            <button
              onClick={handleDeleteRoom}
              disabled={isDeleting}
              className="px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting
                ? language === "ja"
                  ? "削除中..."
                  : "Deleting..."
                : language === "ja"
                ? "削除"
                : "Delete"}
            </button>
          ) : null}
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
