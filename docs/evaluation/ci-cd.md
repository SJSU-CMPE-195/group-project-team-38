---
summary: "CI/CD pipeline overview for validation, web releases, Convex deploys, and TestFlight uploads"
read_when:
  - Configuring GitHub Actions for MediTag
  - Setting up production or staging deployment secrets
  - Releasing the iOS app to TestFlight
  - Explaining which pipelines already exist and which secrets they require
title: "CI/CD Pipelines"
---

# CI/CD Pipelines

MediTag now uses three GitHub Actions workflows:

- `ci.yml`
  - Runs repository validation on pushes and pull requests.
  - Deploys the web app to the staging Vercel project on pushes to `main` when staging secrets are configured.
- `release.yml`
  - Deploys Convex production functions.
  - Builds and deploys the production web app to Vercel.
  - Runs on manual dispatch and version tags matching `v*`.
- `testflight.yml`
  - Builds the iOS app on a macOS runner.
  - Exports an `.ipa` artifact.
  - Uploads the build to TestFlight using an App Store Connect API key.
  - Runs on manual dispatch so releases stay intentional.

## GitHub Environments

Configure at least these GitHub environments:

- `staging`
- `production`

The `testflight.yml` workflow selects one of those environments at dispatch time so the mobile build can point at the matching backend.

## Required Secrets

### Shared web deployment secrets

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

### Convex and public app URL secrets

- `CONVEX_DEPLOY_KEY`
- `CONVEX_SITE_URL`
- `NEXT_PUBLIC_CONVEX_URL`
- `NEXT_PUBLIC_CONVEX_SITE_URL`
- `EXPO_PUBLIC_CONVEX_URL`
- `EXPO_PUBLIC_CONVEX_SITE_URL`

### Apple / TestFlight secrets

- `APPLE_TEAM_ID`
- `APPSTORE_CONNECT_API_KEY_ID`
- `APPSTORE_CONNECT_API_ISSUER_ID`
- `APPSTORE_CONNECT_API_PRIVATE_KEY`

## Release Flow

### Staging web deploy

Push to `main`:

1. `ci.yml` runs repository validation.
2. The same workflow deploys the web app to Vercel staging if the staging secrets are present.

### Production web + backend release

Use `release.yml`:

1. Sync Convex production environment variables.
2. Deploy Convex functions to production.
3. Build the web app with production public Convex URLs.
4. Deploy the prebuilt output to Vercel production.

### TestFlight release

Use `testflight.yml`:

1. Choose `staging` or `production` at dispatch time.
2. The workflow builds the native app with that environment's public Convex URLs.
3. The workflow exports `meditag.ipa`.
4. The workflow uploads the build to TestFlight.

## Notes

- The native app expects `EXPO_PUBLIC_CONVEX_URL` and `EXPO_PUBLIC_CONVEX_SITE_URL`.
- The web app expects `NEXT_PUBLIC_CONVEX_URL` and `NEXT_PUBLIC_CONVEX_SITE_URL`.
- Convex auth expects `CONVEX_SITE_URL` and `NATIVE_APP_URL=meditag://`.
- Keep staging and production values aligned across GitHub environments so web and mobile builds talk to the intended backend.
