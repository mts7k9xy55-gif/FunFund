// src/components/NewFunFundApp.tsx
// Emergent型レイアウト：トップバー（FunFund | 全体議論 | ハンバーガー）/ スレッドカード / 下部Composer / 右メニュー

"use client";

import { useState, useEffect } from "react";
import { SignedIn, useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import MenuDrawer from "./layout/MenuDrawer";
import ThreadView from "./thread/ThreadView";
import ItemComposer from "./composer/ItemComposer";
import CommitModal from "./composer/CommitModal";
import CreateGroupModal from "./group/CreateGroupModal";
import CreateProjectModal from "./project/CreateProjectModal";
import UserProfileModal from "./profile/UserProfileModal";
import { ConnectionsPanel } from "./connection/ConnectionsPanel";
import DmSelectModal from "./dm/DmSelectModal";
import RoomSelector from "./room/RoomSelector";
import PaywallBanner from "./room/PaywallBanner";
import DecisionModal from "./room/DecisionModal";
import LayerInputs from "./layer/LayerInputs";
import Dashboard from "./dashboard/Dashboard";
import JoinRoomModal from "./room/JoinRoomModal";

type Language = "ja" | "en";

export default function NewFunFundApp() {
  const { user } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<Id<"items"> | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedProfileUserId, setSelectedProfileUserId] = useState<Id<"users"> | null>(null);
  const [isGroupCreateOpen, setIsGroupCreateOpen] = useState(false);
  const [isProjectCreateOpen, setIsProjectCreateOpen] = useState(false);
  const [projectCreateType, setProjectCreateType] = useState<"dm" | "thread">("thread");
  const [language, setLanguage] = useState<Language>("ja");
  const [isConnectionsOpen, setIsConnectionsOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<Id<"groups"> | null>(null);
  const [selectedDmId, setSelectedDmId] = useState<Id<"groups"> | null>(null);
  const [isDmSelectOpen, setIsDmSelectOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<Id<"rooms"> | null>(null);
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [selectedThreadId, setSelectedThreadId] = useState<Id<"threads"> | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showLayerInputs, setShowLayerInputs] = useState(false);
  const [isJoinRoomModalOpen, setIsJoinRoomModalOpen] = useState(false);

  // Convex queries & mutations
  const rootItems = useQuery(api.items.listRootItems) ?? [];
  const createItem = useMutation(api.items.createItem);
  const createUserMutation = useMutation(api.users.createUser);
  const createGroupMutation = useMutation(api.groups.createGroup);
  const myGroups = useQuery(api.groups.listMyGroups) ?? [];
  const myDMs = useQuery(api.groups.listMyDMs) ?? [];
  const createDMMutation = useMutation(api.groups.createDM);
  const rooms = useQuery(api.rooms.listRoomsForMe) ?? [];
  const selectedRoom = selectedRoomId ? rooms.find((r) => r._id === selectedRoomId) : null;
  const isRoomActive = selectedRoom?.status === "active";
  const createThreadMutation = useMutation(api.threads.createThread);
  const roomThreads = useQuery(
    api.threads.listThreads,
    selectedRoomId ? { roomId: selectedRoomId } : "skip"
  ) ?? [];

  // Clerk ユーザーIDを Convex users テーブルにマッピング
  useEffect(() => {
    if (user?.id) {
      createUserMutation({
        userId: user.id,
        name: user.fullName ?? user.firstName ?? undefined,
        role: "human",
      }).catch(console.error);
    }
  }, [user?.id, createUserMutation]);

  // Convex users テーブルから userId でユーザーを取得
  const users = useQuery(api.users.listUsers) ?? [];
  const currentConvexUser = users.find((u) => u.userId === user?.id);

  // エラーメッセージを自動で消す
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Checkout完了後のリダイレクト処理
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get("session_id");
      const roomId = params.get("room_id");
      
      if (sessionId && roomId) {
        // Checkout成功
        setSuccessMessage(language === "ja" ? "支払いが完了しました" : "Payment completed");
        setSelectedRoomId(roomId as Id<"rooms">);
        // URLからパラメータを削除
        window.history.replaceState({}, "", window.location.pathname);
      } else if (params.get("canceled")) {
        // Checkoutキャンセル
        setErrorMessage(language === "ja" ? "支払いがキャンセルされました" : "Payment canceled");
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, [language]);

  // 現在のスペース名を取得
  const getCurrentSpaceName = () => {
    if (selectedDmId) {
      const dm = myDMs.find((d) => d._id === selectedDmId);
      return dm?.otherUserName ?? "DM";
    }
    if (selectedGroupId) {
      const group = myGroups.find((g) => g._id === selectedGroupId);
      return group?.name ?? (language === "ja" ? "グループ" : "Group");
    }
    return language === "ja" ? "オープン" : "Open";
  };

  // 表示するアイテムをフィルタリング
  const displayItems = selectedDmId
    ? rootItems.filter((item) => item.groupId === selectedDmId)
    : selectedGroupId
      ? rootItems.filter((item) => item.groupId === selectedGroupId)
      : rootItems.filter((item) => !item.groupId && item.visibility === "public");

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Bar: Emergent型（FunFund | Roomセレクタ | ハンバーガー） */}
      <header className="sticky top-0 z-30 border-b border-border bg-card shrink-0">
        <div className="w-full px-4 md:px-8 lg:px-12 h-14 md:h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <h1 className="text-2xl md:text-3xl font-bold text-primary">FunFund</h1>
            <span className="text-sm md:text-base font-medium text-muted-fg">
              {getCurrentSpaceName()}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <SignedIn>
              <div className="flex items-center gap-2">
                <RoomSelector
                  selectedRoomId={selectedRoomId}
                  onSelectRoom={setSelectedRoomId}
                  language={language}
                  onCreateRoom={() => {
                    setSuccessMessage(language === "ja" ? "Roomを作成しました" : "Room created");
                  }}
                />
                <button
                  onClick={() => setIsJoinRoomModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-muted text-fg text-sm font-medium hover:bg-muted/80 transition-colors"
                  title={language === "ja" ? "招待コードで参加" : "Join with invite code"}
                >
                  {language === "ja" ? "参加" : "Join"}
                </button>
              </div>
            </SignedIn>
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="p-2 md:p-2.5 text-fg hover:bg-muted rounded-lg transition-colors"
              aria-label={language === "ja" ? "メニューを開く" : "Open menu"}
            >
              <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto pb-24">
          <div className="max-w-4xl mx-auto px-4 py-6">
            {/* 未認証時は誰もいない（スレッドを表示しない） */}
            <SignedIn>
              {selectedRoomId ? (
                // Room選択時: ダッシュボードとthreadsを表示
                <div className="space-y-6">
                  {/* ダッシュボード */}
                  <Dashboard
                    roomId={selectedRoomId}
                    threadId={selectedThreadId ?? undefined}
                    language={language}
                  />

                  {/* Threads一覧 */}
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-foreground">
                      {language === "ja" ? "Threads" : "Threads"}
                    </h2>
                    {roomThreads.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-muted-fg text-sm">
                          {language === "ja" ? "まだスレッドがありません" : "No threads yet"}
                        </p>
                      </div>
                    ) : (
                      roomThreads.map((thread) => {
                        const threadUser = users.find((u) => u._id === thread.createdBy);
                        return (
                          <div
                            key={thread._id}
                            className={`bg-card border border-border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                              selectedThreadId === thread._id
                                ? "ring-2 ring-primary"
                                : ""
                            }`}
                            onClick={() => {
                              setSelectedThreadId(thread._id);
                              setShowLayerInputs(true);
                            }}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-semibold text-fg">
                                {thread.title ?? thread.type}
                              </h3>
                              <span className="text-xs text-muted-fg">{thread.type}</span>
                            </div>
                            <p className="text-sm text-muted-fg mb-2">
                              {language === "ja" ? "作成者" : "Created by"}:{" "}
                              {threadUser?.name ?? "Unknown"}
                            </p>
                            {selectedThreadId === thread._id && showLayerInputs && (
                              <div className="mt-4">
                                <LayerInputs
                                  roomId={selectedRoomId}
                                  threadId={thread._id}
                                  language={language}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : (
                // 既存のitems表示（後方互換）
                <ThreadView
                  items={displayItems.map((item) => ({
                    id: item._id,
                    type: item.type,
                    content: item.content ?? "",
                    userId: item.authorId ?? "",
                    userName:
                      users.find((u) => u._id === item.authorId)?.name ??
                      "Unknown",
                    parentId: item.parentId ?? null,
                    createdAt: item.createdAt,
                    score: item.score,
                    reason: item.reason,
                    children: [], // TODO: 子アイテムを取得
                  }))}
                  onOpenCommit={(itemId) => {
                    setSelectedItemId(itemId as Id<"items">);
                    setIsCommitModalOpen(true);
                  }}
                  onOpenProjectCreate={() => {
                    setProjectCreateType("thread");
                    setIsProjectCreateOpen(true);
                  }}
                  onOpenComment={() => {
                    const composer = document.querySelector("textarea");
                    composer?.focus();
                    composer?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                  }}
                  onOpenProfile={(userId) => {
                    const targetUser = users.find((u) => u._id === userId);
                    if (targetUser) {
                      setSelectedProfileUserId(targetUser._id);
                      setIsProfileOpen(true);
                    }
                  }}
                  language={language}
                />
              )}
            </SignedIn>
          </div>
        </div>

        {/* Composer: 下部固定（コメント・評価・プロジェクト作成の切り替え） */}
        <SignedIn>
          {/* Roomがactiveでない場合のPaywallBanner */}
          {selectedRoomId && selectedRoom && !isRoomActive && (
            <div className="sticky bottom-24 px-4 pb-2">
              <PaywallBanner roomStatus={selectedRoom.status} roomId={selectedRoomId} language={language} />
            </div>
          )}
          <ItemComposer
            language={language}
            disabled={selectedRoomId ? !isRoomActive : false}
            reasonRequired={true}
            onOpenProjectCreate={() => {
              setProjectCreateType("thread");
              setIsProjectCreateOpen(true);
            }}
            onSubmit={async (content, mode, reason, attachments) => {
              if (!content.trim() && (!attachments || attachments.length === 0)) {
                setErrorMessage(language === "ja" ? "内容を入力してください" : "Please enter content");
                return;
              }
              try {
                // Roomベースの場合はThread作成APIを使用
                if (selectedRoomId) {
                  const threadType = mode === "evaluation" ? "proposal" : mode === "project" ? "project" : "comment";
                  
                  await createThreadMutation({
                    roomId: selectedRoomId,
                    type: threadType,
                    title: (mode === "evaluation" || mode === "project") ? content.trim().substring(0, 50) : undefined,
                    initialBody: content.trim() || "",
                    reason: (mode === "evaluation" || mode === "project") ? reason : undefined,
                  });
                  
                  const successMsg = mode === "evaluation"
                    ? (language === "ja" ? "提言を投稿しました" : "Proposal posted")
                    : mode === "project"
                      ? (language === "ja" ? "プロジェクトを投稿しました" : "Project posted")
                      : (language === "ja" ? "投稿しました" : "Posted successfully");
                  setSuccessMessage(successMsg);
                } else {
                  // 既存のitems API（後方互換）
                  const itemType = mode === "evaluation" ? "EVALUATION" : "COMMENT";
                  const visibility = selectedDmId ? "dm" : selectedGroupId ? "group" : "public";
                  const groupId = selectedDmId ?? selectedGroupId ?? undefined;
                  
                  await createItem({
                    type: itemType,
                    content: content.trim() || "",
                    parentId: undefined,
                    visibility,
                    groupId,
                  });
                  const successMsg = mode === "evaluation"
                    ? (language === "ja" ? "提言を投稿しました" : "Proposal posted")
                    : (language === "ja" ? "投稿しました" : "Posted successfully");
                  setSuccessMessage(successMsg);
                }
                // TODO: 画像・ファイルのアップロード処理
                if (attachments && attachments.length > 0) {
                  console.log("Attachments:", attachments);
                }
              } catch (error: any) {
                console.error("Failed to create item:", error);
                setErrorMessage(error.message || (language === "ja" ? "投稿に失敗しました" : "Failed to post"));
              }
            }}
          />
        </SignedIn>
      </div>

      {/* 右メニュー（ハンバーガーで開く） */}
      <MenuDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        selectedSpace={selectedGroupId ? "group" : "general"}
        onSelectSpace={() => {
          setSelectedGroupId(null);
          setSelectedDmId(null); // オープンに戻る
        }}
        language={language}
        onLanguageChange={setLanguage}
        onOpenGroupCreate={() => setIsGroupCreateOpen(true)}
        onOpenConnections={() => {
          setIsMenuOpen(false);
          setIsConnectionsOpen(true);
        }}
        groups={myGroups.map((g) => ({
          id: g._id,
          name: g.name,
          description: g.description,
        }))}
        onSelectGroup={(groupId) => {
          setSelectedGroupId(groupId as Id<"groups">);
          setSelectedDmId(null);
          setIsMenuOpen(false);
        }}
        dms={myDMs.map((dm) => ({
          id: dm._id,
          name: dm.name,
          otherUserName: dm.otherUserName,
        }))}
        onSelectDm={(dmId) => {
          setSelectedDmId(dmId as Id<"groups">);
          setSelectedGroupId(null);
          setIsMenuOpen(false);
        }}
        onOpenDmCreate={() => {
          setIsMenuOpen(false);
          setIsDmSelectOpen(true);
        }}
      />

      <CommitModal
        isOpen={isCommitModalOpen}
        onClose={() => {
          setIsCommitModalOpen(false);
          setSelectedItemId(null);
        }}
        language={language}
        parentId={selectedItemId}
        userId={currentConvexUser?._id}
        onSubmit={async (voteType, commitStrength, reason) => {
          if (!selectedItemId) return;

          try {
            // voteType を score に変換（approve: +commitStrength, neutral: 0, oppose: -commitStrength）
            const score =
              voteType === "approve"
                ? commitStrength
                : voteType === "oppose"
                  ? -commitStrength
                  : 0;

            // 認証はサーバー側でチェック（userId は不要になった）
            await createItem({
              type: "EVALUATION",
              content: "",
              score,
              reason,
              parentId: selectedItemId,
              visibility: "public",
            });
            setIsCommitModalOpen(false);
            setSelectedItemId(null);
          } catch (error) {
            console.error("Failed to create evaluation:", error);
          }
        }}
      />

      <CreateGroupModal
        isOpen={isGroupCreateOpen}
        onClose={() => setIsGroupCreateOpen(false)}
        language={language}
        onSubmit={async (name, description) => {
          try {
            await createGroupMutation({
              name,
              description: description || undefined,
              type: "project",
            });
            setSuccessMessage(language === "ja" ? "グループを作成しました" : "Group created successfully");
            setIsGroupCreateOpen(false);
          } catch (error: any) {
            console.error("Failed to create group:", error);
            setErrorMessage(error.message || (language === "ja" ? "グループの作成に失敗しました" : "Failed to create group"));
          }
        }}
      />

      <CreateProjectModal
        isOpen={isProjectCreateOpen}
        onClose={() => setIsProjectCreateOpen(false)}
        language={language}
        type={projectCreateType}
      />

      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => {
          setIsProfileOpen(false);
          setSelectedProfileUserId(null);
        }}
        userId={selectedProfileUserId}
        language={language}
      />

      <ConnectionsPanel
        isOpen={isConnectionsOpen}
        onClose={() => setIsConnectionsOpen(false)}
        language={language}
        onError={(msg) => setErrorMessage(msg)}
        onSuccess={(msg) => setSuccessMessage(msg)}
      />

      <DmSelectModal
        isOpen={isDmSelectOpen}
        onClose={() => setIsDmSelectOpen(false)}
        onSelectDm={(dmId) => {
          setSelectedDmId(dmId);
          setSelectedGroupId(null);
          setIsDmSelectOpen(false);
        }}
        language={language}
      />

      {selectedRoomId && selectedThreadId && (
        <DecisionModal
          isOpen={isDecisionModalOpen}
          onClose={() => {
            setIsDecisionModalOpen(false);
            setSelectedThreadId(null);
          }}
          roomId={selectedRoomId}
          threadId={selectedThreadId}
          language={language}
          onError={(msg) => setErrorMessage(msg)}
          onSuccess={(msg) => setSuccessMessage(msg)}
        />
      )}

      <JoinRoomModal
        isOpen={isJoinRoomModalOpen}
        onClose={() => setIsJoinRoomModalOpen(false)}
        onJoinSuccess={(roomId) => {
          setSelectedRoomId(roomId);
          setSuccessMessage(language === "ja" ? "Roomに参加しました" : "Joined room");
        }}
        language={language}
      />

      {/* エラー/成功メッセージ */}
      {(errorMessage || successMessage) && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50">
          <div
            className={`px-4 py-3 rounded-lg shadow-lg ${
              errorMessage
                ? "bg-red-500 text-white"
                : "bg-green-500 text-white"
            }`}
          >
            {errorMessage || successMessage}
          </div>
        </div>
      )}
    </div>
  );
}
