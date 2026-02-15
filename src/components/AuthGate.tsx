"use client";

import { ReactNode } from "react";
import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs";

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4">
        <p className="text-sm text-slate-600">読み込み中...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-2xl items-center justify-center px-4 py-10">
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-black text-slate-900">FunFund Room</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            建設的な議論、返信、支援コミットはログイン後に利用できます。
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <SignInButton mode="modal">
              <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
                ログイン
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                新規登録
              </button>
            </SignUpButton>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
