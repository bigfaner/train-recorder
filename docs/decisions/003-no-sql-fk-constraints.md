---
date: 2026-05-10
status: accepted
category: data
---

# ADR-003: No SQL Foreign Key Constraints

## Decision

Define all table relationships in the schema without SQL `FOREIGN KEY` / `REFERENCES` constraints. Referential integrity is maintained at the application layer (Repository + Use Cases).

## Context

SQLite supports FK constraints but they must be explicitly enabled per-connection (`PRAGMA foreign_keys = ON`). SQLDelight on KMP adds complexity around cross-platform FK behavior.

## Alternatives Considered

| Approach | Pros | Cons |
|----------|------|------|
| SQL FK constraints | Database enforces integrity | Must enable per-connection, platform-specific edge cases, complicates testing |
| Application-layer integrity | Full control, easier testing | No database-level protection |

## Rationale

- KMP targets (Android SQLite, iOS SQLite) have different default FK pragma behavior
- Application layer already handles cascade operations (delete plan → delete training days → delete exercises)
- Simpler schema SQL that works identically across platforms
- Tests can use in-memory SQLite without FK pragma setup

## Consequences

- Database accepts orphaned rows if application logic has bugs
- All cascade deletes must be explicitly coded in Repository implementations
- Indexes on FK columns still created for query performance
