"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

function normalize(text: string | undefined): string {
  return (text ?? "").toLowerCase();
}

export default function PublicListPageV2() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"latest" | "title">("latest");
  const previewsQuery = useQuery(api.v2Public.listPublicCatalog);

  const filtered = useMemo(() => {
    const previews = previewsQuery ?? [];
    const q = search.trim().toLowerCase();
    const base = previews.filter((item) => {
      if (!q) {
        return true;
      }
      return normalize(item.title).includes(q) || normalize(item.description).includes(q);
    });

    return [...base].sort((a, b) => {
      if (sortBy === "latest") {
        return b.createdAt - a.createdAt;
      }
      return normalize(a.title).localeCompare(normalize(b.title), "ja");
    });
  }, [previewsQuery, search, sortBy]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8fcff] via-[#f6f8ff] to-[#f9f7fb] text-slate-900">
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="text-2xl font-bold tracking-tight text-blue-700">
            FunFund
          </Link>
          <div className="flex items-center gap-3">
            <SignedIn>
              <Link
                href="/room"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Roomへ
              </Link>
              <UserButton />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700">
                  ログイン
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Open Projects</h1>
          <p className="mt-2 text-sm text-slate-600">
            評価と議論に公開されたプロジェクトを一覧表示します。
          </p>
          <div className="mt-5 flex flex-col gap-3 md:flex-row">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="タイトル・説明で検索"
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm outline-none ring-blue-500 transition focus:ring-2"
            />
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as "latest" | "title")}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm"
            >
              <option value="latest">新着順</option>
              <option value="title">タイトル順</option>
            </select>
          </div>
        </section>

        {filtered.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <h2 className="text-lg font-semibold text-slate-800">表示できるプロジェクトがありません</h2>
            <p className="mt-2 text-sm text-slate-500">検索条件を変更するか、後でもう一度確認してください。</p>
          </section>
        ) : (
          <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((item) => (
              <Link
                key={item.id}
                href={`/public/${item.id}`}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-4 aspect-video overflow-hidden rounded-xl bg-slate-100">
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-500">
                      NO IMAGE
                    </div>
                  )}
                </div>
                <h3 className="line-clamp-2 text-lg font-bold text-slate-900">{item.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{item.description ?? "説明はまだありません"}</p>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-500">
                  <div className="rounded-md bg-slate-50 px-2 py-1">
                    Score: {item.weightedScore.toFixed(2)}
                  </div>
                  <div className="rounded-md bg-slate-50 px-2 py-1">
                    Eval: {item.evaluationCount}
                  </div>
                  <div className="rounded-md bg-slate-50 px-2 py-1">
                    Fund: ¥{item.currentAmount.toLocaleString()}
                  </div>
                  <div className="rounded-md bg-slate-50 px-2 py-1">
                    Days: {item.daysRemaining}
                  </div>
                </div>
                <div className="mt-3 text-xs font-medium text-slate-500">
                  作成日: {new Date(item.createdAt).toLocaleDateString("ja-JP")}
                </div>
              </Link>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
