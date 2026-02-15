"use client";

import Link from "next/link";
import {
  ClipboardEvent,
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
            <a
              href="/room"
              className="mt-4 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              部屋に戻る
            </a>
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

function isImageUrl(url: string) {
  return /\.(png|jpe?g|gif|webp|svg|bmp|avif)(\?.*)?$/i.test(url);
}

function renderBodyWithLinks(body: string) {
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

function formatCurrencyYen(value: number) {
  return `¥${Math.max(0, Math.round(value)).toLocaleString("ja-JP")}`;
}

function formatDueDate(dueAt?: number) {
  if (!dueAt) return "未設定";
  return new Date(dueAt).toLocaleDateString("ja-JP");
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

function RoomThreadPageV2Content({ roomId, threadId }: RoomThreadPageV2Props) {
  const { user } = useUser();
  const router = useRouter();
  const [isUserReady, setIsUserReady] = useState(false);

  const roomIdAsId = roomId as Id<"rooms">;
  const threadIdAsId = threadId as Id<"threads">;

  const createUserMutation = useMutation(api.users.createUser);
  const postComment = useMutation(api.messages.postComment);
  const setMessageHidden = useMutation(api.messages.setMessageHidden);
  const deleteMessage = useMutation(api.messages.deleteMessage);
  const setThreadArchived = useMutation(api.threads.setThreadArchived);
  const deleteThread = useMutation(api.threads.deleteThread);
  const createIntent = useMutation(api.intents.createIntent);
  const setIntentHidden = useMutation(api.intents.setIntentHidden);
  const deleteIntent = useMutation(api.intents.deleteIntent);
  const finalizeDecision = useMutation(api.finalDecisions.finalizeDecision);
  const upsertCommitment = useMutation(api.commitments.upsertCommitment);
  const createImageUploadUrl = useMutation(api.uploads.createImageUploadUrl);
  const resolveImageUrl = useMutation(api.uploads.resolveImageUrl);

  const roomsForMe = useQuery(api.rooms.listRoomsForMe, isUserReady ? {} : "skip");
  const selectedRoom = useMemo(() => {
    if (roomsForMe === undefined) {
      return undefined;
    }
    return roomsForMe.find((room) => room._id === roomIdAsId) ?? null;
  }, [roomsForMe, roomIdAsId]);
  const threadDetail = useQuery(
    api.threadView.getThreadView,
    isUserReady ? { threadId: threadIdAsId } : "skip"
  );
  const intents =
    useQuery(api.intents.listIntents, isUserReady ? { threadId: threadIdAsId } : "skip") ?? [];
  const finalDecisions =
    useQuery(
      api.finalDecisions.listFinalDecisions,
      isUserReady ? { threadId: threadIdAsId } : "skip"
    ) ?? [];
  const commitmentSummary = useQuery(
    api.commitments.listThreadCommitments,
    isUserReady ? { threadId: threadIdAsId } : "skip"
  );
  const usersQuery = useQuery(api.users.listUsers);
  const users = useMemo(() => usersQuery ?? [], [usersQuery]);

  const [dangerArmedThreadId, setDangerArmedThreadId] = useState<Id<"threads"> | null>(null);
  const [threadActionId, setThreadActionId] = useState<Id<"threads"> | null>(null);
  const [messageActionId, setMessageActionId] = useState<Id<"messages"> | null>(null);
  const [intentActionId, setIntentActionId] = useState<Id<"intents"> | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [postingReply, setPostingReply] = useState(false);
  const [intentScoreInput, setIntentScoreInput] = useState("");
  const [intentReason, setIntentReason] = useState("");
  const [isIntentComposerOpen, setIsIntentComposerOpen] = useState(false);
  const [postingIntent, setPostingIntent] = useState(false);
  const [isFinalDecisionComposerOpen, setIsFinalDecisionComposerOpen] = useState(false);
  const [finalConclusion, setFinalConclusion] = useState("");
  const [finalNote, setFinalNote] = useState("");
  const [savingFinalDecision, setSavingFinalDecision] = useState(false);
  const [commitmentAmountInput, setCommitmentAmountInput] = useState("1000");
  const [commitmentNoteInput, setCommitmentNoteInput] = useState("");
  const [savingCommitment, setSavingCommitment] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const [uiFeedback, setUiFeedback] = useState<string | null>(null);

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

  const selectedThread = threadDetail?.thread ?? null;
  const threadMessages = useMemo(() => threadDetail?.messages ?? [], [threadDetail]);

  const reasonMessages = useMemo(
    () => threadMessages.filter((message) => message.kind === "reason"),
    [threadMessages]
  );
  const replyMessages = useMemo(
    () => threadMessages.filter((message) => message.kind !== "reason"),
    [threadMessages]
  );

  const currentFinalDecision = finalDecisions.find((decision) => decision.isCurrent) ?? null;
  const historyFinalDecisions = finalDecisions.filter((decision) => !decision.isCurrent);
  const commitmentRows = commitmentSummary?.commitments ?? [];
  const commitmentTotal = commitmentSummary?.totalAmount ?? 0;
  const commitmentSupporterCount = commitmentSummary?.supporterCount ?? 0;
  const myCommitment =
    currentConvexUser
      ? commitmentRows.find((row) => row.supporterUserId === currentConvexUser._id) ?? null
      : null;

  const canModerateMessage = (createdBy: Id<"users">) =>
    selectedRoom?.myRole === "owner" || currentConvexUser?._id === createdBy;

  const canModerateIntent = (createdBy: Id<"users">) =>
    selectedRoom?.myRole === "owner" || currentConvexUser?._id === createdBy;

  const canWriteToThread = Boolean(
    selectedRoom?.myRole !== "viewer" && !selectedThread?.archivedAt
  );
  const isLoading =
    !isUserReady || selectedRoom === undefined || threadDetail === undefined;
  const isMissing = selectedRoom === null || threadDetail === null;
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
      await postComment({
        roomId: selectedThread.roomId,
        threadId: selectedThread._id,
        body: replyBody.trim(),
      });
      setReplyBody("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "返信の投稿に失敗しました";
      setUiFeedback(message);
    } finally {
      setPostingReply(false);
    }
  };

  const handleSubmitIntent = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedThread || !selectedRoom) return;

    const scoreText = intentScoreInput.trim();
    let score: number | undefined;
    if (scoreText) {
      score = Number(scoreText);
      if (!Number.isFinite(score) || score < 1 || score > 10) {
        setUiFeedback("意思スコアは1-10で入力してください");
        return;
      }
    }

    setPostingIntent(true);
    try {
      await createIntent({
        roomId: selectedRoom._id,
        threadId: selectedThread._id,
        score,
        reason: intentReason.trim() || undefined,
      });
      setIntentScoreInput("");
      setIntentReason("");
      setIsIntentComposerOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "意思の投稿に失敗しました";
      setUiFeedback(message);
    } finally {
      setPostingIntent(false);
    }
  };

  const handleToggleIntentHidden = async (intentId: Id<"intents">, hidden: boolean) => {
    setIntentActionId(intentId);
    try {
      await setIntentHidden({ intentId, hidden });
    } catch (error) {
      const message = error instanceof Error ? error.message : "意思表示状態の更新に失敗しました";
      setUiFeedback(message);
    } finally {
      setIntentActionId(null);
    }
  };

  const handleDeleteIntent = async (intentId: Id<"intents">) => {
    const confirmed = window.confirm("この意思を削除します。元に戻せません。");
    if (!confirmed) return;

    setIntentActionId(intentId);
    try {
      await deleteIntent({ intentId });
    } catch (error) {
      const message = error instanceof Error ? error.message : "意思削除に失敗しました";
      setUiFeedback(message);
    } finally {
      setIntentActionId(null);
    }
  };

  const handleFinalizeDecision = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedThread || !finalConclusion.trim()) {
      setUiFeedback("最終決定の結論を入力してください");
      return;
    }

    setSavingFinalDecision(true);
    try {
      await finalizeDecision({
        threadId: selectedThread._id,
        conclusion: finalConclusion.trim(),
        note: finalNote.trim() || undefined,
      });
      setFinalConclusion("");
      setFinalNote("");
      setIsFinalDecisionComposerOpen(false);
      setUiFeedback("最終決定を確定しました");
    } catch (error) {
      const message = error instanceof Error ? error.message : "最終決定の確定に失敗しました";
      setUiFeedback(message);
    } finally {
      setSavingFinalDecision(false);
    }
  };

  const handleSubmitCommitment = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedThread) return;
    const amount = Number(commitmentAmountInput);
    if (!Number.isFinite(amount) || amount <= 0) {
      setUiFeedback("コミット金額は1円以上で入力してください");
      return;
    }

    setSavingCommitment(true);
    try {
      await upsertCommitment({
        roomId: selectedThread.roomId,
        threadId: selectedThread._id,
        amount,
        note: commitmentNoteInput.trim() || undefined,
      });
      setCommitmentNoteInput("");
      setUiFeedback("コミットを保存しました");
    } catch (error) {
      const message = error instanceof Error ? error.message : "コミット保存に失敗しました";
      setUiFeedback(message);
    } finally {
      setSavingCommitment(false);
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

    const targetTitle =
      selectedThread?._id === threadIdValue ? (selectedThread.title ?? "Untitled") : "Untitled";
    const typedTitle = window.prompt(
      `削除するにはスレッド名を入力してください:\n${targetTitle}`
    );
    if (typedTitle !== targetTitle) {
      setUiFeedback("スレッド名が一致しないため削除を中止しました");
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
      router.push("/room");
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
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Link
                href="/room"
                className="rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                部屋選択に戻る
              </Link>
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
                      onClick={() =>
                        setDangerArmedThreadId((prev) =>
                          prev === selectedThread._id ? null : selectedThread._id
                        )
                      }
                      className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
                    >
                      {dangerArmedThreadId === selectedThread._id ? "★ 管理操作ON" : "☆ 管理操作"}
                    </button>
                    <button
                      type="button"
                      disabled={
                        threadActionId === selectedThread._id ||
                        dangerArmedThreadId !== selectedThread._id
                      }
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
                      disabled={
                        threadActionId === selectedThread._id ||
                        dangerArmedThreadId !== selectedThread._id
                      }
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
                    Decision Card
                  </span>
                  <span className="rounded bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                    担当:{" "}
                    {selectedThread.decisionOwnerId
                      ? (userNameById.get(selectedThread.decisionOwnerId) ?? "Unknown")
                      : "未設定"}
                  </span>
                  <span className="rounded bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                    期限: {formatDueDate(selectedThread.dueAt)}
                  </span>
                  <span className="rounded bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    コミット {formatCurrencyYen(commitmentTotal)}
                    {selectedThread.commitmentGoalAmount
                      ? ` / ${formatCurrencyYen(selectedThread.commitmentGoalAmount)}`
                      : ""}
                  </span>
                </div>
                {selectedThread.meetingUrl ? (
                  <p className="mt-3 text-sm text-slate-700">
                    会議リンク:{" "}
                    <a
                      href={selectedThread.meetingUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="font-semibold text-blue-700 underline decoration-blue-400 underline-offset-2"
                    >
                      {selectedThread.meetingUrl}
                    </a>
                  </p>
                ) : null}
                {selectedThread.options?.length ? (
                  <div className="mt-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      選択肢
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-slate-700">
                      {selectedThread.options.map((option, index) => (
                        <li key={`${option}-${index}`}>{index + 1}. {option}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">選択肢はまだ設定されていません。</p>
                )}
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
                  <h3 className="mb-3 text-xl font-black text-slate-900">返信</h3>
                  {replyMessages.length === 0 ? (
                    <p className="text-sm text-slate-500">まだ返信はありません。</p>
                  ) : (
                    <div className="space-y-3">
                      {replyMessages.map((message) => (
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

                  <form onSubmit={handleSubmitReply} className="mt-4 space-y-2">
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
                      placeholder="返信を書く"
                      className="min-h-36 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-lg leading-relaxed"
                    />
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

                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-xl font-black text-slate-900">意思（score / 理由は任意）</h3>
                    <button
                      type="button"
                      onClick={() => setIsIntentComposerOpen((prev) => !prev)}
                      className="rounded border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                    >
                      {isIntentComposerOpen ? "意思入力を閉じる" : "＋ 意思を追加"}
                    </button>
                  </div>

                  {isIntentComposerOpen ? (
                    <form onSubmit={handleSubmitIntent} className="mb-4 space-y-2 rounded-lg border border-slate-200 p-4">
                      <input
                        value={intentScoreInput}
                        onChange={(event) => setIntentScoreInput(event.target.value)}
                        placeholder="score 1-10（任意）"
                        className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                      />
                      <textarea
                        value={intentReason}
                        onChange={(event) => setIntentReason(event.target.value)}
                        onPaste={(event) =>
                          void handleImagePasteToField(
                            event,
                            setIntentReason,
                            createImageUploadUrl,
                            resolveImageUrl,
                            setUiFeedback,
                            setImageUploading
                          )
                        }
                        placeholder="理由（任意）"
                        className="min-h-28 w-full rounded border border-slate-300 px-3 py-2 text-base leading-relaxed"
                      />
                      <p className="text-xs text-slate-500">画像を貼り付けると自動でアップロードされます。</p>
                      {imageUploading ? (
                        <p className="text-xs font-semibold text-blue-700">画像をアップロード中...</p>
                      ) : null}
                      <button
                        type="submit"
                        disabled={!canWriteToThread || postingIntent || imageUploading}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {postingIntent ? "投稿中..." : "意思を投稿"}
                      </button>
                    </form>
                  ) : null}

                  {intents.length === 0 ? (
                    <p className="text-sm text-slate-500">まだ意思はありません。</p>
                  ) : (
                    <div className="space-y-3">
                      {intents.map((intent) => (
                        <div key={intent._id} className="rounded-lg border border-slate-200 p-4">
                          <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
                            {intent.score !== undefined ? (
                              <span className="rounded bg-blue-50 px-2 py-0.5 font-semibold text-blue-700">
                                Score {intent.score}
                              </span>
                            ) : (
                              <span className="rounded bg-slate-100 px-2 py-0.5">Scoreなし</span>
                            )}
                            <span>{intent.authorName ?? userNameById.get(intent.createdBy) ?? "Unknown"}</span>
                            {intent.hiddenAt ? (
                              <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-700">非表示</span>
                            ) : null}
                            {canModerateIntent(intent.createdBy) ? (
                              <div className="ml-auto flex items-center gap-2">
                                <button
                                  type="button"
                                  disabled={intentActionId === intent._id}
                                  onClick={() =>
                                    void handleToggleIntentHidden(intent._id, !Boolean(intent.hiddenAt))
                                  }
                                  className="rounded border border-slate-300 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                                >
                                  {intent.hiddenAt ? "再表示" : "非表示"}
                                </button>
                                <button
                                  type="button"
                                  disabled={intentActionId === intent._id}
                                  onClick={() => void handleDeleteIntent(intent._id)}
                                  className="rounded border border-red-300 bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                                >
                                  削除
                                </button>
                              </div>
                            ) : null}
                          </div>
                          <div className="whitespace-pre-wrap text-lg leading-relaxed text-slate-700">
                            {intent.hiddenAt
                              ? "この意思は非表示になっています。"
                              : intent.reason
                                ? renderBodyWithLinks(intent.reason)
                                : "（空の意思）"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-xl font-black text-slate-900">コミット（資金支援）</h3>
                    <span className="rounded bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      支援者 {commitmentSupporterCount}
                    </span>
                  </div>
                  <p className="mb-3 text-sm text-slate-500">
                    ここでは支払い確定ではなく、実行意思のコミットを記録します。
                  </p>

                  <form onSubmit={handleSubmitCommitment} className="space-y-2 rounded-lg border border-slate-200 p-4">
                    <div className="grid gap-2 md:grid-cols-2">
                      <input
                        value={commitmentAmountInput}
                        onChange={(event) =>
                          setCommitmentAmountInput(event.target.value.replace(/[^0-9]/g, ""))
                        }
                        placeholder="コミット金額（円）"
                        className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                      />
                      <input
                        value={commitmentNoteInput}
                        onChange={(event) => setCommitmentNoteInput(event.target.value)}
                        placeholder="メモ（任意）"
                        className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                    {myCommitment ? (
                      <p className="text-xs text-slate-500">
                        あなたの現在のコミット: {formatCurrencyYen(myCommitment.amount)}
                      </p>
                    ) : null}
                    <button
                      type="submit"
                      disabled={!canWriteToThread || savingCommitment || !commitmentAmountInput.trim()}
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {savingCommitment ? "保存中..." : "コミットを保存"}
                    </button>
                  </form>

                  {commitmentRows.length === 0 ? (
                    <p className="mt-3 text-sm text-slate-500">コミットはまだありません。</p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {commitmentRows.map((commitment) => (
                        <div key={commitment._id} className="rounded-lg border border-slate-200 p-3">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span className="rounded bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">
                              {formatCurrencyYen(commitment.amount)}
                            </span>
                            <span>{commitment.supporterName}</span>
                            <span>{new Date(commitment.updatedAt).toLocaleString("ja-JP")}</span>
                          </div>
                          {commitment.note ? (
                            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                              {renderBodyWithLinks(commitment.note)}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-xl font-black text-slate-900">最終決定（owner確定）</h3>
                    {selectedRoom.myRole === "owner" ? (
                      <button
                        type="button"
                        onClick={() => setIsFinalDecisionComposerOpen((prev) => !prev)}
                        className="rounded border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                      >
                        {isFinalDecisionComposerOpen ? "確定フォームを閉じる" : "＋ 最終決定を確定"}
                      </button>
                    ) : null}
                  </div>

                  {isFinalDecisionComposerOpen ? (
                    <form
                      onSubmit={handleFinalizeDecision}
                      className="mb-4 space-y-2 rounded-lg border border-slate-200 p-4"
                    >
                      <input
                        value={finalConclusion}
                        onChange={(event) => setFinalConclusion(event.target.value)}
                        placeholder="結論（必須）"
                        className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                      />
                      <textarea
                        value={finalNote}
                        onChange={(event) => setFinalNote(event.target.value)}
                        onPaste={(event) =>
                          void handleImagePasteToField(
                            event,
                            setFinalNote,
                            createImageUploadUrl,
                            resolveImageUrl,
                            setUiFeedback,
                            setImageUploading
                          )
                        }
                        placeholder="補足メモ（任意）"
                        className="min-h-24 w-full rounded border border-slate-300 px-3 py-2 text-base leading-relaxed"
                      />
                      <p className="text-xs text-slate-500">画像を貼り付けると自動でアップロードされます。</p>
                      {imageUploading ? (
                        <p className="text-xs font-semibold text-blue-700">画像をアップロード中...</p>
                      ) : null}
                      <button
                        type="submit"
                        disabled={savingFinalDecision || imageUploading || !finalConclusion.trim()}
                        className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingFinalDecision ? "確定中..." : "最終決定を保存"}
                      </button>
                    </form>
                  ) : null}

                  {currentFinalDecision ? (
                    <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4">
                      <div className="mb-1 flex items-center gap-2 text-xs text-emerald-700">
                        <span className="rounded bg-emerald-100 px-2 py-0.5 font-semibold">現在の決定</span>
                        <span>v{currentFinalDecision.version}</span>
                        <span>{currentFinalDecision.deciderName}</span>
                      </div>
                      <div className="whitespace-pre-wrap text-lg font-semibold leading-relaxed text-emerald-900">
                        {renderBodyWithLinks(currentFinalDecision.conclusion)}
                      </div>
                      {currentFinalDecision.note ? (
                        <div className="mt-2 whitespace-pre-wrap text-base leading-relaxed text-emerald-800">
                          {renderBodyWithLinks(currentFinalDecision.note)}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">最終決定はまだありません。</p>
                  )}

                  {historyFinalDecisions.length > 0 ? (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-semibold text-slate-800">履歴</p>
                      {historyFinalDecisions.map((decision) => (
                        <div key={decision._id} className="rounded-lg border border-slate-200 p-3">
                          <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
                            <span className="rounded bg-slate-100 px-2 py-0.5 font-semibold">v{decision.version}</span>
                            <span>{decision.deciderName}</span>
                          </div>
                          <div className="whitespace-pre-wrap text-base leading-relaxed text-slate-700">
                            {renderBodyWithLinks(decision.conclusion)}
                          </div>
                          {decision.note ? (
                            <div className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                              {renderBodyWithLinks(decision.note)}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : null}
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
