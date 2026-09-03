// Creates a staff login. There's no public sign-up route on purpose — this
// script is the only way to grant access, and it requires DATABASE_URL
// (server/database access), so only someone with that can add accounts.
//
// Usage:
//   npm run create-staff -- someone@school.org theirPassword

import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^([\w.-]+)\s*=\s*(.*)?$/);
    if (!match) continue;
    const key = match[1];
    const value = (match[2] ?? "").trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}

async function main() {
  loadEnvLocal(); // must run before importing db/index.ts, which reads DATABASE_URL at import time

  const [email, password] = process.argv.slice(2);
  if (!email || !password) {
    console.error("Usage: npm run create-staff -- someone@school.org theirPassword");
    process.exit(1);
  }

  const { db } = await import("../db");
  const { staff } = await import("../db/schema");

  const passwordHash = await bcrypt.hash(password, 10);
  await db.insert(staff).values({
    id: randomUUID(),
    email: email.toLowerCase(),
    passwordHash,
  });

  console.log(`Staff account created for ${email}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
