---
date: 2026-05-10
status: accepted
category: architecture
---

# ADR-001: KMP + Compose Multiplatform for Cross-Platform UI

## Decision

Use Kotlin Multiplatform (KMP) with Compose Multiplatform to share business logic and UI code across Android (8.0+) and iOS (15.0+).

## Context

PRD requires cross-platform mobile app with consistent core experience on Android and iOS. Project name includes "kotlin".

## Alternatives Considered

| Approach | Pros | Cons |
|----------|------|------|
| Native per-platform | Maximum platform fidelity | Doubles development work |
| Flutter | Cross-platform, mature ecosystem | Not Kotlin, conflicts with project direction |
| Android-only MVP | Faster initial delivery | Delays iOS, requires rewrite later |

## Rationale

- Single Kotlin codebase for both platforms reduces development and maintenance cost
- Compose Multiplatform enables shared declarative UI
- Business logic (Repository, Use Cases, ViewModels) fully shared in `commonMain`
- Platform-specific code limited to: SQLite driver, background timer service, local notifications

## Consequences

- iOS Compose rendering uses Canvas (not native UIKit views) — acceptable for data-centric fitness app
- iOS Compose Multiplatform maturity is evolving — may encounter platform-specific bugs
