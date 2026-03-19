---
summary: "Local Playwright and Maestro harness setup for MediTag V1"
read_when:
  - Running local smoke checks before feature work
  - Setting up Playwright for the web app
  - Setting up Maestro for the native app
title: "MediTag V1 Testing Bootstrap"
---

# MediTag V1 Testing Bootstrap

This prototype starts with runnable E2E harnesses so later feature work has stable entrypoints.

## Demo reseed workflow

Before running the prototype or its E2E checks against Convex demo data, start the backend and re-apply the canonical seed from the repo root:

```sh
bun run dev:server
# in another terminal
bun run seed:demo
```

`bun run seed:demo` is the supported reseed command for local demo and test loops. It rewrites the canonical safe/conflict patients, medications, and wristbands in place so repeated runs keep the same scenarios available without creating duplicate core demo records.

If you are working on backend AI explanations, set `AI_PROVIDER`, `AI_MODEL`, and the matching provider API key in `packages/backend/.env.local` only. Do not mirror those variables into `apps/native` or `apps/web`.

## Web smoke check (Playwright)

Run from the repo root:

```sh
bun run test:e2e:web
```

Playwright lives in `apps/web` and automatically starts the Next.js dev server on port `3001`.

### First-time setup

Install the browser once:

```sh
cd apps/web
bun run e2e:install
```

### Current smoke target

The initial smoke test checks that the admin review entry screen renders without needing a live auth backend:

- page title contains `meditag`
- `Meditag Admin Review` is visible
- the unauthenticated sign-in entry renders

The web smoke check still tolerates the auth backend being offline during local setup, so the admin entry shell can render while deeper app work is still in progress.

## Native smoke check (Maestro)

Run from the repo root:

```sh
bun run test:e2e:native
```

Maestro lives in `apps/native/.maestro/`.

### Required local prerequisites

The native smoke command now prepares the simulator and installs the app for you. The only required local prerequisites are:

1. Maestro CLI is installed and available on `PATH`
2. Xcode is installed with at least one iPhone simulator available

Supported one-command flow:

```sh
cd apps/native
bun run e2e
```

Or from the repo root:

```sh
bun run test:e2e:native
```

What `bun run e2e` does:

1. boots a preferred iPhone simulator if needed
2. builds and installs the native app as `com.meditag.native`
3. runs the Maestro smoke flow

For troubleshooting or faster reruns, the lower-level commands are still available:

```sh
cd apps/native
bun run e2e:prepare
bun run e2e:doctor
bun run e2e:smoke
```

`bun run e2e:doctor` now syntax-checks every Maestro flow in `apps/native/.maestro/` without needing to boot the app.

### Current smoke target

The initial smoke flow only checks that the app launches and the current home screen shows:

- `Meditag`
- `API Status`

The first run can take a while because Expo may prebuild native files and compile a Release simulator build before Maestro starts. After `e2e:prepare` succeeds, `e2e:smoke` is the faster rerun path.

## Native nurse demo flows (Maestro)

The real nurse-path Maestro flows live alongside the smoke harness in `apps/native/.maestro/`:

- `nurse-safe-path.yaml` — sign in, inject the seeded safe wristband fixture, select `Acetaminophen 500mg`, and assert the deterministic pass state
- `nurse-conflict-ai.yaml` — sign in, inject the seeded conflict wristband fixture, select `Amoxicillin 500mg`, assert the deterministic fail state, and request AI explanation text
- `nurse-demo.yaml` — runs both nurse flows sequentially

Run them from the repo root with:

```sh
bun run test:e2e:native:demo
```

Or from `apps/native` with:

```sh
bun run e2e:demo
bun run e2e:demo:safe
bun run e2e:demo:conflict
```

### Additional local assumptions for demo flows

These flows are written for the iOS Simulator and intentionally do **not** rely on live camera automation.

1. Keep Convex running and reseed the canonical demo fixtures first:

```sh
bun run dev:server
# in another terminal
bun run seed:demo
```

2. Create a reusable nurse account manually once in the native app, then reuse those credentials for Maestro sign-in.
3. Provide those sign-in credentials to Maestro as environment variables before running the demo flows:

```sh
export MAESTRO_NURSE_EMAIL="nurse-demo@meditag.test"
export MAESTRO_NURSE_PASSWORD="replace-with-your-password"
```

4. The scan screen exposes **Simulator demo wristbands** only on iOS Simulator. Those buttons inject the seeded tokens below without bypassing any downstream patient lookup or verification logic:
   - `WRISTBAND-SAFE-QR-001` → `Acetaminophen 500mg` → deterministic pass
   - `WRISTBAND-CONFLICT-QR-001` → `Amoxicillin 500mg` → deterministic fail + AI explanation request path

If backend AI credentials are configured, the conflict flow can continue on to generated explanation text. If they are not configured, the flow still verifies that the explanation request was submitted and surfaced in the UI.
