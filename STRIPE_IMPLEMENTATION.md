# Stripe Roomサブスクリプション課金: 実装詳細

## 実装ファイル一覧

### Convex（バックエンド）

1. **`convex/schema.ts`** - Stripe関連フィールド追加
   - `rooms.stripeCustomerId` (optional)
   - `rooms.stripeSubscriptionId` (optional)
   - インデックス: `by_stripeCustomer`

2. **`convex/rooms.ts`** - Internal mutations追加
   - `updateRoomStatusFromWebhook` - Webhook用（status更新）
   - `setRoomStripeInfo` - Stripe情報保存
   - `updateRoomStatusByStripeCustomer` - Customer IDで検索して更新

3. **`convex/stripe.ts`** - Actions（新規作成）
   - `updateRoomStatus` - Webhookから呼び出し（action → internal mutation）
   - `setRoomStripeInfoAction` - Stripe情報保存（action → internal mutation）

### Next.js API Routes

4. **`src/app/api/stripe/checkout/route.ts`** - Checkoutセッション作成
   - POST `/api/stripe/checkout`
   - `roomId`を受け取り、Stripe Checkoutセッションを作成
   - metadataに`roomId`を保存

5. **`src/app/api/stripe/webhook/route.ts`** - Webhookハンドラー
   - POST `/api/stripe/webhook`
   - Webhook署名検証
   - イベントタイプに応じてConvex actionを呼び出し

### フロントエンド

6. **`src/components/room/PaywallBanner.tsx`** - 更新
   - `roomId`プロパティ追加
   - 「支払いへ」ボタンでCheckout APIを呼び出し

7. **`src/components/room/RoomSelector.tsx`** - 更新
   - Room作成時に自動active化を削除（draft状態で作成）

8. **`src/components/NewFunFundApp.tsx`** - 更新
   - Checkout完了後のリダイレクト処理追加
   - PaywallBannerに`roomId`を渡す

---

## WebhookイベントとRoom statusの対応

| Webhookイベント | 処理内容 | Room status |
|----------------|---------|-------------|
| `checkout.session.completed` | Stripe情報を保存、支払い成功ならactive | `active` (if paid) |
| `invoice.paid` | 定期支払い成功 | `active` |
| `invoice.payment_failed` | 支払い失敗 | `past_due` |
| `customer.subscription.deleted` | サブスクリプション削除 | `canceled` |

---

## フロー図

```
1. ユーザーがRoomを作成
   → status: "draft"

2. PaywallBannerの「支払いへ」をクリック
   → POST /api/stripe/checkout
   → Stripe Checkoutセッション作成
   → Checkout URLにリダイレクト

3. ユーザーが支払い完了
   → Stripeがwebhookを送信
   → POST /api/stripe/webhook
   → Webhook署名検証
   → Convex action呼び出し
   → Internal mutation実行
   → Room status: "active"

4. 定期支払い（毎月）
   → invoice.paid webhook
   → Room status: "active" (維持)

5. 支払い失敗
   → invoice.payment_failed webhook
   → Room status: "past_due"
   → 書き込み不可（statusガード）
```

---

## セキュリティ

1. **Webhook署名検証**: すべてのwebhookリクエストで署名を検証
2. **Internal mutation**: 認証不要だが、Convex内部からのみ呼び出し可能
3. **Action経由**: Webhookからはaction経由でinternal mutationを呼び出し（セキュリティレイヤー）

---

## 環境変数チェックリスト

```bash
# 必須
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # または本番URL
NEXT_PUBLIC_CONVEX_URL=https://...convex.cloud

# オプション（フロントエンドでStripe Elementsを使う場合）
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## ローカルテスト手順（3分）

### 1. パッケージインストール

```bash
npm install stripe
```

### 2. Stripe CLIセットアップ

```bash
# Stripe CLIインストール（macOS）
brew install stripe/stripe-cli/stripe

# ログイン
stripe login
```

### 3. Webhookフォワード開始

```bash
# 別ターミナルで実行（Next.jsアプリ起動中）
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

表示される `whsec_...` を `.env.local` の `STRIPE_WEBHOOK_SECRET` に設定

### 4. テスト実行

1. アプリ起動: `npm run dev`
2. Roomを作成（draft状態）
3. Roomを選択
4. PaywallBannerの「支払いへ」をクリック
5. Stripe Checkoutでテストカード入力: `4242 4242 4242 4242`
6. 支払い完了
7. Webhookがトリガーされ、Room statusが`active`になることを確認

### 5. Webhookイベントを手動トリガー

```bash
# 支払い成功
stripe trigger invoice.paid

# 支払い失敗
stripe trigger invoice.payment_failed

# サブスクリプション削除
stripe trigger customer.subscription.deleted
```

---

## トラブルシューティング

### Webhookが届かない

- `stripe listen` が実行されているか確認
- `STRIPE_WEBHOOK_SECRET` が正しいか確認（`stripe listen` で表示される値）
- ブラウザのコンソールとサーバーログを確認

### Room statusが更新されない

- Convex Dashboardでmutationが実行されているか確認
- Webhookのログを確認（`stripe listen` の出力）
- `roomId` がmetadataに正しく含まれているか確認

### Checkout URLが作成されない

- `STRIPE_SECRET_KEY` が正しく設定されているか確認
- `STRIPE_PRICE_ID` が正しいか確認（Stripe Dashboardで確認）
- API routeのログを確認（Next.jsのコンソール）

### Internal mutationが呼び出されない

- Convex Dashboardでactionが実行されているか確認
- `internal.rooms.updateRoomStatusFromWebhook` が正しくエクスポートされているか確認
- Convexの型生成を実行: `npx convex dev --once`
