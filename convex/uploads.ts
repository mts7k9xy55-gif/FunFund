import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { requireUser } from "./_guards";

export const createImageUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const resolveImageUrl = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) {
      throw new Error("Uploaded image URL could not be resolved");
    }
    return url;
  },
});
