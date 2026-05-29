// loadState() regression coverage — the on-startup migration path.
//
// loadState() is where persisted data from an older session is rehydrated:
// it rolls the day over (archiving yesterday's intentions/reflection into
// `days`), migrates legacy habit shapes, backfills missing slices, and
// merges prefs. A silent bug here would lose data on the very next launch,
// yet schema.test.mjs only covered the pure helpers (migrateHabit /
// mergePrefs), never loadState itself. These tests lock in its behaviour.
import { describe, it, expect, beforeEach } from "vitest";
import { loadStore } from "./load-store.mjs";

let S;
// Each test gets a fresh sandbox so persisted state never leaks between them.
beforeEach(() => { S = loadStore(); });

// Persist a raw state blob under the real STORAGE_KEY, exactly as the app does.
function persist(S, state) {
  S.__localStorage.setItem(S.STORAGE_KEY, JSON.stringify(state));
}

describe("loadState — empty start", () => {
  it("seeds demo content when nothing is stored", () => {
    const s = S.loadState();
    // seed() ships demo habits/intentions; the point is it is NOT the bare
    // emptyState and has every slice present.
    expect(Array.isArray(s.habits)).toBe(true);
    expect(s.prefs).toBeTruthy();
    expect(typeof s.today.dayKey).toBe("string");
  });

  it("returns a clean empty state when PAUTA_CLEAN_START is set", () => {
    S.PAUTA_CLEAN_START = true; // ctx.window === win, so this is window.PAUTA_CLEAN_START
    const s = S.loadState();
    expect(s.habits).toEqual([]);
    expect(s.blocks).toEqual([]);
    expect(s.days).toEqual({});
  });
});

describe("loadState — day rollover / archival", () => {
  it("archives a previous day that had content into days{}", () => {
    const today = S.dayKeyOf(Date.now());
    const yesterday = S.addDaysToKey(today, -1);
    persist(S, {
      today: {
        dayKey: yesterday,
        intentions: [{ id: "i1", text: "ship it", done: true }],
        reflection: "a good day",
      },
      days: {},
      activeId: null, blocks: [], habits: [], goals: [], prefs: {},
    });

    const s = S.loadState();
    // Yesterday's content is preserved under its dayKey…
    expect(s.days[yesterday]).toEqual({
      intentions: [{ id: "i1", text: "ship it", done: true }],
      reflection: "a good day",
    });
    // …and today is reset to a fresh, empty day.
    expect(s.today.dayKey).toBe(today);
    expect(s.today.intentions).toEqual([]);
    expect(s.today.reflection).toBe("");
  });

  it("does NOT archive an empty previous day", () => {
    const today = S.dayKeyOf(Date.now());
    const yesterday = S.addDaysToKey(today, -1);
    persist(S, {
      today: { dayKey: yesterday, intentions: [], reflection: "   " },
      days: {}, activeId: null, blocks: [], habits: [], goals: [], prefs: {},
    });

    const s = S.loadState();
    expect(s.days[yesterday]).toBeUndefined();
    expect(s.today.dayKey).toBe(today);
  });

  it("leaves today untouched when it is already the current day", () => {
    const today = S.dayKeyOf(Date.now());
    const intentions = [{ id: "i1", text: "keep me", done: false }];
    persist(S, {
      today: { dayKey: today, intentions, reflection: "midday note" },
      days: {}, activeId: null, blocks: [], habits: [], goals: [], prefs: {},
    });

    const s = S.loadState();
    expect(s.today.intentions).toEqual(intentions);
    expect(s.today.reflection).toBe("midday note");
    expect(Object.keys(s.days)).toEqual([]); // nothing archived
  });
});

describe("loadState — habit migration + slice backfill", () => {
  it("migrates legacy habit data[] arrays onto dated log keys", () => {
    const today = S.dayKeyOf(Date.now());
    const data = new Array(30).fill(0);
    data[29] = 1; // today
    persist(S, {
      today: { dayKey: today, intentions: [], reflection: "" },
      days: {}, activeId: null, blocks: [],
      habits: [{ id: "h", name: "água", data }],
      goals: [], prefs: {},
    });

    const s = S.loadState();
    expect(s.habits[0].data).toBeUndefined(); // legacy field gone
    expect(s.habits[0].log[today]).toBe(1);
  });

  it("backfills a missing goals slice and merges prefs defaults", () => {
    const today = S.dayKeyOf(Date.now());
    persist(S, {
      today: { dayKey: today, intentions: [], reflection: "" },
      activeId: null, blocks: [], habits: [],
      // no days, no goals, partial prefs
      prefs: { theme: "dark" },
    });

    const s = S.loadState();
    expect(s.days).toEqual({});           // missing days{} backfilled
    expect(s.goals).toEqual([]);          // missing goals[] backfilled
    expect(s.prefs.theme).toBe("dark");   // explicit value kept
    expect(s.prefs.haptics).toBe(true);   // default filled in
    expect(s.prefs.reminders).toBeTruthy();
  });
});

describe("loadState — corruption resilience", () => {
  it("falls back to seed() on malformed JSON instead of throwing", () => {
    S.__localStorage.setItem(S.STORAGE_KEY, "{not valid json");
    let s;
    expect(() => { s = S.loadState(); }).not.toThrow();
    expect(s.prefs).toBeTruthy();
    expect(Array.isArray(s.habits)).toBe(true);
  });

  it("falls back to emptyState() on malformed JSON when CLEAN_START is set", () => {
    S.PAUTA_CLEAN_START = true;
    S.__localStorage.setItem(S.STORAGE_KEY, "<<garbage>>");
    const s = S.loadState();
    expect(s.habits).toEqual([]);
    expect(s.blocks).toEqual([]);
  });
});
