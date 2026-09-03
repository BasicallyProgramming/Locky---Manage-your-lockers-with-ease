import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

// DATABASE_URL comes from your Neon project's connection string
// (Neon dashboard -> your project -> Connect -> copy the "pooled connection"
// string). Set it in .env.local for local dev and in your host's
// environment variables (e.g. Vercel project settings) for production.
if (!process.env.DATABASE_URL) {
  console.warn(
    "DATABASE_URL is not set — database calls will fail until it's configured."
  );
}

const sql = neon(process.env.DATABASE_URL ?? "");
export const db = drizzle(sql, { schema });
