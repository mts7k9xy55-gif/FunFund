"use client";

import Link from "next/link";
import { SignInButton, useClerk, useUser } from "@clerk/nextjs";

export default function LogoutPage() {
  const { user } = useUser();
  const { signOut } = useClerk();

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-2xl items-center justify-center px-4 py-10">
      <section className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900">ログアウト</h1>
        {user ? (
          <>
            <p className="mt-3 text-sm text-slate-600">
              現在ログイン中です。下のボタンでログアウトできます。
            </p>
            <button
              type="button"
              onClick={() => void signOut({ redirectUrl: "/logout" })}
              className="mt-6 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              ログアウトする
            </button>
          </>
        ) : (
          <>
            <p className="mt-3 text-sm text-slate-600">ログアウトしました。</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <SignInButton mode="modal">
                <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
                  もう一度ログイン
                </button>
              </SignInButton>
              <Link
                href="/"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                ホームへ戻る
              </Link>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
