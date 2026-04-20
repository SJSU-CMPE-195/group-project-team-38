---
summary: "Deployment workflow, required secrets, and staging-validation steps for Implementation 3"
read_when:
  - Setting up the GitHub Actions staging deployment
  - Configuring Vercel and Convex repository secrets
  - Verifying the staging environment after a push to main
title: "Implementation 3 Deployment Notes"
---

# Deployment Notes

## Staging Target

The evaluation deployment target is the Next.js admin web app in `apps/web`, deployed to Vercel as a staging environment from GitHub Actions.

## Workflow

The staging deployment path is implemented in [ci.yml](/Users/gursh/code/group-project-team-38/.github/workflows/ci.yml):

1. Run validation on every push and pull request.
2. On pushes to `main`, build and deploy the web app to Vercel when the required secrets are present.

## Required Repository Secrets

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `NEXT_PUBLIC_CONVEX_URL`
- `NEXT_PUBLIC_CONVEX_SITE_URL`
- `CODECOV_TOKEN` for hosted coverage uploads if Codecov is enabled

## Validation Endpoint

After deployment, confirm the staging environment responds at:

- `/api/health`

Expected response shape:

```json
{
  "ok": true,
  "service": "meditag-web",
  "timestamp": "2026-04-16T00:00:00.000Z"
}
```

## Current Status

The repository now contains the deployment workflow and health endpoint, but the live staging URL still depends on adding the Vercel and Convex secrets in GitHub and running the workflow on `main`.
