import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

/**
 * AI Gateway — called after a scan to generate a human-readable explanation.
 * Uses OpenAI or Anthropic (swap out model/endpoint as needed).
 *
 * This is a Convex `action` (not mutation) because it makes external HTTP calls.
 * After getting the explanation it calls a mutation to patch the scanLog.
 */
export const explainScanResult = action({
  args: {
    scanLogId: v.id("scanLogs"),
    riskLevel: v.string(),
    conflicts: v.array(v.string()),
    patientAllergies: v.array(v.string()),
    medicationNames: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const { scanLogId, riskLevel, conflicts, patientAllergies, medicationNames } = args;

    let explanation: string;

    try {
      explanation = await callAI(riskLevel, conflicts, patientAllergies, medicationNames);
    } catch (err) {
      // Graceful fallback — never block the scan workflow
      console.error("AI Gateway error:", err);
      explanation = buildFallbackExplanation(riskLevel, conflicts);
    }

    // Patch the scan log with the explanation
    await ctx.runMutation(api.scanLogs.patchAiExplanation, {
      scanLogId,
      aiExplanation: explanation,
    });

    return { explanation };
  },
});

// AI Call

async function callAI(
  riskLevel: string,
  conflicts: string[],
  allergies: string[],
  medications: string[]
): Promise<string> {
  const prompt = buildPrompt(riskLevel, conflicts, allergies, medications);

  // Option A: Anthropic
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) throw new Error(`Anthropic API error: ${response.status}`);
  const data = await response.json();
  return data.content[0].text;

  // Option B: OpenAI
  // const response = await fetch("https://api.openai.com/v1/chat/completions", {
  //   method: "POST",
  //   headers: {
  //     Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
  //     "content-type": "application/json",
  //   },
  //   body: JSON.stringify({
  //     model: "gpt-4o-mini",
  //     max_tokens: 300,
  //     messages: [{ role: "user", content: prompt }],
  //   }),
  // });
  // if (!response.ok) throw new Error(`OpenAI error: ${response.status}`);
  // const data = await response.json();
  // return data.choices[0].message.content;
}

// Prompt

function buildPrompt(
  riskLevel: string,
  conflicts: string[],
  allergies: string[],
  medications: string[]
): string {
  return `You are a clinical decision support assistant. Summarize the following medication safety check result in 2-3 plain sentences for a nurse at the bedside. Be concise and clear.

Risk level: ${riskLevel.toUpperCase()}
Patient allergies: ${allergies.join(", ") || "none recorded"}
Current medications: ${medications.join(", ")}
${conflicts.length > 0 ? `Conflicts detected:\n${conflicts.map((c) => `- ${c}`).join("\n")}` : "No conflicts detected."}

Provide a brief, actionable summary.`;
}

// Fallback

function buildFallbackExplanation(riskLevel: string, conflicts: string[]): string {
  if (riskLevel === "safe") return "No medication conflicts or allergy issues detected. Safe to administer.";
  if (conflicts.length > 0) {
    return `${conflicts.length} issue(s) detected: ${conflicts.slice(0, 2).join("; ")}. Please review before administering.`;
  }
  return "Safety check completed. Please review medication details before administering.";
}