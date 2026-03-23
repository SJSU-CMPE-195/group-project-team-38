# MediTag

prototype demo video: https://drive.google.com/file/d/1YfGoS5vbexodfIoVxzfteH9brpYm94rh/view?usp=sharing

MediTag is an AI-assisted patient safety verification system for medication workflows. The prototype combines a native nurse-facing app, a web admin review dashboard, and a shared Convex backend that handles authentication, patient context, verification logic, scan logging, and optional AI-generated explanation text.

## Team

- Gurshan Warya (`gursheyss`)
- Binh Nguyen (`ntnbinh`)
- Jonathan Nguyen (`jonathanguven`)

## Prerequisites

- Bun `1.3.7`
- Node.js `20+`
- Convex CLI and a Convex account
- Web browser for the Next.js app
- For native development:
  - Expo SDK `54` toolchain
  - Xcode + iOS Simulator, or Android Studio + Android Emulator
  - Maestro CLI for native E2E flows
- Optional for live AI explanation generation:
  - Anthropic API key, or
  - OpenAI API key

## Installation

1. Clone the repository and move into the project root.
2. Install workspace dependencies:

```bash
bun install
```

3. Configure Convex for local development:

```bash
bun run dev:setup
```

4. Create or review the environment files:

- `packages/backend/.env.local`
- `apps/web/.env`
- `apps/native/.env`

## Configuration

### Backend

File: `packages/backend/.env.local`

```dotenv
BETTER_AUTH_SECRET=your-local-better-auth-secret
SITE_URL=http://localhost:3001
NATIVE_APP_URL=meditag://
AI_PROVIDER=
AI_MODEL=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
CONVEX_DEPLOYMENT=
```

- `BETTER_AUTH_SECRET` should be a long local development secret.
- `SITE_URL` should match the local web app URL.
- `NATIVE_APP_URL` must match the Expo scheme used by the native app.
- Set `AI_PROVIDER` to `anthropic` or `openai`.
- Set `AI_MODEL` to a model name that matches the provider.
- Only provide the API key for the provider you are actually using.
- `bun run dev:server` and `cd packages/backend && bun run dev` preload `packages/backend/.env.local` before starting `convex dev`.

### Web

File: `apps/web/.env`

```dotenv
NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3210
NEXT_PUBLIC_CONVEX_SITE_URL=http://127.0.0.1:3211
```

### Native

File: `apps/native/.env`

```dotenv
EXPO_PUBLIC_CONVEX_URL=http://127.0.0.1:3210
EXPO_PUBLIC_CONVEX_SITE_URL=http://127.0.0.1:3211
```

- Keep the Convex URLs aligned across backend, web, and native.
- For local Convex auth, the app URL stays on `http://127.0.0.1:3210` and the site URL stays on `http://127.0.0.1:3211`.

## Quick Demo Setup

1. Start the backend:

```bash
bun run dev:server
```

2. In another terminal, seed the canonical demo data:

```bash
bun run seed:demo
```

3. Start the web app:

```bash
bun run dev:web
```

4. Start the native app:

```bash
bun run dev:native
```

5. Use the seeded demo accounts:

```text
Admin dashboard
Email: admin-demo@meditag.test
Password: meditag-demo-123

Native nurse flow
Email: nurse-demo@meditag.test
Password: meditag-demo-123
```

Demo order:

1. Welcome screen
2. Sign in
3. Native safe nurse workflow
4. Deterministic pass result
5. Web admin review dashboard
6. Optional AI explanation discussion or validated conflict flow

## Running the Application

Start the full monorepo:

```bash
bun run dev
```

Run surfaces individually:

```bash
bun run dev:server
bun run dev:web
bun run dev:native
```

Default local URLs:

- Web app: `http://localhost:3001`
- Convex app URL: `http://127.0.0.1:3210`
- Convex site URL: `http://127.0.0.1:3211`

## Usage

### Native nurse workflow

1. Open the native app.
2. Tap `Log In`.
3. Sign in with the seeded nurse credentials or your own local account.
4. Start the wristband scan flow.
5. On the iOS Simulator, use the built-in demo wristband buttons.
6. Review patient context.
7. Select the medication to verify.
8. Run deterministic verification.
9. If the scenario fails, request AI explanation text.

### Web admin workflow

1. Open the web app at `http://localhost:3001`.
2. Navigate to the dashboard.
3. Sign in with `admin-demo@meditag.test` / `meditag-demo-123`, or use the demo admin button.
4. Filter and inspect verification details.

## Validation

Validation commands:

```bash
bun run check
bun run check-types
cd packages/backend && bun run test
bun run test:e2e:web
bun run test:e2e:native
bun run test:e2e:native:demo
```

## Project Structure

- `apps/native` - Expo / React Native nurse-facing application
- `apps/web` - Next.js admin review dashboard
- `packages/backend` - Convex backend functions, auth, schema, seed data, and tests
- `packages/env` - Shared environment validation
- `packages/config` - Shared TypeScript and workspace config
- `docs` - Architecture, scope, and testing documentation
- `scripts` - Repository setup and utility scripts

## Troubleshooting

### Convex auth works in one app but not the other

- Check that `*_CONVEX_URL` is `http://127.0.0.1:3210`.
- Check that `*_CONVEX_SITE_URL` is `http://127.0.0.1:3211`.
- Check that `NATIVE_APP_URL=meditag://` is set in `packages/backend/.env.local`.

### Native sign-in succeeds but the nurse flow does not load

- Re-run the canonical seed:

```bash
bun run seed:demo
```

- Confirm the seeded nurse account is being used.
- Confirm Convex is still running locally.

### Native Maestro flows fail before the app launches

- Make sure Maestro CLI is installed and on `PATH`.
- Make sure Xcode and an iPhone simulator are available.
- Run:

```bash
cd apps/native
bun run e2e:prepare
bun run e2e:doctor
```

- Dismiss any iOS system alerts on the simulator and rerun.

### AI explanation flow does not generate text

- Verify `AI_PROVIDER`, `AI_MODEL`, and the matching API key are set in `packages/backend/.env.local`.
- Do not put backend AI keys in `apps/web/.env` or `apps/native/.env`.
