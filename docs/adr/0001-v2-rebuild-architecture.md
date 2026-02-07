# ADR-0001: v2 Parallel Rebuild Architecture

- Date: 2026-02-07
- Status: Accepted
- Owner: FunFund Core Team

## Context

v1 has mixed concerns across Room flows, legacy items flows, and billing integrations.
Lint quality is below release bar, and runtime warning/noise occurs in preview environments.
We need a full rebuild while preserving public URLs and avoiding downtime.

## Decision

1. Build v2 in parallel under `src_v2/` and `convex_v2/`.
2. Keep `/`, `/public`, `/public/[id]`, `/room`, `/api/stripe/*` stable.
3. Introduce runtime feature flags to route traffic between v1 and v2.
4. Move billing logic to a dedicated service layer under `src_v2/server/billing/`.
5. Use zero-downtime migration with dual-read/dual-write and backfill jobs.

## Consequences

### Positive
- High-risk refactor is isolated from active flows.
- URL and user expectations remain stable.
- Migration can be staged with quick rollback.

### Negative
- Temporary duplication between v1 and v2.
- Operational complexity during dual-write period.

## Follow-up

- ADR-0002: Data migration and backfill rules.
- ADR-0003: Billing idempotency and webhook retries.
- ADR-0004: Legacy features retirement criteria.
