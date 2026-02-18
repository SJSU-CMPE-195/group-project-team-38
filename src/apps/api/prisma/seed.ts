import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const nursePw = await bcrypt.hash(process.env.SEED_NURSE_PASSWORD!, 10);
  const adminPw = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD!, 10);

  await prisma.nurse.upsert({
    where: { email: "nurse1@meditag.local" },
    update: {},
    create: { 
      name: "Nurse One", 
      email: "nurse1@meditag.local", 
      role: "nurse",
      passwordHash: nursePw,
    },
  });

  await prisma.nurse.upsert({
    where: { email: "admin1@meditag.local" },
    update: {},
    create: {
      name: "Admin One",
      email: "admin1@meditag.local",
      role: "admin",
      passwordHash: adminPw,
    },
  });

  const patient = await prisma.patient.create({
    data: { name: "Demo Patient", dob: new Date("1990-01-01") }
  });

  await prisma.wristband.create({
    data: { uid: "WRISTBAND-DEMO-001", patientId: patient.id }
  });

  console.log("Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
