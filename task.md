# FunFund / Blackhole Editor Vision SPEC (Single Source of Truth)

## North Star
- Do-Based: 行動に直結しない言葉はノイズ。UIもDBも「Do」を中心に設計する。
- Fractal Reputation: 評価の評価…の無限ネスト。影響は減衰係数で収束させる。
- AI Symbiosis: AIもusersに統合し、人間と同じ評価テーブルで淘汰・増幅される。

## Non-Negotiables (絶対に曲げない)
1) usersは human/ai を統合（roleで判別）
2) itemsが唯一の行動ログ（PROPOSAL/EVALUATION/AI_RESPONSE）
3) EVALUATIONは score(1-10)必須、reasonは任意（reasonありはボーナス）
4) 無限ネストOK。ただしweight計算はdampingで必ず収束
5) DB整合性はConvex側でinvariantチェックする（嘘を殺す）

## Stack (固定)
- Next.js App Router
- Convex
- AI: OpenAI or Gemini
- Search: Tavily

## MVP Critical Path (最小ゴール)
- items を投稿できる（PROPOSAL / AI_RESPONSE）
- EVALUATION を付けられる（親itemsへ）
- 重み(reputation/totalWeight)が計算・更新される（収束する）
- 一覧UIで「重い順」に見える（Doが前に出る）
