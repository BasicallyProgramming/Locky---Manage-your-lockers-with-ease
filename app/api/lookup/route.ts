import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { lockers } from "@/db/schema";

// Public on purpose — students use this without signing in. It only ever
// returns the single locker matching an exact PIN; there's no endpoint
// anywhere that lists all lockers without a staff session, so there's no
// way to browse or enumerate other students' data from here.
export async function GET(req: NextRequest) {
  const pin = req.nextUrl.searchParams.get("pin")?.trim();
  if (!pin) {
    return NextResponse.json({ error: "PIN required." }, { status: 400 });
  }

  const [match] = await db.select().from(lockers).where(eq(lockers.pin, pin)).limit(1);
  if (!match) {
    return NextResponse.json({ error: "PIN not recognized." }, { status: 404 });
  }

  // Only send back what a student needs — not their name, not raw internal fields.
  return NextResponse.json({
    number: match.number,
    combo: match.combo,
    section: match.section,
    notes: match.notes,
  });
}
