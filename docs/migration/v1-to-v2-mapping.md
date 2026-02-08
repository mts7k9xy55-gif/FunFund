# v1 to v2 Mapping (Initial Draft)

## Purpose

This document defines deterministic mapping rules for zero-downtime migration.
It is the source of truth for backfill jobs and dual-write validation.

## Table Mapping

| v1 table | v2 table | Rule |
| --- | --- | --- |
| `users` | `users` | `userId -> clerkUserId`, preserve display fields |
| `rooms` | `rooms` | carry status/subscription fields; default `evaluationMode=open` |
| `roomMembers` | `roomMembers` | direct mapping with role normalization |
| `threads` | `threads` | direct mapping; `title` fallback to `type` |
| `messages` | `threadMessages` | direct mapping for room/thread scoped messages |
| `evaluations` | `evaluations` | direct mapping, preserve weighted score |
| `distributionProposals` | `distributionProposals` | direct mapping |
| `publicPreviews + items` | `publicProjects` | join records; item visibility controls v2 visibility |
| `groups` | `groups` | direct mapping |
| `connections` | `connections` | direct mapping |
| `items` | `legacyItems` | direct mapping for backward compatibility |

## Enum Normalization

- Room status: unchanged (`draft`, `active`, `past_due`, `canceled`)
- Visibility:
  - v1 `public` -> v2 `public`
  - v1 `group`/`dm` -> v2 `private`

## Backfill Defaults

- Missing timestamp fields: set to migration execution timestamp.
- Missing `evaluationMode` in rooms: set to `open`.
- Missing project description in previews: fallback to source item content.

## Validation Checks

1. Row count parity for core tables (`users`, `rooms`, `threads`, `evaluations`).
2. Key integrity: every v2 foreign key resolves.
3. Aggregate parity:
   - room member counts
   - average evaluation score per thread
   - proposal total amounts
4. Billing parity:
   - active/past_due/canceled counts per room status
