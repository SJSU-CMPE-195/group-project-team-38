/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("ai", () => ({
  generateText: vi.fn(),
}));

import { generateText } from "ai";

import { api, components, internal } from "../convex/_generated/api";
import authSchema from "../convex/betterAuth/schema";
import {
  buildScanLogExplanationPrompt,
  normalizeExplanationText,
} from "../convex/scanLogExplanations";
import schema from "../convex/schema";

type ModuleLoader = () => Promise<unknown>;
type ModuleMap = Record<string, ModuleLoader>;
type TestInstance = ReturnType<typeof convexTest>;
type IdentityTestInstance = ReturnType<TestInstance["withIdentity"]>;

const allModules = import.meta.glob<ModuleLoader>("../convex/**/*.*s");
const modules: ModuleMap = {};
for (const [path, loader] of Object.entries(allModules)) {
  if (!path.endsWith(".test.ts")) {
    modules[path] = loader;
  }
}
const betterAuthModules = import.meta.glob<ModuleLoader>("../convex/betterAuth/**/*.*s");
const generateTextMock = vi.mocked(generateText);
const originalEnv = { ...process.env };

async function setupIdentity(
  t: TestInstance,
  role: "nurse" | "admin",
): Promise<IdentityTestInstance> {
  const now = Date.now();
  const roleLabel = role.toUpperCase();
  const userEmail = `${roleLabel.toLowerCase()}@meditag.test`;
  const orgSlug = `meditag-${roleLabel.toLowerCase()}-org`;
  const sessionToken = `token-${roleLabel.toLowerCase()}`;

  await t.mutation(components.betterAuth.adapter.create, {
    input: {
      model: "user",
      data: {
        name: `${roleLabel} User`,
        email: userEmail,
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      },
    },
  });

  const user = await t.query(components.betterAuth.adapter.findOne, {
    model: "user",
    where: [
      {
        field: "email",
        operator: "eq",
        value: userEmail,
      },
    ],
  });
  if (!user || typeof user._id !== "string") {
    throw new Error("Unable to create Better Auth user for test.");
  }

  await t.mutation(components.betterAuth.adapter.create, {
    input: {
      model: "organization",
      data: {
        name: `MediTag ${roleLabel} Org`,
        slug: orgSlug,
        createdAt: now,
      },
    },
  });

  const organization = await t.query(components.betterAuth.adapter.findOne, {
    model: "organization",
    where: [
      {
        field: "slug",
        operator: "eq",
        value: orgSlug,
      },
    ],
  });
  if (!organization || typeof organization._id !== "string") {
    throw new Error("Unable to create Better Auth organization for test.");
  }

  await t.mutation(components.betterAuth.adapter.create, {
    input: {
      model: "member",
      data: {
        userId: user._id,
        organizationId: organization._id,
        role,
        createdAt: now,
      },
    },
  });

  await t.mutation(components.betterAuth.adapter.create, {
    input: {
      model: "session",
      data: {
        userId: user._id,
        token: sessionToken,
        activeOrganizationId: organization._id,
        expiresAt: now + 60_000,
        createdAt: now,
        updatedAt: now,
      },
    },
  });

  const session = await t.query(components.betterAuth.adapter.findOne, {
    model: "session",
    where: [
      {
        field: "token",
        operator: "eq",
        value: sessionToken,
      },
    ],
  });
  if (!session || typeof session._id !== "string") {
    throw new Error("Unable to create Better Auth session for test.");
  }

  return t.withIdentity({
    subject: user._id,
    sessionId: session._id,
  });
}

describe("scan log explanation prompt helpers", () => {
  test("builds a bounded prompt from structured failure context only", () => {
    const prompt = buildScanLogExplanationPrompt({
      failureReasons: ["allergy_conflict", "medication_not_found"],
      patientAllergyLabels: ["Penicillin allergy"],
      medication: {
        displayName: "Amoxicillin 500mg",
        rxNormCode: "723",
        route: "PO",
        dose: "1 tablet",
        frequency: "BID",
      },
    });

    expect(prompt.system).toContain("Use only the structured verification facts provided");
    expect(prompt.prompt).toContain('"failureReasons": [');
    expect(prompt.prompt).toContain('"patientAllergyLabels": [');
    expect(prompt.prompt).toContain('"displayName": "Amoxicillin 500mg"');
    expect(prompt.prompt).toContain("current schema does not include enough stored context");
    expect(prompt.prompt).not.toContain("Demo Conflict Patient");
    expect(prompt.prompt).not.toContain("MRN-CONFLICT-001");
    expect(prompt.prompt).not.toContain("WRISTBAND-CONFLICT-QR-001");
  });

  test("normalizes whitespace and bounds stored explanation text", () => {
    const normalized = normalizeExplanationText(
      `  First line.\n\nSecond    line. ${"x".repeat(600)}  `,
    );

    expect(normalized.startsWith("First line. Second line.")).toBe(true);
    expect(normalized.length).toBe(500);
  });
});

describe("scan log explanation context loading", () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(() => {
    vi.useFakeTimers();
    generateTextMock.mockReset();
    process.env = { ...originalEnv };
    t = convexTest(schema, modules);
    t.registerComponent("betterAuth", authSchema, betterAuthModules);
  });

  afterEach(() => {
    vi.useRealTimers();
    process.env = { ...originalEnv };
  });

  test("loads bounded prompt input for a requested failed scan log", async () => {
    const nurse = await setupIdentity(t, "nurse");
    const seed = await t.mutation(internal.seed.seedDemoData);

    const verification = await nurse.mutation(api.verification.verifyMedicationScan, {
      scannedToken: "WRISTBAND-CONFLICT-QR-001",
      selectedMedicationId: seed.conflictMedicationId,
      scanType: "qr",
      requestExplanation: true,
      deviceId: "device-conflict-context-1",
    });

    const context = await t.query(internal.scanLogExplanations.loadScanLogExplanationContext, {
      scanLogId: verification.scanLogId,
    });

    expect(context).toEqual({
      status: "eligible",
      promptInput: {
        failureReasons: ["allergy_conflict"],
        patientAllergyLabels: ["Penicillin allergy"],
        medication: {
          displayName: "Amoxicillin 500mg",
          rxNormCode: "723",
          route: "PO",
          dose: "1 tablet",
          frequency: "BID",
        },
      },
    });
  });

  test("loads eligible context without medication details when the referenced medication is gone", async () => {
    const nurse = await setupIdentity(t, "nurse");
    const seed = await t.mutation(internal.seed.seedDemoData);

    const verification = await nurse.mutation(api.verification.verifyMedicationScan, {
      scannedToken: "WRISTBAND-CONFLICT-QR-001",
      selectedMedicationId: seed.conflictMedicationId,
      scanType: "qr",
      requestExplanation: true,
      deviceId: "device-conflict-context-missing-medication",
    });

    await t.run(async (ctx) => {
      await ctx.db.delete(seed.conflictMedicationId);
    });

    const context = await t.query(internal.scanLogExplanations.loadScanLogExplanationContext, {
      scanLogId: verification.scanLogId,
    });

    expect(context).toEqual({
      status: "eligible",
      promptInput: {
        failureReasons: ["allergy_conflict"],
        patientAllergyLabels: ["Penicillin allergy"],
      },
    });
  });

  test("returns deterministic skip reasons for non-eligible scan logs", async () => {
    const nurse = await setupIdentity(t, "nurse");
    const seed = await t.mutation(internal.seed.seedDemoData);

    const passedVerification = await nurse.mutation(api.verification.verifyMedicationScan, {
      scannedToken: "WRISTBAND-SAFE-QR-001",
      selectedMedicationId: seed.safeMedicationId,
      scanType: "qr",
      requestExplanation: true,
      deviceId: "device-safe-context-skip",
    });
    const notRequestedVerification = await nurse.mutation(api.verification.verifyMedicationScan, {
      scannedToken: "WRISTBAND-CONFLICT-QR-001",
      selectedMedicationId: seed.conflictMedicationId,
      scanType: "qr",
      requestExplanation: false,
      deviceId: "device-conflict-context-not-requested",
    });
    const processedVerification = await nurse.mutation(api.verification.verifyMedicationScan, {
      scannedToken: "WRISTBAND-CONFLICT-QR-001",
      selectedMedicationId: seed.conflictMedicationId,
      scanType: "qr",
      requestExplanation: true,
      deviceId: "device-conflict-context-processed",
    });

    await t.mutation(internal.scanLogExplanations.patchScanLogExplanation, {
      scanLogId: processedVerification.scanLogId,
      explanationStatus: "generated",
      explanationText: "Already processed.",
      explanationModel: "demo-model",
    });

    const deletedVerification = await nurse.mutation(api.verification.verifyMedicationScan, {
      scannedToken: "WRISTBAND-CONFLICT-QR-001",
      selectedMedicationId: seed.conflictMedicationId,
      scanType: "qr",
      requestExplanation: true,
      deviceId: "device-conflict-context-missing-log",
    });

    await t.run(async (ctx) => {
      await ctx.db.delete(deletedVerification.scanLogId);
    });

    await expect(
      t.query(internal.scanLogExplanations.loadScanLogExplanationContext, {
        scanLogId: passedVerification.scanLogId,
      }),
    ).resolves.toEqual({
      status: "skipped",
      reason: "scan_passed",
    });

    await expect(
      t.query(internal.scanLogExplanations.loadScanLogExplanationContext, {
        scanLogId: notRequestedVerification.scanLogId,
      }),
    ).resolves.toEqual({
      status: "skipped",
      reason: "not_requested",
    });

    await expect(
      t.query(internal.scanLogExplanations.loadScanLogExplanationContext, {
        scanLogId: processedVerification.scanLogId,
      }),
    ).resolves.toEqual({
      status: "skipped",
      reason: "already_processed",
    });

    await expect(
      t.query(internal.scanLogExplanations.loadScanLogExplanationContext, {
        scanLogId: deletedVerification.scanLogId,
      }),
    ).resolves.toEqual({
      status: "skipped",
      reason: "scan_log_missing",
    });
  });
});

describe("scan log explanation requests", () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(() => {
    vi.useFakeTimers();
    generateTextMock.mockReset();
    process.env = { ...originalEnv };
    t = convexTest(schema, modules);
    t.registerComponent("betterAuth", authSchema, betterAuthModules);
  });

  afterEach(() => {
    vi.useRealTimers();
    process.env = { ...originalEnv };
  });

  test("reuses the existing failed scan log when requesting an explanation", async () => {
    const nurse = await setupIdentity(t, "nurse");
    const seed = await t.mutation(internal.seed.seedDemoData);

    const verification = await nurse.mutation(api.verification.verifyMedicationScan, {
      scannedToken: "WRISTBAND-CONFLICT-QR-001",
      selectedMedicationId: seed.conflictMedicationId,
      scanType: "qr",
      requestExplanation: false,
      deviceId: "device-conflict-request-existing-log",
    });

    expect(verification.result).toBe("fail");
    expect(verification.explanationStatus).toBe("none");

    const explanationRequest = await nurse.mutation(
      api.scanLogExplanations.requestScanLogExplanation,
      {
        scanLogId: verification.scanLogId,
      },
    );

    expect(explanationRequest).toEqual({
      scanLogId: verification.scanLogId,
      explanationStatus: "requested",
    });

    const logs = await nurse.query(api.verification.getRecentScanLogs, { limit: 10 });
    expect(logs).toHaveLength(1);
    expect(logs[0]?._id).toBe(verification.scanLogId);
    expect(logs[0]?.explanationStatus).toBe("requested");
  });

  test("treats repeated explanation requests for the same scan log as idempotent", async () => {
    const nurse = await setupIdentity(t, "nurse");
    const seed = await t.mutation(internal.seed.seedDemoData);

    const verification = await nurse.mutation(api.verification.verifyMedicationScan, {
      scannedToken: "WRISTBAND-CONFLICT-QR-001",
      selectedMedicationId: seed.conflictMedicationId,
      scanType: "qr",
      requestExplanation: false,
      deviceId: "device-conflict-request-existing-log-repeat",
    });

    await nurse.mutation(api.scanLogExplanations.requestScanLogExplanation, {
      scanLogId: verification.scanLogId,
    });
    const secondRequest = await nurse.mutation(api.scanLogExplanations.requestScanLogExplanation, {
      scanLogId: verification.scanLogId,
    });

    expect(secondRequest).toEqual({
      scanLogId: verification.scanLogId,
      explanationStatus: "requested",
    });

    const logs = await nurse.query(api.verification.getRecentScanLogs, { limit: 10 });
    expect(logs).toHaveLength(1);
    expect(logs[0]?._id).toBe(verification.scanLogId);
    expect(logs[0]?.explanationStatus).toBe("requested");
  });
});

describe("scan log explanation generation", () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(() => {
    vi.useFakeTimers();
    generateTextMock.mockReset();
    process.env = { ...originalEnv };
    t = convexTest(schema, modules);
    t.registerComponent("betterAuth", authSchema, betterAuthModules);
  });

  afterEach(() => {
    vi.useRealTimers();
    process.env = { ...originalEnv };
  });

  test("patches a failed scan log with generated explanation text and model", async () => {
    process.env.AI_PROVIDER = "openai";
    process.env.AI_MODEL = "gpt-4o-mini";
    process.env.OPENAI_API_KEY = "test-openai-key";
    delete process.env.ANTHROPIC_API_KEY;

    generateTextMock.mockResolvedValue({
      text: "  The selected medication conflicts with the patient's recorded penicillin allergy. The deterministic verification correctly flagged this risk.  ",
    } as Awaited<ReturnType<typeof generateText>>);

    const nurse = await setupIdentity(t, "nurse");
    const seed = await t.mutation(internal.seed.seedDemoData);

    const result = await nurse.mutation(api.verification.verifyMedicationScan, {
      scannedToken: "WRISTBAND-CONFLICT-QR-001",
      selectedMedicationId: seed.conflictMedicationId,
      scanType: "qr",
      requestExplanation: true,
      deviceId: "device-conflict-ai-1",
    });

    expect(result.result).toBe("fail");
    expect(result.explanationStatus).toBe("requested");

    await t.finishAllScheduledFunctions(() => vi.runAllTimers());

    const logs = await nurse.query(api.verification.getRecentScanLogs, { limit: 10 });
    expect(logs).toHaveLength(1);
    expect(logs[0]?.explanationStatus).toBe("generated");
    expect(logs[0]?.explanationModel).toBe("gpt-4o-mini");
    expect(logs[0]?.explanationText).toBe(
      "The selected medication conflicts with the patient's recorded penicillin allergy. The deterministic verification correctly flagged this risk.",
    );
    expect(generateTextMock).toHaveBeenCalledTimes(1);
  });

  test("marks explanation generation as failed and preserves the configured model when generation throws", async () => {
    process.env.AI_PROVIDER = "openai";
    process.env.AI_MODEL = "gpt-4o-mini";
    process.env.OPENAI_API_KEY = "test-openai-key";
    delete process.env.ANTHROPIC_API_KEY;

    generateTextMock.mockRejectedValue(new Error("provider unavailable"));

    const nurse = await setupIdentity(t, "nurse");
    const seed = await t.mutation(internal.seed.seedDemoData);

    const result = await nurse.mutation(api.verification.verifyMedicationScan, {
      scannedToken: "WRISTBAND-CONFLICT-QR-001",
      selectedMedicationId: seed.conflictMedicationId,
      scanType: "qr",
      requestExplanation: true,
      deviceId: "device-conflict-ai-runtime-failure",
    });

    expect(result.result).toBe("fail");
    expect(result.explanationStatus).toBe("requested");

    await t.finishAllScheduledFunctions(() => vi.runAllTimers());

    const logs = await nurse.query(api.verification.getRecentScanLogs, { limit: 10 });
    expect(logs).toHaveLength(1);
    expect(logs[0]?.explanationStatus).toBe("failed");
    expect(logs[0]?.explanationText).toBeUndefined();
    expect(logs[0]?.explanationModel).toBe("gpt-4o-mini");
    expect(generateTextMock).toHaveBeenCalledTimes(1);
  });

  test("marks explanation generation as failed when AI config is missing", async () => {
    delete process.env.AI_PROVIDER;
    delete process.env.AI_MODEL;
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    const nurse = await setupIdentity(t, "nurse");
    const seed = await t.mutation(internal.seed.seedDemoData);

    const result = await nurse.mutation(api.verification.verifyMedicationScan, {
      scannedToken: "WRISTBAND-CONFLICT-QR-001",
      selectedMedicationId: seed.conflictMedicationId,
      scanType: "qr",
      requestExplanation: true,
      deviceId: "device-conflict-ai-missing-config",
    });

    expect(result.result).toBe("fail");
    expect(result.explanationStatus).toBe("requested");

    await t.finishAllScheduledFunctions(() => vi.runAllTimers());

    const logs = await nurse.query(api.verification.getRecentScanLogs, { limit: 10 });
    expect(logs).toHaveLength(1);
    expect(logs[0]?.explanationStatus).toBe("failed");
    expect(logs[0]?.explanationText).toBeUndefined();
    expect(logs[0]?.explanationModel).toBeUndefined();
    expect(generateTextMock).not.toHaveBeenCalled();
  });
});
