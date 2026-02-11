"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import DecisionModal from "@/components/room/DecisionModal";
import PaywallBanner from "@/components/room/PaywallBanner";
import RoomSelector from "@/components/room/RoomSelector";
import { isDecisionV2Enabled, isPayoutsV1Enabled } from "@/lib/featureFlags";

function formatMessageKind(kind: "comment" | "reason" | "execution") {
  if (kind === "reason") return "提案理由";
  if (kind === "execution") return "実行";
  return "返信";
}

export default function RoomPageV2() {
  const { user } = useUser();
  const roomsQuery = useQuery(api.rooms.listRoomsForMe);
  const rooms = useMemo(() => roomsQuery ?? [], [roomsQuery]);
  const users = useQuery(api.users.listUsers) ?? [];

  const createUserMutation = useMutation(api.users.createUser);
  const createThreadV2 = useMutation(api.v2Room.createThreadV2);
  const postComment = useMutation(api.messages.postComment);

  const [selectedRoomId, setSelectedRoomId] = useState<Id<"rooms"> | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<Id<"threads"> | null>(null);
  const [threadType, setThreadType] = useState<"comment" | "proposal">("comment");
  const [threadTitle, setThreadTitle] = useState("");
  const [threadBody, setThreadBody] = useState("");
  const [threadReason, setThreadReason] = useState("");
  const [creatingThread, setCreatingThread] = useState(false);
  const [threadError, setThreadError] = useState<string | null>(null);
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [decisionFeedback, setDecisionFeedback] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [postingReply, setPostingReply] = useState(false);

  const [payoutMessage, setPayoutMessage] = useState<string | null>(null);
  const [payoutAmount, setPayoutAmount] = useState("1000");
  const [payoutMethod, setPayoutMethod] = useState<"stripe_connect" | "bank_account">(
    "bank_account"
  );
  const [payoutRecipientUserId, setPayoutRecipientUserId] = useState<Id<"users"> | "">("");
  const [payoutNote, setPayoutNote] = useState("");
  const [bankNameInput, setBankNameInput] = useState("");
  const [bankLast4Input, setBankLast4Input] = useState("");
  const [workingAction, setWorkingAction] = useState<string | null>(null);
  const [accountCopiedMessage, setAccountCopiedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    createUserMutation({
      userId: user.id,
      name: user.fullName ?? user.firstName ?? undefined,
      role: "human",
    }).catch(() => {});
  }, [user?.id, user?.fullName, user?.firstName, createUserMutation]);

  const effectiveRoomId = selectedRoomId ?? rooms[0]?._id ?? null;
  const selectedRoom = useMemo(
    () => (effectiveRoomId ? rooms.find((room) => room._id === effectiveRoomId) ?? null : null),
    [effectiveRoomId, rooms]
  );
  const isActiveRoom = selectedRoom?.status === "active";

  const roomThreads = useQuery(
    api.threads.listThreads,
    effectiveRoomId ? { roomId: effectiveRoomId } : "skip"
  ) ?? [];

  useEffect(() => {
    if (!selectedThreadId) return;
    const exists = roomThreads.some((thread) => thread._id === selectedThreadId);
    if (!exists) setSelectedThreadId(null);
  }, [roomThreads, selectedThreadId]);

  const selectedThread = roomThreads.find((thread) => thread._id === selectedThreadId) ?? null;

  const threadDetail = useQuery(
    api.threads.getThread,
    selectedThreadId ? { threadId: selectedThreadId } : "skip"
  );
  const decisions = useQuery(
    api.decisions.listDecisions,
    selectedThreadId ? { threadId: selectedThreadId } : "skip"
  ) ?? [];
  const roomMembers = useQuery(
    api.rooms.listRoomMembers,
    effectiveRoomId ? { roomId: effectiveRoomId } : "skip"
  ) ?? [];
  const myPayoutAccounts = useQuery(api.payouts.listMyPayoutAccounts, {}) ?? [];
  const membersMissingPayout = useQuery(
    api.payouts.listMembersMissingPayoutMethod,
    effectiveRoomId ? { roomId: effectiveRoomId } : "skip"
  ) ?? [];
  const roomPayoutLedger = useQuery(
    api.payouts.listRoomPayoutLedger,
    effectiveRoomId ? { roomId: effectiveRoomId } : "skip"
  ) ?? [];

  const userNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of users) {
      map.set(row._id, row.name ?? "Unknown");
    }
    return map;
  }, [users]);

  const postJson = async <T extends Record<string, unknown>>(
    path: string,
    payload: Record<string, unknown>
  ): Promise<T> => {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok) {
      const message =
        typeof body.error === "string" ? body.error : `Request failed: ${response.status}`;
      throw new Error(message);
    }
    return body as T;
  };

  const handleStripeOnboard = async () => {
    setWorkingAction("stripe_onboard");
    setPayoutMessage(null);
    try {
      const result = await postJson<{ url?: string }>("/api/payouts/stripe/onboard", {
        roomId: effectiveRoomId,
      });
      if (result.url) {
        window.location.href = result.url;
        return;
      }
      setPayoutMessage("Stripe onboarding URLを取得できませんでした");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Stripe onboardingに失敗しました";
      setPayoutMessage(message);
    } finally {
      setWorkingAction(null);
    }
  };

  const handleBankRegister = async () => {
    if (!bankNameInput.trim() || bankLast4Input.trim().length !== 4) {
      setPayoutMessage("銀行名と口座下4桁を入力してください");
      return;
    }

    setWorkingAction("bank_register");
    setPayoutMessage(null);
    try {
      await postJson("/api/payouts/bank/register", {
        bankName: bankNameInput.trim(),
        accountLast4: bankLast4Input.trim(),
      });
      setPayoutMessage("銀行口座を登録しました");
      setBankNameInput("");
      setBankLast4Input("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "銀行口座登録に失敗しました";
      setPayoutMessage(message);
    } finally {
      setWorkingAction(null);
    }
  };

  const handlePayoutRequest = async () => {
    if (!effectiveRoomId) return;
    const amount = Number(payoutAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setPayoutMessage("送金金額を正しく入力してください");
      return;
    }

    setWorkingAction("payout_request");
    setPayoutMessage(null);
    try {
      await postJson("/api/payouts/request", {
        roomId: effectiveRoomId,
        recipientUserId: payoutRecipientUserId || undefined,
        amount,
        method: payoutMethod,
        note: payoutNote.trim() || undefined,
      });
      setPayoutMessage("送金リクエストを登録しました");
      setPayoutNote("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "送金リクエストに失敗しました";
      setPayoutMessage(message);
    } finally {
      setWorkingAction(null);
    }
  };

  const handleCopyAccountInfo = async (value: string) => {
    if (!navigator?.clipboard) {
      setAccountCopiedMessage("このブラウザではコピー機能を使用できません");
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      setAccountCopiedMessage("口座情報をコピーしました");
    } catch (error) {
      const message = error instanceof Error ? error.message : "コピーに失敗しました";
      setAccountCopiedMessage(message);
    }
  };

  const handleSubmitReply = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedThreadId || !effectiveRoomId || !replyBody.trim()) return;
    setPostingReply(true);
    try {
      await postComment({
        roomId: effectiveRoomId,
        threadId: selectedThreadId,
        body: replyBody.trim(),
      });
      setReplyBody("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "返信の投稿に失敗しました";
      setDecisionFeedback(message);
    } finally {
      setPostingReply(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f7fbff] via-[#f9f8ff] to-[#f8fafb]">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 w-full max-w-[1700px] items-center justify-between px-4 md:px-6">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-blue-700">FunFund Room</h1>
            <p className="text-xs text-slate-500">Closed SNS for practical decisions</p>
          </div>
          <RoomSelector
            selectedRoomId={selectedRoomId}
            onSelectRoom={setSelectedRoomId}
            language="ja"
            onCreateRoom={() => {}}
          />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1700px] px-4 py-8 md:px-6">
        {!effectiveRoomId || !selectedRoom ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-600">
            Roomを作成するか、既存のRoomを選択してください。
          </div>
        ) : (
          <div className="space-y-6">
            {!isActiveRoom ? (
              <PaywallBanner roomStatus={selectedRoom.status} roomId={selectedRoom._id} language="ja" />
            ) : null}

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.8fr)_400px]">
              <div className="space-y-6">
                {isPayoutsV1Enabled() ? (
                  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900">共通口座・支援</h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Room名: {selectedRoom.name} / 役割: {selectedRoom.myRole}
                      {selectedRoom.isPrivate && selectedRoom.inviteCode
                        ? ` / 招待コード: ${selectedRoom.inviteCode}`
                        : ""}
                    </p>

                    <div className="mt-4 space-y-3">
                      <button
                        type="button"
                        disabled={workingAction === "stripe_onboard"}
                        onClick={handleStripeOnboard}
                        className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {workingAction === "stripe_onboard" ? "Stripe連携中..." : "Stripe Connectを連携"}
                      </button>

                      <div className="space-y-2 rounded-lg border border-slate-200 p-3">
                        <p className="text-xs font-semibold text-slate-700">銀行口座を登録</p>
                        <input
                          value={bankNameInput}
                          onChange={(event) => setBankNameInput(event.target.value)}
                          placeholder="銀行名"
                          className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                        />
                        <input
                          value={bankLast4Input}
                          onChange={(event) => setBankLast4Input(event.target.value)}
                          placeholder="口座下4桁"
                          maxLength={4}
                          className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                        />
                        <button
                          type="button"
                          disabled={workingAction === "bank_register"}
                          onClick={handleBankRegister}
                          className="rounded bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {workingAction === "bank_register" ? "登録中..." : "銀行口座を保存"}
                        </button>
                      </div>

                      <div className="space-y-2 rounded-lg border border-slate-200 p-3">
                        <p className="text-xs font-semibold text-slate-700">登録済み口座</p>
                        {myPayoutAccounts.length === 0 ? (
                          <p className="text-xs text-slate-500">受取口座はまだ登録されていません</p>
                        ) : (
                          myPayoutAccounts.map((account) => {
                            const label =
                              account.method === "bank_account"
                                ? `${account.bankName ?? "銀行"} / ****${account.accountLast4 ?? "----"}`
                                : `Stripe Connect / ${account.externalRef ?? "未連携"}`;
                            return (
                              <div key={account._id} className="rounded border border-slate-200 bg-slate-50 p-2">
                                <p className="text-xs font-medium text-slate-700">{label}</p>
                                <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                                  <span>{account.status}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyAccountInfo(label)}
                                    className="ml-auto rounded border border-slate-300 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100"
                                  >
                                    コピー
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                        {accountCopiedMessage ? <p className="text-[11px] text-slate-500">{accountCopiedMessage}</p> : null}
                      </div>

                      <div className="space-y-2 rounded-lg border border-slate-200 p-3">
                        <p className="text-xs font-semibold text-slate-700">支援リクエスト</p>
                        <select
                          value={payoutRecipientUserId}
                          onChange={(event) => setPayoutRecipientUserId(event.target.value as Id<"users"> | "")}
                          className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                        >
                          <option value="">自分宛て</option>
                          {roomMembers.map((member) => (
                            <option key={member._id} value={member.userId}>
                              {member.userName} ({member.role})
                            </option>
                          ))}
                        </select>
                        <input
                          value={payoutAmount}
                          onChange={(event) => setPayoutAmount(event.target.value)}
                          className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                          placeholder="金額"
                        />
                        <select
                          value={payoutMethod}
                          onChange={(event) => setPayoutMethod(event.target.value as "stripe_connect" | "bank_account")}
                          className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                        >
                          <option value="bank_account">bank_account</option>
                          <option value="stripe_connect">stripe_connect</option>
                        </select>
                        <input
                          value={payoutNote}
                          onChange={(event) => setPayoutNote(event.target.value)}
                          className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                          placeholder="メモ（任意）"
                        />
                        <button
                          type="button"
                          disabled={workingAction === "payout_request"}
                          onClick={handlePayoutRequest}
                          className="rounded bg-green-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {workingAction === "payout_request" ? "登録中..." : "送金リクエストを作成"}
                        </button>
                      </div>

                      <div className="space-y-1 text-xs text-slate-600">
                        <p>登録口座数: {myPayoutAccounts.length}</p>
                        <p>送金台帳件数: {roomPayoutLedger.length}</p>
                        {membersMissingPayout.length > 0 ? (
                          <p className="text-amber-700">
                            送金方法未登録メンバー: {membersMissingPayout.map((row) => row.userName).join(", ")}
                          </p>
                        ) : (
                          <p className="text-green-700">全メンバーが送金方法を登録済み</p>
                        )}
                        {payoutMessage ? <p>{payoutMessage}</p> : null}
                      </div>
                    </div>
                  </section>
                ) : null}

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-slate-900">スレッド作成</h2>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <select
                      value={threadType}
                      onChange={(event) => setThreadType(event.target.value as "comment" | "proposal")}
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="comment">相談 / メモ</option>
                      <option value="proposal">提案（判断対象）</option>
                    </select>
                    <input
                      value={threadTitle}
                      onChange={(event) => setThreadTitle(event.target.value)}
                      placeholder="議題タイトル"
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                    />
                  </div>
                  <textarea
                    value={threadBody}
                    onChange={(event) => setThreadBody(event.target.value)}
                    placeholder="背景・論点・条件を記入"
                    className="mt-3 min-h-28 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                  />
                  {threadType === "proposal" ? (
                    <textarea
                      value={threadReason}
                      onChange={(event) => setThreadReason(event.target.value)}
                      placeholder="提案理由（必須）"
                      className="mt-3 min-h-24 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                    />
                  ) : null}
                  {threadError ? <p className="mt-2 text-sm text-red-600">{threadError}</p> : null}
                  <button
                    type="button"
                    disabled={!isActiveRoom || creatingThread || !threadBody.trim() || !threadTitle.trim()}
                    onClick={async () => {
                      if (!effectiveRoomId) return;
                      setCreatingThread(true);
                      setThreadError(null);
                      try {
                        const newThreadId = await createThreadV2({
                          roomId: effectiveRoomId,
                          type: threadType,
                          title: threadTitle.trim(),
                          initialBody: threadBody.trim(),
                          reason: threadReason.trim() ? threadReason.trim() : undefined,
                        });
                        setSelectedThreadId(newThreadId);
                        setThreadTitle("");
                        setThreadBody("");
                        setThreadReason("");
                      } catch (error) {
                        const message = error instanceof Error ? error.message : "Thread creation failed";
                        setThreadError(message);
                      } finally {
                        setCreatingThread(false);
                      }
                    }}
                    className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {creatingThread ? "作成中..." : "スレッドを作成"}
                  </button>
                </section>

                {selectedThread ? (
                  <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-slate-900">{selectedThread.title ?? "Untitled"}</h2>
                        <p className="text-xs text-slate-500">種別: {selectedThread.type}</p>
                      </div>
                      {isDecisionV2Enabled() ? (
                        <button
                          type="button"
                          onClick={() => setIsDecisionModalOpen(true)}
                          disabled={!isActiveRoom}
                          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          判断を追加
                        </button>
                      ) : null}
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-slate-800">返信</h3>
                      {(threadDetail?.messages ?? []).length === 0 ? (
                        <p className="text-sm text-slate-500">まだ返信はありません。</p>
                      ) : (
                        (threadDetail?.messages ?? []).map((message) => (
                          <div key={message._id} className="rounded-lg border border-slate-200 p-3">
                            <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
                              <span className="rounded bg-slate-100 px-2 py-0.5">
                                {formatMessageKind(message.kind)}
                              </span>
                              <span>{userNameById.get(message.createdBy) ?? "Unknown"}</span>
                            </div>
                            <p className="whitespace-pre-wrap text-sm text-slate-700">{message.body}</p>
                          </div>
                        ))
                      )}
                    </div>

                    <form onSubmit={handleSubmitReply} className="mt-4 space-y-2">
                      <textarea
                        value={replyBody}
                        onChange={(event) => setReplyBody(event.target.value)}
                        placeholder="返信を書く"
                        className="min-h-24 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                      />
                      <button
                        type="submit"
                        disabled={!isActiveRoom || postingReply || !replyBody.trim()}
                        className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {postingReply ? "投稿中..." : "返信を投稿"}
                      </button>
                    </form>

                    <div className="mt-6 space-y-3">
                      <h3 className="text-sm font-semibold text-slate-800">判断（評価 + 理由）</h3>
                      {decisions.length === 0 ? (
                        <p className="text-sm text-slate-500">まだ判断はありません。</p>
                      ) : (
                        decisions.map((decision) => (
                          <div key={decision._id} className="rounded-lg border border-slate-200 p-3">
                            <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
                              <span className="rounded bg-blue-50 px-2 py-0.5 font-semibold text-blue-700">
                                Score {decision.score}
                              </span>
                              <span>{decision.evaluatorName}</span>
                            </div>
                            <p className="whitespace-pre-wrap text-sm text-slate-700">{decision.reason}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </section>
                ) : null}
              </div>

              <aside className="space-y-6 xl:sticky xl:top-24 self-start">
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-base font-bold text-slate-900">進行ガイド（提案）</h3>
                  <ol className="mt-3 space-y-2 text-sm text-slate-700">
                    <li>1. 先にスレッドを1件作成して論点を固定する</li>
                    <li>2. 返信で懸念と条件を出し切る</li>
                    <li>3. 最後に判断（評価 + 理由）を入れて締める</li>
                  </ol>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900">スレッド一覧</h3>
                    <span className="text-xs text-slate-500">{roomThreads.length} 件</span>
                  </div>
                  {roomThreads.length === 0 ? (
                    <p className="text-sm text-slate-500">まだスレッドがありません。</p>
                  ) : (
                    <div className="space-y-2">
                      {roomThreads.map((thread) => (
                        <button
                          key={thread._id}
                          type="button"
                          onClick={() => setSelectedThreadId(thread._id)}
                          className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                            selectedThreadId === thread._id
                              ? "border-blue-600 bg-blue-50"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <p className="truncate font-semibold text-slate-900">{thread.title ?? "Untitled"}</p>
                          <p className="text-xs text-slate-500">{thread.type}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              </aside>
            </section>
          </div>
        )}
      </main>

      {isDecisionV2Enabled() && selectedRoom && selectedThreadId ? (
        <DecisionModal
          isOpen={isDecisionModalOpen}
          onClose={() => setIsDecisionModalOpen(false)}
          roomId={selectedRoom._id}
          threadId={selectedThreadId}
          language="ja"
          onError={(message) => setDecisionFeedback(message)}
          onSuccess={(message) => setDecisionFeedback(message)}
        />
      ) : null}

      {decisionFeedback ? (
        <div className="fixed bottom-5 right-5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm">
          {decisionFeedback}
        </div>
      ) : null}
    </div>
  );
}
