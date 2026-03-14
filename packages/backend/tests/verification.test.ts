/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import { beforeEach, describe, expect, test } from "vitest";

import { api, components, internal } from "../convex/_generated/api";
import authSchema from "../convex/betterAuth/schema";
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
const betterAuthModules = import.meta.glob<ModuleLoader>(
  "../convex/betterAuth/**/*.*s"
);

async function setupIdentity(
  t: TestInstance,
  role: "nurse" | "admin"
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

describe("verification flows", () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(() => {
    t = convexTest(schema, modules);
    t.registerComponent("betterAuth", authSchema, betterAuthModules);
  });

  test("rejects unauthenticated verification", async () => {
    await t.mutation(internal.seed.seedDemoData);

    await expect(
      t.mutation(api.verification.verifyMedicationScan, {
        scannedToken: "WRISTBAND-SAFE-QR-001",
        selectedMedicationCode: "161",
      })
    ).rejects.toThrow("not authorized");
  });

  test("returns pass for safe patient/medication pair", async () => {
    const nurse = await setupIdentity(t, "nurse");
    const seed = await t.mutation(internal.seed.seedDemoData);

    const result = await nurse.mutation(api.verification.verifyMedicationScan, {
      scannedToken: "WRISTBAND-SAFE-QR-001",
      selectedMedicationId: seed.safeMedicationId,
      scanType: "qr",
      deviceId: "device-safe-1",
    });

    expect(result.result).toBe("pass");
    expect(result.failureReasons).toEqual([]);

    const logs = await nurse.query(api.verification.getRecentScanLogs, { limit: 10 });
    expect(logs.length).toBe(1);
    expect(logs[0]?.result).toBe("pass");
  });

  test("returns fail with allergy conflict and logs append-only entries", async () => {
    const nurse = await setupIdentity(t, "nurse");
    const seed = await t.mutation(internal.seed.seedDemoData);

    const first = await nurse.mutation(api.verification.verifyMedicationScan, {
      scannedToken: "WRISTBAND-CONFLICT-QR-001",
      selectedMedicationId: seed.conflictMedicationId,
      scanType: "qr",
      requestExplanation: true,
      deviceId: "device-conflict-1",
    });

    expect(first.result).toBe("fail");
    expect(first.failureReasons).toContain("allergy_conflict");
    expect(first.explanationStatus).toBe("requested");

    const second = await nurse.mutation(api.verification.verifyMedicationScan, {
      scannedToken: "WRISTBAND-CONFLICT-QR-001",
      selectedMedicationId: seed.conflictMedicationId,
      scanType: "qr",
      requestExplanation: false,
      deviceId: "device-conflict-1",
    });

    expect(second.result).toBe("fail");

    const logs = await nurse.query(api.verification.getRecentScanLogs, { limit: 10 });
    expect(logs.length).toBe(2);
    expect(logs[0]?._id).not.toBe(logs[1]?._id);
  });

  test("returns wristband_not_found when token is unknown", async () => {
    const nurse = await setupIdentity(t, "nurse");
    await t.mutation(internal.seed.seedDemoData);

    const result = await nurse.mutation(api.verification.verifyMedicationScan, {
      scannedToken: "UNKNOWN-TOKEN",
      selectedMedicationCode: "161",
      scanType: "qr",
    });

    expect(result.result).toBe("fail");
    expect(result.failureReasons).toContain("wristband_not_found");
  });
});

describe("role enforcement", () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(() => {
    t = convexTest(schema, modules);
    t.registerComponent("betterAuth", authSchema, betterAuthModules);
  });

  test("blocks nurse from admin-only patient creation", async () => {
    const nurse = await setupIdentity(t, "nurse");

    await expect(
      nurse.mutation(api.patients.create, {
        mrn: "MRN-NEW-001",
        displayName: "Unauthorized Insert",
        dob: "1999-01-01",
        allergyCodes: [],
        allergyLabels: [],
      })
    ).rejects.toThrow("not authorized");
  });

  test("allows admin to create patient", async () => {
    const admin = await setupIdentity(t, "admin");
    const patientId = await admin.mutation(api.patients.create, {
      mrn: "MRN-ADMIN-001",
      displayName: "Admin Insert",
      dob: "1988-12-01",
      allergyCodes: ["SNOMED:91936005"],
      allergyLabels: ["Latex allergy"],
    });

    const patient = await admin.query(api.patients.getById, { patientId });
    expect(patient?._id).toBe(patientId);
    expect(patient?.mrn).toBe("MRN-ADMIN-001");
  });
});
