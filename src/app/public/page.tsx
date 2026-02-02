// src/app/public/page.tsx
// オープン一覧ページ（Kickstarter風カードグリッド）

"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PublicListPage() {
  const previews = useQuery(api.publicPreviews.listPublicPreviews) ?? [];
  const router = useRouter();

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-bg/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary">FunFund</h1>
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
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-xl font-semibold text-fg mb-6">オープンプロジェクト</h2>

        {previews.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-fg text-sm">まだプロジェクトがありません</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {previews.map((preview) => (
              <div
                key={preview.id}
                onClick={() => router.push(`/public/${preview.id}`)}
                className="bg-card border border-border rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              >
                {/* サムネイル */}
                {preview.thumbnailUrl ? (
                  <div className="aspect-video bg-muted">
                    <img
                      src={preview.thumbnailUrl}
                      alt={preview.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-muted flex items-center justify-center">
                    <span className="text-muted-fg text-sm">画像なし</span>
                  </div>
                )}

                {/* コンテンツ */}
                <div className="p-4">
                  <h3 className="font-semibold text-fg mb-2 line-clamp-2">
                    {preview.title}
                  </h3>
                  <p className="text-sm text-muted-fg line-clamp-2">
                    {preview.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
