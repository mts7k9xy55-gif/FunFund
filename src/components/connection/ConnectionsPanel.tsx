"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface ConnectionsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  language: "ja" | "en";
  onError?: (message: string) => void;
  onSuccess?: (message: string) => void;
}

export function ConnectionsPanel({
  isOpen,
  onClose,
  language,
  onError,
  onSuccess,
}: ConnectionsPanelProps) {
  const [activeTab, setActiveTab] = useState<"connections" | "invite" | "requests">("connections");
  const [searchQuery, setSearchQuery] = useState("");

  const connections = useQuery(api.connections.listConnections);
  const pendingRequests = useQuery(api.connections.listPendingRequests);
  const searchResults = useQuery(
    api.users.searchUsers,
    searchQuery.length >= 1 ? { query: searchQuery } : "skip"
  );

  const sendRequest = useMutation(api.connections.sendRequest);
  const acceptRequest = useMutation(api.connections.acceptRequest);
  const rejectRequest = useMutation(api.connections.rejectRequest);
  const disconnect = useMutation(api.connections.disconnect);
  const createInvite = useMutation(api.invites.createInvite);
  const useInvite = useMutation(api.invites.useInvite);

  const t = {
    title: language === "ja" ? "つながり" : "Connections",
    tabs: {
      connections: language === "ja" ? "つながり" : "Connections",
      invite: language === "ja" ? "招待" : "Invite",
      requests: language === "ja" ? "リクエスト" : "Requests",
    },
    searchPlaceholder: language === "ja" ? "名前で検索..." : "Search by name...",
    noConnections: language === "ja" ? "まだつながりがありません" : "No connections yet",
    noRequests: language === "ja" ? "リクエストはありません" : "No pending requests",
    noResults: language === "ja" ? "見つかりませんでした" : "No results found",
    connect: language === "ja" ? "つながる" : "Connect",
    disconnect: language === "ja" ? "解除" : "Disconnect",
    accept: language === "ja" ? "承認" : "Accept",
    reject: language === "ja" ? "拒否" : "Reject",
    dm: language === "ja" ? "DM" : "DM",
    invite: language === "ja" ? "招待" : "Invite",
    pending: language === "ja" ? "リクエスト中" : "Pending",
    close: language === "ja" ? "閉じる" : "Close",
    createInviteLink: language === "ja" ? "招待リンクを作成" : "Create Invite Link",
    copyLink: language === "ja" ? "リンクをコピー" : "Copy Link",
    copied: language === "ja" ? "コピーしました！" : "Copied!",
    enterCode: language === "ja" ? "招待コードを入力" : "Enter invite code",
    useCode: language === "ja" ? "コードを使う" : "Use Code",
  };

  if (!isOpen) return null;

  const pendingCount = pendingRequests?.length ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{t.title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("connections")}
            className={`flex-1 py-3 text-sm font-medium ${
              activeTab === "connections"
                ? "border-b-2 border-primary text-primary"
                : "text-gray-500"
            }`}
          >
            {t.tabs.connections}
          </button>
          <button
            onClick={() => setActiveTab("invite")}
            className={`flex-1 py-3 text-sm font-medium ${
              activeTab === "invite"
                ? "border-b-2 border-primary text-primary"
                : "text-gray-500"
            }`}
          >
            {t.tabs.invite}
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`flex-1 py-3 text-sm font-medium relative ${
              activeTab === "requests"
                ? "border-b-2 border-primary text-primary"
                : "text-gray-500"
            }`}
          >
            {t.tabs.requests}
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "connections" && (
            <ConnectionsList
              connections={connections ?? []}
              onDisconnect={(userId) => disconnect({ userId })}
              language={language}
              t={t}
            />
          )}
          {activeTab === "invite" && (
            <InviteTab
              onCreateInvite={() => createInvite({})}
              onUseInvite={(code) => useInvite({ code })}
              language={language}
              t={t}
              onError={onError}
              onSuccess={onSuccess}
            />
          )}
          {activeTab === "requests" && (
            <RequestsList
              requests={pendingRequests ?? []}
              onAccept={(connectionId) => acceptRequest({ connectionId })}
              onReject={(connectionId) => rejectRequest({ connectionId })}
              language={language}
              t={t}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ConnectionsList({
  connections,
  onDisconnect,
  language,
  t,
}: {
  connections: any[];
  onDisconnect: (userId: Id<"users">) => void;
  language: "ja" | "en";
  t: any;
}) {
  if (connections.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">{t.noConnections}</div>
    );
  }

  return (
    <div className="space-y-3">
      {connections.map((conn) => (
        <div
          key={conn.connectionId}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary font-medium">
              {(conn.user?.name ?? "?")[0].toUpperCase()}
            </div>
            <div>
              <div className="font-medium">{conn.user?.name ?? "Unknown"}</div>
              <div className="text-xs text-gray-500">
                {conn.user?.reputation?.toFixed(1) ?? "1.0"}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onDisconnect(conn.user?._id)}
              className="px-3 py-1 text-xs text-red-500 hover:bg-red-50 rounded"
            >
              {t.disconnect}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function InviteTab({
  onCreateInvite,
  onUseInvite,
  language,
  t,
  onError,
  onSuccess,
}: {
  onCreateInvite: () => Promise<{ code: string }>;
  onUseInvite: (code: string) => Promise<{ success: boolean; inviterName: string }>;
  language: "ja" | "en";
  t: any;
  onError?: (message: string) => void;
  onSuccess?: (message: string) => void;
}) {
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inputCode, setInputCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleCreateInvite = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await onCreateInvite();
      setInviteCode(result.code);
    } catch (err: any) {
      setError(err.message ?? "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!inviteCode) return;
    try {
      const url = `${window.location.origin}?invite=${inviteCode}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onSuccess?.(language === "ja" ? "リンクをコピーしました" : "Link copied");
    } catch (err) {
      onError?.(language === "ja" ? "コピーに失敗しました" : "Failed to copy");
    }
  };

  const handleUseInvite = async () => {
    if (!inputCode.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await onUseInvite(inputCode.trim().toUpperCase());
      const successMsg =
        language === "ja"
          ? `${result.inviterName} さんとつながりました！`
          : `Connected with ${result.inviterName}!`;
      setSuccess(successMsg);
      onSuccess?.(successMsg);
      setInputCode("");
      // URLパラメータを削除
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.delete("invite");
        window.history.replaceState({}, "", url.toString());
      }
    } catch (err: any) {
      const errorMsg = err.message ?? (language === "ja" ? "エラーが発生しました" : "An error occurred");
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // URLパラメータから招待コードを自動入力
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const inviteParam = params.get("invite");
      if (inviteParam) {
        setInputCode(inviteParam.toUpperCase());
        // 自動的に使用を試みる（オプション）
        // handleUseInvite();
      }
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* 招待リンクを作成 */}
      <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">
          {language === "ja" ? "友達を招待する" : "Invite a friend"}
        </h3>
        <p className="text-sm text-blue-700 mb-4">
          {language === "ja"
            ? "招待リンクを作成して、メールやDMで送りましょう"
            : "Create an invite link and share it via email or DM"}
        </p>

        {inviteCode ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-white rounded-lg border">
              <code className="flex-1 text-lg font-mono font-bold text-center tracking-wider">
                {inviteCode}
              </code>
            </div>
            <button
              onClick={handleCopyLink}
              className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              {copied ? t.copied : t.copyLink}
            </button>
          </div>
        ) : (
          <button
            onClick={handleCreateInvite}
            disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading
              ? "..."
              : t.createInviteLink}
          </button>
        )}
      </div>

      {/* 招待コードを使う */}
      <div className="p-4 bg-green-50 rounded-xl border border-green-200">
        <h3 className="font-semibold text-green-900 mb-2">
          {language === "ja" ? "招待コードを使う" : "Use an invite code"}
        </h3>
        <p className="text-sm text-green-700 mb-4">
          {language === "ja"
            ? "友達からもらった招待コードを入力"
            : "Enter an invite code from a friend"}
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            placeholder="ABCD1234"
            className="flex-1 px-4 py-2 border rounded-lg font-mono text-center tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-green-500"
            maxLength={8}
          />
          <button
            onClick={handleUseInvite}
            disabled={loading || !inputCode.trim()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {t.useCode}
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2 bg-red-100 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-3 p-2 bg-green-100 text-green-700 text-sm rounded-lg">
            {success}
          </div>
        )}
      </div>
    </div>
  );
}

function RequestsList({
  requests,
  onAccept,
  onReject,
  language,
  t,
}: {
  requests: any[];
  onAccept: (connectionId: Id<"connections">) => void;
  onReject: (connectionId: Id<"connections">) => void;
  language: "ja" | "en";
  t: any;
}) {
  if (requests.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">{t.noRequests}</div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((req) => (
        <div
          key={req._id}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary font-medium">
              {(req.fromUser?.name ?? "?")[0].toUpperCase()}
            </div>
            <div>
              <div className="font-medium">
                {req.fromUser?.name ?? "Unknown"}
              </div>
              <div className="text-xs text-gray-500">
                {language === "ja" ? "つながりリクエスト" : "Connection request"}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onAccept(req._id)}
              className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
            >
              {t.accept}
            </button>
            <button
              onClick={() => onReject(req._id)}
              className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              {t.reject}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
