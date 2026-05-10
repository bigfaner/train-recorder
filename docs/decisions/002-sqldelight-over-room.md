---
date: 2026-05-10
status: accepted
category: data
---

# ADR-002: SQLDelight for Cross-Platform SQLite

## Decision

Use SQLDelight (2.x) as the SQLite abstraction layer instead of Room.

## Context

KMP architecture requires a database library that works on both Android and iOS. Room is Android-only.

## Alternatives Considered

| Approach | Pros | Cons |
|----------|------|------|
| Room (Android-only) | Mature, Jetpack integration | Not KMP-compatible |
| SQLDelight | KMP-native, type-safe SQL, compile-time checking | Less annotation magic, more SQL to write |

## Rationale

- SQLDelight generates platform-specific SQLite implementations from shared `.sq` files
- Compile-time SQL validation catches errors early
- Works with KMP's `commonMain`/`androidMain`/`iosMain` structure
- No annotation processor needed (unlike Room's kapt/ksp)

## Consequences

- SQL queries written manually in `.sq` files rather than generated from annotations
- No built-in migration helper like Room's Migration class — migrations handled manually
