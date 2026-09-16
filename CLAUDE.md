# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Arcade Vault — a platform to play games online and compete for the highest score (per README.md, in Spanish).

This repo follows Spec Driven Design using the `/spec` and `/spec-impl` workflow from https://github.com/Klerith/fernando-skills. Install the skills with:

```bash
npx skills@latest add Klerith/fernando-skills
```

## Commands

- `npm run dev` — start the dev server (Next.js)
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — ESLint (flat config in `eslint.config.mjs`, extends `eslint-config-next` core-web-vitals + typescript)

There is no test runner configured yet.

## Architecture

- Next.js App Router (`app/`), TypeScript, Tailwind CSS v4 (via `@tailwindcss/postcss`), React 19.
- Path alias `@/*` maps to the repo root (`tsconfig.json`).
- Currently a fresh `create-next-app` scaffold (`app/layout.tsx`, `app/page.tsx`) — no game/vault-specific code, routes, or data layer exist yet.

## Critical: read framework docs before coding

This project pins a Next.js version whose APIs/conventions may diverge from training data. Per `AGENTS.md`, before writing any Next.js code, read the relevant guide under `node_modules/next/dist/docs/` (resolved relative to `AGENTS.md`'s directory — in monorepos this package may not be visible from the repo root). Pay attention to deprecation notices.
