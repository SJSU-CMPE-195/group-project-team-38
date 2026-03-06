export type RiskLevel = "safe" | "warning" | "danger";

export interface SafetyResult {
  riskLevel: RiskLevel;
  conflicts: string[];
}

interface MedicationInput {
  name: string;
  contraindications: string[];
}

interface PatientInput {
  allergies: string[];
}


export function runSafetyEngine(
  patient: PatientInput,
  medications: MedicationInput[]
): SafetyResult {
  const conflicts: string[] = [];

  // 1. Allergy conflict detection
  for (const med of medications) {
    for (const allergy of patient.allergies) {
      if (nameMatchesAllergy(med.name, allergy)) {
        conflicts.push(
          `ALLERGY: Patient is allergic to "${allergy}" — conflicts with "${med.name}"`
        );
      }
    }
  }

  // 2. Medication–contraindication cross-check
  const medNames = medications.map((m) => m.name.toLowerCase());
  for (const med of medications) {
    for (const contra of med.contraindications) {
      if (medNames.some((n) => n.includes(contra.toLowerCase()))) {
        conflicts.push(
          `INTERACTION: "${med.name}" is contraindicated with "${contra}" (also prescribed)`
        );
      }
    }
  }

  // 3. Duplicate medication check
  const seen = new Set<string>();
  for (const med of medications) {
    const key = med.name.toLowerCase();
    if (seen.has(key)) {
      conflicts.push(`DUPLICATE: "${med.name}" appears more than once in the medication list`);
    }
    seen.add(key);
  }

  // 4. Risk classification
  const riskLevel = classifyRisk(conflicts);

  return { riskLevel, conflicts };
}

function nameMatchesAllergy(medName: string, allergy: string): boolean {
  return medName.toLowerCase().includes(allergy.toLowerCase());
}

function classifyRisk(conflicts: string[]): RiskLevel {
  if (conflicts.length === 0) return "safe";

  const hasDanger = conflicts.some(
    (c) => c.startsWith("ALLERGY") || c.startsWith("INTERACTION")
  );
  if (hasDanger) return "danger";

  return "warning";
}