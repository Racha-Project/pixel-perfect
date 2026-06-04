import { db } from "./server/db.ts";
import { users, profiles } from "./shared/schema.ts";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

async function run() {
  const email = "admin@fitderx.com";
  const password = "password";
  const passwordHash = await bcrypt.hash(password, 12);
  const id = randomUUID();

  await db.insert(users).values({
    id,
    email,
    passwordHash,
    firstName: "System",
    lastName: "Admin",
  });

  await db.insert(profiles).values({
    id,
    displayName: "System Admin",
    userType: "admin",
    onboarded: true,
  });

  console.log("Admin created: admin@fitderx.com / password");
  process.exit(0);
}

run().catch(console.error);
