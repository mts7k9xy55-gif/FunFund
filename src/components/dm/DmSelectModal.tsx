// src/components/dm/DmSelectModal.tsx
// DM開始のためのコンタクト選択モーダル

"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface DmSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDm: (dmId: Id<"groups">) => void;
  language: "ja" | "en";
}

export default function DmSelectModal({
  isOpen,
  onClose,
  onSelectDm,
  language,
}: DmSelectModalProps) {
  const connections = useQuery(api.connections.listConnections);
  const createDM = useMutation(api.groups.createDM);

  if (!isOpen) return null;

  const handleSelectUser = async (userId: Id<"users">) => {
    try {
      const dmId = await createDM({ recipientId: userId });
      onSelectDm(dmId);
      onClose();
    } catch (error) {
      console.error("Failed to create DM:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {language === "ja" ? "DMを開始" : "Start DM"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {connections && connections.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-500 mb-3">
                {language === "ja"
                  ? "つながっている人を選択"
                  : "Select a connection"}
              </p>
              {connections.map((conn) => (
                <button
                  key={conn.connectionId}
                  onClick={() => conn.user?._id && handleSelectUser(conn.user._id)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 border border-gray-200 transition-colors"
                >
                  <div className="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center text-purple-700 font-bold">
                    {(conn.user?.name ?? "?")[0].toUpperCase()}
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{conn.user?.name ?? "Unknown"}</div>
                    <div className="text-xs text-gray-500">
                      {language === "ja" ? "タップしてDMを開始" : "Tap to start DM"}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <p className="mb-2">
                {language === "ja"
                  ? "まだつながりがありません"
                  : "No connections yet"}
              </p>
              <p className="text-sm">
                {language === "ja"
                  ? "招待リンクで友達を招待しましょう"
                  : "Invite friends using invite link"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
