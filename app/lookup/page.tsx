"use client";

import { useState } from "react";

type Result = { number: string; combo: string; section: string; notes: string };

export default function LookupPage() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function lookup() {
    setError("");
    if (!pin.trim()) {
      setError("Enter your PIN.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/lookup?pin=${encodeURIComponent(pin.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error === "PIN not recognized."
            ? "PIN not recognized. Check with your teacher or the front office."
            : data.error || "Something went wrong."
        );
        return;
      }
      setResult(data);
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setPin("");
    setError("");
  }

  return (
    <div className="min-h-screen bg-[var(--steel-900)] flex items-center justify-center p-6">
      {!result ? (
        <div className="w-full max-w-sm bg-[var(--plate)] rounded-2xl p-8 shadow-2xl text-center">
          <p className="font-mono text-[10.5px] tracking-[.22em] uppercase text-[var(--brass-deep)] mb-1.5">
            Locker Room
          </p>
          <h1 className="font-[family-name:var(--font-display)] uppercase text-2xl font-bold mb-1.5">
            Enter Your PIN
          </h1>
          <p className="text-sm text-neutral-600 mb-5">
            Look up your locker number and combination.
          </p>
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && lookup()}
            inputMode="numeric"
            maxLength={8}
            placeholder="••••"
            autoFocus
            className="w-full text-center font-mono text-2xl tracking-[.35em] border border-[var(--rule)] rounded-lg px-4 py-4 mb-3.5"
          />
          <div className="text-[var(--danger)] text-[12.5px] min-h-[18px] mb-1.5">{error}</div>
          <button
            onClick={lookup}
            disabled={loading}
            className="w-full bg-[var(--brass)] border border-[var(--brass-deep)] text-[#2b1e05] font-semibold rounded-lg py-3.5 disabled:opacity-50"
          >
            {loading ? "Looking up…" : "View My Locker"}
          </button>
        </div>
      ) : (
        <div className="w-full max-w-sm bg-[var(--steel-900)] text-[var(--plate)] rounded-2xl p-8 text-center shadow-2xl border border-white/10">
          <div className="text-[10.5px] tracking-[.16em] uppercase text-neutral-400 mb-2.5">
            Your Locker
          </div>
          <div className="inline-block font-mono font-semibold text-4xl bg-[var(--plate)] text-[var(--steel-900)] rounded-lg px-5 py-2 mb-4">
            {result.number}
          </div>
          <div className="font-mono text-lg tracking-[.08em] mb-2">
            <span className="block text-[10.5px] tracking-[.12em] uppercase text-neutral-400 font-sans mb-1">
              Combination
            </span>
            {result.combo || "Not set — ask staff"}
          </div>
          {result.section && (
            <div className="font-mono text-lg tracking-[.08em] mb-2">
              <span className="block text-[10.5px] tracking-[.12em] uppercase text-neutral-400 font-sans mb-1">
                Section
              </span>
              {result.section}
            </div>
          )}
          {result.notes && (
            <div className="text-neutral-300 text-[12.5px] mt-3">{result.notes}</div>
          )}
          <button
            onClick={reset}
            className="mt-5 text-neutral-400 text-[12.5px] underline underline-offset-2"
          >
            Look up another PIN
          </button>
        </div>
      )}
    </div>
  );
}
