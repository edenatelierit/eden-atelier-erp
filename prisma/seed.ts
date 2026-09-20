import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_INVENTORY_CATEGORIES,
  DEFAULT_UNITS,
} from "../lib/master-defaults";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
    },
  },
});

const ADMIN_EMAIL = "admin@edenatelier.com";
const ADMIN_PASSWORD = "Admin123!";
const CLIENT_EMAIL = "client@edenatelier.test";
const PROJECT_NUMBER = "WS-26-001";

async function main() {
  const passwordHash = await hash(ADMIN_PASSWORD, 12);

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      name: "Eden Atelier Admin",
      role: "SUPER_ADMIN",
      passwordHash,
    },
    create: {
      name: "Eden Atelier Admin",
      email: ADMIN_EMAIL,
      role: "SUPER_ADMIN",
      passwordHash,
    },
  });

  const client = await prisma.client.upsert({
    where: { leadNumber: "WS-L-26-001" },
    update: {
      name: "Villa Palme Client",
      contactPerson: "Sara Al Mazrouei",
      phone: "+971500000001",
      email: CLIENT_EMAIL,
      source: "REFERRAL",
      status: "CONVERTED",
    },
    create: {
      leadNumber: "WS-L-26-001",
      name: "Villa Palme Client",
      contactPerson: "Sara Al Mazrouei",
      phone: "+971500000001",
      email: CLIENT_EMAIL,
      source: "REFERRAL",
      status: "CONVERTED",
    },
  });

  const project = await prisma.project.upsert({
    where: { projectNumber: PROJECT_NUMBER },
    update: {
      clientId: client.id,
      location: "Palm Jumeirah, Dubai",
      preferredStyle: "Contemporary",
      preferredWood: "Walnut",
      preferredStone: "Calacatta",
      status: "DESIGN",
    },
    create: {
      clientId: client.id,
      projectNumber: PROJECT_NUMBER,
      location: "Palm Jumeirah, Dubai",
      preferredStyle: "Contemporary",
      preferredWood: "Walnut",
      preferredStone: "Calacatta",
      status: "DESIGN",
      areasIncluded: ["KITCHEN", "WARDROBES"],
    },
  });

  console.log("Seeded workspace:");
  console.log(`  admin   ${admin.email} / ${ADMIN_PASSWORD}`);
  console.log(`  client  ${client.leadNumber} ${client.name}`);
  console.log(`  project ${project.projectNumber} ${project.location}`);

  const units = DEFAULT_UNITS;

  for (const unit of units) {
    await prisma.unitOfMeasure.upsert({
      where: { symbol: unit.symbol },
      update: { nameEn: unit.nameEn, nameAr: unit.nameAr, isSystem: true },
      create: { ...unit, isSystem: true },
    });
  }

  const inventoryCategories = DEFAULT_INVENTORY_CATEGORIES;

  for (const item of inventoryCategories) {
    await prisma.category.upsert({
      where: { type_code: { type: "INVENTORY", code: item.code } },
      update: { nameEn: item.nameEn, nameAr: item.nameAr, isSystem: true },
      create: { ...item, type: "INVENTORY", isSystem: true },
    });
  }

  const expenseCategories = DEFAULT_EXPENSE_CATEGORIES;

  for (const item of expenseCategories) {
    await prisma.category.upsert({
      where: { type_code: { type: "EXPENSE", code: item.code } },
      update: { nameEn: item.nameEn, nameAr: item.nameAr, isSystem: true },
      create: { ...item, type: "EXPENSE", isSystem: true },
    });
  }

  const incomeCategories = DEFAULT_INCOME_CATEGORIES;

  for (const item of incomeCategories) {
    await prisma.category.upsert({
      where: { type_code: { type: "INCOME", code: item.code } },
      update: { nameEn: item.nameEn, nameAr: item.nameAr, isSystem: true },
      create: { ...item, type: "INCOME", isSystem: true },
    });
  }

  console.log(`  units   ${units.length} units of measure`);
  console.log(
    `  cats    ${inventoryCategories.length} inventory + ${expenseCategories.length} expense + ${incomeCategories.length} income`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
