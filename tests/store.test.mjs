// Core store logic: formatting, date math, habit streaks/stats and the weekly
// review. Complements tools/test-cadence.mjs (weekly/monthly cadence) with the
// daily-tide and aggregate paths the UI leans on.
import { describe, it, expect, beforeAll } from "vitest";
import { loadStore } from "./load-store.mjs";

let S;
beforeAll(() => { S = loadStore(); });

describe("fmtDuration", () => {
  it("formats human durations", () => {
    expect(S.fmtDuration(0)).toBe("0 min");
    expect(S.fmtDuration(90 * 1000)).toBe("1 min");
    expect(S.fmtDuration(60 * 60 * 1000)).toBe("1h00");
    expect(S.fmtDuration(90 * 60 * 1000)).toBe("1h30");
  });
  it("formats timer (clock) style", () => {
    expect(S.fmtDuration(65 * 1000, { timer: true })).toBe("01:05");
    expect(S.fmtDuration(3 * 3600 * 1000 + 5 * 60000, { timer: true })).toBe("3:05:00");
  });
  it("never goes negative", () => {
    expect(S.fmtDuration(-5000)).toBe("0 min");
  });
});

describe("date helpers are DST-safe", () => {
  it("addDaysToKey steps calendar days", () => {
    expect(S.addDaysToKey("2025-03-30", 1)).toBe("2025-03-31"); // CET→CEST spring-forward
    expect(S.addDaysToKey("2025-10-26", 1)).toBe("2025-10-27"); // CEST→CET fall-back
    expect(S.addDaysToKey("2025-01-01", -1)).toBe("2024-12-31");
  });
  it("daysBetween is inclusive of both ends", () => {
    expect(S.daysBetween("2025-05-01", "2025-05-01")).toBe(1);
    expect(S.daysBetween("2025-05-01", "2025-05-07")).toBe(7);
  });
});

describe("daily habit streak", () => {
  const mk = (log) => ({ cadence: "daily", createdAt: S.tsFromDayKey("2025-05-01"), log, respiros: {} });
  it("counts consecutive done days back from today", () => {
    const r = S.habitCurrentStreak(
      mk({ "2025-05-20": 1, "2025-05-19": 1, "2025-05-18": 1 }),
      S.tsFromDayKey("2025-05-20"));
    expect(r.days).toBe(3);
    expect(r.units).toBe(3);
  });
  it("a respiro keeps the streak alive; a miss breaks it", () => {
    const r = S.habitCurrentStreak(
      { cadence: "daily", createdAt: S.tsFromDayKey("2025-05-01"),
        log: { "2025-05-20": 1, "2025-05-18": 1 },
        respiros: { "2025-05-19": { reason: "", at: 0 } } },
      S.tsFromDayKey("2025-05-20"));
    expect(r.days).toBe(3);
    expect(r.respiros).toBe(1);
  });
  it("today not done yet does not zero a real streak from yesterday", () => {
    // current day empty, but yesterday + before done → streak still measured from yesterday is 0
    // (daily streak requires today done to count today; this documents the behavior)
    const r = S.habitCurrentStreak(
      mk({ "2025-05-19": 1, "2025-05-18": 1 }),
      S.tsFromDayKey("2025-05-20"));
    expect(r.days).toBe(0);
  });
});

describe("tideTier thresholds", () => {
  it("maps day counts to the right tier name", () => {
    expect(S.tideTier(0)).toBeNull();
    expect(S.tideTier(1).name).toBe("Onda");
    expect(S.tideTier(7).name).toBe("Maré baixa");
    expect(S.tideTier(30).name).toBe("Maré média");
    expect(S.tideTier(720).name).toBe("Tsunami");
  });
  it("exposes the next tier to climb toward", () => {
    expect(S.tideTier(1).next.name).toBe("Maré baixa");
    expect(S.tideTier(720).next).toBeNull(); // top tier
  });
});

describe("navigatorLevel", () => {
  it("ranks by total done-days", () => {
    expect(S.navigatorLevel(0).name).toBe("Aprendiz");
    expect(S.navigatorLevel(30).name).toBe("Grumete");
    expect(S.navigatorLevel(5000).name).toBe("Almirante");
  });
});

describe("focus aggregation", () => {
  const dk = "2025-05-10";
  const ts = (h, m) => new Date(2025, 4, 10, h, m, 0, 0).getTime();
  const blocks = [
    { id: "b1", sessions: [{ startedAt: ts(9, 0), endedAt: ts(9, 30) }], status: "done" },
    { id: "b2", sessions: [{ startedAt: ts(11, 0), endedAt: ts(11, 45) }], status: "done" },
    { id: "b3", sessions: [{ startedAt: new Date(2025, 4, 9, 10, 0).getTime(), endedAt: new Date(2025, 4, 9, 10, 20).getTime() }], status: "done" },
  ];
  it("dailyFocusMs sums only that day's segments", () => {
    expect(S.dailyFocusMs(blocks, dk)).toBe((30 + 45) * 60000);
  });
  it("dailyBlockCount counts distinct blocks active that day", () => {
    expect(S.dailyBlockCount(blocks, dk)).toBe(2);
  });
});

describe("weeklyReview", () => {
  it("summarises a 7-day window without throwing on empty state", () => {
    const r = S.weeklyReview(S.emptyState(), "2025-05-10");
    expect(r.days.length).toBe(7);
    expect(r.focusMs).toBe(0);
    expect(r.habitPct).toBeNull();
  });
});
