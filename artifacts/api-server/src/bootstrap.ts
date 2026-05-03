#!/usr/bin/env node
/**
 * Bootstrap script: creates the first school and admin account.
 *
 * Usage:
 *   pnpm --filter @workspace/api-server run bootstrap
 *   pnpm --filter @workspace/api-server run bootstrap -- --school "Springfield Elementary" --password "secret123"
 *
 * CLI flags (all optional — the script will prompt for any that are missing):
 *   --school    School name
 *   --password  Admin account password (min 8 characters)
 */

import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, pool, schoolsTable, usersTable } from "@workspace/db";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseArgs(): Record<string, string> {
  const args: Record<string, string> = {};
  const argv = process.argv.slice(2).filter((a) => a !== "--");
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--") && i + 1 < argv.length) {
      const key = argv[i].slice(2);
      args[key] = argv[++i];
    }
  }
  return args;
}

function generateJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function generateUniqueJoinCode(): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = generateJoinCode();
    const [existing] = await db
      .select({ id: schoolsTable.id })
      .from(schoolsTable)
      .where(eq(schoolsTable.joinCode, code));
    if (!existing) return code;
  }
  throw new Error("Failed to generate a unique join code after 20 attempts.");
}

const ADJECTIVES = [
  "Brave", "Calm", "Bright", "Bold", "Kind", "Swift", "Gentle", "Wise",
  "Happy", "Sunny", "Quiet", "Eager", "Proud", "Warm", "Clear", "Noble",
  "Vivid", "Loyal", "Merry", "Nimble", "Daring", "Jolly", "Lively", "Tender",
  "Caring", "Clever", "Steady", "Humble", "Radiant", "Serene", "Hearty",
  "Mighty", "Peppy", "Rosy", "Snappy", "Sprightly", "Trusting", "Valiant",
  "Witty", "Zesty",
];

const ANIMALS = [
  "Otter", "Falcon", "Panda", "Dolphin", "Robin", "Badger", "Lynx",
  "Heron", "Koala", "Ibis", "Crane", "Finch", "Marmot", "Newt", "Owl",
  "Quail", "Raven", "Stork", "Tiger", "Viper", "Wren", "Yak", "Zebra",
  "Bison", "Condor", "Dingo", "Elk", "Gazelle", "Hamster", "Iguana",
  "Jaguar", "Kiwi", "Lemur", "Moose", "Narwhal", "Ocelot", "Pelican",
  "Quokka", "Salamander", "Tamarin",
];

function generateAdminNickname(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return `${adj}${animal}`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs();
  const rl = readline.createInterface({ input, output });

  console.log("\n=== KindnessConnect Bootstrap ===\n");

  // Collect school name
  let schoolName = args["school"]?.trim() ?? "";
  if (!schoolName) {
    schoolName = (await rl.question("School name: ")).trim();
  }
  if (!schoolName) {
    console.error("Error: school name is required.");
    process.exit(1);
  }

  // Collect password
  let password = args["password"] ?? "";
  if (!password) {
    password = await rl.question("Admin password (min 8 characters): ");
  }
  if (password.length < 8) {
    console.error("Error: password must be at least 8 characters.");
    process.exit(1);
  }

  rl.close();

  // Warn if schools already exist (non-blocking — re-running is allowed)
  const existing = await db.select({ id: schoolsTable.id }).from(schoolsTable);
  if (existing.length > 0) {
    console.warn(
      `Warning: ${existing.length} school(s) already exist in the database.`,
    );
    console.warn("Continuing will create an additional school and admin.\n");
  }

  console.log("Creating school and admin account...\n");

  // Hash password before opening the transaction so heavy CPU work stays outside it
  const passwordHash = await bcrypt.hash(password, 12);
  const joinCode = await generateUniqueJoinCode();
  const nickname = generateAdminNickname();

  // Wrap both inserts in a single transaction — if admin creation fails the
  // school row is rolled back automatically, leaving no orphaned records.
  const { school, adminUser } = await db.transaction(async (tx) => {
    const [school] = await tx
      .insert(schoolsTable)
      .values({ name: schoolName, joinCode })
      .returning();

    const [adminUser] = await tx
      .insert(usersTable)
      .values({
        schoolId: school.id,
        nickname,
        passwordHash,
        role: "admin",
      })
      .returning();

    return { school, adminUser };
  });

  // Print results
  console.log("=".repeat(48));
  console.log("  Bootstrap complete!");
  console.log("=".repeat(48));
  console.log(`  School name : ${school.name}`);
  console.log(`  School ID   : ${school.id}`);
  console.log(`  Join code   : ${school.joinCode}`);
  console.log("  ---");
  console.log(`  Admin login`);
  console.log(`    Nickname  : ${adminUser.nickname}`);
  console.log(`    Password  : ${password}`);
  console.log(`    Join code : ${school.joinCode}`);
  console.log("=".repeat(48));
  console.log("\nShare the join code with students so they can register.");
  console.log("Keep the admin credentials in a safe place.\n");

  await pool.end();
}

main().catch((err) => {
  console.error("Bootstrap failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
