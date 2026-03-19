/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { api, components, internal } from "../convex/_generated/api";
import authSchema from "../convex/betterAuth/schema";
import type { Id } from "../convex/_generated/dataModel";
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

describe("admin scan log review queries", () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-19T12:00:00.000Z"));
    t = convexTest(schema, modules);
    t.registerComponent("betterAuth", authSchema, betterAuthModules);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("allows admin to list recent review rows with filters and joined context", async () => {
    const admin = await setupIdentity(t, "admin");
    const seed = await t.mutation(internal.seed.seedDemoData);

    await admin.mutation(api.users.upsertCurrentUserProfile, {});

    const safeVerification = await admin.mutation(api.verification.verifyMedicationScan, {
      scannedToken: "WRISTBAND-SAFE-QR-001",
      selectedMedicationId: seed.safeMedicationId,
      scanType: "qr",
      deviceId: "admin-device-1",
    });

    vi.advanceTimersByTime(1_000);

    const conflictVerification = await admin.mutation(api.verification.verifyMedicationScan, {
      scannedToken: "WRISTBAND-CONFLICT-QR-001",
      selectedMedicationId: seed.conflictMedicationId,
      scanType: "qr",
      requestExplanation: true,
      deviceId: "admin-device-2",
    });

    expect(safeVerification.result).toBe("pass");
    expect(conflictVerification.result).toBe("fail");

    const allLogs = await admin.query(api.scanLogs.listForAdminReview, {
      limit: 10,
    });

    expect(allLogs).toHaveLength(2);
    expect(allLogs[0]).toMatchObject({
      scanLogId: conflictVerification.scanLogId,
      result: "fail",
      failureReasons: ["allergy_conflict"],
      explanationStatus: "requested",
      scanner: {
        authUserId: expect.any(String),
        displayName: "ADMIN User",
        email: "admin@meditag.test",
      },
      patient: {
        _id: seed.conflictPatientId,
        mrn: "MRN-CONFLICT-001",
        displayName: "Demo Conflict Patient",
        allergyLabels: ["Penicillin allergy"],
      },
      medication: {
        _id: seed.conflictMedicationId,
        displayName: "Amoxicillin 500mg",
        rxNormCode: "723",
      },
      wristband: {
        _id: seed.conflictWristbandId,
        token: "WRISTBAND-CONFLICT-QR-001",
        tokenType: "qr",
        isActive: true,
      },
    });
    expect(allLogs[1]?.scanLogId).toBe(safeVerification.scanLogId);

    const failOnlyLogs = await admin.query(api.scanLogs.listForAdminReview, {
      limit: 10,
      result: "fail",
      patientId: seed.conflictPatientId,
    });

    expect(failOnlyLogs).toEqual([allLogs[0]]);

    const boundedLogs = await admin.query(api.scanLogs.listForAdminReview, {
      limit: 10,
      createdAtStart: allLogs[0]!.createdAt,
    });

    expect(boundedLogs).toEqual([allLogs[0]]);
  });

  test("blocks nurses from admin review queries", async () => {
    const nurse = await setupIdentity(t, "nurse");
    const seed = await t.mutation(internal.seed.seedDemoData);

    const verification = await nurse.mutation(api.verification.verifyMedicationScan, {
      scannedToken: "WRISTBAND-SAFE-QR-001",
      selectedMedicationId: seed.safeMedicationId,
      scanType: "qr",
    });

    await expect(
      nurse.query(api.scanLogs.listForAdminReview, {
        limit: 10,
      }),
    ).rejects.toThrow("not authorized");

    await expect(
      nurse.query(api.scanLogs.getAdminScanLogDetail, {
        scanLogId: verification.scanLogId,
      }),
    ).rejects.toThrow("not authorized");
  });

  test("returns detailed review context and null for a missing scan log", async () => {
    const admin = await setupIdentity(t, "admin");
    const seed = await t.mutation(internal.seed.seedDemoData);

    await admin.mutation(api.users.upsertCurrentUserProfile, {});

    const verification = await admin.mutation(api.verification.verifyMedicationScan, {
      scannedToken: "WRISTBAND-CONFLICT-QR-001",
      selectedMedicationId: seed.conflictMedicationId,
      scanType: "qr",
      requestExplanation: true,
      deviceId: "admin-device-3",
    });

    await t.mutation(internal.scanLogExplanations.patchScanLogExplanation, {
      scanLogId: verification.scanLogId,
      explanationStatus: "generated",
      explanationText: "Conflict explanation.",
      explanationModel: "demo-model",
    });

    const detail = await admin.query(api.scanLogs.getAdminScanLogDetail, {
      scanLogId: verification.scanLogId,
    });

    expect(detail).toMatchObject({
      scanLog: {
        _id: verification.scanLogId,
        patientId: seed.conflictPatientId,
        medicationId: seed.conflictMedicationId,
        wristbandId: seed.conflictWristbandId,
        result: "fail",
        failureReasons: ["allergy_conflict"],
        explanationStatus: "generated",
        explanationText: "Conflict explanation.",
        explanationModel: "demo-model",
      },
      scanner: {
        authUserId: expect.any(String),
        displayName: "ADMIN User",
        email: "admin@meditag.test",
      },
      patient: {
        _id: seed.conflictPatientId,
        mrn: "MRN-CONFLICT-001",
        displayName: "Demo Conflict Patient",
        allergyCodes: ["SNOMED:294954006"],
        allergyLabels: ["Penicillin allergy"],
      },
      medication: {
        _id: seed.conflictMedicationId,
        patientId: seed.conflictPatientId,
        displayName: "Amoxicillin 500mg",
        rxNormCode: "723",
        contraindicationAllergyCodes: ["SNOMED:294954006"],
      },
      wristband: {
        _id: seed.conflictWristbandId,
        patientId: seed.conflictPatientId,
        token: "WRISTBAND-CONFLICT-QR-001",
        tokenType: "qr",
        isActive: true,
      },
    });

    const deletedScanLogId = verification.scanLogId;
    await t.run(async (ctx) => {
      await ctx.db.delete(deletedScanLogId);
    });

    const missingDetail = await admin.query(api.scanLogs.getAdminScanLogDetail, {
      scanLogId: deletedScanLogId as Id<"scanLogs">,
    });

    expect(missingDetail).toBeNull();
  });
});
