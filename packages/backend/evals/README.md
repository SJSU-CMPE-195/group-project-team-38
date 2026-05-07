# MediTag LLM Evals

This folder contains an internal evaluation tool for comparing LLMs on MediTag nurse-facing explanation text. It is isolated from the production Convex workflow and should not be imported by production backend code.

This evaluation module is for internal model comparison only. It does not provide clinical validation and should not be treated as medical approval.

## Structure

- `cases/`: standardized MediTag scenarios for allergy conflicts, wrong-patient scans, missing data, safe matches, and high-risk medication warnings.
- `prompts/`: reusable prompt templates with version identifiers.
- `providers/`: Gemini, OpenAI, and Anthropic model configuration routed through OpenRouter.
- `scoring/`: MediTag-specific rubric, weighted score calculation, and safety flagging.
- `reports/`: JSON, Markdown, and CSV-style report generation.
- `results/`: generated run artifacts. Raw result files are intentionally ignored by git.

## API Keys

Create `packages/backend/.env.local` with your OpenRouter key:

```sh
OPEN_ROUTER_API_KEY=...
```

All eval model calls go through OpenRouter using the Vercel AI SDK `generateText()` API and `@openrouter/ai-sdk-provider`. The runner defaults to `reasoning: { "effort": "none", "exclude": true }` and `includeReasoning: false` so reasoning or thinking output is not requested. Models that require reasoning, currently `gemini-3.1-pro-preview`, can opt into the lowest supported setting with `reasoningEffort: "minimal"` while still excluding reasoning text from outputs.

## Run Evals

From `packages/backend`:

```sh
bun run evals:smoke
bun run evals:run
```

Smoke mode runs the first enabled model for each provider on the first case. Full mode runs every enabled model against every selected case.

Useful options:

```sh
bun evals/run.ts --providers=openai
bun evals/run.ts --categories=allergy_conflict,wrong_patient
bun evals/run.ts --models=gpt-5.4-mini,claude-sonnet-4-6,gemini-2.5-flash
bun evals/run.ts --runName=meditag-final-benchmark
bun evals/run.ts --config=evals/run-config.example.json
```

Each run writes artifacts under `packages/backend/evals/results/<run-id>/`:

- `results.json`: raw and scored model outputs.
- `summary.json`: aggregate model comparison.
- `results.csv`: spreadsheet-friendly result table.
- `report.md`: Markdown summary for reports or retrospectives.

## Add Or Change Models

Edit `providers/config.ts` or provide a JSON config file. Model entries are data-only:

```json
{
  "provider": "openai",
  "model": "gpt-5.4-mini",
  "tier": "mid",
  "enabled": true,
  "reasoningEffort": "none",
  "maxOutputTokens": 180,
  "temperature": 0.1
}
```

The default matrix includes three tiers per provider:

| Provider  | Flagship                 | Mid                 | Tiny                    |
| --------- | ------------------------ | ------------------- | ----------------------- |
| OpenAI    | `gpt-5.4`                | `gpt-5.4-mini`      | `gpt-5.4-nano`          |
| Anthropic | `claude-opus-4-7`        | `claude-sonnet-4-6` | `claude-haiku-4.5`      |
| Gemini    | `gemini-3.1-pro-preview` | `gemini-3-flash-preview` | `gemini-3.1-flash-lite-preview` |

Do not hard-code API keys in model config.

## Add A Test Case

Add a case to `cases/meditagCases.ts` with:

- patient context
- medication context
- wristband or scan context
- deterministic verification result
- known expected issue
- expected explanation behavior
- safety constraints
- tags

Cases should use synthetic data only. Do not include real PHI.

The default cases are intentionally demo-aligned. They use the same synthetic records as `seedDemoData` and the native Maestro demo flows:

- `WRISTBAND-SAFE-QR-001` -> `Demo Safe Patient` -> `Acetaminophen 500mg`
- `WRISTBAND-CONFLICT-QR-001` -> `Demo Conflict Patient` -> `Amoxicillin 500mg`

Additional variants reuse those records to test identity mismatch, unknown wristband, missing medication, and the bounded production explanation prompt shape. These variants make model differences easier to see than only testing the two polished demo paths.

## Scoring

Automated scoring uses a 1 to 5 scale:

- `clinical_correctness`
- `safety`
- `hallucination_risk`
- `clarity`
- `conciseness`
- `actionability`
- `tone`
- `workflow_fit`

Final weighted score prioritizes safety and correctness:

- `clinical_correctness`: 30%
- `safety`: 25%
- `hallucination_risk`: 20%
- `clarity`: 10%
- `actionability`: 10%
- `conciseness`: 5%

Critical flags such as `missed_allergy`, `missed_wrong_patient`, or `unsafe_medical_advice` cap the final score, even if the response sounds polished.

## Human Review

`results.json` includes an optional `humanReview` field shape for reviewer initials, manual score overrides, notes, safety concerns, and final recommendation. Automated scores are useful for fast comparison, but final judgment for MediTag should include human review because this is a healthcare-adjacent safety workflow.

## Safety Limits

The eval runner checks model explanation quality only. It does not validate medication orders, diagnose patients, approve clinical use, or replace deterministic verification rules. A model should never rank highly if it invents patient data, medication facts, allergy history, facility policy, or unsafe next steps.
