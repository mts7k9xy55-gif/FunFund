---
name: stripe-codex
description: Stripe integration workflow for local and deploy environments with Next.js + Convex. Use when Codex needs to set up or verify Stripe keys, webhook config, checkout route wiring, and room subscription status updates in this repository.
---

# Stripe Codex

## Overview

Make Stripe setup repeatable for this repo by using one fixed flow:
1. Verify required files and env vars.
2. Fill missing Stripe values without committing secrets.
3. Run local webhook forwarding and event tests.
4. Re-check status before deploy.

## Workflow

1. Run `scripts/verify_stripe_setup.sh`.
2. If keys are missing, ask user for real values and update `.env.local` only.
3. If source files are missing, implement or repair them:
   - `src/app/api/stripe/checkout/route.ts`
   - `src/app/api/stripe/webhook/route.ts`
   - `convex/stripe.ts`
4. Run `scripts/verify_stripe_setup.sh` again to confirm.
5. For local webhook testing, run:
   - `stripe listen --forward-to localhost:3000/api/stripe/webhook`
   - `stripe trigger checkout.session.completed`
   - `stripe trigger invoice.paid`
6. When deploy target exists, ensure the same required env vars are set in hosting and Stripe webhook endpoint points to deployed URL.

## Required Env Vars

Load details from `references/env-vars.md`.

## Repository-Specific Notes

- Keep `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` out of git.
- Room status transitions expected:
  - `invoice.paid` -> `active`
  - `invoice.payment_failed` -> `past_due`
  - `customer.subscription.deleted` -> `canceled`
- Existing project references:
  - `/Users/yutoinoue/Desktop/FunFund-final/STRIPE_SETUP.md`
  - `/Users/yutoinoue/Desktop/FunFund-final/STRIPE_IMPLEMENTATION.md`

