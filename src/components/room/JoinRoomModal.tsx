// src/components/room/JoinRoomModal.tsx
// 招待コードでRoomに参加するモーダル

"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinSuccess: (roomId: Id<"rooms">) => void;
  language?: "ja" | "en";
}

export default function JoinRoomModal({
  isOpen,
  onClose,
  onJoinSuccess,
  language = "ja",
}: JoinRoomModalProps) {
  const [inviteCode, setInviteCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const joinRoom = useMutation(api.rooms.joinRoomByInviteCode);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setIsLoading(true);
    try {
      const roomId = await joinRoom({ inviteCode: inviteCode.trim().toUpperCase() });
      onJoinSuccess(roomId);
      setInviteCode("");
      onClose();
    } catch (error: any) {
      alert(
        error.message ||
          (language === "ja"
            ? "招待コードが無効です"
            : "Invalid invite code")
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md mx-4 bg-card border border-border rounded-xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">
            {language === "ja" ? "Roomに参加" : "Join Room"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {language === "ja" ? "招待コード" : "Invite Code"}
            </label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) =>
                setInviteCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
              }
              placeholder={
                language === "ja" ? "8文字の招待コード" : "8-character invite code"
              }
              maxLength={8}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground text-center text-2xl font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-primary uppercase"
              autoFocus
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {language === "ja"
                ? "Room作成者から招待コードを受け取ってください"
                : "Get the invite code from the room creator"}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {language === "ja" ? "キャンセル" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={!inviteCode.trim() || isLoading}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading
                ? language === "ja"
                  ? "参加中..."
                  : "Joining..."
                : language === "ja"
                ? "参加"
                : "Join"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
