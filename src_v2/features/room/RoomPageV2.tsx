"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import Dashboard from "@/components/dashboard/Dashboard";
import LayerInputs from "@/components/layer/LayerInputs";
import DecisionModal from "@/components/room/DecisionModal";
import PaywallBanner from "@/components/room/PaywallBanner";
import RoomSelector from "@/components/room/RoomSelector";
import { isV2LegacyHubEnabled } from "@/lib/featureFlags";

const LegacyHub = dynamic(() => import("@/components/NewFunFundApp"), {
  ssr: false,
  loading: () => <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Legacy Hub loading...</div>,
});

export default function RoomPageV2() {
  const roomsQuery = useQuery(api.rooms.listRoomsForMe);
  const rooms = useMemo(() => roomsQuery ?? [], [roomsQuery]);
  const createThreadV2 = useMutation(api.v2Room.createThreadV2);
  const seedPublicProjects = useMutation(api.v2Public.seedPublicProjectsFromLegacy);
  const [selectedRoomId, setSelectedRoomId] = useState<Id<"rooms"> | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<Id<"threads"> | null>(null);
  const [showLegacyHub, setShowLegacyHub] = useState(false);
  const [threadType, setThreadType] = useState<"comment" | "proposal" | "project">("comment");
  const [threadTitle, setThreadTitle] = useState("");
  const [threadBody, setThreadBody] = useState("");
  const [threadReason, setThreadReason] = useState("");
  const [creatingThread, setCreatingThread] = useState(false);
  const [threadError, setThreadError] = useState<string | null>(null);
  const [migrationMessage, setMigrationMessage] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [decisionFeedback, setDecisionFeedback] = useState<string | null>(null);

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
  const workspace = useQuery(
    api.v2Room.getRoomWorkspace,
    effectiveRoomId ? { roomId: effectiveRoomId } : "skip"
  );
  const migrationSnapshot = useQuery(api.v2Migration.snapshotMigrationCounts, {});

  const effectiveThreadId = useMemo(() => {
    if (!roomThreads.length) {
      return null;
    }
    if (selectedThreadId && roomThreads.some((thread) => thread._id === selectedThreadId)) {
      return selectedThreadId;
    }
    return roomThreads[0]._id;
  }, [roomThreads, selectedThreadId]);
  const decisionsQuery = useQuery(
    api.decisions.listDecisions,
    effectiveThreadId ? { threadId: effectiveThreadId } : "skip"
  );
  const decisions = useMemo(() => decisionsQuery ?? [], [decisionsQuery]);

  const roomMetrics = workspace?.metrics;
  const selectedThread = useMemo(
    () => roomThreads.find((thread) => thread._id === effectiveThreadId) ?? null,
    [effectiveThreadId, roomThreads]
  );

  const stanceLabel = (stance: "yes" | "no" | "hold") => {
    if (stance === "yes") return "賛成";
    if (stance === "no") return "反対";
    return "保留";
  };

  const stanceClass = (stance: "yes" | "no" | "hold") => {
    if (stance === "yes") return "bg-green-100 text-green-700";
    if (stance === "no") return "bg-red-100 text-red-700";
    return "bg-amber-100 text-amber-700";
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
                <h2 className="text-lg font-bold text-slate-900">New Thread (v2)</h2>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <select
                    value={threadType}
                    onChange={(event) =>
                      setThreadType(event.target.value as "comment" | "proposal" | "project")
                    }
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="comment">comment</option>
                    <option value="proposal">proposal</option>
                    <option value="project">project</option>
                  </select>
                  <input
                    value={threadTitle}
                    onChange={(event) => setThreadTitle(event.target.value)}
                    placeholder="タイトル"
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <textarea
                  value={threadBody}
                  onChange={(event) => setThreadBody(event.target.value)}
                  placeholder="最初の本文"
                  className="mt-3 min-h-24 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                />
                {(threadType === "proposal" || threadType === "project") && (
                  <textarea
                    value={threadReason}
                    onChange={(event) => setThreadReason(event.target.value)}
                    placeholder="理由（proposal/projectは必須）"
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
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">判断タイムライン</h2>
                      <p className="text-xs text-slate-500">
                        Thread: {selectedThread?.title ?? selectedThread?.type ?? "Untitled"}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={selectedRoom.status !== "active"}
                      onClick={() => {
                        setDecisionFeedback(null);
                        setIsDecisionModalOpen(true);
                      }}
                      className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      判断する
                    </button>
                  </div>

                  {decisionFeedback ? (
                    <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                      {decisionFeedback}
                    </div>
                  ) : null}

                  {decisions.length === 0 ? (
                    <p className="text-sm text-slate-500">まだ判断はありません。</p>
                  ) : (
                    <div className="space-y-2">
                      {decisions.map((decision) => (
                        <article key={decision._id} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <span className={`rounded px-2 py-0.5 text-xs font-semibold ${stanceClass(decision.stance)}`}>
                              {stanceLabel(decision.stance)}
                            </span>
                            <span className="text-xs text-slate-500">
                              {new Date(decision.createdAt).toLocaleString("ja-JP")}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-700">{decision.authorName}</p>
                          <p className="mt-1 text-sm text-slate-700">{decision.reason}</p>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}

              {effectiveThreadId ? (
                <LayerInputs roomId={selectedRoom._id} threadId={effectiveThreadId} language="ja" />
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

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-bold text-slate-900">Migration Control</h2>
              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <p>users: {migrationSnapshot?.users ?? 0}</p>
                <p>rooms: {migrationSnapshot?.rooms ?? 0}</p>
                <p>threads: {migrationSnapshot?.threads ?? 0}</p>
                <p>evaluations: {migrationSnapshot?.evaluations ?? 0}</p>
                <p>publicProjectsV2: {migrationSnapshot?.publicProjectsV2 ?? 0}</p>
              </div>
              <button
                type="button"
                disabled={seeding}
                onClick={async () => {
                  setSeeding(true);
                  setMigrationMessage(null);
                  try {
                    const result = await seedPublicProjects({ limit: 200 });
                    setMigrationMessage(`Seeded ${result.created} projects`);
                  } catch (error) {
                    const message = error instanceof Error ? error.message : "Failed to seed";
                    setMigrationMessage(message);
                  } finally {
                    setSeeding(false);
                  }
                }}
                className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {seeding ? "Seeding..." : "Seed v2 Public Projects"}
              </button>
              {migrationMessage ? <p className="mt-2 text-xs text-slate-500">{migrationMessage}</p> : null}
            </div>

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

      {effectiveRoomId && effectiveThreadId ? (
        <DecisionModal
          isOpen={isDecisionModalOpen}
          onClose={() => setIsDecisionModalOpen(false)}
          roomId={effectiveRoomId}
          threadId={effectiveThreadId}
          language="ja"
          onError={(message) => setDecisionFeedback(message)}
          onSuccess={(message) => setDecisionFeedback(message)}
        />
      ) : null}
    </div>
  );
}
