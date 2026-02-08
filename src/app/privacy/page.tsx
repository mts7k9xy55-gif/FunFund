import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <article className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">プライバシーポリシー</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          FunFund は、Room運営と意思決定のために必要な最小限の情報のみを扱います。認証は Clerk、データは Convex、決済は Stripe
          を利用し、各サービスの責任範囲で安全に処理されます。
        </p>

        <section className="mt-8 space-y-4 text-sm leading-7 text-slate-700">
          <h2 className="text-base font-semibold text-slate-900">1. 取得する情報</h2>
          <p>アカウント情報、投稿内容、評価データ、課金処理に必要な識別情報を取得します。</p>

          <h2 className="text-base font-semibold text-slate-900">2. 利用目的</h2>
          <p>Roomの運営、評価計算、機能改善、不正利用対策、サポート対応に利用します。</p>

          <h2 className="text-base font-semibold text-slate-900">3. 外部サービス</h2>
          <p>
            認証・決済などの機能は外部サービスを利用します。各サービスの取り扱いは提供元ポリシーに従います。
          </p>

          <h2 className="text-base font-semibold text-slate-900">4. お問い合わせ</h2>
          <p>
            個人情報の開示・訂正・削除の相談は
            <a className="font-medium text-blue-700 hover:text-blue-800" href="mailto:support@funfund.app">
              support@funfund.app
            </a>
            へご連絡ください。
          </p>
        </section>

        <div className="mt-10 border-t border-slate-200 pt-4 text-xs text-slate-500">最終更新日: 2026-02-08</div>

        <div className="mt-4">
          <Link href="/" className="text-sm font-medium text-blue-700 hover:text-blue-800">
            トップへ戻る
          </Link>
        </div>
      </article>
    </div>
  );
}
