"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import Dashboard from "@/components/dashboard/Dashboard";
import DecisionModal from "@/components/room/DecisionModal";
import LayerInputs from "@/components/layer/LayerInputs";
import PaywallBanner from "@/components/room/PaywallBanner";
import RoomSelector from "@/components/room/RoomSelector";
import {
  isDecisionV2Enabled,
  isPayoutsV1Enabled,
  isV2LegacyHubEnabled,
  isWeightsV2Enabled,
} from "@/lib/featureFlags";

const LegacyHub = dynamic(() => import("@/components/NewFunFundApp"), {
  ssr: false,
  loading: () => <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Legacy Hub loading...</div>,
});

export default function RoomPageV2() {
  const roomsQuery = useQuery(api.rooms.listRoomsForMe);
  const rooms = useMemo(() => roomsQuery ?? [], [roomsQuery]);
  const createThreadV2 = useMutation(api.v2Room.createThreadV2);
  const setEvaluatorPublishConsent = useMutation(api.decisions.setEvaluatorPublishConsent);
  const setTargetPublishConsent = useMutation(api.decisions.setTargetPublishConsent);
  const setRoomWeightOverride = useMutation(api.weights.setRoomWeightOverride);
  const setMyWeightProfileVisibility = useMutation(
    api.weights.updateMyWeightProfileVisibility
  );
  const [selectedRoomId, setSelectedRoomId] = useState<Id<"rooms"> | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<Id<"threads"> | null>(null);
  const [showLegacyHub, setShowLegacyHub] = useState(false);
  const [threadType, setThreadType] = useState<"comment" | "proposal">("comment");
  const [threadTitle, setThreadTitle] = useState("");
  const [threadBody, setThreadBody] = useState("");
  const [threadReason, setThreadReason] = useState("");
  const [creatingThread, setCreatingThread] = useState(false);
  const [threadError, setThreadError] = useState<string | null>(null);
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [decisionFeedback, setDecisionFeedback] = useState<string | null>(null);
  const [settingConsentId, setSettingConsentId] = useState<string | null>(null);
  const [overrideUserId, setOverrideUserId] = useState<Id<"users"> | "">("");
  const [overrideWeight, setOverrideWeight] = useState("1.0");
  const [overrideReason, setOverrideReason] = useState("");
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

  const effectiveRoomId = selectedRoomId ?? rooms[0]?._id ?? null;

  const selectedRoom = useMemo(
    () => (effectiveRoomId ? rooms.find((room) => room._id === effectiveRoomId) ?? null : null),
    [effectiveRoomId, rooms]
  );

  const roomThreadsQuery = useQuery(
    api.threads.listThreads,
    effectiveRoomId ? { roomId: effectiveRoomId } : "skip"
  );
  const roomThreads = useMemo(() => roomThreadsQuery ?? [], [roomThreadsQuery]);
  const roomMembers = useQuery(
    api.rooms.listRoomMembers,
    effectiveRoomId ? { roomId: effectiveRoomId } : "skip"
  );
  const workspace = useQuery(
    api.v2Room.getRoomWorkspace,
    effectiveRoomId ? { roomId: effectiveRoomId } : "skip"
  );
  const myWeightProfile = useQuery(api.weights.getMyWeightProfile, {});
  const roomWeightOverrides = useQuery(
    api.weights.listRoomWeightOverrides,
    effectiveRoomId ? { roomId: effectiveRoomId } : "skip"
  );
  const myPayoutAccounts = useQuery(api.payouts.listMyPayoutAccounts, {});
  const membersMissingPayout = useQuery(
    api.payouts.listMembersMissingPayoutMethod,
    effectiveRoomId ? { roomId: effectiveRoomId } : "skip"
  );
  const roomPayoutLedger = useQuery(
    api.payouts.listRoomPayoutLedger,
    effectiveRoomId ? { roomId: effectiveRoomId } : "skip"
  );

  const effectiveThreadId = useMemo(() => {
    if (!roomThreads.length) {
      return null;
    }
    if (selectedThreadId && roomThreads.some((thread) => thread._id === selectedThreadId)) {
      return selectedThreadId;
    }
    return roomThreads[0]._id;
  }, [roomThreads, selectedThreadId]);

  const decisions = useQuery(
    api.decisions.listDecisions,
    effectiveThreadId ? { threadId: effectiveThreadId } : "skip"
  );

  const roomMetrics = workspace?.metrics;

  const decisionRows = decisions ?? [];
  const roomMembersRows = roomMembers ?? [];
  const weightOverrideRows = roomWeightOverrides ?? [];
  const payoutAccounts = myPayoutAccounts ?? [];
  const missingPayoutRows = membersMissingPayout ?? [];
  const payoutLedgerRows = roomPayoutLedger ?? [];
  const [accountCopiedMessage, setAccountCopiedMessage] = useState<string | null>(null);

  const handleApplyWeightOverride = async () => {
    if (!effectiveRoomId || !overrideUserId) {
      return;
    }
    const parsed = Number(overrideWeight);
    if (!Number.isFinite(parsed) || parsed < 0.5 || parsed > 2.5) {
      setDecisionFeedback("重みは0.5〜2.5で指定してください");
      return;
    }

    setWorkingAction("weight_override");
    setDecisionFeedback(null);
    try {
      await setRoomWeightOverride({
        roomId: effectiveRoomId,
        userId: overrideUserId,
        projectWeight: parsed,
        reason: overrideReason.trim() ? overrideReason.trim() : undefined,
      });
      setDecisionFeedback("重みオーバーライドを保存しました");
      setOverrideReason("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "重みオーバーライドの保存に失敗しました";
      setDecisionFeedback(message);
    } finally {
      setWorkingAction(null);
    }
  };

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
        typeof body.error === "string"
          ? body.error
          : `Request failed: ${response.status}`;
      throw new Error(message);
    }
    return body as T;
  };

  const handleStripeOnboard = async () => {
    setWorkingAction("stripe_onboard");
    setPayoutMessage(null);
    try {
      const result = await postJson<{ url?: string; ok?: boolean }>(
        "/api/payouts/stripe/onboard",
        {
        roomId: effectiveRoomId,
        }
      );
      if (result.url) {
        window.location.href = result.url;
        return;
      }
      setPayoutMessage("Stripe onboarding URLを取得できませんでした");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Stripe onboardingに失敗しました";
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
      const message =
        error instanceof Error ? error.message : "銀行口座登録に失敗しました";
      setPayoutMessage(message);
    } finally {
      setWorkingAction(null);
    }
  };

  const handlePayoutRequest = async () => {
    if (!effectiveRoomId) {
      return;
    }
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
      const message =
        error instanceof Error ? error.message : "送金リクエストに失敗しました";
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
      const message =
        error instanceof Error ? error.message : "コピーに失敗しました";
      setAccountCopiedMessage(message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f7fbff] via-[#f9f8ff] to-[#f8fafb]">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-blue-700">FunFund Room</h1>
            <p className="text-xs text-slate-500">Room-based funding workspace (v2)</p>
          </div>
          <RoomSelector
            selectedRoomId={selectedRoomId}
            onSelectRoom={setSelectedRoomId}
            language="ja"
            onCreateRoom={() => {
              // RoomSelector側の作成完了後にquery更新される
            }}
          />
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-12">
        <section className="lg:col-span-8">
          {effectiveRoomId && selectedRoom ? (
            <div className="space-y-6">
              {selectedRoom.status !== "active" ? (
                <PaywallBanner roomStatus={selectedRoom.status} roomId={selectedRoom._id} language="ja" />
              ) : null}

              <Dashboard roomId={selectedRoom._id} threadId={effectiveThreadId ?? undefined} language="ja" />

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900">新しい議題</h2>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <select
                    value={threadType}
                    onChange={(event) =>
                      setThreadType(event.target.value as "comment" | "proposal")
                    }
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
                  className="mt-3 min-h-24 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                />
                {threadType === "proposal" && (
                  <textarea
                    value={threadReason}
                    onChange={(event) => setThreadReason(event.target.value)}
                    placeholder="提案理由（必須）"
                    className="mt-3 min-h-20 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                  />
                )}
                {threadError ? <p className="mt-2 text-sm text-red-600">{threadError}</p> : null}
                <button
                  type="button"
                  disabled={creatingThread || !threadBody.trim() || !threadTitle.trim()}
                  onClick={async () => {
                    if (!effectiveRoomId) {
                      return;
                    }
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
                  {creatingThread ? "作成中..." : "Threadを作成"}
                </button>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900">Threads</h2>
                  <span className="text-xs text-slate-500">{roomThreads.length} 件</span>
                </div>
                {roomThreads.length === 0 ? (
                  <p className="text-sm text-slate-500">まだThreadがありません。</p>
                ) : (
                  <div className="space-y-2">
                    {roomThreads.map((thread) => (
                      <button
                        key={thread._id}
                        type="button"
                        onClick={() => setSelectedThreadId(thread._id)}
                        className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                          effectiveThreadId === thread._id
                            ? "border-blue-600 bg-blue-50"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-slate-900">{thread.title ?? "Untitled"}</p>
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{thread.type}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {effectiveThreadId ? (
                <LayerInputs roomId={selectedRoom._id} threadId={effectiveThreadId} language="ja" />
              ) : null}

              {isDecisionV2Enabled() && effectiveThreadId ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900">判断 (1-10)</h2>
                    <button
                      type="button"
                      onClick={() => setIsDecisionModalOpen(true)}
                      className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      判断を追加
                    </button>
                  </div>

                  {decisionRows.length === 0 ? (
                    <p className="text-sm text-slate-500">表示可能な判断はまだありません。</p>
                  ) : (
                    <div className="space-y-3">
                      {decisionRows.map((decision) => (
                        <div key={decision._id} className="rounded-xl border border-slate-200 p-4">
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="rounded bg-blue-50 px-2 py-0.5 font-semibold text-blue-700">
                              Score {decision.score}
                            </span>
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700">
                              {decision.visibility}
                            </span>
                            <span className="text-slate-500">by {decision.evaluatorName}</span>
                            {decision.targetUserName ? (
                              <span className="text-slate-500">target: {decision.targetUserName}</span>
                            ) : null}
                          </div>
                          <p className="mt-2 text-sm text-slate-700">{decision.reason}</p>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            {decision.canCurrentUserSetEvaluatorConsent ? (
                              <button
                                type="button"
                                disabled={settingConsentId === decision._id}
                                onClick={async () => {
                                  setSettingConsentId(decision._id);
                                  setDecisionFeedback(null);
                                  try {
                                    await setEvaluatorPublishConsent({
                                      decisionId: decision._id,
                                      consent: !(decision.publishConsentByEvaluator ?? false),
                                    });
                                  } catch (error) {
                                    const message =
                                      error instanceof Error
                                        ? error.message
                                        : "公開同意の更新に失敗しました";
                                    setDecisionFeedback(message);
                                  } finally {
                                    setSettingConsentId(null);
                                  }
                                }}
                                className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                公開同意（評価者）: {(decision.publishConsentByEvaluator ?? false) ? "ON" : "OFF"}
                              </button>
                            ) : null}

                            {decision.canCurrentUserSetTargetConsent ? (
                              <button
                                type="button"
                                disabled={settingConsentId === decision._id}
                                onClick={async () => {
                                  setSettingConsentId(decision._id);
                                  setDecisionFeedback(null);
                                  try {
                                    await setTargetPublishConsent({
                                      decisionId: decision._id,
                                      consent: !(decision.publishConsentByTarget ?? false),
                                    });
                                  } catch (error) {
                                    const message =
                                      error instanceof Error
                                        ? error.message
                                        : "公開同意の更新に失敗しました";
                                    setDecisionFeedback(message);
                                  } finally {
                                    setSettingConsentId(null);
                                  }
                                }}
                                className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                公開同意（対象者）: {(decision.publishConsentByTarget ?? false) ? "ON" : "OFF"}
                              </button>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}

              {decisionFeedback ? (
                <div className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {decisionFeedback}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-600">
              Roomを選択してください。
            </div>
          )}
        </section>

        <aside className="lg:col-span-4">
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-bold text-slate-900">Roadmap Status</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>v2 Public: enabled</li>
                <li>v2 Room: enabled</li>
                <li>v2 Billing: service layer</li>
                <li>Legacy features: bridge mode</li>
                <li>
                  Metrics: members={roomMetrics?.memberCount ?? 0}, threads={roomMetrics?.threadCount ?? 0},
                  evaluations={roomMetrics?.evaluationCount ?? 0}
                </li>
              </ul>
            </div>

            {isWeightsV2Enabled() ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-bold text-slate-900">Weight Profile</h2>
                <div className="mt-3 space-y-2 text-sm text-slate-700">
                  <p>Global Weight: {myWeightProfile?.globalWeight ?? 1}</p>
                  <p>Credibility: {myWeightProfile?.globalCredibilityScore ?? 50}</p>
                  <label className="flex items-center gap-2 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={myWeightProfile?.publicProfileEnabled ?? false}
                      onChange={async (event) => {
                        try {
                          await setMyWeightProfileVisibility({
                            publicProfileEnabled: event.target.checked,
                          });
                        } catch (error) {
                          const message =
                            error instanceof Error
                              ? error.message
                              : "公開設定の更新に失敗しました";
                          setDecisionFeedback(message);
                        }
                      }}
                    />
                    実績（信憑性）をプロフィールで公開
                  </label>
                </div>

                {selectedRoom?.myRole === "owner" && effectiveRoomId ? (
                  <div className="mt-4 border-t border-slate-200 pt-4">
                    <h3 className="text-sm font-semibold text-slate-900">プロジェクト別重み設定</h3>
                    <div className="mt-2 space-y-2">
                      <select
                        value={overrideUserId}
                        onChange={(event) =>
                          setOverrideUserId(event.target.value as Id<"users"> | "")
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      >
                        <option value="">ユーザーを選択</option>
                        {roomMembersRows.map((member) => (
                          <option key={member._id} value={member.userId}>
                            {member.userName} ({member.role})
                          </option>
                        ))}
                      </select>
                      <input
                        value={overrideWeight}
                        onChange={(event) => setOverrideWeight(event.target.value)}
                        placeholder="重み (0.5 - 2.5)"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                      <input
                        value={overrideReason}
                        onChange={(event) => setOverrideReason(event.target.value)}
                        placeholder="理由（任意）"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                      <button
                        type="button"
                        disabled={workingAction === "weight_override"}
                        onClick={handleApplyWeightOverride}
                        className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {workingAction === "weight_override" ? "保存中..." : "重みを保存"}
                      </button>
                    </div>
                    <div className="mt-3 space-y-1 text-xs text-slate-500">
                      {weightOverrideRows.length === 0 ? (
                        <p>オーバーライド未設定</p>
                      ) : (
                        weightOverrideRows.map((override) => (
                          <p key={override._id}>
                            {override.userId}: {override.projectWeight}
                          </p>
                        ))
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {isPayoutsV1Enabled() ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-bold text-slate-900">Payout Methods</h2>
                <div className="mt-3 space-y-3">
                  <button
                    type="button"
                    disabled={workingAction === "stripe_onboard"}
                    onClick={handleStripeOnboard}
                    className="w-full rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {workingAction === "stripe_onboard"
                      ? "Stripe連携中..."
                      : "Stripe Connectを連携"}
                  </button>

                  <div className="space-y-2 rounded-lg border border-slate-200 p-3">
                    <p className="text-xs font-semibold text-slate-700">
                      銀行口座を登録（試用フェーズ）
                    </p>
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
                      className="w-full rounded bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {workingAction === "bank_register" ? "登録中..." : "銀行口座を保存"}
                    </button>
                  </div>

                  <div className="space-y-2 rounded-lg border border-slate-200 p-3">
                    <p className="text-xs font-semibold text-slate-700">登録済みの受取口座</p>
                    {payoutAccounts.length === 0 ? (
                      <p className="text-xs text-slate-500">受取口座はまだ登録されていません</p>
                    ) : (
                      payoutAccounts.map((account) => {
                        const label =
                          account.method === "bank_account"
                            ? `${account.bankName ?? "銀行"} / ****${account.accountLast4 ?? "----"}`
                            : `Stripe Connect / ${account.externalRef ?? "未連携"}`;
                        return (
                          <div
                            key={account._id}
                            className="rounded border border-slate-200 bg-slate-50 p-2"
                          >
                            <p className="text-xs font-medium text-slate-700">{label}</p>
                            <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                              <span>{account.status}</span>
                              {account.isDefault ? (
                                <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-700">
                                  default
                                </span>
                              ) : null}
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
                    {accountCopiedMessage ? (
                      <p className="text-[11px] text-slate-500">{accountCopiedMessage}</p>
                    ) : null}
                  </div>

                  <div className="space-y-2 rounded-lg border border-slate-200 p-3">
                    <p className="text-xs font-semibold text-slate-700">送金リクエスト</p>
                    <select
                      value={payoutRecipientUserId}
                      onChange={(event) =>
                        setPayoutRecipientUserId(event.target.value as Id<"users"> | "")
                      }
                      className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                    >
                      <option value="">自分宛て</option>
                      {roomMembersRows.map((member) => (
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
                      onChange={(event) =>
                        setPayoutMethod(event.target.value as "stripe_connect" | "bank_account")
                      }
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
                      className="w-full rounded bg-green-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {workingAction === "payout_request"
                        ? "登録中..."
                        : "送金リクエストを作成"}
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  <p>登録口座数: {payoutAccounts.length}</p>
                  <p>送金台帳件数: {payoutLedgerRows.length}</p>
                  {missingPayoutRows.length > 0 ? (
                    <p className="text-amber-700">
                      送金方法未登録メンバー:{" "}
                      {missingPayoutRows.map((row) => row.userName).join(", ")}
                    </p>
                  ) : (
                    <p className="text-green-700">全メンバーが送金方法を登録済み</p>
                  )}
                  {payoutMessage ? <p>{payoutMessage}</p> : null}
                </div>
              </div>
            ) : null}

            {isV2LegacyHubEnabled() ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-amber-900">Legacy Hub</h3>
                    <p className="mt-1 text-xs text-amber-700">DM / Connections / items系を互換運用します。</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowLegacyHub((prev) => !prev)}
                    className="rounded-md bg-amber-200 px-2.5 py-1 text-xs font-semibold text-amber-900"
                  >
                    {showLegacyHub ? "Hide" : "Open"}
                  </button>
                </div>
              </div>
            ) : null}

            {showLegacyHub ? <LegacyHub /> : null}
          </div>
        </aside>
      </main>

      {isDecisionV2Enabled() && selectedRoom && effectiveThreadId ? (
        <DecisionModal
          isOpen={isDecisionModalOpen}
          onClose={() => setIsDecisionModalOpen(false)}
          roomId={selectedRoom._id}
          threadId={effectiveThreadId}
          language="ja"
          onError={(message) => setDecisionFeedback(message)}
          onSuccess={(message) => setDecisionFeedback(message)}
        />
      ) : null}
    </div>
  );
}
