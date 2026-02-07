# Rebuild Progress (M0-M7)

## Completed

- [x] M0 blueprint + ADR freeze seed
- [x] v2 parallel runtime entrypoints and feature flags
- [x] v2 billing service layer wired into `/api/stripe/*`
- [x] v2 Convex API modules added (`v2Public`, `v2Room`, `v2Migration`)
- [x] migration metadata tables added (`migrationBackfillState`, `dualWriteFailures`, `stripeWebhookEvents`)
- [x] prod/dev Convex deploy completed

## In Progress

- [ ] M2 public metrics enrichment from real evaluation/funding model
- [ ] M3 room UX completion (replace remaining v1 dashboard dependencies)
- [ ] M4 legacy feature full parity via v2 endpoints
- [ ] M5 webhook retry queue processor and reconciliation

## Pending

- [ ] M6 dual-write activation hooks in all critical mutations
- [ ] M6 backfill worker automation and parity checker
- [ ] M7 phased cutover runbook + rollback drills
- [ ] strict no-warning lint profile and full E2E suite
