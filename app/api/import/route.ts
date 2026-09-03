import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { lockers } from "@/db/schema";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { items } = await req.json();
  if (!Array.isArray(items) || !items.length) {
    return NextResponse.json({ error: "No rows to import." }, { status: 400 });
  }

  const records = items
    .map((row: any) => ({
      number: String(row.number ?? "").trim(),
      name: String(row.name ?? "").trim(),
      combo: String(row.combo ?? "").trim(),
      pin: row.pin ? String(row.pin).trim() : null,
      status: row.status === "taken" ? "taken" : "open",
      section: String(row.section ?? "").trim(),
      notes: String(row.notes ?? "").trim(),
      updatedAt: new Date(),
    }))
    .filter((r) => r.number !== "");

  // Chunk to keep each statement a reasonable size.
  const CHUNK = 200;
  try {
    for (let i = 0; i < records.length; i += CHUNK) {
      const chunk = records.slice(i, i + CHUNK);
      for (const record of chunk) {
        await db
          .insert(lockers)
          .values(record)
          .onConflictDoUpdate({ target: lockers.number, set: record });
      }
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Import failed partway through." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, count: records.length });
}
