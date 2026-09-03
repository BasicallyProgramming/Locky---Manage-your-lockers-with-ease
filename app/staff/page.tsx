"use client";

import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";

type Locker = {
  number: string;
  name: string;
  combo: string;
  pin: string | null;
  status: "open" | "taken";
  section: string;
  notes: string;
};

const FIELD_GUESSES: Record<string, string[]> = {
  number: ["locker", "locker #", "locker number", "number", "no", "#"],
  name: ["name", "student", "student name", "assigned to", "owner"],
  combo: ["combo", "combination", "code", "lock code"],
  pin: ["pin", "student pin", "access pin", "passcode"],
  status: ["status"],
  section: ["section", "grade", "class", "homeroom"],
  notes: ["notes", "note", "comment", "comments"],
};

function guessColumn(candidates: string[], headers: string[]) {
  const lower = headers.map((h) => h.toLowerCase().trim());
  for (const c of candidates) {
    const i = lower.indexOf(c);
    if (i !== -1) return headers[i];
  }
  for (const c of candidates) {
    const i = lower.findIndex((h) => h.includes(c));
    if (i !== -1) return headers[i];
  }
  return "";
}

export default function StaffPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        setAuthed(true);
        setEmail(d.email);
      })
      .catch(() => setAuthed(false));
  }, []);

  if (authed === null) return <div className="min-h-screen bg-[var(--steel-900)]" />;
  if (!authed) return <SignIn onSignedIn={(e) => { setAuthed(true); setEmail(e); }} />;
  return <Board email={email} onSignOut={() => setAuthed(false)} />;
}

function SignIn({ onSignedIn }: { onSignedIn: (email: string) => void }) {
  const [emailInput, setEmailInput] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setErr("");
    if (!emailInput || !password) { setErr("Enter your email and password."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput, password }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "Sign-in failed."); return; }
      onSignedIn(data.email);
    } catch {
      setErr("Couldn't reach the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--steel-900)] flex items-center justify-center p-5">
      <div className="w-full max-w-sm bg-[var(--paper)] rounded-xl p-8 shadow-2xl">
        <h1 className="font-[family-name:var(--font-display)] uppercase text-2xl font-bold mb-1">Staff Sign In</h1>
        <p className="text-sm text-neutral-600 mb-5">Sign in with your staff account to manage the locker board.</p>
        <input className="w-full border border-[var(--rule)] rounded-md px-3 py-2.5 mb-2.5 text-sm"
          placeholder="Email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} />
        <input className="w-full border border-[var(--rule)] rounded-md px-3 py-2.5 mb-2.5 text-sm" type="password"
          placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()} />
        <div className="text-[var(--danger)] text-xs min-h-4 mb-2">{err}</div>
        <button disabled={loading} onClick={submit}
          className="w-full bg-[var(--brass)] border border-[var(--brass-deep)] text-[#2b1e05] font-semibold rounded-md py-2.5 disabled:opacity-50">
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </div>
    </div>
  );
}

function Board({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  const [lockers, setLockers] = useState<Locker[]>([]);
  const [filter, setFilter] = useState<"all" | "open" | "taken">("all");
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<Locker | null | "new">(null);
  const [showImport, setShowImport] = useState(false);

  async function refresh() {
    const res = await fetch("/api/lockers");
    if (res.ok) setLockers(await res.json());
  }
  useEffect(() => { refresh(); }, []);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    onSignOut();
  }

  const visible = lockers
    .filter((l) => filter === "all" || l.status === filter)
    .filter((l) => {
      if (!search) return true;
      const t = search.toLowerCase();
      return l.number.toLowerCase().includes(t) || l.name.toLowerCase().includes(t);
    })
    .sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }));

  const stats = {
    total: lockers.length,
    open: lockers.filter((l) => l.status === "open").length,
    taken: lockers.filter((l) => l.status === "taken").length,
  };

  function downloadBackup() {
    const rows = lockers.map((l) => ({
      "Locker Number": l.number, Status: l.status === "open" ? "Open" : "Taken",
      "Student Name": l.name, Combination: l.combo, PIN: l.pin ?? "",
      Section: l.section, Notes: l.notes,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Lockers");
    XLSX.writeFile(wb, "lockers-backup.xlsx");
  }

  return (
    <div className="min-h-screen">
      <div className="bg-[var(--steel-900)] pb-14 pt-9 px-6">
        <div className="max-w-5xl mx-auto flex justify-between items-end gap-6 flex-wrap">
          <div className="text-[var(--plate)]">
            <p className="font-mono text-[11px] tracking-[.22em] uppercase text-[var(--brass)] mb-1.5">Assignment Board</p>
            <h1 className="font-[family-name:var(--font-display)] font-bold uppercase text-4xl">Locker Room</h1>
          </div>
          <div className="flex gap-2.5 items-center flex-wrap">
            {(["total", "open", "taken"] as const).map((k) => (
              <div key={k} className="bg-[var(--steel-800)] border border-white/10 rounded-md px-4 py-2.5 min-w-[88px] text-center">
                <span className={`font-mono text-xl font-semibold block leading-none ${k === "open" ? "text-emerald-300" : k === "taken" ? "text-[var(--brass)]" : "text-[var(--plate)]"}`}>
                  {stats[k]}
                </span>
                <span className="text-[9px] tracking-[.14em] uppercase text-neutral-400">{k}</span>
              </div>
            ))}
            <span className="font-mono text-[11.5px] text-neutral-400">
              {email}
              <button onClick={signOut} className="text-[var(--brass)] underline ml-2">Sign out</button>
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pb-20">
        {lockers.length > 0 && (
          <div className="-mt-8 bg-[var(--plate)] border border-[var(--rule)] rounded-xl shadow-lg p-4 flex gap-3 items-center flex-wrap relative z-10">
            <div className="flex-1 min-w-[220px] flex items-center gap-2 bg-white border border-[var(--rule)] rounded-md px-3 py-2">
              <input className="flex-1 text-sm outline-none" placeholder="Search by locker number or name…"
                value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-1.5">
              {(["all", "open", "taken"] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`font-mono text-xs px-3.5 py-2 rounded-md border ${filter === f ? "bg-[var(--steel-900)] text-[var(--plate)] border-[var(--steel-900)]" : "bg-white border-[var(--rule)]"}`}>
                  {f[0].toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setActive("new")} className="text-sm font-semibold border border-[var(--steel-900)] rounded-md px-4 py-2">Add Locker</button>
              <button onClick={() => setShowImport(true)} className="text-sm font-semibold border border-[var(--steel-900)] rounded-md px-4 py-2">Bulk Import</button>
              <button onClick={downloadBackup} className="text-sm font-semibold bg-[var(--brass)] border border-[var(--brass-deep)] text-[#2b1e05] rounded-md px-4 py-2">Download Backup</button>
            </div>
          </div>
        )}

        {lockers.length === 0 && (
          <div className="mt-16 text-center p-14 border border-dashed border-[var(--rule)] rounded-xl bg-[var(--plate)]">
            <h2 className="font-[family-name:var(--font-display)] uppercase text-2xl mb-1.5">No lockers in the database yet</h2>
            <p className="text-neutral-600 max-w-md mx-auto mb-6 text-sm">Bulk import from Google Sheets once to seed the database, or add lockers one at a time.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowImport(true)} className="bg-[var(--brass)] border border-[var(--brass-deep)] text-[#2b1e05] font-semibold rounded-md px-4 py-2.5">Bulk Import</button>
              <button onClick={() => setActive("new")} className="border border-[var(--steel-900)] font-semibold rounded-md px-4 py-2.5">Add One Locker</button>
            </div>
          </div>
        )}

        <div className="mt-6 grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))" }}>
          {visible.map((l) => (
            <div key={l.number} onClick={() => setActive(l)}
              className={`rounded-md border border-black/40 shadow-lg p-2.5 cursor-pointer min-h-[96px] flex flex-col justify-between hover:-translate-y-0.5 transition-transform`}
              style={{ background: l.status === "taken"
                ? "repeating-linear-gradient(90deg, #3a3226 0 3px, #2c261c 3px 6px)"
                : "repeating-linear-gradient(90deg, var(--steel-700) 0 3px, var(--steel-800) 3px 6px)" }}>
              <span className="self-start bg-[var(--plate)] font-mono font-semibold text-[15px] rounded px-2 py-0.5 shadow">{l.number}</span>
              <span className="text-neutral-100 text-xs font-medium truncate">{l.status === "taken" ? (l.name || "Unnamed") : "\u00A0"}</span>
              <span className={`self-start font-mono text-[9.5px] tracking-[.1em] uppercase px-1.5 py-0.5 rounded-full ${l.status === "open" ? "bg-emerald-400/15 text-emerald-300" : "bg-[var(--brass)]/20 text-[var(--brass)]"}`}>
                {l.status === "open" ? "● Open" : "● Taken"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {active !== null && (
        <Panel
          locker={active === "new" ? null : active}
          onClose={() => setActive(null)}
          onSaved={() => { setActive(null); refresh(); }}
        />
      )}
      {showImport && <ImportModal onClose={() => setShowImport(false)} onDone={() => { setShowImport(false); refresh(); }} />}
    </div>
  );
}

function Panel({ locker, onClose, onSaved }: { locker: Locker | null; onClose: () => void; onSaved: () => void }) {
  const [number, setNumber] = useState(locker?.number ?? "");
  const [name, setName] = useState(locker?.name ?? "");
  const [combo, setCombo] = useState(locker?.combo ?? "");
  const [pin, setPin] = useState(locker?.pin ?? "");
  const [status, setStatus] = useState<"open" | "taken">(locker?.status ?? "open");
  const [section, setSection] = useState(locker?.section ?? "");
  const [notes, setNotes] = useState(locker?.notes ?? "");
  const [comboVisible, setComboVisible] = useState(false);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!number.trim()) { setMsg("Locker number is required."); return; }
    setSaving(true); setMsg("");
    try {
      const res = await fetch("/api/lockers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number: number.trim(), name, combo, pin, status, section, notes }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg(data.error || "Save failed."); return; }
      onSaved();
    } catch {
      setMsg("Couldn't reach the server.");
    } finally {
      setSaving(false);
    }
  }

  async function release() {
    setSaving(true);
    await fetch("/api/lockers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number, name: "", combo: "", pin: null, status: "open", section, notes: "" }),
    });
    onSaved();
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/45 z-20" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full max-w-[400px] bg-[var(--paper)] shadow-2xl z-30 flex flex-col">
        <div className="bg-[var(--steel-900)] text-[var(--plate)] px-5.5 pt-5.5 pb-4.5 flex justify-between items-start">
          <div>
            <div className="font-mono text-[10.5px] tracking-[.14em] uppercase text-neutral-400 mb-1.5">Locker</div>
            <div className="font-mono font-semibold text-2xl bg-[var(--plate)] text-[#1b1e22] rounded px-3 py-1 inline-block">{locker ? locker.number : "New"}</div>
          </div>
          <button onClick={onClose} className="text-[var(--plate)] opacity-70 hover:opacity-100">✕</button>
        </div>
        <div className="p-5.5 overflow-y-auto flex-1 space-y-4.5">
          <div className="text-[var(--danger)] text-xs -mb-2 min-h-4">{msg}</div>
          <Field label="Locker Number">
            <input disabled={!!locker} value={number} onChange={(e) => setNumber(e.target.value)}
              className="w-full border border-[var(--rule)] rounded-md px-3 py-2.5 text-sm disabled:bg-neutral-100" />
          </Field>
          <Field label="Status">
            <div className="flex gap-2">
              <button onClick={() => setStatus("open")} className={`flex-1 py-2.5 rounded-md border font-mono text-xs uppercase ${status === "open" ? "bg-[var(--moss)] text-white border-[var(--moss-deep)]" : "border-[var(--rule)] bg-white"}`}>Open</button>
              <button onClick={() => setStatus("taken")} className={`flex-1 py-2.5 rounded-md border font-mono text-xs uppercase ${status === "taken" ? "bg-[var(--brass)] text-[#2b1e05] border-[var(--brass-deep)]" : "border-[var(--rule)] bg-white"}`}>Taken</button>
            </div>
          </Field>
          <Field label="Student Name"><input value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-[var(--rule)] rounded-md px-3 py-2.5 text-sm" /></Field>
          <Field label="Combination">
            <div className="flex gap-2">
              <input type={comboVisible ? "text" : "password"} value={combo} onChange={(e) => setCombo(e.target.value)} className="w-full border border-[var(--rule)] rounded-md px-3 py-2.5 text-sm font-mono" />
              <button onClick={() => setComboVisible((v) => !v)} className="border border-[var(--rule)] rounded-md px-3">{comboVisible ? "🙈" : "👁"}</button>
            </div>
          </Field>
          <Field label="Student PIN (for the lookup page)"><input value={pin ?? ""} onChange={(e) => setPin(e.target.value)} className="w-full border border-[var(--rule)] rounded-md px-3 py-2.5 text-sm" /></Field>
          <Field label="Section / Grade"><input value={section} onChange={(e) => setSection(e.target.value)} className="w-full border border-[var(--rule)] rounded-md px-3 py-2.5 text-sm" /></Field>
          <Field label="Notes"><textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border border-[var(--rule)] rounded-md px-3 py-2.5 text-sm min-h-[60px]" /></Field>
        </div>
        <div className="p-4 border-t border-[var(--rule)] flex justify-between gap-2.5">
          {locker && <button onClick={release} disabled={saving} className="border border-[var(--steel-900)] rounded-md px-4 py-2 text-sm font-semibold">Release Locker</button>}
          <button onClick={save} disabled={saving} className="ml-auto bg-[var(--brass)] border border-[var(--brass-deep)] text-[#2b1e05] rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-50">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block font-mono text-[10.5px] tracking-[.12em] uppercase text-neutral-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function ImportModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [tab, setTab] = useState<"file" | "csv">("file");
  const [csvUrl, setCsvUrl] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  function ingest(json: any[]) {
    if (!json.length) { setError("That sheet looks empty."); return; }
    const hdrs = Object.keys(json[0]);
    setHeaders(hdrs);
    setRawRows(json);
    const guessed: Record<string, string> = {};
    for (const field of Object.keys(FIELD_GUESSES)) {
      guessed[field] = guessColumn(FIELD_GUESSES[field], hdrs);
    }
    setMapping(guessed);
    setError("");
  }

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(new Uint8Array(e.target!.result as ArrayBuffer), { type: "array" });
        ingest(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" }));
      } catch { setError("Couldn't read that file."); }
    };
    reader.readAsArrayBuffer(file);
  }

  async function fetchCsv() {
    if (!csvUrl.trim()) { setError("Paste a published CSV link first."); return; }
    try {
      const res = await fetch(csvUrl.trim());
      if (!res.ok) throw new Error();
      const text = await res.text();
      const wb = XLSX.read(text, { type: "string" });
      ingest(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" }));
    } catch { setError("Couldn't fetch that link — check it's published as CSV and public."); }
  }

  async function confirmImport() {
    if (!mapping.number) { setError("Pick a column for Locker Number."); return; }
    const items = rawRows.map((row) => {
      const name = mapping.name ? String(row[mapping.name] ?? "").trim() : "";
      let status: "open" | "taken";
      if (mapping.status && String(row[mapping.status]).trim() !== "") {
        status = /open|free|avail|vacant|empty/i.test(String(row[mapping.status])) ? "open" : "taken";
      } else {
        status = name ? "taken" : "open";
      }
      return {
        number: String(row[mapping.number] ?? "").trim(),
        name,
        combo: mapping.combo ? String(row[mapping.combo] ?? "").trim() : "",
        pin: mapping.pin ? String(row[mapping.pin] ?? "").trim() : "",
        status,
        section: mapping.section ? String(row[mapping.section] ?? "").trim() : "",
        notes: mapping.notes ? String(row[mapping.notes] ?? "").trim() : "",
      };
    }).filter((r) => r.number !== "");

    setImporting(true); setError("");
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Import failed."); return; }
      onDone();
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/55 z-40 flex items-center justify-center p-5" onClick={onClose}>
      <div className="bg-[var(--paper)] rounded-xl max-w-[520px] w-full max-h-[88vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-[var(--rule)] flex justify-between items-center">
          <h3 className="font-[family-name:var(--font-display)] uppercase text-lg">Bulk Import to Database</h3>
          <button onClick={onClose}>✕</button>
        </div>
        <div className="p-6">
          {error && <div className="bg-red-100 border border-red-300 text-red-800 rounded-md px-3.5 py-2.5 text-sm mb-3.5">{error}</div>}
          <div className="flex gap-1.5 mb-4.5">
            <button onClick={() => setTab("file")} className={`flex-1 py-2 rounded-md border text-sm font-semibold ${tab === "file" ? "bg-[var(--steel-900)] text-[var(--plate)]" : "bg-white border-[var(--rule)]"}`}>Upload File</button>
            <button onClick={() => setTab("csv")} className={`flex-1 py-2 rounded-md border text-sm font-semibold ${tab === "csv" ? "bg-[var(--steel-900)] text-[var(--plate)]" : "bg-white border-[var(--rule)]"}`}>Published Sheet Link</button>
          </div>
          {tab === "file" ? (
            <div onClick={() => fileInput.current?.click()} className="border-2 border-dashed border-[var(--rule)] rounded-lg p-8 text-center cursor-pointer hover:border-[var(--brass)]">
              <p className="text-sm text-neutral-600"><strong>Click to choose</strong> a .xlsx / .csv file</p>
              <input ref={fileInput} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </div>
          ) : (
            <div className="space-y-2.5">
              <input value={csvUrl} onChange={(e) => setCsvUrl(e.target.value)} placeholder="https://docs.google.com/…/pub?output=csv" className="w-full border border-[var(--rule)] rounded-md px-3 py-2.5 text-sm" />
              <button onClick={fetchCsv} className="bg-[var(--brass)] border border-[var(--brass-deep)] text-[#2b1e05] font-semibold rounded-md px-4 py-2 text-sm">Fetch Sheet</button>
            </div>
          )}

          {headers.length > 0 && (
            <div className="mt-5 pt-4.5 border-t border-[var(--rule)]">
              <p className="text-sm font-semibold mb-3.5">Match your columns</p>
              {Object.keys(FIELD_GUESSES).map((field) => (
                <div key={field} className="grid grid-cols-[110px_1fr] gap-2.5 items-center mb-2.5">
                  <label className="font-mono text-[11.5px] uppercase">{field}</label>
                  <select value={mapping[field] ?? ""} onChange={(e) => setMapping((m) => ({ ...m, [field]: e.target.value }))} className="border border-[var(--rule)] rounded-md px-3 py-2 text-sm">
                    <option value="">— none —</option>
                    {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
              <button onClick={confirmImport} disabled={importing} className="w-full mt-3 bg-[var(--brass)] border border-[var(--brass-deep)] text-[#2b1e05] font-semibold rounded-md py-2.5 disabled:opacity-50">
                {importing ? "Importing…" : "Import to Database"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
