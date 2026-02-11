import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  profiles: defineTable({
    userId: v.string(),
    username: v.optional(v.string()),
    fullName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  users: defineTable({
    userId: v.string(),
    name: v.optional(v.string()),
    role: v.optional(v.string()),
    reputation: v.optional(v.number()), // フラクタル信頼度（計算で更新）
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),

  // グループ（DMグループ、プロジェクトグループなど）
  groups: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    type: v.union(v.literal("dm"), v.literal("project"), v.literal("public")),
    memberIds: v.array(v.id("users")), // メンバーのID配列
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_type", ["type"])
    .index("by_createdBy", ["createdBy"]),

  // つながり（フォロー/友達/ファミリー）
  connections: defineTable({
    fromUserId: v.id("users"), // リクエストを送った人
    toUserId: v.id("users"), // リクエストを受けた人
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("blocked")
    ),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_from", ["fromUserId"])
    .index("by_to", ["toUserId"])
    .index("by_status", ["status"]),

  // 招待リンク
  invites: defineTable({
    code: v.string(), // ユニークな招待コード
    createdBy: v.id("users"), // 作成者
    expiresAt: v.optional(v.number()), // 有効期限（オプション）
    usedBy: v.optional(v.id("users")), // 使用者（使用済みの場合）
    usedAt: v.optional(v.number()), // 使用日時
    createdAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_createdBy", ["createdBy"]),

  items: defineTable({
    parentId: v.optional(v.id("items")),
    rootId: v.optional(v.id("items")),
    type: v.string(),
    content: v.optional(v.string()),
    emoji: v.optional(v.string()),
    authorId: v.optional(v.id("users")),
    score: v.optional(v.number()),
    reason: v.optional(v.string()),
    createdAt: v.number(),
    // セキュリティ関連フィールド
    visibility: v.optional(
      v.union(v.literal("public"), v.literal("group"), v.literal("dm"))
    ), // デフォルトは public
    groupId: v.optional(v.id("groups")), // グループ/DM用
    recipientId: v.optional(v.id("users")), // DM用（1対1の場合）
  })
    .index("by_parent", ["parentId"])
    .index("by_visibility", ["visibility"])
    .index("by_group", ["groupId"]),

  // ===== Room-based システム（軽いSNS化を防ぐ） =====
  
  // Room（グループ）: アクティブなRoomでのみ書き込み可能
  rooms: defineTable({
    name: v.string(),
    ownerId: v.id("users"),
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("past_due"),
      v.literal("canceled")
    ),
    stripeCustomerId: v.optional(v.string()), // Stripe customer ID
    stripeSubscriptionId: v.optional(v.string()), // Stripe subscription ID
    isPrivate: v.optional(v.boolean()), // プライベートグループかどうか
    inviteCode: v.optional(v.string()), // 招待コード（プライベート時）
    evaluationMode: v.optional(v.union(v.literal("open"), v.literal("closed"))), // 評価モード
    virtualFundBalance: v.optional(v.number()), // 仮想Fund残高
    createdAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_status", ["status"])
    .index("by_stripeCustomer", ["stripeCustomerId"])
    .index("by_inviteCode", ["inviteCode"]),

  // Roomメンバー: roleで書き込み権限を制御
  roomMembers: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    role: v.union(
      v.literal("owner"),
      v.literal("member"),
      v.literal("viewer")
    ),
    joinedAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_user", ["userId"]),

  // Thread（スレッド）: comment/proposal/project
  threads: defineTable({
    roomId: v.id("rooms"),
    type: v.union(
      v.literal("comment"),
      v.literal("proposal"),
      v.literal("project")
    ),
    title: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_createdBy", ["createdBy"]),

  // Message（メッセージ）: comment/reason/execution
  messages: defineTable({
    roomId: v.id("rooms"),
    threadId: v.id("threads"),
    kind: v.union(
      v.literal("comment"),
      v.literal("reason"),
      v.literal("execution")
    ),
    body: v.string(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    hiddenAt: v.optional(v.number()),
    hiddenBy: v.optional(v.id("users")),
  })
    .index("by_room", ["roomId"])
    .index("by_thread", ["threadId"])
    .index("by_createdBy", ["createdBy"]),

  // Decision（判断）: stance + reason必須
  decisions: defineTable({
    roomId: v.id("rooms"),
    threadId: v.id("threads"),
    stance: v.optional(
      v.union(
        v.literal("yes"),
        v.literal("no"),
        v.literal("hold")
      )
    ),
    score: v.optional(v.number()), // 1-10
    visibility: v.optional(
      v.union(
        v.literal("private"),
        v.literal("shared_to_target"),
        v.literal("public")
      )
    ),
    targetUserId: v.optional(v.id("users")),
    publishConsentByEvaluator: v.optional(v.boolean()),
    publishConsentByTarget: v.optional(v.boolean()),
    reasonMessageId: v.id("messages"), // reasonはmessagesテーブルに保存
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_thread", ["threadId"])
    .index("by_createdBy", ["createdBy"])
    .index("by_targetUserId", ["targetUserId"]),

  // ユーザー重みプロファイル（FunFund全体）
  userWeightProfiles: defineTable({
    userId: v.id("users"),
    globalWeight: v.number(),
    globalCredibilityScore: v.number(),
    publicProfileEnabled: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_publicProfileEnabled", ["publicProfileEnabled"]),

  // Room単位の重みオーバーライド
  roomWeightOverrides: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    projectWeight: v.number(),
    reason: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_userId", ["userId"])
    .index("by_room_user", ["roomId", "userId"]),

  // Execution（実行ログ）: プロジェクトの実行状況
  executions: defineTable({
    roomId: v.id("rooms"),
    threadId: v.id("threads"),
    status: v.union(
      v.literal("planned"),
      v.literal("done"),
      v.literal("canceled")
    ),
    note: v.string(),
    evidenceUrl: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_thread", ["threadId"])
    .index("by_createdBy", ["createdBy"]),

  // 公開プレビュー用の追加情報（itemsと1:1の関係）
  publicPreviews: defineTable({
    itemId: v.id("items"), // itemsテーブルへの参照
    thumbnailUrl: v.optional(v.string()),
    description: v.optional(v.string()), // 1-2行の説明
    decisions: v.array(v.string()), // この場で決めること（最大3つ）
    suitableFor: v.optional(v.string()), // 向いている人
    notSuitableFor: v.optional(v.string()), // 向いていない人
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_item", ["itemId"]),

  // 3レイヤー入力（メモ/アンケート/インタビュー）
  layerInputs: defineTable({
    roomId: v.id("rooms"),
    threadId: v.id("threads"),
    memo: v.optional(v.string()), // メモ欄（自由記述）
    questionnaire: v.optional(v.string()), // アンケート回答（JSON文字列）
    interview: v.optional(v.string()), // インタビュー回答（JSON文字列）
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_thread", ["threadId"])
    .index("by_createdBy", ["createdBy"]),

  // 評価（5つの基準でスコアリング）
  evaluations: defineTable({
    threadId: v.id("threads"), // 評価対象のThread
    roomId: v.id("rooms"), // Room参照（アクセス制御用）
    evaluatorId: v.id("users"), // 評価者
    mode: v.union(v.literal("open"), v.literal("closed")), // 評価モード
    // スコア（1-5 scale）
    score1: v.number(), // open: 革新性 / closed: 金銭
    score2: v.number(), // open: 実現可能性 / closed: 家事
    score3: v.number(), // open: 社会的インパクト / closed: 決定力
    score4: v.number(), // open: チーム力 / closed: 協力
    score5: v.number(), // open: プレゼン / closed: ストレス軽減
    // 重み（合計100%）
    weight1: v.number(),
    weight2: v.number(),
    weight3: v.number(),
    weight4: v.number(),
    weight5: v.number(),
    // 計算された加重平均スコア
    weightedScore: v.number(),
    comment: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_threadId", ["threadId"])
    .index("by_roomId", ["roomId"])
    .index("by_evaluatorId", ["evaluatorId"])
    .index("by_threadId_evaluatorId", ["threadId", "evaluatorId"]),

  // 分配提案（貢献度ベース）
  distributionProposals: defineTable({
    roomId: v.id("rooms"),
    threadId: v.id("threads"), // 関連するThread
    proposedBy: v.id("users"), // 提案者
    contributions: v.array(v.object({
      userId: v.id("users"),
      percentage: v.number(), // 貢献度%（合計100%）
    })),
    totalAmount: v.number(), // 分配総額
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_roomId", ["roomId"])
    .index("by_threadId", ["threadId"])
    .index("by_proposedBy", ["proposedBy"]),

  // ユーザー送金口座（Stripe Connect / 銀行口座）
  payoutAccounts: defineTable({
    userId: v.id("users"),
    method: v.union(v.literal("stripe_connect"), v.literal("bank_account")),
    status: v.union(v.literal("pending"), v.literal("active"), v.literal("disabled")),
    externalRef: v.optional(v.string()), // Stripe account IDなど
    bankName: v.optional(v.string()),
    accountLast4: v.optional(v.string()),
    isDefault: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_user_default", ["userId", "isDefault"])
    .index("by_status", ["status"]),

  // 送金台帳（試用フェーズでは確定管理まで）
  payoutLedger: defineTable({
    roomId: v.id("rooms"),
    recipientUserId: v.id("users"),
    amount: v.number(),
    currency: v.string(),
    status: v.union(
      v.literal("requires_method"),
      v.literal("pending"),
      v.literal("ready"),
      v.literal("settled"),
      v.literal("failed"),
      v.literal("canceled")
    ),
    method: v.union(
      v.literal("stripe_connect"),
      v.literal("bank_account"),
      v.literal("unspecified")
    ),
    requestedBy: v.id("users"),
    settledBy: v.optional(v.id("users")),
    payoutAccountId: v.optional(v.id("payoutAccounts")),
    distributionProposalId: v.optional(v.id("distributionProposals")),
    requestedAt: v.number(),
    settledAt: v.optional(v.number()),
    note: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_roomId", ["roomId"])
    .index("by_recipientUserId", ["recipientUserId"])
    .index("by_status", ["status"])
    .index("by_distributionProposalId", ["distributionProposalId"]),

  // v2公開プロジェクト（段階移行用）
  publicProjectsV2: defineTable({
    sourceItemId: v.optional(v.id("items")),
    title: v.string(),
    description: v.string(),
    thumbnailUrl: v.optional(v.string()),
    decisions: v.array(v.string()),
    suitableFor: v.optional(v.string()),
    notSuitableFor: v.optional(v.string()),
    weightedScore: v.number(),
    evaluationCount: v.number(),
    currentAmount: v.number(),
    goalAmount: v.number(),
    daysRemaining: v.number(),
    visibility: v.union(v.literal("public"), v.literal("private")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_visibility", ["visibility"])
    .index("by_sourceItemId", ["sourceItemId"])
    .index("by_createdAt", ["createdAt"]),

  // 移行バックフィルの進捗管理
  migrationBackfillState: defineTable({
    tableName: v.string(),
    lastCursor: v.optional(v.string()),
    processedCount: v.number(),
    updatedAt: v.number(),
  }).index("by_tableName", ["tableName"]),

  // dual-write失敗の補償キュー
  dualWriteFailures: defineTable({
    domain: v.string(),
    operation: v.string(),
    payload: v.string(),
    error: v.string(),
    retryCount: v.number(),
    lastTriedAt: v.number(),
    createdAt: v.number(),
  }).index("by_domain", ["domain"]),

  // Stripe webhookの重複処理防止
  stripeWebhookEvents: defineTable({
    eventId: v.string(),
    eventType: v.string(),
    processedAt: v.number(),
  }).index("by_eventId", ["eventId"]),
});
