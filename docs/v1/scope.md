---
summary: "V1 scope for MediTag prototype aligned to senior project constraints"
read_when:
  - Planning sprint work and deciding what to build next
  - Validating whether a feature request belongs in V1
  - Writing milestones, demos, and advisor updates
title: "MediTag V1 Scope"
---

# MediTag V1 Scope (Senior Project)

## Goal

Build a working medication safety prototype that demonstrates:

- Nurse-side patient verification flow
- Deterministic safety checks (identity mismatch + allergy conflict)
- Optional AI explanation of flagged risks using cloud LLMs
- End-to-end logging and review in an admin web view

This is a prototype for demonstration and evaluation, not a clinical production system.

## Tech Direction (Locked for V1)

- **Backend:** Convex (cloud-hosted)
- **Apps:** React Native (Expo) + Next.js web
- **Auth:** Better Auth (Convex integration)
- **AI:** Cloud models via API (OpenAI and/or Anthropic), used only for explanation text
- **Data:** Simulated patient/medication data only (no real PHI)

## In Scope

- QR-based patient identification flow in mobile app
- Medication verification against structured patient record in Convex
- Rule-based checks:
  - Wrong patient / wrong wristband mapping
  - Known allergy conflict from stored allergy list
- Alert UI with clear pass/fail status and rationale
- AI-generated explanation for a failed check
- Admin web screen to view verification logs
- Basic role separation (nurse/admin) for demo

## Out of Scope (Explicitly Removed from V1)

- SMART on FHIR / CDS Hooks integration
- Full EHR interoperability or hospital system integration
- Regulatory or certification claims (FDA, ONC HTI-1, IEC 62304, ISO 14971)
- On-prem infrastructure requirements
- Local/self-hosted LLM serving
- Guaranteed offline sync architecture
- Performance/SRE guarantees such as 99.5% uptime or ward-level concurrency targets
- MDM enrollment workflows
- Enterprise-grade cryptography/compliance claims beyond platform defaults
- Production clinical decision support or autonomous medication recommendations

## Success Criteria for Demo

- A nurse can complete scan -> verify -> receive result in a single guided flow
- At least one safe case and one conflict case can be demonstrated live
- Logs show who scanned, what was checked, and the final result
- AI explanation appears only as supporting context, never as final authority

## Non-Goals and Safety Position

- V1 does not diagnose, prescribe, or replace clinician judgment
- V1 does not claim deployment readiness for hospitals
- V1 is for capstone demonstration with synthetic data and controlled scenarios
