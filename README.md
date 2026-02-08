# FunFund

A crowdfunding platform with weighted evaluation system, built with Next.js and Convex.

## Tech Stack

- **Frontend**: Next.js 16 with App Router, TypeScript, Tailwind CSS
- **Backend/Database**: Convex (real-time backend with automatic TypeScript types)
- **Deployment**: Vercel with GitHub Actions CI/CD

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- Convex account
- Vercel account

### Environment Setup

1. Copy the environment example file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in your Convex deployment URL in `.env.local`:
   ```
   NEXT_PUBLIC_CONVEX_URL=your-convex-deployment-url
   ```

3. (v2 parallel rebuild) Optional runtime feature flags:
   ```
   NEXT_PUBLIC_V2_ROOM_ENABLED=true
   NEXT_PUBLIC_V2_BILLING_ENABLED=true
   NEXT_PUBLIC_V2_LEGACY_ENABLED=true
   NEXT_PUBLIC_WEIGHTS_V2_ENABLED=true
   NEXT_PUBLIC_DECISION_V2_ENABLED=true
   NEXT_PUBLIC_PAYOUTS_V1_ENABLED=true
   ```
   - Defaults: `room=true`, `billing=true`, `legacy=true`, `weights=true`, `decision=true`, `payouts=true`.

### Convex Setup

1. Create a Convex account at [convex.dev](https://convex.dev)
2. Run `npx convex dev` to initialize and deploy your Convex functions
3. The schema will be automatically deployed

### Development

```bash
npm install
npx convex dev  # Start Convex in development mode (in a separate terminal)
npm run dev     # Start Next.js development server
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Project Structure

```
src/
├── app/              # Next.js App Router pages
├── lib/
│   └── convex.tsx    # Convex client provider
src_v2/
├── features/         # v2 UI and feature modules
└── server/           # v2 server-side service layer (billing, etc.)
convex/
├── schema.ts         # Database schema definition
├── profiles.ts       # Profile queries and mutations
├── proposals.ts      # Proposal queries and mutations
└── evaluations.ts    # Evaluation queries and mutations with weighted scoring
convex_v2/
└── schema.ts         # v2 normalized schema blueprint (parallel rebuild)
```

## Database Schema

The application uses three main tables:

- **profiles**: User profiles with authentication integration
- **proposals**: Funding proposals/campaigns
- **evaluations**: Weighted evaluations for proposals with 5 criteria (innovation, feasibility, impact, team, presentation)

### Weighted Scoring System

Each evaluation includes scores (1-5) and weights for:
- Innovation (革新性)
- Feasibility (実現可能性)
- Impact (社会的インパクト)
- Team (チーム力)
- Presentation (プレゼンテーション)

The weighted average is calculated automatically in Convex and proposals can be ranked by their average scores.

## Deployment

### Vercel Setup

1. Connect your GitHub repository to Vercel
2. Add the following environment variables:
   - `NEXT_PUBLIC_CONVEX_URL`: Your Convex deployment URL
   - `STRIPE_SECRET_KEY`: Stripe secret key (checkout + connect onboarding)
   - `STRIPE_PRICE_ID`: Stripe price for room activation
   - `STRIPE_WEBHOOK_SECRET`: Stripe webhook signing secret
   - `PAYOUT_ADMIN_KEY`: Admin-only key used for `/api/payouts/admin/settle`

### Clerk Keys (Preview vs Production)

- Preview or development deployments may use Clerk `test` keys. In that case, the browser warning about development keys is expected.
- For production deployments, set Clerk `live` keys (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`) to remove the warning and production limits.

### Trial Payout Mode

- Trial phase supports both payout account registration methods:
  - Stripe Connect onboarding (`/api/payouts/stripe/onboard`)
  - Bank account registration (`/api/payouts/bank/register`)
- In trial mode, payout execution is ledger-based:
  - create requests at `/api/payouts/request`
  - settle manually at `/api/payouts/admin/settle`
- This keeps accidental transfer risk low while UX and business rules are being tuned.

### Preview Deployments and Manifest Icons

- Vercel Preview Protection (SSO/password) may return `401` for `/manifest.json` and icon URLs when fetched by browser manifest checks.
- In this project, PWA manifest linking is disabled on Vercel preview deployments to avoid false icon warnings.
- Validate icon/manifest behavior on a production deployment URL (or with preview protection disabled) for final confirmation.

### Convex Deployment

```bash
npx convex deploy
```

## v2 Rebuild Artifacts

- Architecture decision record:
  - `docs/adr/0001-v2-rebuild-architecture.md`
- Data migration mapping draft:
  - `docs/migration/v1-to-v2-mapping.md`
- New runtime entrypoints:
  - `/public` and `/public/[id]` use v2 catalog/detail pages.
  - `/room` can switch between v1/v2 by feature flags.
- New billing service layer:
  - `src_v2/server/billing/*`

### CI/CD

The project includes GitHub Actions workflows for:
- **CI**: Runs lint and build checks on every push and PR
- **Vercel Deploy**: Automatic deployments to Vercel

## License

MIT
