# Convex v2 Blueprint

This directory is the parallel Convex design space for the full rebuild.

- `schema.ts`: normalized table design for Room-first crowdfunding with legacy compatibility.
- `_guards.ts`: auth/authorization guard primitives intended for generated v2 functions.

## Intended rollout

1. Implement generated v2 functions in this directory.
2. Run dual-read/dual-write with migration jobs.
3. Cut over feature flags to v2 runtime paths.
4. Decommission v1 Convex modules after stabilization.
