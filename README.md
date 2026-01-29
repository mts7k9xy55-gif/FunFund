# FunFund

A crowdfunding platform built with Next.js, Supabase, and Vercel.

## Tech Stack

- **Frontend**: Next.js 16 with App Router, TypeScript, Tailwind CSS
- **Backend/Database**: Supabase (PostgreSQL with Row Level Security)
- **Deployment**: Vercel with GitHub Actions CI/CD

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- Supabase account
- Vercel account

### Environment Setup

1. Copy the environment example file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in your Supabase credentials in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

### Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the migration file located at `supabase/migrations/00001_initial_schema.sql` in the Supabase SQL Editor

### Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Project Structure

```
src/
├── app/              # Next.js App Router pages
├── lib/
│   └── supabase/     # Supabase client configuration
│       ├── client.ts # Browser client
│       └── server.ts # Server client
├── types/
│   └── database.ts   # TypeScript types for database
└── middleware.ts     # Auth middleware
```

## Database Schema

The application uses three main tables:

- **profiles**: User profiles extending Supabase auth
- **projects**: Crowdfunding campaigns/projects
- **contributions**: Donations to projects

## Deployment

### Vercel Setup

1. Connect your GitHub repository to Vercel
2. Add the following secrets to your GitHub repository:
   - `VERCEL_TOKEN`: Your Vercel API token
   - `VERCEL_ORG_ID`: Your Vercel organization ID
   - `VERCEL_PROJECT_ID`: Your Vercel project ID
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key

### CI/CD

The project includes GitHub Actions workflows for:
- **CI**: Runs lint and build checks on every push and PR
- **Vercel Deploy**: Automatic deployments to Vercel
  - Preview deployments for PRs
  - Production deployments for main branch

## License

MIT
