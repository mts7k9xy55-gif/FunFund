# Room-based システム: 軽いSNS化を防ぐ実装

## 目的

このシステムは「軽いSNSに落ちない」ことを目的として設計されています。
UIではなく**サーバー（Convex mutation）で強制**することで、設計思想を確実に守ります。

## 禁止ルール（なぜこれで平凡化しないか）

### 1. **いいね機能は作らない**
- ❌ 数だけの反応（いいね、リアクション）
- ✅ 理由付きの判断（Decision）のみ
- **理由**: 数だけの反応は思考停止を招く。理由を書くことで、判断の質が問われる。

### 2. **数だけの投票は許さない**
- ❌ 賛成/反対の数だけを集計
- ✅ stance (yes/no/hold) + **理由必須**
- **理由**: 理由なしの投票は「多数決」に堕する。理由を書くことで、判断の根拠が可視化される。

### 3. **DM機能は不要**
- ❌ 1対1のプライベートな会話
- ✅ Room（公開の議論の場）のみ
- **理由**: プライベートな会話は透明性を損なう。すべての議論はRoomで公開される。

### 4. **書き込みガード（最重要）**
- ❌ draft/past_due/canceled のRoomに書き込み可能
- ✅ **active のRoomのみ書き込み可能**
- **理由**: 期限切れやキャンセルされたRoomに書き込むと混乱を招く。アクティブなRoomでのみ議論が可能。

### 5. **viewerは書き込み不可**
- ❌ viewerも書き込み可能
- ✅ **owner/memberのみ書き込み可能**
- **理由**: viewerは「見るだけ」の役割。書き込み権限を制限することで、議論の質を保つ。

### 6. **理由必須（最重要）**
- ❌ proposal/project/decision に理由なしで作成可能
- ✅ **proposal/project/decision は理由必須**
- **理由**: 理由なしの提案や判断は「思いつき」に過ぎない。理由を書くことで、思考の深さが問われる。

## 実装の強制方法

すべての書き込み操作（mutation）の先頭で以下をチェック：

```typescript
// 1. 認証チェック
const user = await requireUser(ctx);

// 2. 書き込みガード（active room + member/owner）
await requireWritePermission(ctx, roomId, user._id);

// 3. 理由必須チェック（proposal/project/decision）
requireReason(reason, context);
```

これらのガードを**サーバー側で強制**することで、UIのバグや改ざんがあっても設計思想が守られます。

## API 使用例

### Room作成とアクティブ化

```typescript
// Room作成（draft状態）
const roomId = await createRoom({ name: "プロジェクトA" });

// Roomをアクティブ化（ownerのみ）
await activateRoom({ roomId });

// メンバー追加（ownerのみ）
await addMember({ 
  roomId, 
  userId: otherUserId, 
  role: "member" // or "viewer"
});
```

### Thread作成（理由必須チェック）

```typescript
// comment: 理由不要
const threadId1 = await createThread({
  roomId,
  type: "comment",
  initialBody: "これはコメントです",
});

// proposal: 理由必須
const threadId2 = await createThread({
  roomId,
  type: "proposal",
  title: "新機能の提案",
  initialBody: "この機能を追加しましょう",
  reason: "ユーザーの要望が多く、実装コストも低いため", // 必須
});

// project: 理由必須
const threadId3 = await createThread({
  roomId,
  type: "project",
  title: "プロジェクトX",
  initialBody: "このプロジェクトを開始します",
  reason: "ビジネス価値が高く、リソースも確保できたため", // 必須
});
```

### 判断（理由必須）

```typescript
// 判断を下す（理由必須）
await decide({
  roomId,
  threadId,
  stance: "yes", // or "no" or "hold"
  reasonBody: "この提案は技術的に実現可能で、ユーザー価値も高い", // 必須
});
```

### 実行ログ

```typescript
// 実行ログを記録（project threadのみ）
await logExecution({
  roomId,
  threadId,
  status: "done",
  note: "実装完了しました",
  evidenceUrl: "https://example.com/evidence.png",
});
```

## データモデル

- **rooms**: Room（グループ）の定義
- **roomMembers**: Roomメンバーとrole
- **threads**: スレッド（comment/proposal/project）
- **messages**: メッセージ（comment/reason/execution）
- **decisions**: 判断（stance + reason必須）
- **executions**: 実行ログ（project threadのみ）

詳細は `schema.ts` を参照してください。
