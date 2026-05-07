# MediTag LLM Evals

This folder contains an internal evaluation tool for comparing LLMs on MediTag nurse-facing explanation text. It is isolated from the production Convex workflow and should not be imported by production backend code.

This evaluation module is for internal model comparison only. It does not provide clinical validation and should not be treated as medical approval.

## Structure

- `cases/`: standardized MediTag scenarios for allergy conflicts, wrong-patient scans, missing data, safe matches, and high-risk medication warnings.
- `prompts/`: reusable prompt templates with version identifiers.
- `providers/`: Gemini, OpenAI, and Anthropic model configuration plus HTTP adapters.
- `scoring/`: MediTag-specific rubric, weighted score calculation, and safety flagging.
- `reports/`: JSON, Markdown, and CSV-style report generation.
- `results/`: generated run artifacts. Raw result files are intentionally ignored by git.

## API Keys

Create `packages/backend/.env.local` with the keys you want to use:

```sh
OPEN_API_KEY=...
ANTHROPIC_API_KEY=...
GEMINI_API_KEY=...
```

The OpenAI adapter also accepts `OPENAI_API_KEY` as a fallback, but this repo’s local eval setup uses `OPEN_API_KEY`.

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
bun evals/run.ts --models=gpt-4o-mini,claude-sonnet-4-5
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
  "model": "gpt-4o-mini",
  "enabled": true,
  "maxOutputTokens": 180,
  "temperature": 0.1
}
```

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
