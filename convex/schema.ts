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
    createdAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_status", ["status"])
    .index("by_stripeCustomer", ["stripeCustomerId"]),

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
  })
    .index("by_room", ["roomId"])
    .index("by_thread", ["threadId"])
    .index("by_createdBy", ["createdBy"]),

  // Decision（判断）: stance + reason必須
  decisions: defineTable({
    roomId: v.id("rooms"),
    threadId: v.id("threads"),
    stance: v.union(
      v.literal("yes"),
      v.literal("no"),
      v.literal("hold")
    ),
    reasonMessageId: v.id("messages"), // reasonはmessagesテーブルに保存
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_thread", ["threadId"])
    .index("by_createdBy", ["createdBy"]),

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
});
