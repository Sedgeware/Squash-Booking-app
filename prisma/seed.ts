import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  // ─── Existing users ──────────────────────────────────────────────────────

  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@tamworthsquash.com" },
    update: { phone: "07700 100001" },
    create: {
      email: "admin@tamworthsquash.com",
      name: "Admin User",
      password: adminPassword,
      phone: "07700 100001",
      role: "ADMIN",
    },
  });

  await prisma.membership.upsert({
    where: { id: "admin-membership" },
    update: {},
    create: {
      id: "admin-membership",
      userId: admin.id,
      status: "ACTIVE",
      currentPeriodStart: now,
      currentPeriodEnd: nextMonth,
    },
  });

  const testPassword = await bcrypt.hash("test123", 12);
  await prisma.user.upsert({
    where: { email: "test@tamworthsquash.com" },
    update: { phone: "07700 100002" },
    create: {
      email: "test@tamworthsquash.com",
      name: "Test User",
      password: testPassword,
      phone: "07700 100002",
      role: "USER",
    },
  });

  // ─── Ladder users ─────────────────────────────────────────────────────────

  const ladderPassword = await bcrypt.hash("ladder123", 12);

  const ladderUsersData = [
    { name: "Sarah Jones",   email: "sarah@tamworthsquash.com",  phone: "07700 900001", rank: 1 },
    { name: "Tom Smith",     email: "tom@tamworthsquash.com",    phone: "07700 900002", rank: 2 },
    { name: "Alex Brown",    email: "alex@tamworthsquash.com",   phone: "07700 900003", rank: 3 },
    { name: "Priya Patel",   email: "priya@tamworthsquash.com",  phone: "07700 900004", rank: 4 },
    { name: "James Carter",  email: "james@tamworthsquash.com",  phone: "07700 900005", rank: 5 },
  ];

  const ladderPlayers: { id: string; rank: number; name: string }[] = [];

  for (const u of ladderUsersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { phone: u.phone },
      create: {
        email: u.email,
        name: u.name,
        password: ladderPassword,
        phone: u.phone,
        role: "USER",
      },
    });

    // Give each active ladder member an active membership
    const memId = `membership-${u.email}`;
    await prisma.membership.upsert({
      where: { id: memId },
      update: {},
      create: {
        id: memId,
        userId: user.id,
        status: "ACTIVE",
        currentPeriodStart: now,
        currentPeriodEnd: nextMonth,
      },
    });

    // Create or update ladder player record
    const lp = await prisma.ladderPlayer.upsert({
      where: { userId: user.id },
      update: { status: "ACTIVE", rank: u.rank, approvedAt: now, approvedById: admin.id },
      create: {
        userId: user.id,
        status: "ACTIVE",
        rank: u.rank,
        joinedAt: now,
        approvedAt: now,
        approvedById: admin.id,
      },
    });

    ladderPlayers.push({ id: lp.id, rank: u.rank, name: u.name });
  }

  // ─── Pending ladder request ───────────────────────────────────────────────

  const emmaPassword = await bcrypt.hash("ladder123", 12);
  const emma = await prisma.user.upsert({
    where: { email: "emma@tamworthsquash.com" },
    update: { phone: "07700 900006" },
    create: {
      email: "emma@tamworthsquash.com",
      name: "Emma Wilson",
      password: emmaPassword,
      phone: "07700 900006",
      role: "USER",
    },
  });

  await prisma.membership.upsert({
    where: { id: "membership-emma@tamworthsquash.com" },
    update: {},
    create: {
      id: "membership-emma@tamworthsquash.com",
      userId: emma.id,
      status: "ACTIVE",
      currentPeriodStart: now,
      currentPeriodEnd: nextMonth,
    },
  });

  await prisma.ladderPlayer.upsert({
    where: { userId: emma.id },
    update: { status: "PENDING", rank: null },
    create: {
      userId: emma.id,
      status: "PENDING",
      joinedAt: now,
    },
  });

  // ─── Sample challenge: James (rank 5) → Alex (rank 3) ─────────────────────

  const james = ladderPlayers.find((p) => p.rank === 5)!;
  const alex  = ladderPlayers.find((p) => p.rank === 3)!;

  // Only create the challenge if it doesn't already exist
  const existingChallenge = await prisma.ladderChallenge.findFirst({
    where: { challengerId: james.id, challengedId: alex.id, status: "PENDING" },
  });

  if (!existingChallenge) {
    await prisma.ladderChallenge.create({
      data: {
        challengerId: james.id,
        challengedId: alex.id,
        status: "PENDING",
      },
    });
  }

  console.log("\nSeed complete.");
  console.log("\n── Existing accounts ──────────────────────────────────");
  console.log("  Admin:  admin@tamworthsquash.com / admin123  (ADMIN)");
  console.log("  Test:   test@tamworthsquash.com  / test123   (no ladder)");
  console.log("\n── Ladder accounts (all password: ladder123) ──────────");
  for (const u of ladderUsersData) {
    console.log(`  Rank ${u.rank}: ${u.name.padEnd(14)} ${u.email}`);
  }
  console.log("  Pending: Emma Wilson        emma@tamworthsquash.com");
  console.log("\n── Sample data ────────────────────────────────────────");
  console.log("  Challenge: James Carter (rank 5) → Alex Brown (rank 3) [PENDING]");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
