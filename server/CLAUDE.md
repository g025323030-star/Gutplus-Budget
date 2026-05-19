# Gutplus Budget — Server CLAUDE.md

See root `CLAUDE.md` for monorepo structure and shared types.

## Stack

- Node.js + Express + TypeScript
- TypeORM + PostgreSQL (`pg`)
- Zod (validation, schemas from `@gutplus/shared`)
- bcrypt (password hashing)
- JWT in HttpOnly cookies
- nodemailer (transactional email)
- Helmet (security headers)

## Architecture

```
src/
├── controllers/    — HTTP layer: parse req, call service, return res
├── services/       — business logic, TypeORM queries
├── entities/       — TypeORM entity classes
├── dto/            — input shapes (used in controllers + Zod validation)
├── routes/         — express Router definitions
├── middlewares/    — authGuard, rollingTokenMiddleware, validate, errorHandler
├── config/         — data-source.ts (AppDataSource)
├── migrations/     — TypeORM migration files
├── seeds/          — seed.ts (dev data)
├── templates/      — email HTML templates
└── utils/          — jwt.utils, password.utils, sendEmail, etc.
```

## Controller / Service Rules

- **Controllers** only handle HTTP: read `req`, call one service method, send `res`. No TypeORM or business logic.
- **Services** handle all business logic and database access via `AppDataSource.getRepository(Entity)`.
- Both are **Classes**, exported as **singletons**: `export const userService = new UserService();`
- Import singleton instances — never instantiate in controllers or routes.

```ts
// correct
export class UserService { ... }
export const userService = new UserService();

// in controller
import { userService } from '../services';
```

## API Response Structure

Always use these shapes — never return raw entity objects:

```ts
// Success
{ success: true, data: ... }

// Success with message only
{ success: true, message: '...' }

// Error (handled by global errorHandler middleware)
{ success: false, message: '...', error: '...' }  // error only in development
```

## Error Handling

- Services **throw** descriptive `Error` objects — do not catch inside the service.
- Controllers pass errors to `next(error)` — never catch and swallow in a controller.
- The global `errorHandler` middleware in `middlewares/error.middleware.ts` catches everything and returns a 500 response.
- Never send sensitive info (passwords, tokens) in API responses.

## Middleware Stack (order in app.ts)

1. `cors` — allow `localhost:5173`, credentials: true
2. `rollingTokenMiddleware` — rolling JWT refresh (runs before auth guard)
3. `helmet` — security headers
4. `express.json()` + `express.urlencoded()`
5. Route-level: `authGuard` on all routes except `/users` and `/tokens`
6. `errorHandler` — last middleware

## Auth

- JWT stored in HttpOnly cookie (`cookieOptions` from `utils/jwt.utils.ts`)
- `authGuard` middleware verifies the cookie and sets `req.user`
- `rollingTokenMiddleware` extends the cookie on each request
- Passwords hashed with bcrypt via `hashPassword` / `comparePassword` in `utils/password.utils.ts`
- Password reset: token stored in `token` entity, email sent via nodemailer

## TypeORM Conventions

- Entity columns use `snake_case` names in the DB, `camelCase` in TypeScript
- Relations are loaded explicitly with `relations: ['...']` — no eager loading
- Migrations: `npm run migration:generate` → `npm run migration:run`
- Never modify existing migration files — generate a new one
- Seed: `npm run seed:run` (dev only)

## Validation

- DTOs are plain TypeScript interfaces in `dto/`
- Validation is done with Zod schemas from `@gutplus/shared` via `validate.middleware.ts`
- Always validate at the route level using the middleware before the controller method

## Routes + Endpoints

All route paths come from `ENDPOINTS` exported by `@gutplus/shared`:
```ts
import { API_PREFIX, ENDPOINTS } from '@gutplus/shared';
app.use(`${API_PREFIX}/${ENDPOINTS.transactions.base}`, authGuard, transactionRoutes);
```
Never hardcode URL strings in `app.ts` or route files — always use `ENDPOINTS`.
