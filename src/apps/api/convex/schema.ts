import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Nurse
  nurses: defineTable({
    name: v.string(),
    email: v.string(),
    passwordHash: v.string(),
    role: v.union(v.literal("nurse"), v.literal("admin")),
  }).index("by_email", ["email"]),

  // Sessions
  sessions: defineTable({
    nurseId: v.id("nurses"),
    token: v.string(),
    expiresAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_nurse", ["nurseId"]),

  // Patients
  patients: defineTable({
    name: v.string(),
    dateOfBirth: v.string(),   // "YYYY-MM-DD"
    allergies: v.array(v.string()),
    bloodType: v.optional(v.string()),
    ward: v.string(),
    notes: v.optional(v.string()),
  }),

  // Wristbands
  wristbands: defineTable({
    uid: v.string(),            // QR / NFC uid scanned by nurse
    patientId: v.id("patients"),
    isActive: v.boolean(),
    assignedAt: v.number(),
    assignedBy: v.id("nurses"),
  })
    .index("by_uid", ["uid"])
    .index("by_patient", ["patientId"]),

  // Medications
  medications: defineTable({
    patientId: v.id("patients"),
    name: v.string(),
    dosage: v.string(),
    frequency: v.string(),
    route: v.string(),
    contraindications: v.array(v.string()),
    scheduledAt: v.optional(v.number()),
    isActive: v.boolean(),
  }).index("by_patient", ["patientId"]),

  // Scan Logs
  scanLogs: defineTable({
    wristbandUid: v.string(),
    wristbandId: v.id("wristbands"),
    patientId: v.id("patients"),
    nurseId: v.id("nurses"),
    medicationIds: v.array(v.id("medications")),
    riskLevel: v.union(
      v.literal("safe"),
      v.literal("warning"),
      v.literal("danger")
    ),
    conflicts: v.array(v.string()),
    aiExplanation: v.optional(v.string()),
    scannedAt: v.number(),
  })
    .index("by_patient", ["patientId"])
    .index("by_nurse", ["nurseId"])
    .index("by_wristband", ["wristbandId"])
    .index("by_scanned_at", ["scannedAt"]),
});