# Agent Guide

## Repository

- The repository currently contains one application under `client/`; there is no root package manifest or backend implementation.
- This is a React 19 + TypeScript + Vite app. The runtime entrypoint is `client/src/main.tsx`, which renders `App` and the canvas UI.
- Canvas behavior is split between `client/src/components/Canvas.tsx` (React lifecycle/UI) and `client/src/canvas/` (imperative engine, editor state, tools, scene model, and renderer). Keep drawable data in `Scene`; `CanvasRenderer` is a pure redraw layer.
- Use the `@/` import alias for paths under `client/src`; it is defined in `client/tsconfig.app.json` and resolved by `client/vite.config.ts`.
- `docs/architecture.md` describes planned FastAPI/PostgreSQL/WebSocket components, but those components are not present in the current tree.

## Commands

- Run commands from `client/`.
- Install locked dependencies with `npm ci`.
- Start the dev server with `npm run dev`.
- Run ESLint with `npm run lint`.
- Run the production typecheck and Vite build with `npm run build`; `tsc -b` runs before `vite build`.
- There is no test script or test runner configured. Use focused linting/build checks for changes.

## Conventions

- TypeScript uses strict unused-local and unused-parameter checks, `noEmit`, bundler module resolution, and `erasableSyntaxOnly`; unused code will fail `npm run build`.
- Prettier is configured with semicolons, double quotes, trailing commas, a 100-column print width, and two-space indentation. No formatting script is defined, so invoke the local formatter directly when needed: `npx prettier --write <files>`.
