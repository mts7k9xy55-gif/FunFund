"use client";

import Link from "next/link";
import {
  ClipboardEvent,
  ChangeEvent,
  Component,
  Dispatch,
  ErrorInfo,
  FormEvent,
  ReactNode,
  SetStateAction,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import RoomAccountControls from "@/components/room/RoomAccountControls";
import { BANK_OPTIONS, findBankOptionByCode } from "./bankOptions";

interface RoomThreadPageV2Props {
  roomId: string;
  threadId: string;
}

class ThreadPageErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // no-op: ユーザー向けにはfallbackのみ表示
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-[#f7fbff] via-[#f9f8ff] to-[#f8fafb] p-6">
          <div className="mx-auto w-full max-w-[980px] rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-900">スレッドを表示できませんでした</h2>
            <p className="mt-2 text-sm text-slate-600">
              読み込み中に問題が発生しました。部屋一覧から開き直してください。
            </p>
            <Link
              href="/room"
              className="mt-4 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              部屋に戻る
            </Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function formatMessageKind(kind: "comment" | "reason" | "execution") {
  if (kind === "reason") return "提案理由";
  if (kind === "execution") return "実行";
  return "返信";
}

type ReplyTone = "意見" | "反論" | "質問";

function parseReplyTone(body: string): { tone: ReplyTone | null; text: string } {
  const normalized = body.trim();
  const matched = normalized.match(/^【(意見|反論|質問)】\s*/);
  if (!matched) {
    return { tone: null, text: body };
  }
  return {
    tone: matched[1] as ReplyTone,
    text: normalized.slice(matched[0].length),
  };
}

function isImageUrl(url: string) {
  return /\.(png|jpe?g|gif|webp|svg|bmp|avif)(\?.*)?$/i.test(url);
}

function renderBodyWithLinks(body: string) {
  const imageMarkdownRegex = /!\[[^\]]*]\((https?:\/\/[^\s)]+)\)/g;
  const imageMatches = Array.from(body.matchAll(imageMarkdownRegex));
  if (imageMatches.length > 0) {
    const rendered: ReactNode[] = [];
    let cursor = 0;
    let keyIndex = 0;

    for (const match of imageMatches) {
      const fullMatch = match[0];
      const imageUrl = match[1];
      const start = match.index ?? 0;
      const end = start + fullMatch.length;

      if (start > cursor) {
        const before = body.slice(cursor, start);
        rendered.push(
          <span key={`md-text-${keyIndex++}`}>{renderBodyWithLinks(before)}</span>
        );
      }

      rendered.push(
        <span key={`md-image-${keyIndex++}`} className="my-3 block">
          <a href={imageUrl} target="_blank" rel="noreferrer noopener">
            <img
              src={imageUrl}
              alt="attachment"
              className="max-h-80 max-w-full rounded-lg border border-slate-200 object-contain"
            />
          </a>
        </span>
      );

      cursor = end;
    }

    if (cursor < body.length) {
      rendered.push(
        <span key={`md-text-${keyIndex++}`}>{renderBodyWithLinks(body.slice(cursor))}</span>
      );
    }

    return rendered;
  }

  const regex = /(https?:\/\/[^\s]+)/g;
  const elements: ReactNode[] = [];
  let lastIndex = 0;
  let index = 0;

  for (const match of body.matchAll(regex)) {
    const rawUrl = match[0];
    const start = match.index ?? 0;
    const end = start + rawUrl.length;

    if (start > lastIndex) {
      elements.push(<span key={`text-${index++}`}>{body.slice(lastIndex, start)}</span>);
    }

    const trailing = rawUrl.match(/[),.!?、。]+$/)?.[0] ?? "";
    const cleanUrl = trailing ? rawUrl.slice(0, rawUrl.length - trailing.length) : rawUrl;

    if (isImageUrl(cleanUrl)) {
      const mediaKey = `media-${index++}`;
      elements.push(
        <span key={mediaKey} className="my-3 block">
          <a
            href={cleanUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="mb-2 block text-sm underline decoration-blue-400 underline-offset-2 hover:text-blue-700"
          >
            {cleanUrl}
          </a>
          <a href={cleanUrl} target="_blank" rel="noreferrer noopener">
            <img
              src={cleanUrl}
              alt="attachment"
              className="max-h-80 max-w-full rounded-lg border border-slate-200 object-contain"
            />
          </a>
        </span>
      );
    } else {
      elements.push(
        <a
          key={`link-${index++}`}
          href={cleanUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="underline decoration-blue-400 underline-offset-2 hover:text-blue-700"
        >
          {cleanUrl}
        </a>
      );
    }

    if (trailing) {
      elements.push(<span key={`trail-${index++}`}>{trailing}</span>);
    }
    lastIndex = end;
  }

  if (lastIndex < body.length) {
    elements.push(<span key={`text-${index++}`}>{body.slice(lastIndex)}</span>);
  }

  return elements.length ? elements : [<span key="text-0">{body}</span>];
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
    const inserted = `${start > 0 ? "\n" : ""}![貼り付け画像](${imageUrl})\n`;
    setField((previous) => `${previous.slice(0, start)}${inserted}${previous.slice(end)}`);
  } catch {
    onError("画像の貼り付けに失敗しました");
  } finally {
    onUploading?.(false);
  }
}

async function handleImageFileToField(
  file: File,
  setField: Dispatch<SetStateAction<string>>,
  createImageUploadUrl: (args: Record<string, never>) => Promise<string>,
  resolveImageUrl: (args: { storageId: Id<"_storage"> }) => Promise<string>,
  onError: (message: string) => void,
  onUploading?: (uploading: boolean) => void
) {
  if (!file.type.startsWith("image/")) {
    onError("画像ファイルを選択してください");
    return;
  }
  if (file.size > 10_000_000) {
    onError("画像サイズは10MB以下にしてください");
    return;
  }

  onUploading?.(true);
  try {
    const uploadUrl = await createImageUploadUrl({});
    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
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
    setField((previous) => `${previous}${previous.trim() ? "\n" : ""}![添付画像](${imageUrl})\n`);
  } catch {
    onError("画像の添付に失敗しました");
  } finally {
    onUploading?.(false);
  }
}

function RoomThreadPageV2Content({ roomId, threadId }: RoomThreadPageV2Props) {
  const { user } = useUser();
  const router = useRouter();
  const [isUserReady, setIsUserReady] = useState(false);

  const roomIdAsId = roomId as Id<"rooms">;
  const threadIdAsId = threadId as Id<"threads">;
  type LocalThread = {
    _id: Id<"threads">;
    roomId: Id<"rooms">;
    title: string;
    createdAt: number;
    archivedAt?: number;
    commitmentGoalAmount?: number;
    decisionOwnerId?: Id<"users">;
    dueAt?: number;
    meetingUrl?: string;
    options?: string[];
  };

  const createUserMutation = useMutation(api.users.createUser);
  const postComment = useMutation(api.messages.postComment);
  const setMessageHidden = useMutation(api.messages.setMessageHidden);
  const deleteMessage = useMutation(api.messages.deleteMessage);
  const setThreadArchived = useMutation(api.threads.setThreadArchived);
  const deleteThread = useMutation(api.threads.deleteThread);
  const registerMyBankAccount = useMutation(api.payouts.registerMyBankAccount);
  const createImageUploadUrl = useMutation(api.uploads.createImageUploadUrl);
  const resolveImageUrl = useMutation(api.uploads.resolveImageUrl);

  const roomsForMe = useQuery(api.rooms.listRoomsForMe, isUserReady ? {} : "skip");
  const selectedRoom = useMemo(() => {
    if (roomsForMe === undefined) {
      return undefined;
    }
    return roomsForMe.find((room) => room._id === roomIdAsId) ?? null;
  }, [roomsForMe, roomIdAsId]);
  const selectedThread = useMemo(
    (): LocalThread => ({
      _id: threadIdAsId,
      roomId: roomIdAsId,
      title: "スレッド",
      createdAt: Date.now(),
      archivedAt: undefined,
      commitmentGoalAmount: undefined,
      decisionOwnerId: undefined,
      dueAt: undefined,
      meetingUrl: undefined,
      options: undefined,
    }),
    [threadIdAsId, roomIdAsId]
  );
  const threadMessagesQuery = useQuery(
    api.messages.listThreadMessages,
    isUserReady ? { threadId } : "skip"
  );
  const threadMessages = useMemo(() => threadMessagesQuery ?? [], [threadMessagesQuery]);
  const myPayoutAccounts =
    useQuery(api.payouts.listMyPayoutAccounts, isUserReady ? {} : "skip") ?? [];
  const usersQuery = useQuery(api.users.listUsers);
  const users = useMemo(() => usersQuery ?? [], [usersQuery]);

  const [threadActionId, setThreadActionId] = useState<Id<"threads"> | null>(null);
  const [messageActionId, setMessageActionId] = useState<Id<"messages"> | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [replyTone, setReplyTone] = useState<ReplyTone>("意見");
  const [postingReply, setPostingReply] = useState(false);
  const [bankPresetCodeInput, setBankPresetCodeInput] = useState("");
  const [branchNameInput, setBranchNameInput] = useState("");
  const [branchCodeInput, setBranchCodeInput] = useState("");
  const [accountTypeInput, setAccountTypeInput] = useState<"ordinary" | "checking" | "savings">(
    "ordinary"
  );
  const [accountNumberInput, setAccountNumberInput] = useState("");
  const [accountHolderNameInput, setAccountHolderNameInput] = useState("");
  const [savingBank, setSavingBank] = useState(false);
  const [bankFeedback, setBankFeedback] = useState<string | null>(null);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const [uiFeedback, setUiFeedback] = useState<string | null>(null);

  const handleReplyImageFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    await handleImageFileToField(
      file,
      setReplyBody,
      createImageUploadUrl,
      resolveImageUrl,
      setUiFeedback,
      setImageUploading
    );
    event.target.value = "";
  };

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

  const currentConvexUser = users.find((row) => row.userId === user?.id);

  const userNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of users) {
      map.set(row._id, row.name ?? "Unknown");
    }
    return map;
  }, [users]);

  const reasonMessages = useMemo(
    () => threadMessages.filter((message) => message.kind === "reason"),
    [threadMessages]
  );
  const replyMessages = useMemo(
    () => threadMessages.filter((message) => message.kind !== "reason"),
    [threadMessages]
  );

  const activeBankAccount = myPayoutAccounts.find(
    (account) => account.method === "bank_account" && account.status === "active"
  );
  const selectedBankPreset = findBankOptionByCode(bankPresetCodeInput);

  const canModerateMessage = (createdBy: Id<"users">) =>
    selectedRoom?.myRole === "owner" || currentConvexUser?._id === createdBy;

  const canWriteToThread = Boolean(
    selectedRoom?.myRole !== "viewer" && !selectedThread?.archivedAt
  );
  const isLoading =
    !isUserReady ||
    selectedRoom === undefined ||
    threadMessagesQuery === undefined;
  const isMissing = selectedRoom === null;
  const isRoomThreadMismatch = Boolean(
    selectedRoom && selectedThread && selectedThread.roomId !== selectedRoom._id
  );

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
          title: "FunFund 招待",
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

  const handleCopyInviteCode = async () => {
    if (!selectedRoom?.inviteCode || !navigator?.clipboard) {
      setInviteMessage("招待コードをコピーできませんでした");
      return;
    }
    try {
      await navigator.clipboard.writeText(selectedRoom.inviteCode);
      setInviteMessage("招待コードをコピーしました");
    } catch {
      setInviteMessage("招待コードのコピーに失敗しました");
    }
  };

  const handleToggleMessageHidden = async (messageId: Id<"messages">, hidden: boolean) => {
    setMessageActionId(messageId);
    try {
      await setMessageHidden({ messageId, hidden });
    } catch (error) {
      const message = error instanceof Error ? error.message : "返信表示状態の更新に失敗しました";
      setUiFeedback(message);
    } finally {
      setMessageActionId(null);
    }
  };

  const handleDeleteMessage = async (messageId: Id<"messages">) => {
    const confirmed = window.confirm("この返信を削除します。元に戻せません。");
    if (!confirmed) return;

    setMessageActionId(messageId);
    try {
      await deleteMessage({ messageId });
    } catch (error) {
      const message = error instanceof Error ? error.message : "返信削除に失敗しました";
      setUiFeedback(message);
    } finally {
      setMessageActionId(null);
    }
  };

  const handleSubmitReply = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedThread || !replyBody.trim()) return;

    setPostingReply(true);
    try {
      const normalizedBody = replyBody.trim();
      await postComment({
        roomId: selectedThread.roomId,
        threadId: selectedThread._id,
        body: `【${replyTone}】 ${normalizedBody}`,
      });
      setReplyBody("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "返信の投稿に失敗しました";
      setUiFeedback(message);
    } finally {
      setPostingReply(false);
    }
  };

  const handleSaveBankAccount = async (event: FormEvent) => {
    event.preventDefault();
    const bankName = selectedBankPreset?.name ?? "";
    const bankCode = selectedBankPreset?.code ?? "";
    const onlineBankingUrl = selectedBankPreset?.onlineBankingUrl;
    const accountNumber = accountNumberInput.replace(/[^0-9]/g, "");
    if (!selectedBankPreset) {
      setBankFeedback("銀行アプリを選択してください");
      return;
    }
    if (!bankName || accountNumber.length < 4 || accountNumber.length > 8) {
      setBankFeedback("口座番号(4-8桁)を入力してください");
      return;
    }

    setSavingBank(true);
    setBankFeedback(null);
    try {
      await registerMyBankAccount({
        bankName,
        bankCode,
        branchName: branchNameInput.trim() || undefined,
        branchCode: branchCodeInput.trim() || undefined,
        accountType: accountTypeInput,
        accountNumber,
        accountHolderName: accountHolderNameInput.trim() || undefined,
        onlineBankingUrl,
        isDefault: true,
      });
      setBankFeedback("銀行口座を保存しました");
    } catch (error) {
      const message = error instanceof Error ? error.message : "口座保存に失敗しました";
      setBankFeedback(message);
    } finally {
      setSavingBank(false);
    }
  };

  const handleSetThreadArchived = async (threadIdValue: Id<"threads">, archived: boolean) => {
    if (selectedRoom?.myRole !== "owner") {
      setUiFeedback("オーナーのみスレッドを操作できます");
      return;
    }

    setThreadActionId(threadIdValue);
    try {
      await setThreadArchived({ threadId: threadIdValue, archived });
      if (archived) {
        setUiFeedback("達成！に移動しました");
      } else {
        setUiFeedback("スレッドを再オープンしました");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "スレッド更新に失敗しました";
      setUiFeedback(message);
    } finally {
      setThreadActionId(null);
    }
  };

  const handleDeleteThread = async (threadIdValue: Id<"threads">) => {
    if (selectedRoom?.myRole !== "owner") {
      setUiFeedback("オーナーのみスレッドを削除できます");
      return;
    }

    const finalPhrase = window.prompt("最終確認: DELETE と入力してください");
    if (finalPhrase !== "DELETE") {
      setUiFeedback("確認語が一致しないため削除を中止しました");
      return;
    }

    setThreadActionId(threadIdValue);
    try {
      await deleteThread({ threadId: threadIdValue });
      router.push(`/room?roomId=${roomId}`);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "スレッド削除に失敗しました";
      setUiFeedback(message);
    } finally {
      setThreadActionId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f7fbff] via-[#f9f8ff] to-[#f8fafb]">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-[1700px] items-start justify-between gap-4 px-4 py-3 md:px-6">
          <div>
            <h1>
              <Link
                href="/room"
                className="cursor-pointer text-2xl font-black tracking-tight text-blue-700 transition hover:text-blue-800 hover:underline"
              >
                FunFund
              </Link>
            </h1>
            <button
              type="button"
              onClick={() => router.push(`/room?roomId=${roomId}`)}
              className="mt-1 rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              ← 部屋に戻る
            </button>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex flex-wrap items-center justify-end gap-2">
              <RoomAccountControls />
              {selectedRoom?.isPrivate && selectedRoom?.inviteCode ? (
                <details className="relative">
                  <summary className="list-none cursor-pointer rounded border border-blue-300 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-100">
                    共有
                  </summary>
                  <div className="absolute right-0 z-10 mt-1 w-44 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                    <button
                      type="button"
                      onClick={async (event) => {
                        await handleShareInvite();
                        event.currentTarget.closest("details")?.removeAttribute("open");
                      }}
                      className="block w-full rounded px-2 py-1.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      共有シートを開く
                    </button>
                    <button
                      type="button"
                      onClick={async (event) => {
                        await handleCopyInvite();
                        event.currentTarget.closest("details")?.removeAttribute("open");
                      }}
                      className="block w-full rounded px-2 py-1.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      リンクをコピー
                    </button>
                    <button
                      type="button"
                      onClick={async (event) => {
                        await handleCopyInviteCode();
                        event.currentTarget.closest("details")?.removeAttribute("open");
                      }}
                      className="block w-full rounded px-2 py-1.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      招待コードをコピー
                    </button>
                  </div>
                </details>
              ) : null}
            </div>
            {inviteMessage ? <p className="text-xs text-slate-500">{inviteMessage}</p> : null}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1700px] px-4 py-8 md:px-6">
        {isLoading ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-600">
            読み込み中...
          </div>
        ) : isMissing || isRoomThreadMismatch || !selectedRoom || !selectedThread ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-600">
            Roomまたはスレッドが見つかりません。
          </div>
        ) : (
          <div className="space-y-6">
            {selectedThread.archivedAt ? (
              <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
                このスレッドは「達成！」として記録されています。
              </div>
            ) : null}

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-3xl font-black leading-tight text-slate-900">{selectedThread.title ?? "Untitled"}</h2>
                  <p className="mt-2 text-xs text-slate-500">
                    作成: {new Date(selectedThread.createdAt).toLocaleString("ja-JP")}
                  </p>
                </div>
                {selectedRoom.myRole === "owner" ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={threadActionId === selectedThread._id}
                      onClick={() => {
                        const targetLabel = selectedThread.archivedAt ? "再オープン" : "達成";
                        const confirmed = window.confirm(`${targetLabel}に変更します。続けますか？`);
                        if (!confirmed) return;
                        void handleSetThreadArchived(selectedThread._id, !Boolean(selectedThread.archivedAt));
                      }}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                    >
                      {selectedThread.archivedAt ? "再オープン" : "達成！"}
                    </button>
                    <button
                      type="button"
                      disabled={threadActionId === selectedThread._id}
                      onClick={() => void handleDeleteThread(selectedThread._id)}
                      className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                    >
                      スレッド削除
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="mb-8 rounded-2xl border border-blue-200 bg-blue-50/40 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                    企画カード
                  </span>
                  <span className="rounded bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    銀行送金のみ
                  </span>
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <h3 className="mb-3 text-xl font-black text-slate-900">提案理由</h3>
                  {reasonMessages.length === 0 ? (
                    <p className="text-sm text-slate-500">提案理由はまだありません。</p>
                  ) : (
                    <div className="space-y-3">
                      {reasonMessages.map((message) => (
                        <div key={message._id} className="rounded-lg border border-slate-200 p-4">
                          <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
                            <span className="rounded bg-slate-100 px-2 py-0.5">{formatMessageKind(message.kind)}</span>
                            <span>{userNameById.get(message.createdBy) ?? "Unknown"}</span>
                            {message.hiddenAt ? (
                              <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-700">非表示</span>
                            ) : null}
                            {canModerateMessage(message.createdBy) ? (
                              <div className="ml-auto flex items-center gap-2">
                                <button
                                  type="button"
                                  disabled={messageActionId === message._id}
                                  onClick={() =>
                                    void handleToggleMessageHidden(message._id, !Boolean(message.hiddenAt))
                                  }
                                  className="rounded border border-slate-300 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                                >
                                  {message.hiddenAt ? "再表示" : "非表示"}
                                </button>
                                <button
                                  type="button"
                                  disabled={messageActionId === message._id}
                                  onClick={() => void handleDeleteMessage(message._id)}
                                  className="rounded border border-red-300 bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                                >
                                  削除
                                </button>
                              </div>
                            ) : null}
                          </div>
                          <div className="whitespace-pre-wrap text-lg leading-relaxed text-slate-700">
                            {message.hiddenAt
                              ? "この返信は非表示になっています。"
                              : renderBodyWithLinks(message.body)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="mb-3 text-xl font-black text-slate-900">反論・意見・返信</h3>
                  {replyMessages.length === 0 ? (
                    <p className="text-sm text-slate-500">まだ投稿はありません。</p>
                  ) : (
                    <div className="space-y-3">
                      {replyMessages.map((message) => (
                        <div key={message._id} className="rounded-lg border border-slate-200 p-4">
                          {(() => {
                            const parsedReply = parseReplyTone(message.body ?? "");
                            return (
                              <>
                          <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
                            <span className="rounded bg-slate-100 px-2 py-0.5">{formatMessageKind(message.kind)}</span>
                            <span className="rounded bg-blue-50 px-2 py-0.5 font-semibold text-blue-700">
                              {parsedReply.tone ?? "返信"}
                            </span>
                            <span>{userNameById.get(message.createdBy) ?? "Unknown"}</span>
                            {message.hiddenAt ? (
                              <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-700">非表示</span>
                            ) : null}
                            {canModerateMessage(message.createdBy) ? (
                              <div className="ml-auto flex items-center gap-2">
                                <button
                                  type="button"
                                  disabled={messageActionId === message._id}
                                  onClick={() =>
                                    void handleToggleMessageHidden(message._id, !Boolean(message.hiddenAt))
                                  }
                                  className="rounded border border-slate-300 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                                >
                                  {message.hiddenAt ? "再表示" : "非表示"}
                                </button>
                                <button
                                  type="button"
                                  disabled={messageActionId === message._id}
                                  onClick={() => void handleDeleteMessage(message._id)}
                                  className="rounded border border-red-300 bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                                >
                                  削除
                                </button>
                              </div>
                            ) : null}
                          </div>
                          <div className="whitespace-pre-wrap text-lg leading-relaxed text-slate-700">
                            {message.hiddenAt
                              ? "この返信は非表示になっています。"
                              : renderBodyWithLinks(parsedReply.text || message.body)}
                          </div>
                              </>
                            );
                          })()}
                        </div>
                      ))}
                    </div>
                  )}

                  <form onSubmit={handleSubmitReply} className="mt-4 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {(["意見", "反論", "質問"] as ReplyTone[]).map((tone) => (
                        <button
                          key={tone}
                          type="button"
                          onClick={() => setReplyTone(tone)}
                          className={`rounded-lg border px-4 py-2 text-base font-bold transition ${
                            replyTone === tone
                              ? "border-blue-400 bg-blue-50 text-blue-700"
                              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {tone}
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={replyBody}
                      onChange={(event) => setReplyBody(event.target.value)}
                      onPaste={(event) =>
                        void handleImagePasteToField(
                          event,
                          setReplyBody,
                          createImageUploadUrl,
                          resolveImageUrl,
                          setUiFeedback,
                          setImageUploading
                        )
                      }
                      placeholder="内容を書く（選択した種別で投稿されます）"
                      className="min-h-36 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-lg leading-relaxed"
                    />
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="reply-image-input"
                        className="cursor-pointer rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        画像を選択
                      </label>
                      <input
                        id="reply-image-input"
                        type="file"
                        accept="image/*"
                        onChange={(event) => void handleReplyImageFileChange(event)}
                        className="hidden"
                      />
                    </div>
                    <p className="text-xs text-slate-500">画像を貼り付けると自動でアップロードされます。</p>
                    {imageUploading ? (
                      <p className="text-xs font-semibold text-blue-700">画像をアップロード中...</p>
                    ) : null}
                    <button
                      type="submit"
                      disabled={!canWriteToThread || postingReply || imageUploading || !replyBody.trim()}
                      className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {postingReply ? "投稿中..." : "返信を投稿"}
                    </button>
                  </form>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                  <h3 className="text-xl font-black text-slate-900">銀行口座を接続</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    実際の送金時に使う受取口座を登録します（銀行間送金のみ）。
                  </p>
                  {activeBankAccount ? (
                    <p className="mt-2 text-xs font-semibold text-emerald-700">
                      接続済み: {activeBankAccount.bankName ?? "銀行未設定"} / ****
                      {activeBankAccount.accountLast4 ?? "----"}
                    </p>
                  ) : null}
                  <form onSubmit={handleSaveBankAccount} className="mt-3 grid gap-2 md:grid-cols-2">
                    <select
                      value={bankPresetCodeInput}
                      onChange={(event) => setBankPresetCodeInput(event.target.value)}
                      className="w-full rounded border border-slate-300 px-3 py-2 text-sm md:col-span-2"
                    >
                      <option value="">銀行アプリを選択（必須）</option>
                      {BANK_OPTIONS.map((bank) => (
                        <option key={bank.code} value={bank.code}>
                          {bank.name}
                        </option>
                      ))}
                    </select>
                    <input
                      value={branchNameInput}
                      onChange={(event) => setBranchNameInput(event.target.value)}
                      placeholder="支店名（任意）"
                      className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                    />
                    <input
                      value={branchCodeInput}
                      onChange={(event) => setBranchCodeInput(event.target.value.replace(/[^0-9]/g, "").slice(0, 3))}
                      placeholder="支店コード（3桁・任意）"
                      className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                    />
                    <select
                      value={accountTypeInput}
                      onChange={(event) =>
                        setAccountTypeInput(event.target.value as "ordinary" | "checking" | "savings")
                      }
                      className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option value="ordinary">普通</option>
                      <option value="checking">当座</option>
                      <option value="savings">貯蓄</option>
                    </select>
                    <input
                      value={accountNumberInput}
                      onChange={(event) => setAccountNumberInput(event.target.value.replace(/[^0-9]/g, "").slice(0, 8))}
                      placeholder="口座番号（4-8桁）"
                      className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                    />
                    <input
                      value={accountHolderNameInput}
                      onChange={(event) => setAccountHolderNameInput(event.target.value)}
                      placeholder="口座名義（任意）"
                      className="w-full rounded border border-slate-300 px-3 py-2 text-sm md:col-span-2"
                    />
                    <input
                      value={selectedBankPreset?.onlineBankingUrl ?? ""}
                      readOnly
                      placeholder="ネットバンクURL"
                      className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 md:col-span-2"
                    />
                    <div className="md:col-span-2 space-y-2">
                      <button
                        type="submit"
                        disabled={savingBank}
                        className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
                      >
                        {savingBank ? "保存中..." : "銀行口座を保存"}
                      </button>
                      {bankFeedback ? <p className="mt-2 text-xs text-slate-600">{bankFeedback}</p> : null}
                      {activeBankAccount?.onlineBankingUrl ? (
                        <a
                          href={activeBankAccount.onlineBankingUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex rounded border border-blue-300 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                        >
                          {activeBankAccount.bankName ?? "銀行"}アプリを開く
                        </a>
                      ) : null}
                    </div>
                  </form>
                </div>

              </div>
            </section>
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

export default function RoomThreadPageV2(props: RoomThreadPageV2Props) {
  return (
    <ThreadPageErrorBoundary>
      <RoomThreadPageV2Content {...props} />
    </ThreadPageErrorBoundary>
  );
}
