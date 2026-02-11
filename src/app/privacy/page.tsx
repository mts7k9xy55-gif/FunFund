import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <article className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">プライバシーポリシー（簡易版）</h1>

        <section className="mt-6 space-y-4 text-sm leading-7 text-slate-700">
          <p>
            FunFundは、取得したデータを<strong>プラットフォーム運営のためにのみ</strong>利用します。
            それ以外の目的で利用しません。
          </p>
          <p>
            運営に必要な範囲として、認証・Room運営・投稿表示・不正利用防止・障害対応のための最小限の情報を扱います。
          </p>
          <p>
            外部基盤（Clerk / Convex / Stripe / Vercel）上で処理される情報も、同じくサービス運営目的の範囲に限定します。
          </p>
          <p>
            当サービスの利用をもって、本ポリシーに同意したものとみなします。
          </p>
        </section>

        <div className="mt-8 border-t border-slate-200 pt-4 text-xs text-slate-500">最終更新日: 2026-02-11</div>

        <div className="mt-4">
          <Link href="/" className="text-sm font-medium text-blue-700 hover:text-blue-800">
            トップへ戻る
          </Link>
        </div>
      </article>
    </div>
  );
}
