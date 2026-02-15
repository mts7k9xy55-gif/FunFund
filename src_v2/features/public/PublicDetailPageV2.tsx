"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { useClerk, useUser } from "@clerk/nextjs";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface PublicDetailPageV2Props {
  id: string;
}

function isLikelyConvexId(value: string): boolean {
  return /^[a-z0-9]+$/.test(value) && value.length >= 20;
}

export default function PublicDetailPageV2({ id }: PublicDetailPageV2Props) {
  const router = useRouter();
  const { openSignIn } = useClerk();
  const { isLoaded, user } = useUser();
  const canQuery = isLikelyConvexId(id);
  const preview = useQuery(
    api.v2Public.getPublicProject,
    canQuery
      ? {
          itemId: id as Id<"items">,
        }
      : "skip"
  );

  const handleJoin = () => {
    if (!isLoaded) {
      return;
    }
    if (!user) {
      openSignIn();
      return;
    }
    router.push("/room");
  };

  if (!preview) {
    return (
      <main className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-4">
        <p className="rounded-xl border border-slate-300 bg-white px-6 py-4 text-sm text-slate-600">
          公開投稿が見つかりません。
        </p>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fbff] text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link href="/public" className="text-sm font-semibold text-slate-700 hover:text-blue-700">
            ← 一覧へ戻る
          </Link>
          <button
            onClick={handleJoin}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Roomを開く
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {preview.thumbnailUrl ? (
            <div className="aspect-[16/7] bg-slate-100">
              <img src={preview.thumbnailUrl} alt={preview.title} className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="aspect-[16/7] bg-gradient-to-r from-slate-100 to-slate-200" />
          )}
          <div className="p-6 md:p-8">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">{preview.title}</h1>
            <p className="mt-4 text-base leading-7 text-slate-700">{preview.description}</p>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-slate-600 md:grid-cols-2">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Fund</p>
                <p className="mt-1 font-semibold text-slate-900">¥{preview.currentAmount.toLocaleString()}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Days</p>
                <p className="mt-1 font-semibold text-slate-900">{preview.daysRemaining}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 md:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">この場で決めること</h2>
            {preview.decisions.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">決定項目はまだ登録されていません。</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                {preview.decisions.map((item, index) => (
                  <li key={`${item}-${index}`} className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">対象ユーザー</h2>
            <div className="mt-3 space-y-4 text-sm leading-6">
              <div>
                <h3 className="font-semibold text-slate-900">向いている人</h3>
                <p className="text-slate-700">{preview.suitableFor ?? "未設定"}</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">向いていない人</h3>
                <p className="text-slate-700">{preview.notSuitableFor ?? "未設定"}</p>
              </div>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
