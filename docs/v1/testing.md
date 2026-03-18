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

The initial smoke test only checks that the existing `/` page renders and exposes the basic shell:

- page title contains `meditag`
- `API Status` is visible
- the home page ASCII banner renders

The web smoke check now tolerates the auth backend being offline during local setup, so the page can still render a disconnected shell while deeper app work is still in progress.

## Native smoke check (Maestro)

Run from the repo root:

```sh
bun run test:e2e:native
```

Maestro lives in `apps/native/.maestro/`.

### Required local prerequisites

The current native smoke flow assumes all of the following are true:

1. Maestro CLI is installed and available on `PATH`
2. Xcode is installed
3. An iOS simulator is booted
4. The Expo native app is installed on the simulator with bundle id `com.meditag.native`

Typical local sequence:

```sh
cd apps/native
bun run prebuild
bun run ios
bun run e2e:doctor
bun run e2e:smoke
```

### Current smoke target

The initial smoke flow only checks that the app launches and the current home screen shows:

- `Meditag`
- `API Status`

If the simulator app is not installed yet, Maestro will fail at launch time. That failure is expected until the native build prerequisite is satisfied.
