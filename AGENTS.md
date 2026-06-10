# AGENTS.md

## Project Overview

This project appears to be a Telegram bot (`@Okoneitor_bot`) using the Telegram Bot API, Google Gemini API, and Supabase (project: `yfdwtfricvquakrtarey`). Source code is not yet present in the repository.

---

## Build / Lint / Test Commands

*(Update these once a build system is in place. Below are common conventions for Node.js/TypeScript bot projects.)*

```bash
# Install dependencies
npm install

# Development
npm run dev          # run with hot-reload (nodemon/ts-node-dev)
npm run start        # production start

# Linting & Formatting
npm run lint         # ESLint
npm run lint:fix     # auto-fix
npm run format       # Prettier

# Type checking
npm run typecheck    # tsc --noEmit

# Testing
npm test             # run all tests
npm run test:watch   # watch mode
npm run test:cov     # coverage report

# Run a single test file
npm test -- path/to/file.test.ts
```

### Testing Framework
- **Vitest** is recommended for this project (fast, ESM-native, minimal config).
- Test files go next to the module they test: `src/**/*.test.ts` or `src/**/__tests__/*.test.ts`.
- Single test run: `npx vitest run path/to/test` or `npm test -- path/to/test`.

---

## Code Style Guidelines

### Imports
- Use ES module imports (`import` / `export`), not CommonJS (`require`).
- Order imports in groups (separated by a blank line):
  1. **Node built-ins** (`fs`, `path`, `os`)
  2. **Third-party packages** (`telegraf`, `@google/generative-ai`, `@supabase/supabase-js`)
  3. **Internal modules** (use `@/` or `src/` alias)
  4. **Types** (`import type { ... }`)
- Avoid barrel files (`index.ts` that re-export everything); import directly.

### Formatting
- Single quotes, semicolons required.
- Trailing commas where valid.
- 100 character line width.
- 2-space indentation.
- Use **Prettier** with the following config:
  ```json
  { "semi": true, "singleQuote": true, "trailingComma": "all", "printWidth": 100, "tabWidth": 2 }
  ```

### Types
- **Strict TypeScript** mode (`strict: true` in `tsconfig.json`).
- Prefer `interface` over `type` for object shapes.
- Use `type` for unions, intersections, and aliases.
- Avoid `any`. Use `unknown` and narrow with type guards.
- Mark function return types explicitly (do not rely on inference for public APIs).
- Use `import type { ... }` for type-only imports to avoid runtime overhead.

### Naming Conventions
- **Files**: `kebab-case` for files (`telegram-handler.ts`), PascalCase for components/classes.
- **Variables/functions**: `camelCase`.
- **Classes/interfaces/types**: `PascalCase`. Interface names do not get an `I` prefix.
- **Constants (truly immutable)**: `UPPER_SNAKE_CASE`.
- **Environment variables**: `UPPER_SNAKE_CASE`, accessed via a config module (not `process.env` scattered everywhere).
- **Async functions**: suffix with `Async` only if a sync counterpart exists.

### Error Handling
- Use a centralized error-handling middleware for the bot (catch-all `bot.catch()`).
- Use discriminated unions or `Result<T, E>` pattern for recoverable errors instead of throwing.
- Validate environment variables at startup with a schema (e.g., `zod` or custom guard).
- Log errors with context — never log secrets or tokens.
- Use `try/catch` around async operations, especially API calls (Telegram, Gemini, Supabase).

### Project Structure
```
src/
  bot/             # Telegram bot setup & handlers
  services/        # Gemini, Supabase clients
  utils/           # helpers, formatters
  config/          # env validation, constants
  types/           # shared types
```

### Security
- **Never commit secrets or API keys.** Use a `.env` file (gitignored) loaded at runtime.
- The file `Docs/Keys.txt` contains exposed credentials — it should be deleted and the secrets rotated.
- Validate all user input before processing.
- Use `bot.use(..)` session middleware carefully — do not store sensitive data in session.

### Git
- Branch naming: `feat/description`, `fix/description`, `chore/description`.
- Commit messages: conventional commits format (`feat:`, `fix:`, `chore:`, `refactor:`).
- Keep commits focused — one logical change per commit.

### What to Avoid
- Do not use `require()` / CommonJS in new code.
- Do not use `console.log` in production — use a logger (`pino`, `winston`).
- Do not use `moment` — use `date-fns` or native `Temporal` / `Intl`.
- Do not put business logic in route/handler files — extract to services.
- Do not leave `TODO` comments without an associated issue or ticket.
