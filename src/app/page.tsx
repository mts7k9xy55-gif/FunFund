import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[linear-gradient(150deg,#f8fbff_0%,#fefcf8_50%,#f8fff9_100%)]">
      <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            FunFund
          </p>
          <h1 className="mt-4 text-3xl font-black leading-tight text-slate-900 sm:text-5xl">
            使える議論の場から、実行できる支援まで。
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
            FunFundは「議論して終わり」にしないための作業場です。Roomを作成して招待で参加し、
            理由付きの意見を重ねて合意形成を進めます。
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/room"
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Roomで作成・参加
            </Link>
            <Link
              href="/privacy"
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              プライバシーポリシー
            </Link>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">01</p>
            <h2 className="mt-3 text-xl font-bold text-slate-900">できること</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Room作成、スレッド作成、意思決定ログ記録を最短手順で実行できます。
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">02</p>
            <h2 className="mt-3 text-xl font-bold text-slate-900">
              建設的な議論・意思決定
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              提案理由と評価理由を明示して、判断を記録。誰が何を根拠に決めたかを残せます。
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">03</p>
            <h2 className="mt-3 text-xl font-bold text-slate-900">財政支援を円滑に</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              口座情報登録、表示、送金リクエストを同じ画面で処理。寄付や支援実行の詰まりを減らします。
            </p>
          </article>
        </section>
      </main>
    </div>
  );
}
