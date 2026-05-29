// Schema + migration contracts: the shapes the rest of the app relies on.
import { describe, it, expect, beforeAll } from "vitest";
import { loadStore } from "./load-store.mjs";

let S;
beforeAll(() => { S = loadStore(); });

describe("emptyState", () => {
  it("has every top-level slice the store expects", () => {
    const s = S.emptyState();
    expect(s.today).toMatchObject({ intentions: [], reflection: "" });
    expect(typeof s.today.dayKey).toBe("string");
    expect(s.days).toEqual({});
    expect(s.activeId).toBeNull();
    expect(s.blocks).toEqual([]);
    expect(s.habits).toEqual([]);
    expect(s.goals).toEqual([]);
    expect(s.prefs).toBeTruthy();
  });
});

describe("defaultPrefs / mergePrefs", () => {
  it("defaultPrefs includes a reminders sub-object", () => {
    const p = S.defaultPrefs();
    expect(p.reminders).toMatchObject({ enabled: false });
    expect(typeof p.reminders.habitsTime).toBe("string");
    expect(typeof p.reminders.reflectionTime).toBe("string");
  });
  it("mergePrefs fills missing keys and deep-merges reminders", () => {
    const merged = S.mergePrefs({ theme: "dark", reminders: { enabled: true } });
    expect(merged.theme).toBe("dark");
    expect(merged.reminders.enabled).toBe(true);
    // a key absent from the partial input still gets its default
    expect(typeof merged.reminders.reflectionTime).toBe("string");
    expect(merged.haptics).toBe(true);
  });
  it("mergePrefs tolerates null/garbage", () => {
    expect(() => S.mergePrefs(null)).not.toThrow();
    expect(S.mergePrefs(null).theme).toBe("auto");
  });
});

describe("migrateHabit (legacy data[] → log{})", () => {
  it("maps the rolling 30-cell array onto dated log keys", () => {
    const today = S.dayKeyOf(Date.now());
    // index 29 = today, 28 = yesterday … only two done cells: today and 2 days ago
    const data = new Array(30).fill(0);
    data[29] = 1;          // today
    data[27] = 1;          // 2 days ago
    const out = S.migrateHabit({ id: "h", name: "x", data });
    expect(out.data).toBeUndefined();          // legacy field removed
    expect(out.log[today]).toBe(1);
    expect(out.log[S.addDaysToKey(today, -2)]).toBe(1);
    expect(Object.keys(out.log).length).toBe(2);
  });
  it("fills new-schema defaults for a bare habit", () => {
    const out = S.migrateHabit({ id: "h", name: "x" });
    expect(out.log).toEqual({});
    expect(out.respiros).toEqual({});
    expect(out.counts).toEqual({});
    expect(out.recurrence).toBe("forever");
    expect(out.cadence).toBe("daily");
    expect(out.endsAt).toBeNull();
    expect(out.anchor).toBeNull();
  });
});
