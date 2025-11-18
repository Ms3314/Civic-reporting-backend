import "dotenv/config";
import prisma from "../lib/prisma.js";

const DEPARTMENTS = [
  "GHMC Engineering Wing / Roads & Buildings (R&B) Dept.",
  "Hyderabad City Police / Local Police Stations",
  "GHMC - Health & Sanitation Dept.",
  "GHMC - Solid Waste Management (SWM) Dept.",
  "GHMC - Disaster Response Force (DRF)",
  "HMWSSB - Hyderabad Metropolitan Water Supply & Sewerage Board",
  "GHMC - Town Planning Dept.",
  "GHMC - Veterinary Dept. (Animal Care / ABC Wing)",
  "GHMC Electrical Maintenance Dept.",
  "GHMC - Urban Biodiversity / Horticulture Dept.",
  "Hyderabad Traffic Police (H-TP)",
];

async function main() {
  await prisma.category.createMany({
    data: DEPARTMENTS.map((name) => ({
      name,
    })),
    skipDuplicates: true,
  });

  await prisma.admin.createMany({
    data: DEPARTMENTS.map((name) => ({
      email: `${name.toLowerCase().replace(/\s+/g, "")}@gmail.com`,
      password: "random",
    })),
    skipDuplicates: true,
  });
}

main()
  .then(() => console.log("Seeding complete!"))
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
