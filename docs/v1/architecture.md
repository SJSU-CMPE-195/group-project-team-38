---
summary: "V1 architecture for MediTag prototype using Convex backend and cloud LLMs"
read_when:
  - Implementing backend schema/functions in Convex
  - Building mobile scan workflow and verification pipeline
  - Integrating cloud LLM explanations safely
title: "MediTag V1 Architecture"
---

# MediTag V1 Architecture

## System Overview

MediTag V1 is a cloud-backed prototype with three core surfaces:

- Mobile app (Expo/React Native) for scan and verification workflow
- Web app (Next.js) for admin log review
- Convex backend for data, rules, auth session handling, and audit events

An external cloud LLM API is used only to generate short explanation text for already-detected conflicts.

## Data Model (V1)

Core entities:

- `users` (role: `nurse` | `admin`)
- `patients` (display info + allergy list)
- `wristbands` (QR token -> patient mapping)
- `medications` (patient-linked active meds)
- `scanLogs` (who, when, scanned token, selected med, result, explanation source)

All IDs and relationships live in Convex.

## Verification Flow

1. Nurse signs in on mobile app.
2. Nurse scans QR token.
3. App sends token + selected medication to Convex mutation.
4. Convex resolves patient from wristband mapping.
5. Convex runs deterministic checks:
   - token-patient match
   - allergy conflict check
6. Convex stores scan log with pass/fail outcome.
7. If failed, app can request optional LLM explanation based on structured result.
8. App shows final status and explanation (if requested).

## AI Guardrails (Required)

- AI is never used to determine pass/fail.
- AI input is bounded to structured conflict context from Convex checks.
- AI output is treated as explanatory text only.
- If LLM call fails, verification result still returns without explanation.

## Security and Privacy Posture for Prototype

- Use only synthetic/sample patient records.
- Do not store raw PHI in prompts to external models.
- Keep API keys in environment variables; never commit secrets.
- Log minimal event details needed for demo traceability.

## Deferred Architecture (Post-V1)

The following are intentionally deferred:

- FHIR/SMART/CDS Hooks adapters
- On-prem deployment mode
- Local model hosting
- Offline-first sync/conflict resolution
- Compliance and certification workstreams

