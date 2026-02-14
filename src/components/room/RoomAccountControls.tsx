"use client";

import { useEffect, useState } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

const AVATAR_CHOICES = ["🙂", "😀", "😎", "🧠", "🛠️", "🌱", "🔥", "🚀", "🐱", "🐶", "🦊", "🐼"];
const DEFAULT_AVATAR = "🙂";

export default function RoomAccountControls() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const myProfile = useQuery(api.profiles.getMyProfile, {});
  const upsertMyProfile = useMutation(api.profiles.upsertMyProfile);

  const [isOpen, setIsOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [avatarEmoji, setAvatarEmoji] = useState(DEFAULT_AVATAR);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setDisplayName(myProfile?.displayName ?? user?.fullName ?? user?.firstName ?? "");
    setAvatarEmoji(myProfile?.avatarEmoji ?? DEFAULT_AVATAR);
    setFeedback(null);
  }, [isOpen, myProfile?.displayName, myProfile?.avatarEmoji, user?.fullName, user?.firstName]);

  const currentAvatar = myProfile?.avatarEmoji ?? DEFAULT_AVATAR;

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      await upsertMyProfile({
        displayName: displayName.trim() || undefined,
        avatarEmoji,
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
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-sm">
            {currentAvatar}
          </span>
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
            <p className="mt-1 text-xs text-slate-500">アイコンと表示名だけ設定できます。</p>

            <label className="mt-4 block text-xs font-semibold text-slate-700">表示名（任意）</label>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="表示名"
              maxLength={40}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
            />

            <p className="mt-4 text-xs font-semibold text-slate-700">アイコン</p>
            <div className="mt-2 grid grid-cols-6 gap-2">
              {AVATAR_CHOICES.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setAvatarEmoji(emoji)}
                  className={`rounded-lg border px-2 py-2 text-lg transition ${
                    avatarEmoji === emoji
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-300 bg-white hover:bg-slate-50"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>

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
                disabled={saving}
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
