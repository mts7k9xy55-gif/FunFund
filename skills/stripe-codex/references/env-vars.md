# Stripe Env Variables

Use these keys for this repository.

## Required

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_CONVEX_URL`

## Optional

- `STRIPE_PUBLISHABLE_KEY`

## Validation Rules

- Treat values as missing when empty or ending with `...`.
- Never commit real secret values.
- Keep secrets in `.env.local` for local dev and hosting secret manager for deploy.

