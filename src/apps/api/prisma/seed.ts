import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.nurse.upsert({
    where: { email: "nurse1@meditag.local" },
    update: {},
    create: { name: "Nurse One", email: "nurse1@meditag.local", role: "nurse" }
  });

  const patient = await prisma.patient.create({
    data: { name: "Demo Patient", dob: new Date("1990-01-01") }
  });

  await prisma.wristband.create({
    data: { uid: "WRISTBAND-DEMO-001", patientId: patient.id }
  });
}

main()
  .finally(async () => prisma.$disconnect());
