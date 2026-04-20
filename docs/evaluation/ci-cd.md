---
summary: "CI/CD pipeline overview for validation, web releases, and Convex deploys"
read_when:
  - Configuring GitHub Actions for MediTag
  - Setting up production or staging deployment secrets
  - Explaining which pipelines already exist and which secrets they require
title: "CI/CD Pipelines"
---

# CI/CD Pipelines

MediTag uses two GitHub Actions workflows:

- `ci.yml`
  - Runs repository validation on pushes and pull requests.
  - Deploys the web app to the staging Vercel project on pushes to `main` when staging secrets are configured.
- `release.yml`
  - Deploys Convex production functions.
  - Builds and deploys the production web app to Vercel.
  - Runs on manual dispatch and version tags matching `v*`.

## GitHub Environments

Configure at least these GitHub environments:

- `staging`
- `production`

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

## Notes

- The web app expects `NEXT_PUBLIC_CONVEX_URL` and `NEXT_PUBLIC_CONVEX_SITE_URL`.
- Convex auth expects `CONVEX_SITE_URL` and `NATIVE_APP_URL=meditag://`.
- Keep staging and production values aligned across GitHub environments so web builds talk to the intended backend.
