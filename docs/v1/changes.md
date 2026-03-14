---
summary: "Change log for MediTag V1 scope reset from ambitious report/workbook plans to realistic senior-project prototype"
read_when:
  - Explaining scope reductions to advisor or reviewers
  - Preparing status updates and milestone check-ins
  - Clarifying what moved to post-V1 roadmap
title: "MediTag V1 Changes"
---

# MediTag V1 Changes

## Why We Changed Scope

The original planning docs mixed prototype goals with production-grade healthcare ambitions.  
For senior project feasibility, V1 now targets a demonstrable, reliable prototype using the stack already present in this repository.

## Platform and Stack Changes

- Backend direction changed to **Convex (cloud-hosted)** for all app data/functions.
- AI direction changed to **cloud model APIs** for optional explanation text.
- V1 architecture now aligns with repo tooling (`Next.js`, `Expo`, `Convex`, `Better Auth`, monorepo workflow).

## Removed from V1 Scope

- SMART on FHIR and CDS Hooks implementation.
- Direct EHR interoperability claims.
- On-prem/local-network deployment requirement.
- Local/self-hosted LLM serving and model ops.
- Offline-first sync guarantees.
- Regulatory/certification framing (FDA/ONC HTI-1/IEC 62304/ISO 14971) as project deliverables.
- Enterprise SRE targets (for example 99.5% uptime, ward-level throughput promises).
- MDM enrollment and hospital IT infrastructure assumptions.
- Broad global deployment claims for this capstone phase.

## Kept in V1 Scope

- Mobile scan-based patient verification flow.
- Deterministic safety checks (identity mismatch, allergy conflict).
- Admin log visibility from a web interface.
- Role-aware access for demo scenarios.
- Audit-style event logging for scan outcomes.
- AI-generated explanation as assistive context only.

## Behavioral Guardrail Changes

- AI is no longer framed as a decision-maker.
- Deterministic checks remain the pass/fail authority.
- LLM failures do not block verification result delivery.

## Documentation Changes Introduced

- Added [scope.md](/Users/gursh/code/group-project-team-38/docs/v1/scope.md) as V1 source of truth.
- Added [architecture.md](/Users/gursh/code/group-project-team-38/docs/v1/architecture.md) for Convex + cloud LLM flow.
- Added this document to track scope and architecture deltas.

## Impact on Execution

- Lower implementation risk and faster demo readiness.
- Better alignment between docs and actual codebase direction.
- Clear separation between capstone prototype and post-graduation roadmap.

## Post-V1 Roadmap (Deferred)

- FHIR/SMART/CDS Hooks integration
- On-prem deployment option
- Local model hosting
- Offline sync and conflict resolution
- Compliance and certification workstreams

