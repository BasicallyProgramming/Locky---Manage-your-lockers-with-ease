import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

// Locker number is the primary key — it's the stable, staff-assigned ID.
// pin is separately unique since that's what the public lookup page keys on.
export const lockers = pgTable("lockers", {
  number: text("number").primaryKey(),
  name: text("name").notNull().default(""),
  combo: text("combo").notNull().default(""),
  pin: text("pin").unique(),
  status: text("status").notNull().default("open"), // "open" | "taken"
  section: text("section").notNull().default(""),
  notes: text("notes").notNull().default(""),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Staff accounts. No public sign-up route on purpose — accounts are created
// with the seed script (scripts/create-staff.ts) so only someone with
// server/database access can grant staff logins.
export const staff = pgTable("staff", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
