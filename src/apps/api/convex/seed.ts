/**
 * seed.ts — run once to populate Convex with synthetic demo data
 *
 * Usage (from api/ directory):
 *   npx convex run seed:run
 *
 * Or add to package.json scripts:
 *   "db:seed": "npx convex run seed:run"
 */

import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Password hash helper
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const run = mutation({
  args: {},
  handler: async (ctx) => {
    // Nurses
    const adminHash = await hashPassword("admin123");
    const nurseHash = await hashPassword("nurse123");

    const adminId = await ctx.db.insert("nurses", {
      name: "Admin User",
      email: "admin@meditag.dev",
      passwordHash: adminHash,
      role: "admin",
    });

    const nurseId = await ctx.db.insert("nurses", {
      name: "Sarah Chen",
      email: "sarah@meditag.dev",
      passwordHash: nurseHash,
      role: "nurse",
    });

    // Patients (synthetic)
    const patient1Id = await ctx.db.insert("patients", {
      name: "James Hartwell",
      dateOfBirth: "1958-03-12",
      allergies: ["penicillin", "sulfonamides"],
      bloodType: "A+",
      ward: "Cardiology-3B",
      notes: "Synthetic demo patient",
    });

    const patient2Id = await ctx.db.insert("patients", {
      name: "Maria Delgado",
      dateOfBirth: "1972-07-25",
      allergies: ["aspirin"],
      bloodType: "O-",
      ward: "Oncology-2A",
      notes: "Synthetic demo patient",
    });

    const patient3Id = await ctx.db.insert("patients", {
      name: "Tom Nguyen",
      dateOfBirth: "1990-11-03",
      allergies: [],
      bloodType: "B+",
      ward: "General-1C",
      notes: "Synthetic demo patient — no known allergies",
    });

    // Wristbands
    await ctx.db.insert("wristbands", {
      uid: "WB-001-HARTWELL",
      patientId: patient1Id,
      isActive: true,
      assignedAt: Date.now(),
      assignedBy: adminId,
    });

    await ctx.db.insert("wristbands", {
      uid: "WB-002-DELGADO",
      patientId: patient2Id,
      isActive: true,
      assignedAt: Date.now(),
      assignedBy: adminId,
    });

    await ctx.db.insert("wristbands", {
      uid: "WB-003-NGUYEN",
      patientId: patient3Id,
      isActive: true,
      assignedAt: Date.now(),
      assignedBy: adminId,
    });

    // Medications

    // Patient 1 — has penicillin allergy; amoxicillin should trigger DANGER
    await ctx.db.insert("medications", {
      patientId: patient1Id,
      name: "Amoxicillin",      // penicillin-class — should trigger allergy conflict
      dosage: "500mg",
      frequency: "three times daily",
      route: "oral",
      contraindications: [],
      isActive: true,
    });
    await ctx.db.insert("medications", {
      patientId: patient1Id,
      name: "Atorvastatin",
      dosage: "40mg",
      frequency: "once daily",
      route: "oral",
      contraindications: ["clarithromycin"],
      isActive: true,
    });

    // Patient 2 — aspirin allergy; ibuprofen contraindicated with warfarin
    await ctx.db.insert("medications", {
      patientId: patient2Id,
      name: "Ibuprofen",        // aspirin-class — should trigger allergy conflict
      dosage: "400mg",
      frequency: "as needed",
      route: "oral",
      contraindications: ["warfarin"],
      isActive: true,
    });
    await ctx.db.insert("medications", {
      patientId: patient2Id,
      name: "Warfarin",         // contraindicated with ibuprofen above
      dosage: "5mg",
      frequency: "once daily",
      route: "oral",
      contraindications: ["ibuprofen", "aspirin"],
      isActive: true,
    });

    // Patient 3 — safe, no conflicts
    await ctx.db.insert("medications", {
      patientId: patient3Id,
      name: "Metformin",
      dosage: "850mg",
      frequency: "twice daily",
      route: "oral",
      contraindications: [],
      isActive: true,
    });
    await ctx.db.insert("medications", {
      patientId: patient3Id,
      name: "Lisinopril",
      dosage: "10mg",
      frequency: "once daily",
      route: "oral",
      contraindications: [],
      isActive: true,
    });

    return {
      seeded: true,
      nurses: ["admin@meditag.dev (admin123)", "sarah@meditag.dev (nurse123)"],
      patients: ["James Hartwell", "Maria Delgado", "Tom Nguyen"],
      wristbandUids: ["WB-001-HARTWELL", "WB-002-DELGADO", "WB-003-NGUYEN"],
      notes: "WB-001 and WB-002 will trigger safety conflicts. WB-003 is safe.",
    };
  },
});