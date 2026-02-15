"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

export default function RoomAccountControls() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const myProfile = useQuery(api.profiles.getMyProfile, {});
  const upsertMyProfile = useMutation(api.profiles.upsertMyProfile);
  const createImageUploadUrl = useMutation(api.uploads.createImageUploadUrl);
  const resolveImageUrl = useMutation(api.uploads.resolveImageUrl);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setDisplayName(myProfile?.displayName ?? user?.fullName ?? user?.firstName ?? "");
    setAvatarUrl(myProfile?.avatarUrl ?? user?.imageUrl ?? "");
    setFeedback(null);
  }, [isOpen, myProfile?.displayName, myProfile?.avatarUrl, user?.fullName, user?.firstName, user?.imageUrl]);

  const currentAvatarUrl = myProfile?.avatarUrl ?? user?.imageUrl ?? "";

  const handlePickImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (!file.type.startsWith("image/")) {
      setFeedback("画像ファイルを選択してください");
      return;
    }
    if (file.size > 10_000_000) {
      setFeedback("画像サイズは10MB以下にしてください");
      return;
    }

    setUploading(true);
    setFeedback(null);
    try {
      const uploadUrl = await createImageUploadUrl({});
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!uploadResponse.ok) {
        throw new Error("画像アップロードに失敗しました");
      }
      const payload = (await uploadResponse.json()) as { storageId?: string };
      if (!payload.storageId) {
        throw new Error("アップロード結果が不正です");
      }
      const resolvedUrl = await resolveImageUrl({
        storageId: payload.storageId as Id<"_storage">,
      });
      setAvatarUrl(resolvedUrl);
      setFeedback("画像を設定しました");
    } catch (error) {
      const message = error instanceof Error ? error.message : "画像の設定に失敗しました";
      setFeedback(message);
    } finally {
      setUploading(false);
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      await upsertMyProfile({
        displayName: displayName.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
      });
      setFeedback("保存しました");
      setTimeout(() => setIsOpen(false), 250);
    } catch (error) {
      const message = error instanceof Error ? error.message : "プロフィール保存に失敗しました";
      setFeedback(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          {currentAvatarUrl ? (
            <img
              src={currentAvatarUrl}
              alt="profile"
              className="h-5 w-5 rounded-full border border-slate-200 object-cover"
            />
          ) : (
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] text-slate-500">
              PF
            </span>
          )}
          プロフィール
        </button>
        <button
          type="button"
          onClick={() => void signOut({ redirectUrl: "/logout" })}
          className="rounded border border-red-300 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100"
        >
          ログアウト
        </button>
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            type="button"
            aria-label="close"
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/45"
          />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">プロフィール</h2>
            <p className="mt-1 text-xs text-slate-500">写真と表示名を設定できます。</p>

            <div className="mt-4 flex items-center gap-3">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="preview"
                  className="h-14 w-14 rounded-full border border-slate-200 object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xs text-slate-500">
                  No
                </div>
              )}
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                >
                  {uploading ? "アップロード中..." : "写真を選択"}
                </button>
                {avatarUrl ? (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl("")}
                    className="block rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    写真を削除
                  </button>
                ) : null}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePickImage}
                className="hidden"
              />
            </div>

            <label className="mt-4 block text-xs font-semibold text-slate-700">表示名（任意）</label>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="表示名"
              maxLength={40}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
            />

            {feedback ? <p className="mt-3 text-xs text-slate-600">{feedback}</p> : null}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                閉じる
              </button>
              <button
                type="button"
                disabled={saving || uploading}
                onClick={() => void handleSave()}
                className="rounded bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
