import { v } from "convex/values";
import { query } from "./_generated/server";

export const getThreadView = query({
  args: {
    threadId: v.string(),
  },
  handler: async (_ctx, _args) => {
    // 一時回避: スレッド詳細クエリのサーバー例外で画面全体が落ちるため、
    // ここでは空の詳細を返して UI 側で安全に扱う。
    return {
      thread: null,
      messages: [],
      decisions: [],
      executions: [],
    };
  },
});
