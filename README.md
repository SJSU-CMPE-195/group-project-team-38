# MediTag

MediTag is an AI-assisted patient safety verification system built around QR/NFC scanning, clinician workflows, and a shared Convex backend for web and native clients.

## Team

- Gurshan Warya (gursheyss)
- Binh Nguyen (ntnbinh)
- Jonathan Nguyen (jonathanguven)

## Prerequisites

- Bun `1.3.7` or later
- Node.js `20+`
- A Convex account and the Convex CLI flow used by `bun run dev:setup`
- Expo Go or an iOS Simulator / Android Emulator for the native app
- An OpenAI or Anthropic API key if you want to enable backend AI explanations

## Installation

1. Clone the repository and move into the project directory.
2. Install dependencies:

```bash
bun install
```

3. Configure the Convex backend for local development:

```bash
bun run dev:setup
```

4. Review the environment files in `packages/backend/.env.local`, `apps/web/.env`, and `apps/native/.env` before starting the apps.

## Configuration

The project uses separate environment files for the backend, web app, and native app.

Backend: `packages/backend/.env.local`

```dotenv
BETTER_AUTH_SECRET=meditag-local-dev-auth-secret-32-chars
SITE_URL=http://localhost:3001
NATIVE_APP_URL=meditag://
AI_PROVIDER=
AI_MODEL=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
CONVEX_DEPLOYMENT=
```

Web: `apps/web/.env`

```dotenv
NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3210
NEXT_PUBLIC_CONVEX_SITE_URL=http://127.0.0.1:3211
```

Native: `apps/native/.env`

```dotenv
EXPO_PUBLIC_CONVEX_URL=http://127.0.0.1:3210
EXPO_PUBLIC_CONVEX_SITE_URL=http://127.0.0.1:3211
```

Notes:

- Set `AI_PROVIDER` to `openai` or `anthropic`.
- Set `AI_MODEL` to the model name that matches your chosen provider.
- Provide only the API key required for the provider you selected.
- Keep the Convex URLs aligned across backend, web, and native when using a non-default deployment.
- Keep `NATIVE_APP_URL` aligned with the Expo scheme in `apps/native/app.json` so native Better Auth sign-in is accepted.

## Running the Application

Start the full monorepo:

```bash
bun run dev
```

Run individual targets:

```bash
bun run dev:web
bun run dev:native
bun run dev:server
```

The web app runs on `http://localhost:3001`.

## Usage

- Open the web app in a browser to access the Next.js client.
- Run the native app through Expo for the nurse-facing mobile workflow.
- Use the scan and verification flows to test patient checks, medication checks, and AI-generated safety explanations.
- Seed demo data when needed:

```bash
bun run seed:demo
```

## Project Structure

- `apps/web`: Next.js web application
- `apps/native`: Expo / React Native mobile application
- `packages/backend`: Convex backend functions, auth setup, schema, and tests
- `packages/env`: Shared environment validation for web and native apps
- `packages/config`: Shared TypeScript configuration
- `docs`: Project documentation, architecture notes, and testing guides
- `scripts`: Repository scripts such as docs listing and setup helpers
