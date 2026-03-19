# meditag

## Features

- **TypeScript** - For type safety and improved developer experience
- **Next.js** - Full-stack React framework
- **React Native** - Build mobile apps using React
- **Expo** - Tools for React Native development
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **shadcn/ui** - Reusable UI components
- **Convex** - Reactive backend-as-a-service platform
- **Authentication** - Better-Auth
- **Oxlint** - Oxlint + Oxfmt (linting & formatting)
- **Turborepo** - Optimized monorepo build system

## Getting Started

First, install the dependencies:

```bash
bun install
```

## Convex Setup

This project uses Convex as a backend. You'll need to set up Convex before running the app:

```bash
bun run dev:setup
```

Follow the prompts to create a new Convex project and connect it to your application.

Copy the public Convex variables from `packages/backend/.env.local` to `apps/*/.env`.
Keep `AI_PROVIDER`, `AI_MODEL`, `OPENAI_API_KEY`, and `ANTHROPIC_API_KEY` in `packages/backend/.env.local` only — those backend-only values should not be copied into the native or web apps.

Then, run the development server:

```bash
bun run dev
```

If you want the canonical MediTag demo data in Convex, keep the backend running and seed it from another terminal:

```bash
bun run seed:demo
```

That command re-applies the same safe and conflict demo records, so it is the supported way to reseed local demo and testing data without piling up duplicate core records.

For backend AI explanation work, configure these backend-only variables in `packages/backend/.env.local`:

```bash
AI_PROVIDER=openai
AI_MODEL=gpt-4o-mini
OPENAI_API_KEY=...
```

Or:

```bash
AI_PROVIDER=anthropic
AI_MODEL=claude-sonnet-4-5
ANTHROPIC_API_KEY=...
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see the web application.
Use the Expo Go app to run the mobile application.
Your app will connect to the Convex cloud backend automatically.

## Native iOS Maestro demo flows

The native Maestro flows live in `apps/native/.maestro/`.

- `bun run test:e2e:native` runs the lightweight smoke flow
- `bun run test:e2e:native:demo` runs the nurse safe + conflict simulator flows

The nurse demo flows assume:

1. Convex is running and the canonical demo data has been re-seeded with `bun run seed:demo`
2. You have created a reusable nurse account in the native app once and exported its credentials for Maestro:

```bash
export MAESTRO_NURSE_EMAIL="nurse-demo@meditag.test"
export MAESTRO_NURSE_PASSWORD="replace-with-your-password"
```

3. You are running on the iOS Simulator, where the scan screen exposes seeded **Simulator demo wristbands** instead of relying on live QR camera automation

Those simulator fixtures map to the stable demo path:

- `WRISTBAND-SAFE-QR-001` → `Acetaminophen 500mg` → pass
- `WRISTBAND-CONFLICT-QR-001` → `Amoxicillin 500mg` → fail + AI explanation request

## Git Hooks and Formatting

- Format and lint fix: `bun run check`

## Project Structure

```
meditag/
├── apps/
│   ├── web/         # Frontend application (Next.js)
│   ├── native/      # Mobile application (React Native, Expo)
├── packages/
│   ├── backend/     # Convex backend functions and schema
```

## Available Scripts

- `bun run dev`: Start all applications in development mode
- `bun run build`: Build all applications
- `bun run dev:web`: Start only the web application
- `bun run dev:setup`: Setup and configure your Convex project
- `bun run seed:demo`: Re-apply the canonical local Convex demo seed data
- `bun run check-types`: Check TypeScript types across all apps
- `bun run dev:native`: Start the React Native/Expo development server
- `bun run check`: Run Oxlint and Oxfmt
