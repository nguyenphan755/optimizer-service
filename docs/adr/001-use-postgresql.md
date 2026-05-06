# ADR 001: Use PostgreSQL

## Status
Accepted

## Context
The MES system needs transactional consistency, structured schema evolution, and mature SQL tooling.

## Decision
Use PostgreSQL as the primary relational database.

## Consequences
- Migrations and seeds are maintained under `database/migrations` and `database/seeds`.
- SQL and migration scripts are versioned in the repository.
