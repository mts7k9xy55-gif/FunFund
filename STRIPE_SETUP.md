# Stripe Roomサブスクリプション課金: セットアップガイド

## 環境変数一覧

### `.env.local` に追加

```bash
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_...  # Stripe Dashboard > Developers > API keys
STRIPE_PUBLISHABLE_KEY=pk_test_...  # フロントエンド用（必要に応じて）
STRIPE_WEBHOOK_SECRET=whsec_...  # Stripe CLIでローカルテスト時に取得

# Stripe Price ID（サブスクリプション価格）
STRIPE_PRICE_ID=price_...  # Stripe Dashboard > Products > 価格ID

# サイトURL（Checkout成功/キャンセル時のリダイレクト用）
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # ローカル開発時
# NEXT_PUBLIC_SITE_URL=https://your-domain.com  # 本番環境
```

### 既存の環境変数（確認）

```bash
NEXT_PUBLIC_CONVEX_URL=https://...convex.cloud
```

---

## パッケージインストール（必須）

```bash
npm install stripe
```

**注意**: `@types/stripe` は不要です（stripeパッケージに型定義が含まれています）

---

## Stripe Dashboard設定

### 1. プロダクトと価格を作成

1. Stripe Dashboard > Products に移動
2. 「Add product」をクリック
3. プロダクト名: "Room Subscription"（任意）
4. 価格を設定（例: ¥1,000/月）
5. 価格ID（`price_...`）をコピーして `STRIPE_PRICE_ID` に設定

### 2. Webhookエンドポイント設定（本番環境）

1. Stripe Dashboard > Developers > Webhooks
2. 「Add endpoint」をクリック
3. Endpoint URL: `https://your-domain.com/api/stripe/webhook`
4. イベントを選択:
   - `invoice.paid`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
   - `checkout.session.completed`
5. Webhook signing secretをコピーして `STRIPE_WEBHOOK_SECRET` に設定

---

## ローカルでのStripe CLIによるテスト手順

### 1. Stripe CLIインストール

```bash
# macOS
brew install stripe/stripe-cli/stripe

# その他のOS
# https://stripe.com/docs/stripe-cli
```

### 2. Stripe CLIログイン

```bash
stripe login
```

### 3. Webhookをローカルでフォワード

```bash
# Next.jsアプリが localhost:3000 で起動している状態で実行
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

このコマンドを実行すると、`whsec_...` というWebhook signing secretが表示されます。
これを `.env.local` の `STRIPE_WEBHOOK_SECRET` に設定してください。

### 4. テストイベントをトリガー

別のターミナルで以下を実行：

```bash
# Checkoutセッション作成（テスト用）
stripe trigger checkout.session.completed

# 支払い成功イベント
stripe trigger invoice.paid

# 支払い失敗イベント
stripe trigger invoice.payment_failed

# サブスクリプション削除イベント
stripe trigger customer.subscription.deleted
```

### 5. 実際のCheckoutフローをテスト

1. アプリを起動: `npm run dev`
2. Roomを作成
3. Roomを選択
4. PaywallBannerの「支払いへ」ボタンをクリック
5. Stripe Checkoutページでテストカードを使用:
   - カード番号: `4242 4242 4242 4242`
   - 有効期限: 任意の未来の日付
   - CVC: 任意の3桁
   - 郵便番号: 任意
6. 支払いを完了
7. Webhookがトリガーされ、Room statusが `active` になることを確認

---

## テストカード

Stripeのテストモードで使用できるカード番号：

- **成功**: `4242 4242 4242 4242`
- **3D Secure認証が必要**: `4000 0025 0000 3155`
- **支払い失敗**: `4000 0000 0000 0002`

詳細: https://stripe.com/docs/testing

---

## WebhookイベントとRoom statusの対応

| Webhookイベント | Room status | 説明 |
|----------------|-------------|------|
| `checkout.session.completed` (payment_status=paid) | `active` | Checkout完了 + 初回支払い成功 |
| `invoice.paid` | `active` | 定期支払い成功 |
| `invoice.payment_failed` | `past_due` | 支払い失敗 |
| `customer.subscription.deleted` | `canceled` | サブスクリプション削除 |

---

## トラブルシューティング

### Webhookが届かない

1. `stripe listen` が実行されているか確認
2. `STRIPE_WEBHOOK_SECRET` が正しく設定されているか確認
3. ブラウザのコンソールとサーバーログを確認

### Room statusが更新されない

1. Convex Dashboardでmutationが実行されているか確認
2. Webhookのログを確認（`stripe listen` の出力）
3. `roomId` がmetadataに正しく含まれているか確認

### Checkout URLが作成されない

1. `STRIPE_SECRET_KEY` が正しく設定されているか確認
2. `STRIPE_PRICE_ID` が正しいか確認
3. API routeのログを確認

---

## 本番環境へのデプロイ

1. Stripe Dashboardで本番APIキーを取得
2. Vercel（または他のホスティング）に環境変数を設定
3. Webhookエンドポイントを本番URLに設定
4. Webhook signing secretを更新

---

## セキュリティ注意事項

- `STRIPE_SECRET_KEY` と `STRIPE_WEBHOOK_SECRET` は**絶対に**Gitにコミットしない
- `.env.local` は `.gitignore` に含まれていることを確認
- 本番環境では環境変数を適切に管理（Vercelの環境変数設定など）
