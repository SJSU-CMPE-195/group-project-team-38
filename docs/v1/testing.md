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

## Web admin review flows (Playwright)

The deeper browser coverage now lives in `apps/web/tests/e2e/admin-review.spec.ts` and runs as part of the same command:

```sh
bun run test:e2e:web
```

Those tests cover the MediTag-specific review behavior that matters for V1:

- recent scan-event rendering
- result/date/search filtering
- detail drill-in
- deterministic failure reason display
- explanation status/text display

To keep the suite reliable without needing a fully bootstrapped Convex auth/admin session, Playwright starts the Next.js dev server with `NEXT_PUBLIC_E2E_ADMIN_FIXTURE=1` and opens `/dashboard?fixture=admin-review` for the deeper portal assertions.

That fixture mode is **only** for browser-test stability. It exercises the actual dashboard UI behavior, but it does not replace manual end-to-end checks against a live local backend.

For a live local admin-review check, run Convex + seed data, sign in with an admin account in the browser, and use the normal `/dashboard` route.

## Native smoke check (Maestro)

Run from the repo root:

```sh
bun run test:e2e:native
```

Maestro lives in `apps/native/.maestro/`.

### Required local prerequisites

The native smoke command now prepares the simulator and installs the app for you. The required local prerequisites are:

1. Maestro CLI is installed and available on `PATH`
2. Xcode is installed with at least one iPhone simulator available
3. The simulator is in a clean enough state that system setup alerts are not blocking the app launch flow

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

The smoke flow now attempts to dismiss common blocking startup alerts (`Not Now`, `Cancel`, `Continue`, `OK`) before asserting app content. If your simulator still lands on an Apple Account or onboarding modal, dismiss it once manually or erase/sign out that simulator before rerunning.

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

## Practical local validation loop

For repeated stabilization passes, this is the supported repo-level loop:

1. Start the backend and reseed demo data when needed:

```sh
bun run dev:server
# in another terminal
bun run seed:demo
```

2. Run the app surfaces you are actively checking:

```sh
bun run dev:web
bun run dev:native
```

3. Run the validation commands from the repo root:

```sh
bun run check
bun run check-types
cd packages/backend && bun run test
bun run test:e2e:web
bun run test:e2e:native
```

4. For the full native nurse journey instead of the shallow smoke flow:

```sh
bun run test:e2e:native:demo
```

Notes:

- `bun run check-types` is the canonical repo command even though Turbo currently has no package-level `check-types` tasks wired yet.
- `bun run test:e2e:web` is reliable without a live backend because it includes the unauthenticated smoke path and the fixture-backed admin review path.
- Native Maestro flows still require local simulator tooling and, for the deeper nurse flows, a reusable nurse login plus seeded demo data.
