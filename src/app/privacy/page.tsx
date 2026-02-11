import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <article className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">プライバシーポリシー</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          FunFund（以下「当サービス」）は、意思決定コミュニティの運営に必要な範囲で個人情報を取り扱います。本ポリシーは、当サービスに
          おける個人情報等の取扱い方針を定めるものです。
        </p>

        <section className="mt-8 space-y-6 text-sm leading-7 text-slate-700">
          <section>
            <h2 className="text-base font-semibold text-slate-900">1. 事業者情報</h2>
            <p>サービス名: FunFund</p>
            <p>連絡先: support@funfund.app</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">2. 取得する情報</h2>
            <p>当サービスでは、主に以下の情報を取得します。</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>アカウント情報（氏名表示名、メールアドレス、認証ID等）</li>
              <li>Room・スレッド・返信・意見・評価・ログ等の投稿データ</li>
              <li>招待コード、メンバーシップ、権限ロール等のコミュニティ管理情報</li>
              <li>決済・請求に必要な情報（Stripeで処理される取引関連情報）</li>
              <li>障害対応・不正検知のための技術情報（IP、端末・ブラウザ情報、アクセスログ等）</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">3. 利用目的</h2>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>アカウント認証、本人確認、ログイン維持</li>
              <li>Room運営、招待、投稿表示、意思決定フロー提供</li>
              <li>料金請求、支払管理、不正利用防止</li>
              <li>システム保守、障害調査、セキュリティ対策</li>
              <li>お問い合わせ対応、重要通知の送信</li>
              <li>機能改善・品質向上のための分析（個人を特定しない形を含む）</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">4. 第三者提供・外部委託</h2>
            <p>
              当サービスは、機能提供のために外部サービスを利用します。これらのサービス提供者に必要範囲で情報が送信・処理される場合があります。
            </p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>Clerk（認証）</li>
              <li>Convex（データ保存・アプリ基盤）</li>
              <li>Stripe（決済）</li>
              <li>Vercel（ホスティング）</li>
            </ul>
            <p className="mt-1">
              法令に基づく場合を除き、本人同意なく目的外で第三者提供は行いません。
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">5. 保存期間</h2>
            <p>
              取得情報は、利用目的の達成に必要な期間保持し、不要となった場合は合理的な期間内に削除または匿名化します。法令上の保存義務がある場合は
              当該期間保持します。
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">6. 安全管理措置</h2>
            <p>
              アクセス制御、認証、通信の保護、ログ監視等、合理的な安全管理措置を講じます。ただし、インターネット通信において完全な安全性を保証する
              ものではありません。
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">7. ユーザーの権利</h2>
            <p>
              ご本人は、自己情報の開示、訂正、削除、利用停止等を請求できます。ご希望の場合は下記連絡先までご連絡ください。本人確認のうえ、法令に従い
              対応します。
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">8. 国際データ移転</h2>
            <p>
              利用する外部サービスの提供地域に応じて、取得情報が国外で処理される場合があります。当サービスは、法令および提供事業者の契約条件に基づき
              適切に管理します。
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">9. ポリシーの改定</h2>
            <p>
              本ポリシーは、法令改正・機能変更等に応じて改定することがあります。重要な変更は、サービス上で告知します。
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900">10. お問い合わせ</h2>
            <p>
              個人情報の取扱いに関するお問い合わせは
              <a className="font-medium text-blue-700 hover:text-blue-800" href="mailto:support@funfund.app">
                {" "}
                support@funfund.app
              </a>
              までご連絡ください。
            </p>
          </section>
        </section>

        <div className="mt-10 border-t border-slate-200 pt-4 text-xs text-slate-500">最終更新日: 2026-02-11</div>

        <div className="mt-4">
          <Link href="/" className="text-sm font-medium text-blue-700 hover:text-blue-800">
            トップへ戻る
          </Link>
        </div>
      </article>
    </div>
  );
}
