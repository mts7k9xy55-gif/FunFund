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
convex/
├── schema.ts         # Database schema definition
├── profiles.ts       # Profile queries and mutations
├── proposals.ts      # Proposal queries and mutations
└── evaluations.ts    # Evaluation queries and mutations with weighted scoring
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

### Convex Deployment

```bash
npx convex deploy
```

### CI/CD

The project includes GitHub Actions workflows for:
- **CI**: Runs lint and build checks on every push and PR
- **Vercel Deploy**: Automatic deployments to Vercel

## License

MIT
