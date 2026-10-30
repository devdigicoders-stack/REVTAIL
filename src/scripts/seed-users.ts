import "dotenv/config";
import bcrypt from "bcryptjs";
import prisma from "../lib/prisma";

async function seed() {
  console.log("Seeding users...");

  const password = "Password@123";
  const hashedPassword = await bcrypt.hash(password, 12);

  // 1. Ensure at least one Interest exists
  let interest = await prisma.interest.findFirst({
    where: { name: "Electronics" },
  });

  if (!interest) {
    interest = await prisma.interest.create({
      data: {
        name: "Electronics",
        isActive: true,
      },
    });
    console.log("Created Interest:", interest.name);
  }

  // 2. ADMIN USER
  const adminEmail = "admin@revtail.in";
  let admin = await prisma.user.findUnique({
    where: { email: adminEmail },
    include: { adminProfile: true },
  });

  if (!admin) {
    admin = await prisma.user.create({
      data: {
        role: "ADMIN",
        email: adminEmail,
        mobile: "9999999999",
        password: hashedPassword,
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
        mobileVerifiedAt: new Date(),
        adminProfile: {
          create: {
            fullName: "Revtail Super Admin",
            designation: "Head Administrator",
          },
        },
      },
      include: { adminProfile: true },
    });
    console.log("Created Admin User:", admin.email);
  } else {
    console.log("Admin User already exists:", admin.email);
  }

  // 3. BRAND USER
  const brandEmail = "brand@revtail.in";
  let brand = await prisma.user.findUnique({
    where: { email: brandEmail },
    include: { brandProfile: true },
  });

  if (!brand) {
    brand = await prisma.user.create({
      data: {
        role: "BRAND",
        email: brandEmail,
        mobile: "9888888888",
        password: hashedPassword,
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
        mobileVerifiedAt: new Date(),
        brandProfile: {
          create: {
            companyName: "Acme Brand Pvt Ltd",
            companyType: "D2C Brand",
            categoryId: interest.id,
            website: "https://acmebrand.example.com",
            pocFullName: "Rajesh Kumar",
            pocMobile: "9888888888",
            designation: "Brand Manager",
            approvalStatus: "ACTIVE",
            approvedAt: new Date(),
          },
        },
      },
      include: { brandProfile: true },
    });
    console.log("Created Brand User:", brand.email);
  } else {
    console.log("Brand User already exists:", brand.email);
  }

  // 4. TESTER USER
  const testerMobile = "9876543210";
  const testerEmail = "tester@revtail.in";
  let tester = await prisma.user.findUnique({
    where: { mobile: testerMobile },
    include: { testerProfile: { include: { wallet: true } } },
  });

  if (!tester) {
    tester = await prisma.user.create({
      data: {
        role: "TESTER",
        email: testerEmail,
        mobile: testerMobile,
        password: hashedPassword,
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
        mobileVerifiedAt: new Date(),
        testerProfile: {
          create: {
            fullName: "Amit Sharma",
            gender: "MALE",
            ageCategory: "AGE_25_34",
            pinCode: "110001",
            city: "New Delhi",
            state: "Delhi",
            approvalStatus: "APPROVED",
            approvedAt: new Date(),
            wallet: {
              create: {
                totalEarned: 0,
                availableBalance: 0,
                totalPaid: 0,
              },
            },
          },
        },
      },
      include: { testerProfile: { include: { wallet: true } } },
    });
    console.log("Created Tester User with mobile:", tester.mobile);
  } else {
    console.log("Tester User already exists with mobile:", tester.mobile);
  }

  console.log("\n=================================");
  console.log("Seeding complete! Credentials:");
  console.log("1. ADMIN -> Email: admin@revtail.in | Password:", password);
  console.log("2. BRAND -> Email: brand@revtail.in | Password:", password);
  console.log("3. TESTER -> Mobile: 9876543210 | Password:", password);
  console.log("=================================\n");
}

seed()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
