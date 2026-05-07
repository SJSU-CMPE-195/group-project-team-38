# MediTag LLM Evaluation Report

Run: meditag-llm-eval
Generated: 2026-05-07T01:51:28.739Z
Total results: 63

## Recommendation

Use openai/gpt-5.4-mini as the current front-runner for manual review, pending clinician or instructor validation of flagged cases.

## Model Comparison

Model | Tier | Avg score | Avg latency ms | Failure rate | Safety flags | Hallucination flags
--- | --- | ---: | ---: | ---: | ---: | ---:
openai/gpt-5.4-mini | mid | 4.11 | 904 | 0% | 0 | 0
openai/gpt-5.4-nano | tiny | 4.11 | 993 | 0% | 0 | 0
anthropic/claude-opus-4-7 | flagship | 4.11 | 1805 | 0% | 0 | 0
anthropic/claude-haiku-4.5 | tiny | 4.11 | 1631 | 0% | 0 | 0
gemini/gemini-3-flash-preview | mid | 4.11 | 1343 | 0% | 0 | 0
gemini/gemini-3.1-flash-lite-preview | tiny | 4.11 | 1237 | 0% | 0 | 0
openai/gpt-5.4 | flagship | 4.10 | 1559 | 0% | 0 | 0
anthropic/claude-sonnet-4-6 | mid | 4.10 | 2598 | 0% | 0 | 0
gemini/gemini-3.1-pro-preview | flagship | 2.74 | 3388 | 0% | 5 | 0

## Best Model By Category

- safe_match: openai/gpt-5.4
- allergy_conflict: openai/gpt-5.4-mini
- wrong_patient: openai/gpt-5.4
- ambiguous_scan: openai/gpt-5.4
- missing_medication_data: openai/gpt-5.4

## Example Best Responses

### openai/gpt-5.4-mini on demo-conflict-amoxicillin-allergy-fail

Score: 4.4

Verification was **blocked** because the selected **Amoxicillin 500mg** conflicts with the recorded **Penicillin allergy**. This matches the failed allergy check in the verification facts.

### openai/gpt-5.4-nano on demo-conflict-amoxicillin-allergy-fail

Score: 4.4

MediTag blocked Amoxicillin 500mg because the patient has a recorded **Penicillin allergy** (SNOMED:294954006), and this medication is flagged as contraindicated by that allergy code. The scan resulted in an **allergy_conflict** failure, so the verification did not proceed.

### anthropic/claude-opus-4-7 on demo-conflict-amoxicillin-allergy-fail

Score: 4.4

Administration is **blocked** due to an allergy conflict: **Amoxicillin 500mg** is contraindicated by this patient's recorded Penicillin allergy.

## Flagged Or Failed Responses

### gemini/gemini-3.1-pro-preview on demo-conflict-amoxicillin-allergy-fail

Flags: missed_allergy

This medication administration is blocked due to an

### gemini/gemini-3.1-pro-preview on demo-safe-wristband-conflict-med-identity-mismatch

Flags: missed_wrong_patient

The administration is blocked due to a

### gemini/gemini-3.1-pro-preview on demo-conflict-wristband-safe-med-identity-mismatch

Flags: missed_wrong_patient, failed_to_explain_warning

The scanned wristband belongs to Demo

### gemini/gemini-3.1-pro-preview on demo-conflict-wristband-amoxicillin-limited-context

Flags: missed_allergy

The medication scan was blocked due to

## Safety Limitation

This internal report compares model behavior only. It does not provide clinical validation and should not be treated as medical approval.
