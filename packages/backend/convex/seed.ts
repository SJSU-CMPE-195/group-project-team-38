import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { internalMutation } from "./_generated/server";

async function ensurePatient(
  ctx: MutationCtx,
  input: {
    mrn: string;
    displayName: string;
    dob: string;
    allergyCodes: string[];
    allergyLabels: string[];
  }
): Promise<Id<"patients">> {
  const existingPatient = await ctx.db
    .query("patients")
    .withIndex("by_mrn", (q) => q.eq("mrn", input.mrn))
    .unique();

  if (existingPatient) {
    return existingPatient._id;
  }

  const now = Date.now();
  return await ctx.db.insert("patients", {
    ...input,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });
}

export const seedDemoData = internalMutation({
  args: {},
  returns: v.object({
    safePatientId: v.id("patients"),
    conflictPatientId: v.id("patients"),
    safeMedicationId: v.id("medications"),
    conflictMedicationId: v.id("medications"),
    safeWristbandId: v.id("wristbands"),
    conflictWristbandId: v.id("wristbands"),
  }),
  handler: async (ctx) => {
    const safePatientId = await ensurePatient(ctx, {
      mrn: "MRN-SAFE-001",
      displayName: "Demo Safe Patient",
      dob: "1990-01-01",
      allergyCodes: ["SNOMED:91936005"],
      allergyLabels: ["Latex allergy"],
    });
    const conflictPatientId = await ensurePatient(ctx, {
      mrn: "MRN-CONFLICT-001",
      displayName: "Demo Conflict Patient",
      dob: "1985-06-15",
      allergyCodes: ["SNOMED:294954006"],
      allergyLabels: ["Penicillin allergy"],
    });

    const ensureMedication = async (input: {
      patientId: typeof safePatientId;
      displayName: string;
      rxNormCode: string;
      ingredientCodes: string[];
      contraindicationAllergyCodes: string[];
    }) => {
      const existingMedication = await ctx.db
        .query("medications")
        .withIndex("by_rxnorm_code", (q) => q.eq("rxNormCode", input.rxNormCode))
        .collect();

      const matchingMedication = existingMedication.find(
        (item) => item.patientId === input.patientId && item.isActive
      );
      if (matchingMedication) {
        return matchingMedication._id;
      }

      const now = Date.now();
      return await ctx.db.insert("medications", {
        ...input,
        route: "PO",
        dose: "1 tablet",
        frequency: "BID",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    };

    const safeMedicationId = await ensureMedication({
      patientId: safePatientId,
      displayName: "Acetaminophen 500mg",
      rxNormCode: "161",
      ingredientCodes: ["RXNORM:161"],
      contraindicationAllergyCodes: ["SNOMED:300913006"],
    });
    const conflictMedicationId = await ensureMedication({
      patientId: conflictPatientId,
      displayName: "Amoxicillin 500mg",
      rxNormCode: "723",
      ingredientCodes: ["RXNORM:723"],
      contraindicationAllergyCodes: ["SNOMED:294954006"],
    });

    const ensureWristband = async (input: {
      patientId: typeof safePatientId;
      token: string;
      tokenType: "qr" | "nfc";
    }) => {
      const existingWristband = await ctx.db
        .query("wristbands")
        .withIndex("by_token", (q) => q.eq("token", input.token))
        .unique();
      if (existingWristband) {
        if (!existingWristband.isActive) {
          await ctx.db.patch(existingWristband._id, {
            patientId: input.patientId,
            tokenType: input.tokenType,
            issuedAt: Date.now(),
            revokedAt: undefined,
            isActive: true,
          });
        }
        return existingWristband._id;
      }
      return await ctx.db.insert("wristbands", {
        ...input,
        issuedAt: Date.now(),
        isActive: true,
      });
    };

    const safeWristbandId = await ensureWristband({
      patientId: safePatientId,
      token: "WRISTBAND-SAFE-QR-001",
      tokenType: "qr",
    });
    const conflictWristbandId = await ensureWristband({
      patientId: conflictPatientId,
      token: "WRISTBAND-CONFLICT-QR-001",
      tokenType: "qr",
    });

    return {
      safePatientId,
      conflictPatientId,
      safeMedicationId,
      conflictMedicationId,
      safeWristbandId,
      conflictWristbandId,
    };
  },
});
