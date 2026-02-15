# FunFund

FunFundは、チーム内で企画を立てて、返信しながら議論し、必要なら資金コミットまで進めるためのアプリです。

## Stack

- Next.js 16 (App Router)
- Convex
- Clerk
- Tailwind CSS
- Vercel

## Local Development

```bash
npm install
npx convex dev
npm run dev
```

Open: `http://localhost:3000`

## Main Routes

- `/` : トップ
- `/room` : ルーム選択 / 広場 / チーム
- `/room/[roomId]/thread/[threadId]` : スレッド詳細（返信・議論・コミット）

## Deploy

```bash
npx convex deploy
vercel --prod
```
