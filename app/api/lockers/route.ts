import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { lockers } from "@/db/schema";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const all = await db.select().from(lockers);
  return NextResponse.json(all);
}

// Creates a new locker or overwrites an existing one (number is the key).
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = await req.json();
  const number = String(body.number ?? "").trim();
  if (!number) return NextResponse.json({ error: "Locker number is required." }, { status: 400 });

  const record = {
    number,
    name: String(body.name ?? "").trim(),
    combo: String(body.combo ?? "").trim(),
    pin: body.pin ? String(body.pin).trim() : null,
    status: body.status === "taken" ? "taken" : "open",
    section: String(body.section ?? "").trim(),
    notes: String(body.notes ?? "").trim(),
    updatedAt: new Date(),
  };

  try {
    await db
      .insert(lockers)
      .values(record)
      .onConflictDoUpdate({ target: lockers.number, set: record });
  } catch (err: any) {
    // Most likely a duplicate PIN (unique constraint) collision.
    if (String(err?.message ?? "").includes("unique")) {
      return NextResponse.json(
        { error: "That PIN is already assigned to another locker." },
        { status: 409 }
      );
    }
    console.error(err);
    return NextResponse.json({ error: "Save failed." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { number } = await req.json();
  if (!number) return NextResponse.json({ error: "Locker number is required." }, { status: 400 });

  await db.delete(lockers).where(eq(lockers.number, String(number)));
  return NextResponse.json({ ok: true });
}
