// src/components/layout/MenuDrawer.tsx
// Emergent型右メニュー：ハンバーガーで開く
// 掲示板(Spaces) / 言語 / DM / グループ / 認証

"use client";

import Link from "next/link";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";

type Space = { id: string; name: string; emoji: string };
type Language = "ja" | "en";

export default function MenuDrawer({
  isOpen,
  onClose,
  selectedSpace,
  onSelectSpace,
  language,
  onLanguageChange,
  onOpenGroupCreate,
  onOpenConnections,
  groups,
  onSelectGroup,
  dms,
  onSelectDm,
  onOpenDmCreate,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedSpace: string;
  onSelectSpace: (id: string) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenGroupCreate: () => void;
  onOpenConnections?: () => void;
  groups?: Array<{ id: string; name: string; description?: string }>;
  onSelectGroup?: (groupId: string) => void;
  dms?: Array<{ id: string; name: string; otherUserName?: string }>;
  onSelectDm?: (dmId: string) => void;
  onOpenDmCreate?: () => void;
}) {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <aside className="fixed top-0 right-0 z-50 w-72 h-full bg-card border-l border-border shadow-xl overflow-y-auto">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-base font-semibold text-fg">メニュー</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-fg hover:text-fg rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* 言語 */}
          <div>
            <div className="text-xs font-medium text-muted-fg uppercase tracking-wider mb-2">
              言語
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onLanguageChange("ja")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  language === "ja"
                    ? "bg-primary text-primary-fg"
                    : "bg-muted text-muted-fg hover:text-fg"
                }`}
              >
                日本語
              </button>
              <button
                type="button"
                onClick={() => onLanguageChange("en")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  language === "en"
                    ? "bg-primary text-primary-fg"
                    : "bg-muted text-muted-fg hover:text-fg"
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* つながり */}
          <SignedIn>
            <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-bold text-green-700 uppercase tracking-wider">
                  {language === "ja" ? "つながり" : "Connections"}
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenConnections}
                className="w-full px-4 py-3 rounded-lg bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-md"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {language === "ja" ? "つながりを管理" : "Manage Connections"}
              </button>
            </div>
          </SignedIn>

          {/* DM */}
          <SignedIn>
            <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  DM
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onOpenDmCreate?.();
                  onClose();
                }}
                className="w-full px-4 py-2.5 rounded-lg bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 shadow-md"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                {language === "ja" ? "新しいDM" : "New DM"}
              </button>
              <div className="mt-3 space-y-1">
                {dms && dms.length > 0 ? (
                  dms.map((dm) => (
                    <button
                      key={dm.id}
                      type="button"
                      onClick={() => {
                        onSelectDm?.(dm.id);
                        onClose();
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-fg bg-white/80 border border-purple-100 hover:bg-purple-100 transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 text-xs font-bold">
                          {(dm.otherUserName ?? dm.name)?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <span>{dm.otherUserName ?? dm.name}</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-xs text-muted-fg px-3 py-2 text-center">
                    {language === "ja" ? "DMはありません" : "No DMs"}
                  </div>
                )}
              </div>
            </div>
          </SignedIn>

          {/* グループ（際立たせる） */}
          <div className="p-5 bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/30 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {language === "ja" ? "グループ" : "Groups"}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onOpenGroupCreate();
                onClose();
              }}
              className="w-full px-4 py-3.5 rounded-xl bg-primary text-primary-fg text-base font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-lg"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              {language === "ja" ? "グループを作成" : "Create Group"}
            </button>
            <div className="mt-4 space-y-2">
              {groups && groups.length > 0 ? (
                groups.map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => {
                      onSelectGroup?.(group.id);
                      onClose();
                    }}
                    className="w-full text-left px-4 py-3 rounded-xl text-base font-semibold text-fg bg-white/80 border-2 border-primary/20 hover:bg-primary/10 hover:border-primary/40 transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                        {group.name[0]?.toUpperCase() ?? "G"}
                      </div>
                      <span>{group.name}</span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-sm text-muted-fg px-4 py-3 text-center bg-white/50 rounded-xl">
                  {language === "ja" ? "グループがありません" : "No groups"}
                </div>
              )}
            </div>
          </div>

          {/* オープン */}
          <div>
            <div className="text-xs font-medium text-muted-fg uppercase tracking-wider mb-2">
              {language === "ja" ? "オープン" : "Open"}
            </div>
            <button
              type="button"
              onClick={() => {
                onSelectSpace("1");
                onClose();
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-fg hover:bg-muted transition-colors"
            >
              {language === "ja" ? "広場" : "Plaza"}
            </button>
          </div>

          <div>
            <div className="text-xs font-medium text-muted-fg uppercase tracking-wider mb-2">
              {language === "ja" ? "リーガル" : "Legal"}
            </div>
            <div className="space-y-1">
              <Link
                href="/privacy"
                onClick={onClose}
                className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-fg hover:bg-muted transition-colors"
              >
                {language === "ja" ? "プライバシーポリシー" : "Privacy Policy"}
              </Link>
              <Link
                href="/terms"
                onClick={onClose}
                className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-fg hover:bg-muted transition-colors"
              >
                {language === "ja" ? "利用規約" : "Terms"}
              </Link>
            </div>
          </div>

          {/* 認証 */}
          <div className="pt-4 border-t border-border">
            <SignedOut>
              <div className="flex flex-col gap-2">
                <SignInButton>
                  <button className="w-full py-2 text-sm text-muted-fg hover:text-fg transition-colors">
                    ログイン
                  </button>
                </SignInButton>
                <SignUpButton>
                  <button className="w-full py-2 rounded-lg btn-primary text-sm">
                    新規登録
                  </button>
                </SignUpButton>
              </div>
            </SignedOut>
            <SignedIn>
              <div className="flex justify-center">
                <UserButton />
              </div>
            </SignedIn>
          </div>
        </div>
      </aside>
    </>
  );
}
