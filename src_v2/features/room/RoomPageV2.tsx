"use client";

import Link from "next/link";
import {
  ClipboardEvent,
  Dispatch,
  SetStateAction,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import PaywallBanner from "@/components/room/PaywallBanner";
import RoomSelector from "@/components/room/RoomSelector";
import HomeScreenAddGuide from "@/components/room/HomeScreenAddGuide";
import RoomAccountControls from "@/components/room/RoomAccountControls";
import { isPayoutsV1Enabled } from "@/lib/featureFlags";
import { BANK_OPTIONS, filterBankOptions, findBankOptionByCode } from "./bankOptions";

type BankAccountType = "ordinary" | "checking" | "savings";

function getBankAccountTypeLabel(accountType?: BankAccountType) {
  if (accountType === "checking") return "当座";
  if (accountType === "savings") return "貯蓄";
  return "普通";
}

function formatCurrencyYen(value: number) {
  return `¥${Math.max(0, Math.round(value)).toLocaleString("ja-JP")}`;
}

async function handleImagePasteToField(
  event: ClipboardEvent<HTMLTextAreaElement>,
  setField: Dispatch<SetStateAction<string>>,
  createImageUploadUrl: (args: Record<string, never>) => Promise<string>,
  resolveImageUrl: (args: { storageId: Id<"_storage"> }) => Promise<string>,
  onError: (message: string) => void,
  onUploading?: (uploading: boolean) => void
) {
  const imageItem = Array.from(event.clipboardData?.items ?? []).find((item) =>
    item.type.startsWith("image/")
  );
  if (!imageItem) {
    return;
  }
  const imageFile = imageItem.getAsFile();
  if (!imageFile) {
    onError("画像の取得に失敗しました");
    return;
  }
  if (imageFile.size > 10_000_000) {
    onError("画像サイズは10MB以下にしてください");
    event.preventDefault();
    return;
  }

  event.preventDefault();
  const target = event.currentTarget;
  const start = target.selectionStart ?? target.value.length;
  const end = target.selectionEnd ?? start;

  onUploading?.(true);
  try {
    const uploadUrl = await createImageUploadUrl({});
    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": imageFile.type || "application/octet-stream" },
      body: imageFile,
    });
    if (!uploadResponse.ok) {
      throw new Error("画像アップロードに失敗しました");
    }
    const uploadPayload = (await uploadResponse.json()) as { storageId?: string };
    if (!uploadPayload.storageId) {
      throw new Error("アップロード結果が不正です");
    }
    const imageUrl = await resolveImageUrl({
      storageId: uploadPayload.storageId as Id<"_storage">,
    });
    const inserted = `${start > 0 ? "\n" : ""}${imageUrl}\n`;
    setField((previous) => `${previous.slice(0, start)}${inserted}${previous.slice(end)}`);
  } catch {
    onError("画像の貼り付けに失敗しました");
  } finally {
    onUploading?.(false);
  }
}

export default function RoomPageV2() {
  const { user } = useUser();
  const [isUserReady, setIsUserReady] = useState(false);

  const roomsQuery = useQuery(api.rooms.listRoomsForMe, isUserReady ? {} : "skip");
  const rooms = useMemo(() => roomsQuery ?? [], [roomsQuery]);

  const createUserMutation = useMutation(api.users.createUser);
  const createThreadV2 = useMutation(api.v2Room.createThreadV2);
  const createImageUploadUrl = useMutation(api.uploads.createImageUploadUrl);
  const resolveImageUrl = useMutation(api.uploads.resolveImageUrl);

  const [selectedRoomId, setSelectedRoomId] = useState<Id<"rooms"> | null>(null);
  const [threadTitle, setThreadTitle] = useState("");
  const [threadBody, setThreadBody] = useState("");
  const [isThreadComposerOpen, setIsThreadComposerOpen] = useState(false);
  const [creatingThread, setCreatingThread] = useState(false);
  const [threadImageUploading, setThreadImageUploading] = useState(false);
  const [threadError, setThreadError] = useState<string | null>(null);
  const [showArchivedThreads, setShowArchivedThreads] = useState(false);
  const [uiFeedback, setUiFeedback] = useState<string | null>(null);

  const [payoutMessage, setPayoutMessage] = useState<string | null>(null);
  const [payoutAmount, setPayoutAmount] = useState("1000");
  const [payoutMethod, setPayoutMethod] = useState<"stripe_connect" | "bank_account">(
    "bank_account"
  );
  const [payoutRecipientUserId, setPayoutRecipientUserId] = useState<Id<"users"> | "">("");
  const [payoutNote, setPayoutNote] = useState("");
  const [bankSearchInput, setBankSearchInput] = useState("");
  const [bankCodeInput, setBankCodeInput] = useState("");
  const [bankNameInput, setBankNameInput] = useState("");
  const [branchCodeInput, setBranchCodeInput] = useState("");
  const [branchNameInput, setBranchNameInput] = useState("");
  const [accountTypeInput, setAccountTypeInput] = useState<BankAccountType>("ordinary");
  const [accountNumberInput, setAccountNumberInput] = useState("");
  const [accountHolderNameInput, setAccountHolderNameInput] = useState("");
  const [onlineBankingUrlInput, setOnlineBankingUrlInput] = useState("");
  const [reportLedgerNote, setReportLedgerNote] = useState("");
  const [workingAction, setWorkingAction] = useState<string | null>(null);
  const [accountCopiedMessage, setAccountCopiedMessage] = useState<string | null>(null);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!user?.id) {
      setIsUserReady(false);
      return;
    }

    const ensureUser = async () => {
      try {
        await createUserMutation({
          userId: user.id,
          name: user.fullName ?? user.firstName ?? undefined,
          role: "human",
        });
      } catch {
        // 失敗時もUIクラッシュを避けるため読み込みは進める
      } finally {
        if (!cancelled) {
          setIsUserReady(true);
        }
      }
    };

    void ensureUser();
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.fullName, user?.firstName, createUserMutation]);

  const effectiveRoomId = selectedRoomId ?? rooms[0]?._id ?? null;
  const selectedRoom = useMemo(
    () => (effectiveRoomId ? rooms.find((room) => room._id === effectiveRoomId) ?? null : null),
    [effectiveRoomId, rooms]
  );

  const roomThreadsQuery = useQuery(
    api.threads.listThreads,
    isUserReady && effectiveRoomId ? { roomId: effectiveRoomId } : "skip"
  );
  const roomThreads = useMemo(() => roomThreadsQuery ?? [], [roomThreadsQuery]);

  const myPayoutAccounts = useQuery(
    api.payouts.listMyPayoutAccounts,
    isUserReady ? {} : "skip"
  ) ?? [];
  const membersMissingPayout =
    useQuery(
      api.payouts.listMembersMissingPayoutMethod,
      isUserReady && effectiveRoomId ? { roomId: effectiveRoomId } : "skip"
    ) ??
    [];
  const roomPayoutLedger =
    useQuery(
      api.payouts.listRoomPayoutLedger,
      isUserReady && effectiveRoomId ? { roomId: effectiveRoomId } : "skip"
    ) ?? [];
  const roomPayoutDestinations =
    useQuery(
      api.payouts.listRoomPayoutDestinations,
      isUserReady && effectiveRoomId ? { roomId: effectiveRoomId } : "skip"
    ) ?? [];

  const isActiveRoom = selectedRoom?.status === "active";

  const activeThreads = useMemo(
    () => roomThreads.filter((thread) => !thread.archivedAt),
    [roomThreads]
  );
  const archivedThreads = useMemo(
    () => roomThreads.filter((thread) => Boolean(thread.archivedAt)),
    [roomThreads]
  );
  const bankCandidates = useMemo(
    () => filterBankOptions(bankSearchInput).slice(0, 8),
    [bankSearchInput]
  );
  const selectedRecipient = useMemo(() => {
    if (!payoutRecipientUserId) return null;
    return roomPayoutDestinations.find((row) => row.userId === payoutRecipientUserId) ?? null;
  }, [payoutRecipientUserId, roomPayoutDestinations]);
  const recipientBankAccount = selectedRecipient?.payoutAccount ?? null;
  const recipientBankOption = findBankOptionByCode(recipientBankAccount?.bankCode);
  const recipientOnlineBankingUrl =
    recipientBankAccount?.onlineBankingUrl ?? recipientBankOption?.onlineBankingUrl ?? "";
  const myBankAccountTemplates = useMemo(() => {
    return myPayoutAccounts
      .filter((account) => account.method === "bank_account")
      .map((account) => {
        const bankLabel =
          account.bankCode && account.bankName
            ? `${account.bankName} (${account.bankCode})`
            : account.bankName ?? "銀行未設定";
        const branchLabel =
          account.branchName || account.branchCode
            ? `${account.branchName ?? "支店"}${account.branchCode ? ` (${account.branchCode})` : ""}`
            : "支店未設定";
        return {
          id: account._id,
          summary: `${bankLabel} / ${branchLabel} / ${getBankAccountTypeLabel(account.accountType)} / ****${account.accountLast4 ?? "----"}`,
          template: [
            `銀行名: ${account.bankName ?? ""}`,
            `銀行コード: ${account.bankCode ?? ""}`,
            `支店名: ${account.branchName ?? ""}`,
            `支店コード: ${account.branchCode ?? ""}`,
            `口座種別: ${getBankAccountTypeLabel(account.accountType)}`,
            `口座番号: ${account.accountNumber ?? ""}`,
            `口座名義(カナ): ${account.accountHolderName ?? ""}`,
          ].join("\n"),
        };
      });
  }, [myPayoutAccounts]);
  const pendingLedgerForSelectedRecipient = useMemo(() => {
    if (!selectedRecipient?.userId) return null;
    const candidates = roomPayoutLedger
      .filter(
        (row) =>
          row.recipientUserId === selectedRecipient.userId &&
          (row.status === "pending" || row.status === "requires_method" || row.status === "ready")
      )
      .sort((a, b) => b.createdAt - a.createdAt);
    return candidates[0] ?? null;
  }, [roomPayoutLedger, selectedRecipient]);

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
    const accountNumber = accountNumberInput.replace(/[^0-9]/g, "");
    if (!bankNameInput.trim() || accountNumber.length < 4 || accountNumber.length > 8) {
      setPayoutMessage("銀行名と口座番号（4〜8桁）を入力してください");
      return;
    }
    if (bankCodeInput && !/^[0-9]{4}$/.test(bankCodeInput)) {
      setPayoutMessage("銀行コードは4桁で入力してください");
      return;
    }
    if (branchCodeInput && !/^[0-9]{3}$/.test(branchCodeInput)) {
      setPayoutMessage("支店コードは3桁で入力してください");
      return;
    }

    setWorkingAction("bank_register");
    setPayoutMessage(null);
    try {
      await postJson("/api/payouts/bank/register", {
        bankCode: bankCodeInput.trim() || undefined,
        bankName: bankNameInput.trim(),
        branchName: branchNameInput.trim() || undefined,
        branchCode: branchCodeInput.trim() || undefined,
        accountType: accountTypeInput,
        accountNumber,
        accountHolderName: accountHolderNameInput.trim() || undefined,
        onlineBankingUrl: onlineBankingUrlInput.trim() || undefined,
      });
      setPayoutMessage("銀行口座を登録しました。送金テンプレートが更新されました");
      setBranchCodeInput("");
      setBranchNameInput("");
      setAccountNumberInput("");
      setAccountHolderNameInput("");
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

  const handleSelectBank = (bank: (typeof BANK_OPTIONS)[number]) => {
    setBankCodeInput(bank.code);
    setBankNameInput(bank.name);
    setOnlineBankingUrlInput(bank.onlineBankingUrl ?? "");
    setBankSearchInput(bank.name);
  };

  const buildRecipientTransferTemplate = () => {
    if (!selectedRecipient || !recipientBankAccount) {
      return "";
    }
    return [
      `受取人: ${selectedRecipient.userName}`,
      `銀行名: ${recipientBankAccount.bankName ?? ""}`,
      `銀行コード: ${recipientBankAccount.bankCode ?? ""}`,
      `支店名: ${recipientBankAccount.branchName ?? ""}`,
      `支店コード: ${recipientBankAccount.branchCode ?? ""}`,
      `口座種別: ${getBankAccountTypeLabel(recipientBankAccount.accountType as BankAccountType)}`,
      `口座番号: ${recipientBankAccount.accountNumber ?? ""}`,
      `口座名義(カナ): ${recipientBankAccount.accountHolderName ?? ""}`,
    ].join("\n");
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

  const handleOpenOnlineBanking = () => {
    if (!recipientOnlineBankingUrl) {
      setPayoutMessage("この銀行のネットバンクURLが未設定です");
      return;
    }
    window.open(recipientOnlineBankingUrl, "_blank", "noopener,noreferrer");
  };

  const handleReportTransfer = async () => {
    if (!pendingLedgerForSelectedRecipient?._id) {
      setPayoutMessage("報告対象の送金リクエストが見つかりません");
      return;
    }
    setWorkingAction("report_transfer");
    setPayoutMessage(null);
    try {
      await postJson("/api/payouts/report-transfer", {
        ledgerId: pendingLedgerForSelectedRecipient._id,
        note: reportLedgerNote.trim() || undefined,
      });
      setReportLedgerNote("");
      setPayoutMessage("送金完了報告を登録しました（管理確認待ち）");
    } catch (error) {
      const message = error instanceof Error ? error.message : "送金完了報告に失敗しました";
      setPayoutMessage(message);
    } finally {
      setWorkingAction(null);
    }
  };

  const inviteUrl =
    selectedRoom?.isPrivate && selectedRoom?.inviteCode
      ? `${typeof window !== "undefined" ? window.location.origin : ""}/room?invite=${selectedRoom.inviteCode}`
      : null;

  const handleCopyInvite = async () => {
    if (!inviteUrl || !navigator?.clipboard) {
      setInviteMessage("招待リンクをコピーできませんでした");
      return;
    }
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setInviteMessage("招待リンクをコピーしました");
    } catch {
      setInviteMessage("招待リンクのコピーに失敗しました");
    }
  };

  const handleShareInvite = async () => {
    if (!inviteUrl) {
      setInviteMessage("このRoomは招待リンクが未設定です");
      return;
    }
    try {
      if (navigator?.share) {
        await navigator.share({
          title: "FunFund Room 招待",
          text: "Roomに参加してください",
          url: inviteUrl,
        });
        setInviteMessage("共有しました");
        return;
      }
      await handleCopyInvite();
    } catch {
      setInviteMessage("共有をキャンセルしました");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f7fbff] via-[#f9f8ff] to-[#f8fafb]">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-[1700px] items-start justify-between gap-4 px-4 py-3 md:px-6">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-blue-700">FunFund Room</h1>
            <p className="text-xs text-slate-500">For Practical Decision</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <RoomAccountControls />
            <RoomSelector
              selectedRoomId={selectedRoomId}
              onSelectRoom={setSelectedRoomId}
              language="ja"
              onCreateRoom={() => {}}
            />
            {selectedRoom?.isPrivate && selectedRoom?.inviteCode ? (
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCopyInvite}
                  className="rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  招待リンクをコピー
                </button>
                <button
                  type="button"
                  onClick={handleShareInvite}
                  className="rounded border border-blue-300 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                >
                  共有（DMへ）
                </button>
              </div>
            ) : null}
            <HomeScreenAddGuide targetPath="/room" />
            {inviteMessage ? <p className="text-xs text-slate-500">{inviteMessage}</p> : null}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1700px] px-4 py-8 md:px-6">
        {!isUserReady ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-600">
            読み込み中...
          </div>
        ) : !effectiveRoomId || !selectedRoom ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-600">
            Roomを作成するか、既存のRoomを選択してください。
          </div>
        ) : (
          <div className="space-y-6">
            {!isActiveRoom ? (
              <PaywallBanner roomStatus={selectedRoom.status} roomId={selectedRoom._id} language="ja" />
            ) : null}

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">企画</h2>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setThreadError(null);
                      setIsThreadComposerOpen((prev) => !prev);
                    }}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 font-semibold text-white transition hover:bg-blue-700"
                  >
                    {isThreadComposerOpen ? "スレッド作成を閉じる" : "＋ スレッドを作成"}
                  </button>
                  <span className="rounded bg-blue-50 px-2.5 py-1 font-semibold text-blue-700">
                    課題 {activeThreads.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowArchivedThreads((prev) => !prev)}
                    className="rounded border border-slate-300 bg-white px-2.5 py-1 font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    {showArchivedThreads
                      ? `達成！を隠す (${archivedThreads.length})`
                      : `達成！ (${archivedThreads.length})`}
                  </button>
                </div>
              </div>

              {activeThreads.length === 0 ? (
                <p className="py-10 text-sm text-slate-500">未達成の課題スレッドはありません。</p>
              ) : (
                <div className="space-y-3">
                  {activeThreads.map((thread) => (
                    <Link
                      key={thread._id}
                      href={`/room/${selectedRoom._id}/thread/${thread._id}`}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-5 text-left transition hover:border-slate-300 hover:shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="line-clamp-2 text-2xl font-black text-slate-900">{thread.title ?? "Untitled"}</p>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          企画
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          コミット {formatCurrencyYen(thread.commitmentTotal ?? 0)}
                          {thread.commitmentGoalAmount
                            ? ` / ${formatCurrencyYen(thread.commitmentGoalAmount)}`
                            : ""}
                        </span>
                        {thread.commitmentCount ? (
                          <span className="rounded bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                            支援者 {thread.commitmentCount}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-4 text-xs text-slate-500">
                        作成: {new Date(thread.createdAt).toLocaleString("ja-JP")}
                      </p>
                    </Link>
                  ))}
                </div>
              )}

              {showArchivedThreads ? (
                <div className="mt-6 border-t border-slate-200 pt-4">
                  <p className="mb-2 text-sm font-semibold text-slate-800">達成！</p>
                  {archivedThreads.length === 0 ? (
                    <p className="text-sm text-slate-500">達成済みスレッドはありません。</p>
                  ) : (
                    <div className="space-y-2">
                      {archivedThreads.map((thread) => (
                        <Link
                          key={thread._id}
                          href={`/room/${selectedRoom._id}/thread/${thread._id}`}
                          className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-left text-sm transition hover:border-slate-300"
                        >
                          <p className="truncate font-semibold text-slate-900">{thread.title ?? "Untitled"}</p>
                          <p className="text-xs text-slate-500">達成済み</p>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </section>

            {isThreadComposerOpen ? (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">スレッド作成</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsThreadComposerOpen(false)}
                    className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    閉じる
                  </button>
                </div>

                <div className="space-y-3">
                  <p className="rounded bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">企画</p>
                  <input
                    value={threadTitle}
                    onChange={(event) => setThreadTitle(event.target.value)}
                    placeholder="議題タイトル"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <textarea
                  value={threadBody}
                  onChange={(event) => setThreadBody(event.target.value)}
                  onPaste={(event) =>
                    void handleImagePasteToField(
                      event,
                      setThreadBody,
                      createImageUploadUrl,
                      resolveImageUrl,
                      setUiFeedback,
                      setThreadImageUploading
                    )
                  }
                  placeholder="理由・背景・論点（必須）"
                  className="mt-3 min-h-32 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base leading-relaxed"
                />
                <p className="mt-2 text-xs text-slate-500">
                  画像を貼り付けると自動でアップロードされます。
                </p>
                {threadImageUploading ? (
                  <p className="text-xs font-semibold text-blue-700">画像をアップロード中...</p>
                ) : null}

                {threadError ? <p className="mt-2 text-sm text-red-600">{threadError}</p> : null}
                <button
                  type="button"
                  disabled={
                    !isActiveRoom ||
                    creatingThread ||
                    threadImageUploading ||
                    !threadBody.trim() ||
                    !threadTitle.trim()
                  }
                  onClick={async () => {
                    if (!effectiveRoomId) return;
                    setCreatingThread(true);
                    setThreadError(null);
                    try {
                      const newThreadId = await createThreadV2({
                        roomId: effectiveRoomId,
                        type: "proposal",
                        title: threadTitle.trim(),
                        initialBody: "スレッドを開始しました。",
                        reason: threadBody.trim(),
                      });

                      setThreadTitle("");
                      setThreadBody("");
                      setIsThreadComposerOpen(false);
                      setUiFeedback("スレッドを作成しました");

                      window.location.href = `/room/${effectiveRoomId}/thread/${newThreadId}`;
                    } catch (error) {
                      const message = error instanceof Error ? error.message : "Thread creation failed";
                      setThreadError(message);
                    } finally {
                      setCreatingThread(false);
                    }
                  }}
                  className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creatingThread ? "作成中..." : "この内容で作成"}
                </button>
              </section>
            ) : null}

            {isPayoutsV1Enabled() ? (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <details>
                  <summary className="cursor-pointer text-sm font-semibold text-slate-800">
                    振込導線（銀行アプリ / ネットバンク）
                  </summary>
                  <p className="mt-2 text-xs text-slate-500">
                    Room名: {selectedRoom.name} / 役割: {selectedRoom.myRole}
                    {selectedRoom.isPrivate && selectedRoom.inviteCode
                      ? ` / 招待コード: ${selectedRoom.inviteCode}`
                      : ""}
                  </p>

                  <div className="mt-4 space-y-4">
                    <button
                      type="button"
                      disabled={workingAction === "stripe_onboard"}
                      onClick={handleStripeOnboard}
                      className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {workingAction === "stripe_onboard" ? "Stripe連携中..." : "Stripe Connectを連携"}
                    </button>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="space-y-2 rounded-lg border border-slate-200 p-3">
                        <p className="text-xs font-semibold text-slate-700">銀行口座を登録（振込先）</p>
                        <input
                          value={bankSearchInput}
                          onChange={(event) => setBankSearchInput(event.target.value)}
                          placeholder="銀行名で検索（例: みずほ / MUFG / 0009）"
                          className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                        />
                        <div className="flex flex-wrap gap-2">
                          {bankCandidates.map((bank) => (
                            <button
                              key={bank.code}
                              type="button"
                              onClick={() => handleSelectBank(bank)}
                              className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100"
                            >
                              {bank.name} ({bank.code})
                            </button>
                          ))}
                        </div>
                        <div className="grid gap-2 md:grid-cols-2">
                          <input
                            value={bankCodeInput}
                            onChange={(event) => setBankCodeInput(event.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
                            placeholder="銀行コード (4桁)"
                            className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                          />
                          <input
                            value={bankNameInput}
                            onChange={(event) => setBankNameInput(event.target.value)}
                            placeholder="銀行名"
                            className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                          />
                        </div>
                        <div className="grid gap-2 md:grid-cols-2">
                          <input
                            value={branchCodeInput}
                            onChange={(event) => setBranchCodeInput(event.target.value.replace(/[^0-9]/g, "").slice(0, 3))}
                            placeholder="支店コード (3桁)"
                            className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                          />
                          <input
                            value={branchNameInput}
                            onChange={(event) => setBranchNameInput(event.target.value)}
                            placeholder="支店名"
                            className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                          />
                        </div>
                        <div className="grid gap-2 md:grid-cols-2">
                          <select
                            value={accountTypeInput}
                            onChange={(event) => setAccountTypeInput(event.target.value as BankAccountType)}
                            className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                          >
                            <option value="ordinary">普通</option>
                            <option value="checking">当座</option>
                            <option value="savings">貯蓄</option>
                          </select>
                          <input
                            value={accountNumberInput}
                            onChange={(event) => setAccountNumberInput(event.target.value.replace(/[^0-9]/g, "").slice(0, 8))}
                            placeholder="口座番号 (4〜8桁)"
                            className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                          />
                        </div>
                        <input
                          value={accountHolderNameInput}
                          onChange={(event) => setAccountHolderNameInput(event.target.value)}
                          placeholder="口座名義（カナ）"
                          className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                        />
                        <input
                          value={onlineBankingUrlInput}
                          onChange={(event) => setOnlineBankingUrlInput(event.target.value)}
                          placeholder="ネットバンクURL（任意）"
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
                        <p className="text-xs font-semibold text-slate-700">自分の振込テンプレート</p>
                        {myBankAccountTemplates.length === 0 ? (
                          <p className="text-xs text-slate-500">
                            銀行口座を登録すると、ここから1タップでテンプレートコピーできます
                          </p>
                        ) : (
                          myBankAccountTemplates.map((row) => (
                            <div key={row.id} className="rounded border border-slate-200 bg-slate-50 p-2">
                              <p className="text-xs font-medium text-slate-700">{row.summary}</p>
                              <button
                                type="button"
                                onClick={() => handleCopyAccountInfo(row.template)}
                                className="mt-2 rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100"
                              >
                                振込テンプレをコピー
                              </button>
                            </div>
                          ))
                        )}
                        {accountCopiedMessage ? (
                          <p className="text-[11px] text-slate-500">{accountCopiedMessage}</p>
                        ) : null}
                      </div>
                    </div>

                    <div className="space-y-3 rounded-lg border border-slate-200 p-3">
                      <p className="text-xs font-semibold text-slate-700">送金先を選ぶ</p>
                      <select
                        value={payoutRecipientUserId}
                        onChange={(event) => setPayoutRecipientUserId(event.target.value as Id<"users"> | "")}
                        className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                      >
                        <option value="">自分宛て</option>
                        {roomPayoutDestinations.map((member) => (
                          <option key={member.userId} value={member.userId}>
                            {member.userName} ({member.role})
                          </option>
                        ))}
                      </select>

                      {selectedRecipient ? (
                        <div className="rounded border border-blue-200 bg-blue-50/60 p-3">
                          <p className="text-sm font-semibold text-slate-900">
                            {selectedRecipient.userName} の振込先
                          </p>
                          {recipientBankAccount?.method === "bank_account" ? (
                            <div className="mt-2 space-y-2 text-xs text-slate-700">
                              <p>銀行: {recipientBankAccount.bankName ?? "-"} ({recipientBankAccount.bankCode ?? "-"})</p>
                              <p>支店: {recipientBankAccount.branchName ?? "-"} ({recipientBankAccount.branchCode ?? "-"})</p>
                              <p>種別: {getBankAccountTypeLabel(recipientBankAccount.accountType as BankAccountType)}</p>
                              <p>口座番号: {recipientBankAccount.accountNumber ?? "-"}</p>
                              <p>名義(カナ): {recipientBankAccount.accountHolderName ?? "-"}</p>
                              <div className="flex flex-wrap gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleCopyAccountInfo(buildRecipientTransferTemplate())}
                                  className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100"
                                >
                                  振込情報を一括コピー
                                </button>
                                {recipientOnlineBankingUrl ? (
                                  <button
                                    type="button"
                                    onClick={handleOpenOnlineBanking}
                                    className="rounded border border-blue-300 bg-blue-100 px-2 py-1 text-[11px] font-semibold text-blue-700 transition hover:bg-blue-200"
                                  >
                                    ネットバンクを開く
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          ) : (
                            <p className="mt-2 text-xs text-slate-600">
                              銀行口座が未登録です。相手に振込先登録を依頼してください。
                            </p>
                          )}
                        </div>
                      ) : null}
                    </div>

                    <div className="space-y-2 rounded-lg border border-slate-200 p-3">
                      <p className="text-xs font-semibold text-slate-700">送金リクエストを作成（台帳化）</p>
                      <div className="grid gap-2 md:grid-cols-2">
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
                      </div>
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

                    <div className="space-y-2 rounded-lg border border-slate-200 p-3">
                      <p className="text-xs font-semibold text-slate-700">送金完了報告</p>
                      {pendingLedgerForSelectedRecipient ? (
                        <>
                          <p className="text-xs text-slate-600">
                            最新台帳: {pendingLedgerForSelectedRecipient.amount.toLocaleString("ja-JP")}円 / status: {pendingLedgerForSelectedRecipient.status}
                          </p>
                          <input
                            value={reportLedgerNote}
                            onChange={(event) => setReportLedgerNote(event.target.value)}
                            className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                            placeholder="振込日時・メモ（任意）"
                          />
                          <button
                            type="button"
                            disabled={workingAction === "report_transfer"}
                            onClick={handleReportTransfer}
                            className="rounded bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {workingAction === "report_transfer" ? "報告中..." : "送金完了を報告"}
                          </button>
                        </>
                      ) : (
                        <p className="text-xs text-slate-500">
                          先に送金先を選んで、送金リクエストを作成してください。
                        </p>
                      )}
                    </div>

                    <div className="space-y-1 text-xs text-slate-600">
                      <p>登録口座数: {myPayoutAccounts.length}</p>
                      <p>Room内の振込先登録済み人数: {roomPayoutDestinations.filter((row) => row.payoutAccount).length}</p>
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
                </details>
              </section>
            ) : null}
          </div>
        )}
      </main>

      {uiFeedback ? (
        <div className="fixed bottom-5 right-5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm">
          {uiFeedback}
        </div>
      ) : null}
    </div>
  );
}
