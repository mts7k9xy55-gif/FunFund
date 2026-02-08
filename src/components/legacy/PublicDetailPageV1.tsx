// src/app/public/[id]/page.tsx
// 詳細プレビューページ（Kickstarter風）

"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";

interface PublicDetailPageV1Props {
  id: string;
}

export default function PublicDetailPageV1({ id }: PublicDetailPageV1Props) {
  const { user, isLoaded } = useUser();
  const preview = useQuery(api.publicPreviews.getPublicPreview, {
    itemId: id as Id<"items">,
  });
  const router = useRouter();

  const handleJoinGroup = () => {
    if (!isLoaded) return;

    if (!user) {
      // ログインが必要
      router.push("/sign-in");
      return;
    }

    // ログイン済みならRoomSelectorを開く（または/roomに遷移）
    router.push("/room");
  };

  if (!preview) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-muted-fg">プロジェクトが見つかりません</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-bg/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/public" className="text-primary hover:underline">
              ← 一覧に戻る
            </Link>
            <Link
              href="/room"
              className="px-4 py-2 rounded-lg bg-primary text-primary-fg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              グループに入る
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 上：サムネ＋タイトル＋短い説明 */}
        <div className="mb-8">
          {preview.thumbnailUrl && (
            <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-6">
              <img
                src={preview.thumbnailUrl}
                alt={preview.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <h1 className="text-3xl font-bold text-fg mb-4">{preview.title}</h1>
          <p className="text-lg text-muted-fg">{preview.description}</p>
        </div>

        {/* 中：この場で決めること／向いている人・向いていない人 */}
        <div className="mb-8 space-y-6">
          {preview.decisions.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-fg mb-3">
                この場で決めること
              </h2>
              <ul className="space-y-2">
                {preview.decisions.map((decision, idx) => (
                  <li key={idx} className="text-fg flex items-start">
                    <span className="mr-2">•</span>
                    <span>{decision}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(preview.suitableFor || preview.notSuitableFor) && (
            <div className="grid md:grid-cols-2 gap-6">
              {preview.suitableFor && (
                <div>
                  <h3 className="text-lg font-semibold text-fg mb-2">
                    向いている人
                  </h3>
                  <p className="text-muted-fg">{preview.suitableFor}</p>
                </div>
              )}
              {preview.notSuitableFor && (
                <div>
                  <h3 className="text-lg font-semibold text-fg mb-2">
                    向いていない人
                  </h3>
                  <p className="text-muted-fg">{preview.notSuitableFor}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 下：行動ボタンは1つだけ「グループに入る」 */}
        <div className="border-t border-border pt-8">
          <button
            onClick={handleJoinGroup}
            className="w-full md:w-auto px-8 py-3 rounded-lg bg-primary text-primary-fg text-lg font-medium hover:bg-primary/90 transition-colors"
          >
            グループに入る
          </button>
        </div>
      </main>
    </div>
  );
}
