// convex/publicPreviews.ts
// 公開プレビュー用のquery（ログイン不要）

import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * 公開プレビュー一覧を取得（ログイン不要）
 */
export const listPublicPreviews = query({
  args: {},
  handler: async (ctx) => {
    // visibility: "public" のitemsを取得
    const publicItems = await ctx.db
      .query("items")
      .withIndex("by_visibility", (q) => q.eq("visibility", "public"))
      .filter((q) => !q.field("parentId")) // ルートアイテムのみ
      .collect();

    // publicPreviewsテーブルから追加情報を取得
    const previews = await Promise.all(
      publicItems.map(async (item) => {
        const preview = await ctx.db
          .query("publicPreviews")
          .withIndex("by_item", (q) => q.eq("itemId", item._id))
          .first();

        return {
          id: item._id,
          title: item.content?.substring(0, 100) ?? "",
          description: preview?.description ?? item.content?.substring(0, 200) ?? "",
          thumbnailUrl: preview?.thumbnailUrl,
          createdAt: item.createdAt,
        };
      })
    );

    return previews;
  },
});

/**
 * 公開プレビュー詳細を取得（ログイン不要）
 */
export const getPublicPreview = query({
  args: {
    itemId: v.id("items"),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);

    if (!item || (item.visibility ?? "public") !== "public") {
      return null;
    }

    const preview = await ctx.db
      .query("publicPreviews")
      .withIndex("by_item", (q) => q.eq("itemId", args.itemId))
      .first();

    return {
      id: item._id,
      title: item.content?.substring(0, 100) ?? "",
      description: preview?.description ?? item.content ?? "",
      thumbnailUrl: preview?.thumbnailUrl,
      decisions: preview?.decisions ?? [],
      suitableFor: preview?.suitableFor,
      notSuitableFor: preview?.notSuitableFor,
      createdAt: item.createdAt,
    };
  },
});
