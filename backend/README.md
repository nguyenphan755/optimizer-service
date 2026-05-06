# Backend Service

Backend runtime lives in `backend`.

## Database location

Database assets are centralized at the repository root:

- `database/migrations`
- `database/seeds`
- `database/schemas`
- `database/scripts`

## Useful commands

Run from repository root:

- `npm run dev:backend`
- `npm run migrate`
- `npm run seed`

Run directly from `backend`:

- `npm run dev`
- `npm run migrate`
- `npm run db:migrate-003` ... `npm run db:migrate-010`
