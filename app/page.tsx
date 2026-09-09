import Link from "next/link";

const PLATES = [
  { n: "014", state: "open" },
  { n: "015", state: "steel" },
  { n: "016", state: "steel" },
  { n: "017", state: "open" },
  { n: "018", state: "steel" },
  { n: "019", state: "steel" },
  { n: "020", state: "steel" },
  { n: "021", state: "open" },
  { n: "022", state: "steel" },
  { n: "023", state: "steel" },
  { n: "024", state: "steel" },
  { n: "025", state: "open" },
] as const;

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--paper)]">
      {/* Hero */}
      <section className="bg-[var(--steel-900)] text-[var(--plate)]">
        <div className="mx-auto max-w-6xl px-6 py-20 grid gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="font-mono text-[10.5px] tracking-[.22em] uppercase text-[var(--brass)] mb-4">
              Locker Room
            </p>
            <h1 className="font-[family-name:var(--font-display)] uppercase font-bold leading-[0.98] text-4xl sm:text-5xl lg:text-6xl mb-6">
              Every locker,
              <br />
              one board.
            </h1>
            <p className="text-[var(--rule)] text-base sm:text-lg max-w-md mb-9">
              Assign lockers, combos, and PINs from one spreadsheet import.
              Students find their own locker in seconds — no front office line.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/lookup"
                className="rounded-lg bg-[var(--moss)] hover:bg-[var(--moss-deep)] transition-colors px-6 py-3 text-sm font-semibold text-[var(--plate)]"
              >
                Find your locker
              </Link>
              <Link
                href="/staff"
                className="rounded-lg border border-[var(--brass)] hover:bg-[var(--brass)]/10 transition-colors px-6 py-3 text-sm font-semibold text-[var(--brass)]"
              >
                Staff sign in
              </Link>
            </div>
          </div>

          {/* Locker plate grid */}
          <div className="grid grid-cols-4 gap-3 rotate-1">
            {PLATES.map((p) => (
              <div
                key={p.n}
                className={`aspect-[4/5] rounded-md border flex flex-col items-center justify-center ${
                  p.state === "open"
                    ? "bg-[var(--moss)]/20 border-[var(--moss)]"
                    : "bg-[var(--steel-800)] border-[var(--steel-700)]"
                }`}
              >
                <span className="font-[family-name:var(--font-display)] text-lg font-semibold">
                  {p.n}
                </span>
                <span
                  className={`font-mono text-[9px] tracking-[.15em] uppercase mt-1 ${
                    p.state === "open" ? "text-[var(--moss)]" : "text-[var(--rule)]/60"
                  }`}
                >
                  {p.state === "open" ? "open" : "taken"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="font-[family-name:var(--font-display)] uppercase font-bold text-2xl text-[var(--steel-900)] mb-10">
          How it works
        </h2>
        <div className="grid gap-8 sm:grid-cols-3">
          {[
            {
              step: "1",
              title: "Import the roster",
              body: "Drop in your spreadsheet — Locky matches locker number, name, combo, and PIN columns automatically.",
            },
            {
              step: "2",
              title: "Lockers get assigned",
              body: "Staff review and adjust assignments, combos, and sections from one board.",
            },
            {
              step: "3",
              title: "Students look themselves up",
              body: "Students enter their PIN on the lookup page to get their locker number and combo — no staff needed.",
            },
          ].map((s) => (
            <div key={s.step} className="border-t-2 border-[var(--brass)] pt-4">
              <span className="font-mono text-xs text-[var(--brass-deep)]">
                {s.step}
              </span>
              <h3 className="font-[family-name:var(--font-display)] uppercase font-semibold text-lg text-[var(--steel-900)] mt-2 mb-2">
                {s.title}
              </h3>
              <p className="text-sm text-[var(--steel-700)] leading-relaxed">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--rule)]">
        <div className="mx-auto max-w-6xl px-6 py-8 flex flex-wrap items-center justify-between gap-4">
          <p className="font-mono text-xs text-[var(--steel-700)]">
            Locker Room — built for schools
          </p>
          <div className="flex gap-6 text-sm">
            <Link href="/lookup" className="text-[var(--moss-deep)] hover:underline">
              Find your locker
            </Link>
            <Link href="/staff" className="text-[var(--brass-deep)] hover:underline">
              Staff sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}