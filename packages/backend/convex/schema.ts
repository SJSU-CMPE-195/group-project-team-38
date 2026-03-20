import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    authUserId: v.string(),
    displayName: v.string(),
    email: v.string(),
    isActive: v.boolean(),
    role: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_auth_user_id", ["authUserId"])
    .index("by_email", ["email"]),
  patients: defineTable({
    mrn: v.string(),
    displayName: v.string(),
    dob: v.string(),
    allergyCodes: v.array(v.string()),
    allergyLabels: v.array(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_mrn", ["mrn"])
    .index("by_active", ["isActive"]),
  wristbands: defineTable({
    patientId: v.id("patients"),
    token: v.string(),
    tokenType: v.union(v.literal("qr"), v.literal("nfc")),
    issuedAt: v.number(),
    revokedAt: v.optional(v.number()),
    isActive: v.boolean(),
  })
    .index("by_token", ["token"])
    .index("by_patient_id", ["patientId"])
    .index("by_patient_id_and_active", ["patientId", "isActive"]),
  medications: defineTable({
    patientId: v.id("patients"),
    displayName: v.string(),
    rxNormCode: v.string(),
    route: v.optional(v.string()),
    dose: v.optional(v.string()),
    frequency: v.optional(v.string()),
    ingredientCodes: v.array(v.string()),
    contraindicationAllergyCodes: v.array(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_patient_id", ["patientId"])
    .index("by_patient_id_and_active", ["patientId", "isActive"])
    .index("by_rxnorm_code", ["rxNormCode"]),
  scanLogs: defineTable({
    authUserId: v.string(),
    patientId: v.optional(v.id("patients")),
    wristbandId: v.optional(v.id("wristbands")),
    medicationId: v.optional(v.id("medications")),
    scannedToken: v.string(),
    result: v.union(v.literal("pass"), v.literal("fail")),
    failureReasons: v.array(
      v.union(
        v.literal("identity_mismatch"),
        v.literal("allergy_conflict"),
        v.literal("wristband_not_found"),
        v.literal("medication_not_found"),
      ),
    ),
    deterministicDecisionVersion: v.string(),
    explanationStatus: v.union(
      v.literal("none"),
      v.literal("requested"),
      v.literal("generated"),
      v.literal("failed"),
    ),
    explanationText: v.optional(v.string()),
    explanationModel: v.optional(v.string()),
    metadata: v.object({
      scanType: v.union(v.literal("qr"), v.literal("nfc"), v.literal("unknown")),
      deviceId: v.optional(v.string()),
    }),
    createdAt: v.number(),
  })
    .index("by_created_at", ["createdAt"])
    .index("by_auth_user_id_and_created_at", ["authUserId", "createdAt"])
    .index("by_patient_id_and_created_at", ["patientId", "createdAt"])
    .index("by_result_and_created_at", ["result", "createdAt"]),
});
