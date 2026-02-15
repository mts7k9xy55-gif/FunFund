import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <article className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">利用規約</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          本サービスは Room 内の議論・返信・資金支援コミュニケーションを目的としています。法令違反、公序良俗違反、第三者の権利侵害に当たる利用を禁止します。
        </p>

        <section className="mt-8 space-y-4 text-sm leading-7 text-slate-700">
          <h2 className="text-base font-semibold text-slate-900">1. アカウント管理</h2>
          <p>ユーザーは自己の責任でアカウント情報を管理し、第三者への不正利用を防止してください。</p>

          <h2 className="text-base font-semibold text-slate-900">2. 投稿と評価</h2>
          <p>投稿・評価内容に関する責任は投稿者に帰属します。運営は違反投稿を削除する場合があります。</p>

          <h2 className="text-base font-semibold text-slate-900">3. 課金</h2>
          <p>有料機能は Stripe を通じて提供されます。返金・キャンセル条件は契約内容と法令に従います。</p>

          <h2 className="text-base font-semibold text-slate-900">4. サービス変更</h2>
          <p>運営は品質維持のため、機能の追加・変更・停止を行う場合があります。</p>
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
