// Backup safety: the export→import round-trip must preserve data, and import
// must never crash or corrupt the app on malformed / malicious input. This is
// the single most important safety net — a bad import replaces ALL user data.
import { describe, it, expect, beforeAll } from "vitest";
import { loadStore } from "./load-store.mjs";

let S;
beforeAll(() => { S = loadStore(); });

// Mirror store.jsx's serializeBackup() (which lives inside the useStore hook,
// so we can't call it from the sandbox directly).
const wrap = (data) => ({ app: "pauta", version: S.EXPORT_VERSION, exportedAt: new Date().toISOString(), data });

describe("export → import round-trip", () => {
  it("preserves the seed dataset through a full cycle", () => {
    const original = S.seed();
    const restored = S.parseBackup(JSON.stringify(wrap(original)));

    expect(restored.blocks.length).toBe(original.blocks.length);
    expect(restored.habits.length).toBe(original.habits.length);
    expect(restored.goals.length).toBe(original.goals.length);

    // Habit ids + completion logs survive intact.
    for (const h of original.habits) {
      const r = restored.habits.find(x => x.id === h.id);
      expect(r).toBeTruthy();
      expect(Object.keys(r.log).sort()).toEqual(Object.keys(h.log).sort());
    }
    // Today (created "now" by seed) is kept, not archived.
    expect(restored.today.intentions.length).toBe(original.today.intentions.length);
  });

  it("accepts a raw (unwrapped) state object too", () => {
    const st = S.parseBackup(JSON.stringify(S.emptyState()));
    expect(Array.isArray(st.blocks)).toBe(true);
    expect(st.prefs).toBeTruthy();
  });
});

describe("import rejects junk", () => {
  it("throws on non-JSON text", () => {
    expect(() => S.parseBackup("}{ not json")).toThrow();
  });
  it("throws on a JSON object that isn't a Pauta backup", () => {
    expect(() => S.parseBackup(JSON.stringify({ foo: 1, bar: 2 }))).toThrow();
  });
  it("throws on a JSON array", () => {
    expect(() => S.parseBackup(JSON.stringify([1, 2, 3]))).toThrow();
  });
  it("throws on null", () => {
    expect(() => S.parseBackup("null")).toThrow();
  });
  it("rejects an oversized file before parsing", () => {
    expect(typeof S.MAX_BACKUP_CHARS).toBe("number");
    const huge = "0".repeat(S.MAX_BACKUP_CHARS + 1);
    expect(() => S.parseBackup(huge)).toThrow();
    // a normal-sized valid backup still parses fine
    expect(() => S.parseBackup(JSON.stringify(S.emptyState()))).not.toThrow();
  });
});

describe("import sanitizes malformed fields instead of crashing", () => {
  it("drops blocks whose sessions are not a valid array", () => {
    const st = S.parseBackup(JSON.stringify({
      blocks: [
        { id: "ok", title: "good", sessions: [{ startedAt: 1000, endedAt: 2000 }], status: "done" },
        { id: "bad1", title: "no sessions", sessions: "oops" },
        { id: "bad2", title: "empty sessions", sessions: [] },
        "not even an object",
        null,
      ],
    }));
    expect(st.blocks.map(b => b.id)).toEqual(["ok"]);
    // every surviving block has an iterable sessions array (buildTimeline relies on this)
    for (const b of st.blocks) expect(Array.isArray(b.sessions)).toBe(true);
  });

  it("coerces habit log/respiros/counts to plain day-keyed objects", () => {
    const st = S.parseBackup(JSON.stringify({
      habits: [{
        id: "h1", name: "walk",
        log: "not-an-object",
        respiros: ["array", "instead"],
        counts: { "2025-05-01": 3, "not-a-date": 9, "2025-05-02": -5 },
        createdAt: Date.now() - 5 * 86400000,
      }],
    }));
    const h = st.habits[0];
    expect(h.log).toEqual({});
    expect(h.respiros).toEqual({});
    // only the valid, positive, properly-keyed count survives
    expect(h.counts).toEqual({ "2025-05-01": 3 });
  });

  it("nulls activeId when it points at a missing block", () => {
    const st = S.parseBackup(JSON.stringify({
      activeId: "ghost",
      blocks: [{ id: "real", sessions: [{ startedAt: 1 }], status: "done" }],
    }));
    expect(st.activeId).toBeNull();
  });

  it("closes a stale second 'active' block so it can't tick forever", () => {
    const st = S.parseBackup(JSON.stringify({
      activeId: "a",
      blocks: [
        { id: "a", sessions: [{ startedAt: 1, endedAt: null }], status: "active" },
        { id: "b", sessions: [{ startedAt: 5, endedAt: null }], status: "active" },
      ],
    }));
    const a = st.blocks.find(b => b.id === "a");
    const b = st.blocks.find(b => b.id === "b");
    expect(a.status).toBe("active");
    expect(b.status).toBe("paused");
    expect(b.sessions[0].endedAt).not.toBeNull();   // open session was closed
  });

  it("drops day-archive entries with non-date keys", () => {
    const st = S.parseBackup(JSON.stringify({
      today: { dayKey: S.dayKeyOf(Date.now()), intentions: [], reflection: "" },
      days: {
        "2025-01-15": { intentions: [{ text: "ok" }], reflection: "" },
        "garbage-key": { intentions: [{ text: "nope" }] },
      },
    }));
    expect(Object.keys(st.days)).toEqual(["2025-01-15"]);
    expect(st.days["2025-01-15"].intentions[0].text).toBe("ok");
  });

  it("does not pollute Object.prototype via a __proto__ key", () => {
    const malicious = '{"today":{"dayKey":"2025-01-01","intentions":[]},"__proto__":{"polluted":true}}';
    S.parseBackup(malicious);
    expect({}.polluted).toBeUndefined();
  });

  it("survives intentions that are missing text or are not objects", () => {
    const st = S.parseBackup(JSON.stringify({
      today: {
        dayKey: S.dayKeyOf(Date.now()),
        intentions: [{ id: "i1" }, "string", null, { id: "i2", text: "real", done: true }],
        reflection: 5,    // wrong type
      },
    }));
    expect(st.today.intentions.length).toBe(2);
    expect(st.today.intentions[0].text).toBe("");
    expect(st.today.intentions[1].text).toBe("real");
    expect(st.today.intentions[1].done).toBe(true);
    expect(st.today.reflection).toBe("");   // coerced from a number
  });
});
