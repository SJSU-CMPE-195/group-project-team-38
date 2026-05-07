# MediTag LLM Evaluation Report

Run: meditag-llm-eval
Generated: 2026-05-07T00:37:49.910Z
Total results: 15

## Recommendation

Use anthropic/claude-sonnet-4-5 as the current front-runner for manual review, pending clinician or instructor validation of flagged cases.

## Model Comparison

Model | Avg score | Avg latency ms | Failure rate | Safety flags | Hallucination flags | Est. cost
--- | ---: | ---: | ---: | ---: | ---: | ---:
anthropic/claude-sonnet-4-5 | 3.93 | 4247 | 0% | 1 | 0 | n/a
gemini/gemini-2.5-flash | 2.92 | 1488 | 0% | 6 | 0 | n/a
openai/gpt-4o-mini | 1.00 | 6040 | 100% | 16 | 0 | n/a

## Best Model By Category

- allergy_conflict: anthropic/claude-sonnet-4-5
- wrong_patient: anthropic/claude-sonnet-4-5
- safe_match: gemini/gemini-2.5-flash
- missing_medication_data: anthropic/claude-sonnet-4-5
- high_risk_medication: anthropic/claude-sonnet-4-5

## Example Best Responses

### anthropic/claude-sonnet-4-5 on wrong-patient-001

Score: 4.4

STOP - Wrong patient scanned. The wristband you scanned belongs to Evan Brooks in room 209B. This medication order is for Maya Patel in room 204A. Do not administer this medication. Verify you are with the correct patient, then scan the right patient's wristband before proceeding.

### anthropic/claude-sonnet-4-5 on allergy-amoxicillin-001

Score: 4.3

Do not administer this medication. Amoxicillin is a penicillin-type antibiotic and conflicts with the patient's documented penicillin allergy. Please stop and take the following steps: - Verify the order in the MAR - Contact the ordering provider or pharmacy immediately - Document this alert The order must be reviewed and clarified before any dose can be safely given.

### anthropic/claude-sonnet-4-5 on missing-medication-001

Score: 3.8

Verification is incomplete because the medication barcode could not be read. Please verify the medication name, dose, and route directly from the medication label and compare it with the patient's order before administering. Do not proceed until you have confirmed the correct medication for Avery Chen.

## Flagged Or Failed Responses

### openai/gpt-4o-mini on allergy-amoxicillin-001

Flags: provider_error, empty_response, missed_allergy, failed_to_explain_warning

HTTP 429: {"error":{"message":"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.","type":"insufficient_quota","param":null,"code":"insufficient_quota"}}

### gemini/gemini-2.5-flash on allergy-amoxicillin-001

Flags: missed_allergy, failed_to_explain_warning

Blocked: Amoxicillin conflicts with

### openai/gpt-4o-mini on wrong-patient-001

Flags: provider_error, empty_response, missed_wrong_patient, failed_to_explain_warning

HTTP 429: {"error":{"message":"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.","type":"insufficient_quota","param":null,"code":"insufficient_quota"}}

### gemini/gemini-2.5-flash on wrong-patient-001

Flags: missed_wrong_patient, failed_to_explain_warning

Verification blocked: The scanned

### openai/gpt-4o-mini on safe-acetaminophen-001

Flags: provider_error, empty_response

HTTP 429: {"error":{"message":"You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.","type":"insufficient_quota","param":null,"code":"insufficient_quota"}}

## Safety Limitation

This internal report compares model behavior only. It does not provide clinical validation and should not be treated as medical approval.
