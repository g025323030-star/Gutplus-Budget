# Gutplus Budget — Project CLAUDE.md

## Monorepo Structure

npm workspaces with three packages:

```
Gutplus Budget/
├── shared/     (@gutplus/shared) — types, enums, schemas, contracts, API endpoints
├── client/     (gutplus-budget-client) — React frontend
└── server/     (gutplus-budget-server) — Express backend
```

Root scripts:
- `npm run dev:client` / `npm run dev:server`
- `npm run build:shared` → must run before client/server builds
- `npm run build` → builds all three in correct order

## shared package

All API contracts, types, and validation live here and are shared between client and server.
Import from `@gutplus/shared` — never duplicate types in client or server.

Key exports:
- `types/` — `Transaction`, `Category`, `BudgetPlan`, `Household`, `User`, `FamilyMember`, `Account`
- `enums/` — `CategoryType` (INCOME/EXPENSE), `CategoryFrequency` (MONTHLY/YEARLY), `AccountType`, `FamilyMemberRole`
- `schemas/` — Zod schemas for all entities (validation)
- `contracts/` — API request/response types
- `endpoints.ts` — `API_PREFIX` and `ENDPOINTS` object used in both app.ts and client services

When adding a new entity or field, update `shared/` first, then rebuild: `npm run build:shared`.

## TypeScript Conventions (all packages)

- `camelCase` — variables, functions, parameters
- `PascalCase` — classes, interfaces, React components, type aliases
- `snake_case` — database table and column names (TypeORM `@Column({ name: 'snake_case' })`)
- 2-space indentation
- Single quotes for strings
- Semicolons always
- No abbreviations unless standard (e.g., `req`, `res`, `id`, `dto`)

## Data Model: Ownership Chain

All data is scoped by household:
`User → Household → (Transactions, Categories, BudgetPlans, Accounts, FamilyMembers)`

- `householdId` is always required when creating/querying resources
- A `Transaction` has no `type` field — its type (INCOME/EXPENSE) is determined by its linked `Category.type`
- `BudgetPlan` is monthly-only (`month: 1–12`, `year`)
- `Category` supports hierarchy via `parentCategoryId` (nullable self-reference)
